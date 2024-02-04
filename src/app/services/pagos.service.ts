import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { Pago, User } from '../models';
import { environment } from '../../environments/environment';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root'
})
export class PagosService {

  private http = inject(HttpClient);
  private utilsSvc = inject(UtilsService);
  private readonly baseUrl: string = environment.baseUrl;

  private _pagos = signal<Pago[]>([]);
  public pagos = computed(() => this._pagos());

  constructor() { }

  get user(): User {
    return this.utilsSvc.getFromLocalStorage('user') as User;
  }

  public setPagos(pagos: Pago[]): void {
    this._pagos.set(pagos);
  }

  getPagosByRutaAndDate(idRuta: string, date: string): Observable<Pago[]> {
    const url: string = `${this.baseUrl}/pago`;

    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`)

    const params = new HttpParams()
      .append('ruta', idRuta)
      .append('fecha', date)

    return this.http.get<Pago[]>(url, {headers, params});
  }

  updatePago(idPago: string, body: any): Observable<boolean>{

    const url: string = `${this.baseUrl}/pago/${idPago}`;

    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`)

    return this.http.patch<boolean>(url, body, {headers})
  }
}
