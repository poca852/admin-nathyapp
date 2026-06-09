import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Credito, HistorialCredito, User } from '../models';
import { UtilsService } from './utils.service';
import { Observable } from 'rxjs';
import { MomentService } from '../config/plugins/moment.plugin';
import { EmpresaReport } from '../pages/main/renovaciones/interfaces/renovacion-report.interface';
import { CajaMovimiento } from '../models/caja-movimiento.interface';

@Injectable({
  providedIn: 'root'
})
export class CreditosService {

  private readonly baseUrl: string = environment.baseUrl;
  private _currentCredito = signal<Credito | null>(null);
  public currentCredito = computed(() => this._currentCredito());

  constructor(
    private http: HttpClient,
    private utilsSvc: UtilsService,
    private moment: MomentService,
  ) { }

  get user(): User {
    return this.utilsSvc.getFromLocalStorage('user') as User;
  }

  setCurrentCredito(credito: Credito): void {
    this._currentCredito.set(credito);
  }

  removeCurrentCredito(): void {
    this._currentCredito.set(null);
  }

  getRenovaciones(fecha: string, ruta?: string): Observable<EmpresaReport> {
    const url: string = `${this.baseUrl}/renovacion/diaria`;

    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`);

    let params = new HttpParams()
      .set('fecha', fecha);

    if (ruta) params = params.append('rutaId', ruta);

    return this.http.get<EmpresaReport>(url, { headers, params });

  }

  updateCredito(id: string, credito: any) {

    delete credito.esAutomatico

    const url: string = `${this.baseUrl}/movimiento-caja/update-credito/${id}`;

    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`);

    return this.http.patch<boolean>(url, credito, { headers });
  }

  deleteCredito(creditoId: string, movimientoId: string) {
    const url: string = `${this.baseUrl}/movimiento-caja/delete-credito/${creditoId}/${movimientoId}`;

    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`);

    return this.http.delete<boolean>(url, { headers });
  }

  getHistorialCreditos(clienteId: string) {
    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${this.user.token}`);

    const params = new HttpParams()
      .append('clienteId', clienteId)

    return this.http.get<HistorialCredito[]>(`${this.baseUrl}/credito/historial`, { headers, params })
  }

  getHistorialPagos(rutaId: string, creditoId: string) {

    const url = `${this.baseUrl}/movimiento-caja/historial-pagos`;
    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${this.user.token}`);

    const params = new HttpParams()
      .append('rutaId', rutaId)
      .append('creditoId', creditoId)

    return this.http.get<CajaMovimiento[]>(url, { headers, params })

  }

}
