import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { Gasto, ListaDeGastos, User } from '../models';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root'
})
export class GastosService {

  private readonly baseUrl: string = environment.baseUrl;

  private _listOfGastos = signal<ListaDeGastos[]>([]);
  public listOfGastos = computed(() => this._listOfGastos());

  constructor(
    private http: HttpClient,
    private utilsSvc: UtilsService,
  ) { 
    this.getListOfGastos().subscribe(lista => this._listOfGastos.set(lista))
  }

  get user(): User {
    return this.utilsSvc.getFromLocalStorage('user') as User;
  }

  updateGasto(idGasto: string, data: any): Observable<boolean> {
    const url: string = `${this.baseUrl}/gasto/${idGasto}`;

    const headers = new HttpHeaders()
      .set('authorization', `Bearer ${this.user.token}`);

    return this.http.patch<boolean>(url, data, {headers});
  }

  getGastosByDate(fecha: string, idRuta: string): Observable<Gasto[]> {
    const url: string = `${this.baseUrl}/gasto/get-by-date`;

    const headers = new HttpHeaders()
      .set('authorization', `Bearer ${this.user.token}`);

    const params = new HttpParams()
      .append('fecha', fecha)
      .append('ruta', idRuta);

    return this.http.get<Gasto[]>(url, {headers, params})
  }

  getListOfGastos(): Observable<ListaDeGastos[]> {
    const url: string = `${this.baseUrl}/list-gasto`;

    const headers = new HttpHeaders()
      .set('authorization', `Bearer ${this.user.token}`);

    return this.http.get<ListaDeGastos[]>(url, {headers});
  }

}
