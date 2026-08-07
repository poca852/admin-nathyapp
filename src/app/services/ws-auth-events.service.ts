import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  WsAuthEventsResponse,
  WsAuthFailureReason,
} from '../models/ws-auth-event.interface';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WsAuthEventsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.baseUrl;

  getEvents(opts?: {
    reason?: WsAuthFailureReason | 'ALL';
    hours?: number;
    limit?: number;
  }): Observable<WsAuthEventsResponse> {
    let params = new HttpParams();
    if (opts?.reason && opts.reason !== 'ALL') {
      params = params.set('reason', opts.reason);
    }
    if (opts?.hours != null) {
      params = params.set('hours', String(opts.hours));
    }
    if (opts?.limit != null) {
      params = params.set('limit', String(opts.limit));
    }
    return this.http.get<WsAuthEventsResponse>(
      `${this.baseUrl}/ws-auth-events`,
      { params },
    );
  }
}
