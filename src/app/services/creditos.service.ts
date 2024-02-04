import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Credito, User } from '../models';
import { UtilsService } from './utils.service';
import { Observable } from 'rxjs';
import { MomentService } from '../config/plugins/moment.plugin';

@Injectable({
  providedIn: 'root'
})
export class CreditosService {

  private readonly baseUrl: string = environment.baseUrl;
  private _currentCredito = signal<Credito|null>(null);
  public currentCredito = computed(() => this._currentCredito());

  constructor(
    private http: HttpClient,
    private utilsSvc: UtilsService,
    private moment: MomentService,
  ) { }

  get user(): User {
    return this.utilsSvc.getFromLocalStorage('user') as User;
  }

  setCurrentCredito(credito: Credito): void {
    this._currentCredito.set(credito);
  }

  removeCurrentCredito(): void {
    this._currentCredito.set(null);
  }

  getRenovaciones(fecha: string): Observable<Credito[]> {
    const url: string = `${this.baseUrl}/credito/renovaciones`;

    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`);

    const params = new HttpParams()
      .set('fecha', fecha);

    return this.http.get<Credito[]>(url, {headers, params});
      
  }

  updateCredito(id: string, credito: any){
    const url: string = `${this.baseUrl}/credito/${id}`;

    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`);

    const params = new HttpParams()
      .set('fecha', this.moment.nowWithFormat('YYYY-MM-DD'));

    return this.http.patch<Credito>(url, credito, {headers, params});
  }

  deleteCredito(id: string){
    const url: string = `${this.baseUrl}/credito/${id}`;

    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`);

    return this.http.delete<boolean>(url, {headers});
  }
}
