import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Observable, Subscription, interval, map, of, switchMap, tap } from 'rxjs';

import { environment } from 'src/environments/environment';
import { AuthStatus, PeticionImagen } from '../models';
import { Roles } from '../models/roles.enum';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class PeticionesImagenService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly baseUrl = environment.baseUrl;
  private readonly _pendientes = signal<PeticionImagen[]>([]);
  private readonly _cantidad = signal(0);
  readonly peticionesPendientes = computed(() => this._pendientes());
  readonly cantidadPendientes = computed(() => this._cantidad());

  private readonly pollingInterval = 30000;
  private pollingSubscription: Subscription | null = null;

  constructor() {
    effect(() => {
      const status = this.authService.authStatus();
      if (status === AuthStatus.authenticated) {
        this.startPolling();
      } else {
        this.stopPolling();
        this._pendientes.set([]);
        this._cantidad.set(0);
      }
    }, { allowSignalWrites: true });
  }

  private getEmpresaId(): string | null {
    const user = this.authService.currentUser();
    if (!user || user.rol === Roles.superAdmin) return null;

    const empresa = user.empresa as unknown;
    if (!empresa) return null;
    if (typeof empresa === 'string') return empresa || null;
    if (typeof empresa === 'object') {
      const id = (empresa as { id?: string; _id?: string }).id
        || (empresa as { _id?: string })._id;
      return id || null;
    }
    return null;
  }

  getPeticionesPendientes(): Observable<PeticionImagen[]> {
    const params = this.paramsPendientes();
    if (!params) {
      this._pendientes.set([]);
      this._cantidad.set(0);
      return of([]);
    }

    return this.http.get<PeticionImagen[]>(`${this.baseUrl}/peticiones-imagen`, { params }).pipe(
      tap((peticiones) => {
        const lista = peticiones ?? [];
        this._pendientes.set(lista);
        this._cantidad.set(lista.length);
      }),
    );
  }

  private paramsPendientes(): HttpParams | null {
    const user = this.authService.currentUser();
    const empresaId = this.getEmpresaId();
    if (user?.rol !== Roles.superAdmin && !empresaId) return null;

    let params = new HttpParams().set('estado', 'pendiente');
    if (empresaId) {
      params = params.set('id_empresa', empresaId);
    }
    return params;
  }

  getConteo(): Observable<number> {
    const params = this.paramsPendientes();
    if (!params) {
      this._cantidad.set(0);
      return of(0);
    }

    return this.http.get<{ total: number }>(`${this.baseUrl}/peticiones-imagen/conteo`, { params }).pipe(
      tap((respuesta) => this._cantidad.set(respuesta?.total ?? 0)),
      map((respuesta) => respuesta?.total ?? 0),
    );
  }

  aprobarPeticion(id: string): Observable<PeticionImagen> {
    return this.http.patch<PeticionImagen>(`${this.baseUrl}/peticiones-imagen/${id}`, {
      esAprobado: true,
    }).pipe(
      tap(() => {
        this._pendientes.update((lista) => lista.filter((item) => item.id !== id));
        this._cantidad.update((total) => Math.max(0, total - 1));
      }),
    );
  }

  rechazarPeticion(id: string): Observable<PeticionImagen> {
    return this.http.patch<PeticionImagen>(`${this.baseUrl}/peticiones-imagen/${id}`, {
      esAprobado: false,
    }).pipe(
      tap(() => {
        this._pendientes.update((lista) => lista.filter((item) => item.id !== id));
        this._cantidad.update((total) => Math.max(0, total - 1));
      }),
    );
  }

  startPolling(): void {
    this.stopPolling();
    this.getConteo().subscribe({ error: () => { /* silenciar */ } });
    this.pollingSubscription = interval(this.pollingInterval).pipe(
      switchMap(() => this.getConteo()),
    ).subscribe({ error: () => { /* silenciar */ } });
  }

  stopPolling(): void {
    this.pollingSubscription?.unsubscribe();
    this.pollingSubscription = null;
  }
}
