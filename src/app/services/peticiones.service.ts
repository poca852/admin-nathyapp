import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal, effect } from '@angular/core';
import { environment } from 'src/environments/environment';
import { PeticionUbicacion, AuthStatus } from '../models';
import { Observable, interval, switchMap, tap, Subscription } from 'rxjs';
import { UtilsService } from './utils.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PeticionesService {
  private http = inject(HttpClient);
  private utilsSvc = inject(UtilsService);
  private authService = inject(AuthService);

  private baseUrl: string = environment.baseUrl;
  private _peticionesPendientes = signal<PeticionUbicacion[]>([]);
  public peticionesPendientes = computed(() => this._peticionesPendientes());
  public cantidadPendientes = computed(() => this._peticionesPendientes().length);

  private pollingInterval = 30000; // 30 segundos
  private pollingSubscription: Subscription | null = null;

  constructor() {
    // Efecto para iniciar/detener polling basado en estado de autenticación
    effect(() => {
      const status = this.authService.authStatus();
      if (status === AuthStatus.authenticated) {
        this.startPolling();
      } else {
        this.stopPolling();
        this._peticionesPendientes.set([]);
      }
    }, { allowSignalWrites: true });
  }

  private getEmpresaId(): string {
    const user = this.authService.currentUser();
    return user?.empresa || '';
  }

  getPeticionesPendientes(): Observable<PeticionUbicacion[]> {
    const url = `${this.baseUrl}/peticiones-ubicacion`;

    const params = new HttpParams()
      .set('estado', 'pendiente')
      .set('id_empresa', this.getEmpresaId());

    return this.http.get<PeticionUbicacion[]>(url, { params }).pipe(
      tap(peticiones => {
        this._peticionesPendientes.set(peticiones);
      })
    );
  }

  aprobarPeticion(id: string): Observable<boolean> {
    const url = `${this.baseUrl}/peticiones-ubicacion/${id}`;
    const body = { esAprobado: true };

    return this.http.patch<boolean>(url, body).pipe(
      tap(() => {
        // Remover la petición aprobada de la lista local
        this._peticionesPendientes.update(peticiones =>
          peticiones.filter(p => p.id !== id)
        );
      })
    );
  }

  rechazarPeticion(id: string): Observable<boolean> {
    const url = `${this.baseUrl}/peticiones-ubicacion/${id}`;
    const body = { esAprobado: false };

    return this.http.patch<boolean>(url, body).pipe(
      tap(() => {
        // Remover la petición rechazada de la lista local
        this._peticionesPendientes.update(peticiones =>
          peticiones.filter(p => p.id !== id)
        );
      })
    );
  }

  startPolling(): void {
    // Detener polling existente
    this.stopPolling();

    // Cargar inmediatamente
    this.getPeticionesPendientes().subscribe();

    // Configurar intervalo
    this.pollingSubscription = interval(this.pollingInterval).pipe(
      switchMap(() => this.getPeticionesPendientes())
    ).subscribe();
  }

  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  // Método para forzar una actualización manual
  refreshPeticiones(): void {
    this.getPeticionesPendientes().subscribe();
  }
}