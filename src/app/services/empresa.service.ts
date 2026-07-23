import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { UtilsService } from './utils.service';
import { Empresa, MoraConfig, Ruta, User } from '../models';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {

  private readonly http = inject(HttpClient);
  private readonly utilsSvc = inject(UtilsService);
  private readonly baseUrl: string = environment.baseUrl;

  // --- Signals (State Management) ---
  private readonly _empresa = signal<Empresa | null>(null);
  public readonly empresa = computed(() => this._empresa());

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
   */
  applyEmpresa(empresa: Empresa): void {
    this._empresa.set(empresa);
    this.setRutas(empresa.rutas || []);
    this._employes.set(empresa.employes || []);
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
