import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, NgZone, computed, inject, signal } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AuthStatus, LoginResponse, User } from '../models';
import { Observable, catchError, map, of } from 'rxjs';
import { UtilsService } from './utils.service';
import { NotificacionesService } from './notificaciones.service';
import { WsService } from './ws.service';
import { EmpresaService } from './empresa.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  http = inject(HttpClient);
  utilsSvc = inject(UtilsService);
  notificacionesSvc = inject(NotificacionesService);
  ws = inject(WsService);
  empresaSvc = inject(EmpresaService);
  private readonly ngZone = inject(NgZone);

  private baseUrl: string = environment.baseUrl;
  private _currentUser = signal<User | null>(null);
  private _authStatus = signal<AuthStatus>(AuthStatus.checking);
  public currentUser = computed(() => this._currentUser());
  public authStatus = computed(() => this._authStatus());
  private sessionRevokedListenerStarted = false;
  private forcingLogout = false;

  constructor() {
    this.initSessionRevokedListener();
  }

  private initSessionRevokedListener(): void {
    if (this.sessionRevokedListenerStarted) {
      return;
    }
    this.sessionRevokedListenerStarted = true;

    this.ws.listen<{ reason?: string }>('session-revoked').subscribe((payload) => {
      this.ngZone.run(() => {
        this.handleRemoteSessionEnd(payload?.reason);
      });
    });

    // Respaldo: session:state llega a adminRoom; si es nuestro userId y sesión libre → logout.
    this.ws.onSessionState().subscribe((ev) => {
      this.ngZone.run(() => {
        if (ev?.hasActiveSession) return;
        const me =
          this._currentUser() ??
          (this.utilsSvc.getFromLocalStorage('user') as User | null);
        const myId = me?.id || me?._id;
        if (!myId || String(ev?.userId) !== String(myId)) return;
        this.handleRemoteSessionEnd(ev?.reason);
      });
    });
  }

  private handleRemoteSessionEnd(reason?: string): void {
    if (this.forcingLogout) return;
    if (
      this._authStatus() !== AuthStatus.authenticated &&
      !this.utilsSvc.getFromLocalStorage('user')
    ) {
      return;
    }

    this.forcingLogout = true;
    const message =
      reason === 'ADMIN_CLEAR'
        ? 'Sesión cerrada por un administrador.'
        : reason === 'USER_BLOCKED'
          ? 'Tu usuario fue bloqueado. Contacta a un administrador.'
          : reason === 'PASSWORD_CHANGED'
            ? 'Tu contraseña cambió. Inicia sesión de nuevo.'
            : 'Tu sesión se cerró porque se inició en otro lugar.';

    this.utilsSvc.presentToast({
      message,
      duration: 4000,
      color: 'warning',
      position: 'bottom',
    });
    this.logout({ skipServer: true });
    setTimeout(() => {
      this.forcingLogout = false;
    }, 1500);
  }

  private setAuthentication(user: User, token: string): boolean {
    if (!this.esADmin(user.rol)) return false;
    this._currentUser.set({ ...user, token });
    this._authStatus.set(AuthStatus.authenticated);
    this.utilsSvc.saveInLocalStorage('user', { ...user, token });

    const empresaId =
      typeof user.empresa === 'string'
        ? user.empresa
        : (user.empresa as any)?.id || (user.empresa as any)?._id;

    if (empresaId) {
      this.empresaSvc.setEmpresa(empresaId);
    } else if (user.rol !== 'SUPERADMIN') {
      // Sin empresa no hay rooms admin:/empresa: → presencia y caja realtime muertos.
      this.utilsSvc.presentToast({
        message:
          'Tu usuario no tiene empresa asignada. El seguimiento en tiempo real no estará disponible.',
        duration: 4000,
        color: 'warning',
        position: 'bottom',
      });
    }

    this.ws.connect(token);

    return true;
  }

  private esADmin(rol: string): boolean {

    return ['ADMIN', 'SUPERADMIN', 'SUPERVISOR'].includes(rol);

  }

  login(username: string, password: string): Observable<boolean> {
    const url: string = `${this.baseUrl}/auth/login`;
    const body = { username, password };

    const params = new HttpParams()
      .set('admin', true)

    return this.http.post<LoginResponse>(url, body, { params })
      .pipe(
        map(({ user, token }) => this.setAuthentication(user, token))
      )
  }

  revalidarToken(): Observable<boolean> {

    const url: string = `${this.baseUrl}/auth/revalidar`;
    const user = this.utilsSvc.getFromLocalStorage('user');
    if (!user) {
      this._authStatus.set(AuthStatus.noAuthenticated);
      return of(false);
    }

    const headers = new HttpHeaders()
      .set('authorization', `Bearer ${user.token}`)

    return this.http.get<LoginResponse>(url, { headers })
      .pipe(
        map(({ user, token }) => this.setAuthentication(user, token)),
        catchError((err) => {
          this._authStatus.set(AuthStatus.noAuthenticated);
          this.logout({ skipServer: true });
          return of(false)
        })
      )
  }

  logout(options?: { skipServer?: boolean }) {
    const stored = this.utilsSvc.getFromLocalStorage('user') as User | null;
    const token = stored?.token;

    const finish = () => {
      this.notificacionesSvc.notificarLogout();
      this.ws.disconnect();
      this._authStatus.set(AuthStatus.noAuthenticated);
      this._currentUser.set(null);
      localStorage.removeItem('user');
      this.utilsSvc.routerLink('/auth');
    };

    if (options?.skipServer || !token) {
      finish();
      return;
    }

    // Limpia UI de inmediato; notifica al servidor en background con el token capturado.
    const headers = new HttpHeaders().set('authorization', `Bearer ${token}`);
    finish();
    this.http
      .post(`${this.baseUrl}/auth/logout`, {}, { headers })
      .pipe(catchError(() => of(null)))
      .subscribe();
  }

  /** Actualiza el perfil del usuario autenticado (nombre / username / password). */
  updateMe(payload: {
    nombre?: string;
    username?: string;
    password?: string;
  }): Observable<User> {
    const url = `${this.baseUrl}/auth/me`;
    return this.http.patch<User>(url, payload).pipe(
      map((user) => {
        const current = this.utilsSvc.getFromLocalStorage('user') as User | null;
        const token = current?.token;
        const merged: User = {
          ...current,
          ...user,
          id: user.id || user._id || current?.id || current?._id,
          _id: user._id || user.id || current?._id || current?.id,
          token,
        };
        this._currentUser.set(merged);
        this.utilsSvc.saveInLocalStorage('user', merged);
        return merged;
      }),
    );
  }

}
