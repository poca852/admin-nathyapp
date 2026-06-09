import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  ReporteCajaHistoricoResponse,
  ReporteCarteraResponse,
  ReporteFinancieroResponse,
  ReporteOficinaResponse,
  ReporteQueryParams,
} from '../models/reportes.interface';
import { User } from '../models';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root',
})
export class ReportesService {
  private readonly http = inject(HttpClient);
  private readonly utilsSvc = inject(UtilsService);
  private readonly baseUrl = environment.baseUrl;

  private get user(): User {
    return this.utilsSvc.getFromLocalStorage('user') as User;
  }

  private authHeaders(): HttpHeaders {
    return new HttpHeaders().set('authorization', `Bearer ${this.user.token}`);
  }

  private buildParams(params: ReporteQueryParams): HttpParams {
    let httpParams = new HttpParams();

    if (params.fechaInicio) {
      httpParams = httpParams.set('fechaInicio', params.fechaInicio);
    }
    if (params.fechaFin) {
      httpParams = httpParams.set('fechaFin', params.fechaFin);
    }
    if (params.rutaId) {
      httpParams = httpParams.set('rutaId', params.rutaId);
    }

    return httpParams;
  }

  getCartera(rutaId?: string): Observable<ReporteCarteraResponse> {
    const params = this.buildParams({ rutaId });
    return this.http.get<ReporteCarteraResponse>(`${this.baseUrl}/reportes/cartera`, {
      headers: this.authHeaders(),
      params,
    });
  }

  getFinanciero(
    fechaInicio: string,
    fechaFin: string,
    rutaId?: string,
  ): Observable<ReporteFinancieroResponse> {
    const params = this.buildParams({ fechaInicio, fechaFin, rutaId });
    return this.http.get<ReporteFinancieroResponse>(`${this.baseUrl}/reportes/financiero`, {
      headers: this.authHeaders(),
      params,
    });
  }

  getOficina(
    fechaInicio: string,
    fechaFin: string,
    rutaId?: string,
  ): Observable<ReporteOficinaResponse> {
    const params = this.buildParams({ fechaInicio, fechaFin, rutaId });
    return this.http.get<ReporteOficinaResponse>(`${this.baseUrl}/reportes/oficina`, {
      headers: this.authHeaders(),
      params,
    });
  }

  getCajaHistorico(
    fechaInicio: string,
    fechaFin: string,
    rutaId?: string,
  ): Observable<ReporteCajaHistoricoResponse> {
    const params = this.buildParams({ fechaInicio, fechaFin, rutaId });
    return this.http.get<ReporteCajaHistoricoResponse>(`${this.baseUrl}/reportes/caja-historico`, {
      headers: this.authHeaders(),
      params,
    });
  }
}
