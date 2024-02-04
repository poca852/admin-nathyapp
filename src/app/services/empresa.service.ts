import { Injectable, computed, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { UtilsService } from './utils.service';
import { Empresa, ResponseBackup, Ruta, User } from '../models';
import { AuthService } from './auth.service';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {

  private readonly baseUrl: string = environment.baseUrl;

  private _empresa = signal<Empresa|null>(null);
  public empresa = computed(() => this._empresa());

  private _ruta = signal<Ruta|null>(null);
  public ruta = computed(() => this._ruta());

  private _rutas = signal<Ruta[]>([]);
  public rutas = computed(() => this._rutas());

  private _employes = signal<User[]>([]);
  public employes = computed(() => this._employes());

  constructor(
    private http: HttpClient,
    private utilsSvc: UtilsService,
  ) { 
    // this.setEmpresa();
  }

  get user(): User {
    return this.utilsSvc.getFromLocalStorage('user') as User;
  }

  setRuta(ruta: Ruta) {
    this._ruta.set(ruta);
  }

  removeRuta(){
    this._ruta.set(null);
  }

  removeRutas(){
    this._rutas.set([]);
  }

  setEmpresa() {
    this.getEmpresa().subscribe({
      next: empresa => {
        this._empresa.set(empresa);
        this._rutas.set(empresa.rutas);
        this._employes.set(empresa.employes)
      }
    })
  }

  getEmpresa(): Observable<Empresa>{
    const url: string = `${this.baseUrl}/empresa/${this.user.empresa}`;
    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`);

    return this.http.get<Empresa>(url, {headers})
      .pipe(
        map((empresa: Empresa) => {
          if(this.user.rutas.length === 0){
            return empresa;
          }else {
            empresa.rutas = empresa.rutas.filter(ruta => this.user.rutas.includes(ruta._id))
            return empresa;
          }
        })
      )
  }

  getEmpleados(): Observable<User[]> {
    const url: string = `${this.baseUrl}/empresa/get-empleados`;
    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`);
    
    const params = new HttpParams().append('empresa', this.user.empresa)

    return this.http.get<User[]>(url, {headers, params})
  }

  addEmpleado(empleado: any): Observable<boolean> {

    empleado.empresa = this.empresa()._id;
    
    const url: string = `${this.baseUrl}/empresa/add-empleado`;
    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`);

    return this.http.post<boolean>(url, empleado, {headers})
  } 

  deleteEmpleado(idEmpleado: string): Observable<boolean> {
    const url: string = `${this.baseUrl}/empresa/remove-empleado`;
    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`);

    const params = new HttpParams()
      .append('empresa', this.empresa()._id)
      .append('empleado', idEmpleado)

    return this.http.delete<boolean>(url, {headers, params})
  }

  editEmpresa(idEmpresa: string, empresa: any): Observable<boolean> {

    const url: string = `${this.baseUrl}/empresa/update/${idEmpresa}`;

    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`);

    return this.http.patch<boolean>(url, empresa, {headers});

  }

  addRuta(empresa: string, ruta: string) {
    const url: string = `${this.baseUrl}/empresa/add-ruta`;

    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`);

    const params = new HttpParams()
      .append('ruta', ruta)
      .append('empresa', empresa)

    return this.http.patch<boolean>(url, {}, {headers, params})
  }

  getBackUp(idEmpresa: string): Observable<ArrayBuffer> {

    const url: string = `${this.baseUrl}/reports/backup`;
    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`);

    const params = new HttpParams()
      .append('empresa', idEmpresa)

    return this.http.get(url, {headers, params, responseType: 'arraybuffer'})
  }

  sendBackup(idEmpresa: string, email?: string): Observable<boolean> {

    const url: string = `${this.baseUrl}/reports/send-backup`;
    const headers = new HttpHeaders()
      .append('authorization', `Bearer ${this.user.token}`);

    const params = new HttpParams()
      .append('empresa', idEmpresa)
      .append('to', email)

    return this.http.get<boolean>(url, {headers, params})
  }
}
