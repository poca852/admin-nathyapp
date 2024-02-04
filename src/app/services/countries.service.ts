import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { City, Country, Region, State, User } from '../models';
import { environment } from 'src/environments/environment';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root'
})
export class CountriesService {

  private baseUrl = environment.baseUrl;
  private http = inject(HttpClient);
  private utilsSvc = inject(UtilsService);

  private _regions: Region[] = [ Region.Africa, Region.Americas, Region.Asia, Region.Europe, Region.Oceania];

  constructor() {}

  get regions(): Region[] {
    return [...this._regions];
  }

  get user(): User {
    return this.utilsSvc.getFromLocalStorage('user') as User;
  }

  getPaises(): Observable<Country[]> {

    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`);

    // const url: string = `${this.baseUrl}/region/americas?fields=cca3,name,borders`;
    const url: string = `${this.baseUrl}/country/America`;
    return this.http.get<Country[]>(url, {headers});
  }

  getEstadosByCountry(country: string): Observable<State[]> {
    const url: string = `${this.baseUrl}/country/state/${country}`;
    // const url: string = `https://www.universal-tutorial.com/api/states/${country}`;

    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`);

    return this.http.get<State[]>(url, {headers});

  }

  getCitiesByEstado(state: string): Observable<City[]> {
    const url: string = `${this.baseUrl}/country/city/${state}`;

    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`);

    return this.http.get<City[]>(url, {headers})
  }

}
