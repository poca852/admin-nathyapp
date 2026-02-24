import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { Pago, User } from '../models';
import { environment } from '../../environments/environment';
import { UtilsService } from './utils.service';
import { MovimientoCaja } from '../models/movimiento-caja.interface';

@Injectable({
  providedIn: 'root'
})
export class PagosService {

  private http = inject(HttpClient);
  private utilsSvc = inject(UtilsService);
  private readonly baseUrl: string = environment.baseUrl;

  private _pagos = signal<MovimientoCaja[]>([]);
  public pagos = computed(() => this._pagos());

  constructor() { }

  get user(): User {
    return this.utilsSvc.getFromLocalStorage('user') as User;
  }

  public setPagos(pagos: MovimientoCaja[]): void {
    this._pagos.set(pagos);
  }

  getPagosByRutaAndDate(idRuta: string, date: Date): Observable<MovimientoCaja[]> {
    const url: string = `${this.baseUrl}/movimiento-caja/resumen-por-ruta`;

    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`)

    const params = new HttpParams()
      .append('rutaId', idRuta)
      .append('fecha', date.toISOString())

    return this.http.get<MovimientoCaja[]>(url, {headers, params});
  }

  updatePago(idPago: string, body: any): Observable<boolean>{

    const url: string = `${this.baseUrl}/pago/${idPago}`;

    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`)

    return this.http.patch<boolean>(url, body, {headers})
  }
}
