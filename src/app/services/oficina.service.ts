import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import { UtilsService } from './utils.service';
import { User } from '../models';
import { Observable } from 'rxjs';
import { ResumenOficinaResponse } from '../pages/main/oficina/interfaces/resumen-oficina.interface';

@Injectable({
  providedIn: 'root'
})
export class OficinaService {

  private readonly http = inject(HttpClient);
  private readonly utilsSvc = inject(UtilsService);
  private readonly baseUrl: string = environment.baseUrl;

  get user(): User {
    return this.utilsSvc.getFromLocalStorage('user') as User;
  }

  getResumen(rutaId: string, fecha: string): Observable<ResumenOficinaResponse> {
    const url = `${this.baseUrl}/movimiento-caja/oficina/resumen`;

    const headers = new HttpHeaders()
      .set('authorization', `Bearer ${this.user.token}`);

    const params = new HttpParams()
      .set('rutaId', rutaId)
      .set('fecha', fecha);

    return this.http.get<ResumenOficinaResponse>(url, { headers, params });
  }

  updateMovimiento(id: string, data: any): Observable<boolean> {
    const url = `${this.baseUrl}/movimiento-caja/update/${id}`;

    const headers = new HttpHeaders()
      .set('authorization', `Bearer ${this.user.token}`);

    return this.http.patch<boolean>(url, data, { headers });
  }

}
