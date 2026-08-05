import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  ConvertLeadPayload,
  ConvertLeadResponse,
  Lead,
  LeadStatus,
} from '../models';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class LeadsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.baseUrl;

  getLeads(status?: LeadStatus): Observable<Lead[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<Lead[]>(`${this.baseUrl}/leads`, { params });
  }

  getLead(id: string): Observable<Lead> {
    return this.http.get<Lead>(`${this.baseUrl}/leads/${id}`);
  }

  updateLead(
    id: string,
    body: { status?: LeadStatus; notas?: string },
  ): Observable<Lead> {
    return this.http.patch<Lead>(`${this.baseUrl}/leads/${id}`, body);
  }

  convertLead(id: string, body: ConvertLeadPayload): Observable<ConvertLeadResponse> {
    return this.http.post<ConvertLeadResponse>(
      `${this.baseUrl}/leads/${id}/convert`,
      body,
    );
  }

  deleteLead(id: string): Observable<{ ok: boolean; message: string }> {
    return this.http.delete<{ ok: boolean; message: string }>(
      `${this.baseUrl}/leads/${id}`,
    );
  }
}
