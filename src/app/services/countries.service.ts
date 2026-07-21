import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { City, Country, Region, State, User } from '../models';
import { environment } from 'src/environments/environment';
import { UtilsService } from './utils.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject } from '@angular/core';

/** Países soportados por la app (lista local; el endpoint /country/America ya no existe). */
export const PAISES_SOPORTADOS: string[] = [
  'Guatemala',
  'Colombia',
  'Brasil',
  'Mexico',
  'Argentina',
  'Peru',
];

@Injectable({
  providedIn: 'root'
})
export class CountriesService {

  private baseUrl = environment.baseUrl;
  private http = inject(HttpClient);
  private utilsSvc = inject(UtilsService);

  private _regions: Region[] = [Region.Africa, Region.Americas, Region.Asia, Region.Europe, Region.Oceania];

  constructor() {}

  get regions(): Region[] {
    return [...this._regions];
  }

  get user(): User {
    return this.utilsSvc.getFromLocalStorage('user') as User;
  }

  getPaises(): Observable<Country[]> {
    return of(
      PAISES_SOPORTADOS.map((name, index) => ({
        _id: String(index + 1),
        id: index + 1,
        id_region: 1,
        name,
      }))
    );
  }

  getEstadosByCountry(country: string): Observable<State[]> {
    const url: string = `${this.baseUrl}/country/state/${country}`;
    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`);

    return this.http.get<State[]>(url, { headers });
  }

  getCitiesByEstado(state: string): Observable<City[]> {
    const url: string = `${this.baseUrl}/country/city/${state}`;
    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`);

    return this.http.get<City[]>(url, { headers });
  }

}
