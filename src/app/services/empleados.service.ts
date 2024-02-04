import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AddUser, User } from '../models';
import { Observable, map } from 'rxjs';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root'
})
export class EmpleadosService {

  private http = inject(HttpClient);
  private utilsSvc = inject(UtilsService);

  private readonly baseUrl: string = environment.baseUrl;

  private _employes = signal<User[]>([]);
  public employes = computed(() => this._employes());

  private _currentEmploye = signal<User | null>(null);
  public currentEmploye = computed(() => this._currentEmploye());

  constructor() { }

  get user(): User {
    return this.utilsSvc.getFromLocalStorage('user') as User;
  }

  setEmployes(users: User[]): void {
    this._employes.set(users)
  }

  setCurrentEmploye(user: User): void {
    this._currentEmploye.set(user);
  }

  removeCurrentEmploye() {
    this._currentEmploye.set(null);
  }

  getEmployes(): Observable<User[]> {
    const url: string = `${this.baseUrl}/auth/users`;

    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`)

    const params = new HttpParams()
      .set('have_empresa', true);

    return this.http.get<User[]>(url, { headers, params })
  }

  updateEmploye(idUser: string, empleado: any): Observable<boolean> {
    const headers = new HttpHeaders()
      .set('authorization', `Bearer ${this.user.token}`);

    return this.http.patch<User>(`${this.baseUrl}/auth/update-user/${idUser}`, empleado, { headers })
      .pipe(
        map((user) => true)
      )
  }

}
