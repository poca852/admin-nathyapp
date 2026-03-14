import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { UtilsService } from './utils.service';
import { Empresa, Ruta, User } from '../models';
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

  removeRutas() {
    this._rutas.set([]);
  }

  /**
   * Fetches company data and updates internal state (rutas and employees).
   */
  setEmpresa(id: string) {
    this.getEmpresa(id).subscribe({
      next: (empresa) => {
        this._empresa.set(empresa);
        this.setRutas(empresa.rutas || []);
        this._employes.set(empresa.employes || []);
      },
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

  addEmpleado(empleado: any): Observable<boolean> {
    const body = { ...empleado, empresa: this.empresa()?.id };
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

  getBackUp(idEmpresa: string): Observable<ArrayBuffer> {
    const params = new HttpParams().append('empresa', idEmpresa);
    return this.http.get(`${this.baseUrl}/reports/backup`, { params, responseType: 'arraybuffer' });
  }

  sendBackup(idEmpresa: string, email?: string): Observable<boolean> {
    let params = new HttpParams().append('empresa', idEmpresa);
    if (email) params = params.append('to', email);

    return this.http.get<boolean>(`${this.baseUrl}/reports/send-backup`, { params });
  }
}
