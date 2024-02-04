import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { UtilsService } from './utils.service';
import { Inversion, User } from '../models';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InversionesService {

  private baseUrl: string = environment.baseUrl;

  constructor(
    private http: HttpClient,
    private utilsSvc: UtilsService,
  ) { }

  get user(): User {
    return this.utilsSvc.getFromLocalStorage('user') as User;
  }

  getInversionesByDate(fecha: string, idRuta: string): Observable<Inversion[]> {
    const url: string = `${this.baseUrl}/inversion/get-by-date`;

    const headers = new HttpHeaders()
      .set('authorization', `Bearer ${this.user.token}`);

    const params = new HttpParams()
      .append('fecha', fecha)
      .append('ruta', idRuta);

    return this.http.get<Inversion[]>(url, {headers, params})
  }
}
