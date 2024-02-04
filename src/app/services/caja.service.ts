import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Caja, User } from '../models';
import { environment } from 'src/environments/environment';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root'
})
export class CajaService {

  private readonly baseUrl: string = environment.baseUrl;

  constructor(
    private http: HttpClient,
    private utilSvc: UtilsService,
  ) { }

  get user(): User {
    return this.utilSvc.getFromLocalStorage('user') as User;
  }

  getCajaByRutaAndDate(ruta: string, date: string): Observable<Caja> {

    const url = `${this.baseUrl}/caja`;

    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`)

    const params = new HttpParams()
      .append('ruta', ruta)
      .append('fecha', date)

    return this.http.get<Caja>(url, {headers, params})

  }
}
