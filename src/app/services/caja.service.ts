import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Caja, User } from '../models';
import { environment } from 'src/environments/environment';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root',
})
export class CajaService {
  private readonly baseUrl: string = environment.baseUrl;
  private readonly http = inject(HttpClient);
  private readonly utilSvc = inject(UtilsService);

  get user(): User {
    return this.utilSvc.getFromLocalStorage('user') as User;
  }

  private authHeaders(): HttpHeaders {
    return new HttpHeaders().append('authorization', `Bearer ${this.user.token}`);
  }

  /** Snapshot histórico persistido (día cerrado). */
  getCajaByRutaAndDate(ruta: string, date: string): Observable<Caja> {
    const params = new HttpParams()
      .append('ruta', ruta)
      .append('fecha', date);
    return this.http.get<Caja>(`${this.baseUrl}/caja`, {
      headers: this.authHeaders(),
      params,
    });
  }

  /** Ledger en vivo del día abierto. */
  getCurrentCaja(ruta: string): Observable<Caja> {
    const params = new HttpParams().append('ruta', ruta);
    return this.http.get<Caja>(`${this.baseUrl}/caja/current`, {
      headers: this.authHeaders(),
      params,
    });
  }
}
