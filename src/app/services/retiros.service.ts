import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { UtilsService } from './utils.service';
import { Retiro, User } from '../models';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RetirosService {

  private baseUrl: string = environment.baseUrl;

  constructor(
    private http: HttpClient,
    private utilsSvc: UtilsService,
  ) { }

  get user(): User{
    return this.utilsSvc.getFromLocalStorage('user') as User;
  }

  getRetirosByDate(fecha: string, idRuta: string): Observable<Retiro[]> {
    const url: string = `${this.baseUrl}/retiro/get-by-date`;

    const headers = new HttpHeaders()
      .set('authorization', `Bearer ${this.user.token}`);

    const params = new HttpParams()
      .append('fecha', fecha)
      .append('ruta', idRuta);

    return this.http.get<Retiro[]>(url, {headers, params})
  }
}
