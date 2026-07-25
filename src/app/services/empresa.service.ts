import { Injectable, Injector, computed, inject, runInInjectionContext, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { UtilsService } from './utils.service';
import { Empresa, MoraConfig, Ruta, User } from '../models';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { RoleService } from './role.service';
import { Roles } from '../models/roles.enum';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {

  private readonly http = inject(HttpClient);
  private readonly utilsSvc = inject(UtilsService);
  private readonly baseUrl: string = environment.baseUrl;

  /** Injector raíz para lazy injection (rompe ciclo Auth↔Empresa↔Role). */
  private readonly injector = inject(Injector);

  // --- Signals (State Management) ---
  private readonly _empresa = signal<Empresa | null>(null);
  public readonly empresa = computed(() => this._empresa());

  /** True cuando el SUPERADMIN marcó la suscripción como no pagada. */
  public readonly paymentDue = computed(() => {
    const e = this._empresa();
    if (!e) return false;
    return e.isSubscriptionPaid === false;
  });

  public readonly paymentDueLabel = computed(() => {
    if (!this.paymentDue()) return '';
    const day = this._empresa()?.dayOfPay;
    return day != null
      ? `Pago pendiente · día ${day}`
      : 'Pago de suscripción pendiente';
  });

  private readonly _ruta = signal<Ruta | null>(null);
  public readonly ruta = computed(() => this._ruta());

  private readonly _rutas = signal<Ruta[]>([]);
  public readonly rutas = computed(() => this._rutas());

  private readonly _employes = signal<User[]>([]);
  public readonly employes = computed(() => this._employes());

  // --- Getters ---
  get user(): User {
    return this.utilsSvc.getFromLocalStorage('user') as User;
  }

  // --- State Mutators ---
  setRuta(ruta: Ruta) {
    this._ruta.set(ruta);
  }

  removeRuta() {
    this._ruta.set(null);
  }

  setRutas(rutas: Ruta[]) {
    this._rutas.set(rutas);
  }

  updateRutaLock(rutaId: string, isLocked: boolean): void {
    this._rutas.update(rutas =>
      rutas.map(ruta =>
        ruta.id === rutaId || ruta._id === rutaId
          ? { ...ruta, isLocked }
          : ruta
      )
    );

    const current = this._ruta();
    if (current && (current.id === rutaId || current._id === rutaId)) {
      this._ruta.set({ ...current, isLocked });
    }
  }

  updateRutaStatus(rutaId: string, status: boolean): void {
    this._rutas.update(rutas =>
      rutas.map(ruta =>
        ruta.id === rutaId || ruta._id === rutaId
          ? { ...ruta, status }
          : ruta
      )
    );

    const current = this._ruta();
    if (current && (current.id === rutaId || current._id === rutaId)) {
      this._ruta.set({ ...current, status });
    }
  }

  removeRutas() {
    this._rutas.set([]);
  }

  /**
   * Applies company payload into local signals (rutas / empleados).
   * SUPERVISOR: solo rutas asignadas y sin empleados (defensa en profundidad).
   * Usa runInInjectionContext para lazy-inyectar RoleService y romper el ciclo.
   */
  applyEmpresa(empresa: Empresa): void {
    let rutas = empresa.rutas || [];
    let employes = empresa.employes || [];

    // Lazy injection para romper el ciclo AuthService → EmpresaService → RoleService → AuthService
    runInInjectionContext(this.injector, () => {
      const roleSvc = inject(RoleService);
      if (roleSvc.rol() === Roles.supervisor) {
        const allowed = new Set(roleSvc.assignedRutaIds());
        rutas = rutas.filter((r) => allowed.has(String(r.id || r._id)));
        employes = [];
      }
    });

    this._empresa.set({ ...empresa, rutas, employes });
    this.setRutas(rutas);
    this._employes.set(employes);
  }

  /** Actualiza solo flags de suscripción (p. ej. vía WebSocket). */
  patchSubscriptionLocal(patch: {
    isSubscriptionPaid?: boolean;
    subscriptionStatus?: Empresa['subscriptionStatus'];
    dayOfPay?: number;
  }): void {
    this._empresa.update((current) => {
      if (!current) return current;
      return {
        ...current,
        ...patch,
      };
    });
  }

  /**
   * Fetches company data and updates internal state (rutas and employees).
   */
  setEmpresa(id: string) {
    if (!id) return;
    this.getEmpresa(id).subscribe({
      next: (empresa) => this.applyEmpresa(empresa),
      error: (err) => console.error('Error al obtener la empresa:', err)
    });
  }

  // --- HTTP Requests ---
  // Note: AuthInterceptor handles 'authorization' header automatically.

  getEmpresa(id: string): Observable<Empresa> {
    return this.http.get<Empresa>(`${this.baseUrl}/empresa/${id}`);
  }

  getEmpleados(): Observable<User[]> {
    const params = new HttpParams().append('empresa', this.user.empresa);
    return this.http.get<User[]>(`${this.baseUrl}/empresa/get-empleados`, { params });
  }

  addEmpleado(empleado: any, empresaId?: string): Observable<boolean> {
    const body = { ...empleado, empresa: empresaId || this.empresa()?.id };
    return this.http.post<boolean>(`${this.baseUrl}/empresa/add-empleado`, body);
  }

  deleteEmpleado(idEmpleado: string): Observable<boolean> {
    const params = new HttpParams()
      .append('empresa', this._empresa()?.id || '')
      .append('empleado', idEmpleado);

    return this.http.delete<boolean>(`${this.baseUrl}/empresa/remove-empleado`, { params });
  }

  editEmpresa(idEmpresa: string, empresa: Partial<Empresa>): Observable<boolean> {
    return this.http.patch<boolean>(`${this.baseUrl}/empresa/update/${idEmpresa}`, empresa);
  }

  updateMoraConfig(idEmpresa: string, config: MoraConfig): Observable<Empresa> {
    return this.http.patch<Empresa>(`${this.baseUrl}/empresa/${idEmpresa}/mora-config`, config);
  }

  getBackUp(idEmpresa: string): Observable<ArrayBuffer> {
    const params = new HttpParams().append('empresa', idEmpresa);
    return this.http.get(`${this.baseUrl}/reports/backup`, { params, responseType: 'arraybuffer' });
  }

  sendBackup(idEmpresa: string, email?: string): Observable<boolean> {
    let params = new HttpParams().append('empresa', idEmpresa);
    if (email) params = params.append('to', email);

    return this.http.get<boolean>(`${this.baseUrl}/reports/send-backup`, { params });
  }

  getAllEmpresas(): Observable<Empresa[]> {
    return this.http.get<Empresa[]>(`${this.baseUrl}/empresa/all`);
  }

  getOverdueEmpresas(includeGrace = false): Observable<Empresa[]> {
    let params = new HttpParams();
    if (includeGrace) {
      params = params.set('includeGrace', 'true');
    }
    return this.http.get<Empresa[]>(`${this.baseUrl}/empresa/overdue`, { params });
  }

  updateSubscription(
    id: string,
    body: {
      dayOfPay?: number;
      isSubscriptionPaid?: boolean;
      subscriptionGraceDays?: number;
    },
  ): Observable<Empresa> {
    return this.http.patch<Empresa>(`${this.baseUrl}/empresa/${id}/subscription`, body);
  }

  suspendEmpresa(
    id: string,
    reason: 'PAYMENT' | 'MANUAL' = 'PAYMENT',
  ): Observable<Empresa> {
    return this.http.post<Empresa>(`${this.baseUrl}/empresa/${id}/suspend`, { reason });
  }

  unsuspendEmpresa(id: string, markPaid = false): Observable<Empresa> {
    let params = new HttpParams();
    if (markPaid) {
      params = params.set('markPaid', 'true');
    }
    return this.http.post<Empresa>(`${this.baseUrl}/empresa/${id}/unsuspend`, {}, { params });
  }

  createEmpresa(payload: Partial<Empresa> & { name: string; country: string }): Observable<Empresa> {
    return this.http.post<Empresa>(`${this.baseUrl}/empresa`, payload);
  }

  deleteEmpresa(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/empresa/${id}`);
  }

  moveEmpleado(body: {
    empleadoId: string;
    fromEmpresaId: string;
    toEmpresaId: string;
    rutaId?: string;
  }): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.baseUrl}/empresa/move-empleado`, body);
  }

  moveRuta(body: {
    rutaId: string;
    fromEmpresaId: string;
    toEmpresaId: string;
  }): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.baseUrl}/empresa/move-ruta`, body);
  }

  assignRuta(body: { rutaId: string; empresaId: string }): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.baseUrl}/empresa/assign-ruta`, body);
  }

  getEmpleadosByEmpresa(empresaId: string): Observable<User[]> {
    const params = new HttpParams().append('empresa', empresaId);
    return this.http.get<User[]>(`${this.baseUrl}/empresa/get-empleados`, { params });
  }
}
