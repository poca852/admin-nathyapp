import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Cliente, Credito, User } from '../models';
import { Observable } from 'rxjs';
import { UtilsService } from './utils.service';

export interface ClienteDetail {
  cliente: Cliente;
  credito: Credito | null;
}

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  private readonly baseUrl: string = environment.baseUrl;
  private _clientes = signal<Cliente[]>([]);
  public clientes = computed(() => this._clientes());
  private _currentCliente = signal<Cliente | null>(null);
  public currentCliente = computed(() => this._currentCliente());

  constructor(
    private http: HttpClient,
    private utilsSvc: UtilsService
  ) { }

  get user(): User {
    return this.utilsSvc.getFromLocalStorage('user') as User;
  }

  public setCurrentCliente(cliente: Cliente) {
    this._currentCliente.set(cliente);
  }

  public removeCurrentCliente() {
    this._currentCliente.set(null);
  }

  public setClientes(clientes: Cliente[]): void {
    this._clientes.set(clientes);
  }

  public removeClientes(): void {
    this._clientes.set([]);
  }

  getClientesByRuta(idRuta: string, includeInactive = false): Observable<Cliente[]> {
    const url: string = `${this.baseUrl}/cliente/admin`;
    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`);

    let params = new HttpParams()
      .append('idRuta', idRuta);

    if (includeInactive) {
      params = params.append('includeInactive', 'true');
    }

    return this.http.get<Cliente[]>(url, { headers, params })

  }

  updateCliente(idCliente: string, body: any): Observable<boolean> {
    const url: string = `${this.baseUrl}/cliente/${idCliente}`;
    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`);

    return this.http.patch<boolean>(url, body, { headers });
  }

  setClienteState(idCliente: string, state: boolean): Observable<Cliente> {
    const url: string = `${this.baseUrl}/cliente/${idCliente}/state`;
    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`);

    return this.http.patch<Cliente>(url, { state }, { headers });
  }

  deleteCliente(idCliente: string): Observable<{ message: string }> {
    const url: string = `${this.baseUrl}/cliente/${idCliente}`;
    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`);
    return this.http.delete<{ message: string }>(url, { headers });
  }

  getClienteById(idCliente: string): Observable<ClienteDetail> {
    const url: string = `${this.baseUrl}/cliente/${idCliente}`;
    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`);

    return this.http.get<ClienteDetail>(url, { headers });
  }

}
