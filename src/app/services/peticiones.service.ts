import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal, effect } from '@angular/core';
import { environment } from 'src/environments/environment';
import { PeticionUbicacion, AuthStatus } from '../models';
import { Roles } from '../models/roles.enum';
import { Observable, interval, of, switchMap, tap, Subscription } from 'rxjs';
import { UtilsService } from './utils.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PeticionesService {
  private http = inject(HttpClient);
  private utilsSvc = inject(UtilsService);
  private authService = inject(AuthService);

  private baseUrl: string = environment.baseUrl;
  private _peticionesPendientes = signal<PeticionUbicacion[]>([]);
  public peticionesPendientes = computed(() => this._peticionesPendientes());
  public cantidadPendientes = computed(() => this._peticionesPendientes().length);

  private pollingInterval = 30000; // 30 segundos
  private pollingSubscription: Subscription | null = null;

  constructor() {
    // Efecto para iniciar/detener polling basado en estado de autenticación
    effect(() => {
      const status = this.authService.authStatus();
      if (status === AuthStatus.authenticated) {
        this.startPolling();
      } else {
        this.stopPolling();
        this._peticionesPendientes.set([]);
      }
    }, { allowSignalWrites: true });
  }

  /** Empresa del usuario tenant. SUPERADMIN no tiene (ni debe tener) empresa. */
  private getEmpresaId(): string | null {
    const user = this.authService.currentUser();
    if (!user || user.rol === Roles.superAdmin) return null;

    const empresa = user.empresa as unknown;
    if (!empresa) return null;
    if (typeof empresa === 'string') return empresa || null;
    if (typeof empresa === 'object') {
      const id = (empresa as { id?: string; _id?: string }).id
        || (empresa as { _id?: string })._id;
      return id || null;
    }
    return null;
  }

  getPeticionesPendientes(): Observable<PeticionUbicacion[]> {
    const url = `${this.baseUrl}/peticiones-ubicacion`;
    const user = this.authService.currentUser();
    const empresaId = this.getEmpresaId();

    // ADMIN/SUPERVISOR sin empresa: no consultar (evita 400 por id_empresa vacío)
    if (user?.rol !== Roles.superAdmin && !empresaId) {
      this._peticionesPendientes.set([]);
      return of([]);
    }

    let params = new HttpParams().set('estado', 'pendiente');
    // SUPERADMIN: sin id_empresa → ve pendientes de todas las empresas
    if (empresaId) {
      params = params.set('id_empresa', empresaId);
    }

    return this.http.get<PeticionUbicacion[]>(url, { params }).pipe(
      tap(peticiones => {
        this._peticionesPendientes.set(peticiones);
      })
    );
  }

  aprobarPeticion(id: string): Observable<boolean> {
    const url = `${this.baseUrl}/peticiones-ubicacion/${id}`;
    const body = { esAprobado: true };

    return this.http.patch<boolean>(url, body).pipe(
      tap(() => {
        this._peticionesPendientes.update(peticiones =>
          peticiones.filter(p => p.id !== id)
        );
      })
    );
  }

  rechazarPeticion(id: string): Observable<boolean> {
    const url = `${this.baseUrl}/peticiones-ubicacion/${id}`;
    const body = { esAprobado: false };

    return this.http.patch<boolean>(url, body).pipe(
      tap(() => {
        this._peticionesPendientes.update(peticiones =>
          peticiones.filter(p => p.id !== id)
        );
      })
    );
  }

  startPolling(): void {
    this.stopPolling();

    this.getPeticionesPendientes().subscribe({ error: () => { /* silenciar 400 en UI */ } });

    this.pollingSubscription = interval(this.pollingInterval).pipe(
      switchMap(() => this.getPeticionesPendientes())
    ).subscribe({ error: () => { /* silenciar */ } });
  }

  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  refreshPeticiones(): void {
    this.getPeticionesPendientes().subscribe({ error: () => { /* silenciar */ } });
  }
}
