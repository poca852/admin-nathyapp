import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Ruta, User } from '../models';
import { environment } from 'src/environments/environment';
import { UtilsService } from './utils.service';
import * as moment from 'moment';
import { MomentService } from '../config/plugins/moment.plugin';

@Injectable({
  providedIn: 'root'
})
export class RutaService {

  private http = inject(HttpClient);
  private utilsSvc = inject(UtilsService);
  momentSvc = inject(MomentService)

  private readonly baseUrl: string = environment.baseUrl;
  public readonly today: string = this.momentSvc.nowWithFormat('DD/MM/YYYY');

  constructor() { }

  get user(): User {
    return this.utilsSvc.getFromLocalStorage('user') as User;
  }

  getRutaById(id: string): Observable<Ruta> {

    const url: string = `${this.baseUrl}/ruta/${id}`;

    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`);

    return this.http.get<Ruta>(url, { headers })

  }

  getRutasByUser(): Observable<Ruta[]> {
    const url: string = `${this.baseUrl}/ruta`;

    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`);

    return this.http.get<Ruta[]>(url, { headers })
  }

  addRuta(ruta: any): Observable<Ruta> {
    const url: string = `${this.baseUrl}/ruta`;

    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`)

    return this.http.post<Ruta>(url, ruta, { headers })
  }

  updateRuta(idRuta: string, data: any): Observable<boolean> {
    const url: string = `${this.baseUrl}/ruta/${idRuta}`;

    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`)

    return this.http.patch<Ruta>(url, data, { headers })
      .pipe(
        map((ruta) => true)
      )
  }

  newCaja(idRuta: string): Observable<boolean> {
    const url: string = `${this.baseUrl}/ruta/open/${idRuta}`;

    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`)

    const params = new HttpParams()
      .set('fecha', this.today)

    return this.http.patch<boolean>(url, {}, { headers, params })
  }

  closeCaja(idRuta: string): Observable<boolean> {
    const url: string = `${this.baseUrl}/ruta/close/${idRuta}`;

    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`)

    const params = new HttpParams()
      .set('fecha', this.today)

    return this.http.patch<boolean>(url, {}, { headers, params })
  }

  getRutasByEmpresa() {
    const url: string = `${this.baseUrl}/empresa`;

    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`);

    return this.http.get<Ruta[]>(url, { headers })
  }

}
