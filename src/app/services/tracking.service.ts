import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CobradorTrackingHoy } from './ws.service';

@Injectable({
  providedIn: 'root',
})
export class TrackingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.baseUrl;

  getEmpresaHoy(empresaId: string): Observable<CobradorTrackingHoy[]> {
    return this.http.get<CobradorTrackingHoy[]>(
      `${this.baseUrl}/tracking/empresa/${empresaId}/hoy`,
    );
  }

  getCobradorHoy(cobradorId: string): Observable<CobradorTrackingHoy> {
    return this.http.get<CobradorTrackingHoy>(
      `${this.baseUrl}/tracking/cobrador/${cobradorId}/hoy`,
    );
  }
}
