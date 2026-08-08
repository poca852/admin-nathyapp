import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import { AppConfig, UpdateAppConfigPayload } from '../models';

@Injectable({
  providedIn: 'root',
})
export class AppConfigService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.baseUrl;

  getAdmin(): Observable<AppConfig> {
    return this.http.get<AppConfig>(`${this.baseUrl}/app-config/admin`);
  }

  update(payload: UpdateAppConfigPayload): Observable<AppConfig> {
    return this.http.patch<AppConfig>(`${this.baseUrl}/app-config`, payload);
  }
}
