import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { Empresa, Ruta, User } from '../models';
import { EmpresaService } from './empresa.service';

@Injectable({
  providedIn: 'root',
})
export class SuperAdminContextService {
  private readonly empresaSvc = inject(EmpresaService);

  private readonly _empresas = signal<Empresa[]>([]);
  private readonly _selectedEmpresa = signal<Empresa | null>(null);
  private readonly _selectedRuta = signal<Ruta | null>(null);
  private readonly _loading = signal(false);

  readonly empresas = computed(() => this._empresas());
  readonly selectedEmpresa = computed(() => this._selectedEmpresa());
  readonly selectedRuta = computed(() => this._selectedRuta());
  readonly loading = computed(() => this._loading());

  readonly rutasDeEmpresa = computed(() => this._selectedEmpresa()?.rutas ?? []);
  readonly empleadosDeEmpresa = computed(() => this._selectedEmpresa()?.employes ?? []);

  loadEmpresas(): Observable<Empresa[]> {
    this._loading.set(true);
    return this.empresaSvc.getAllEmpresas().pipe(
      tap((list) => {
        const normalized = (list || []).map((e: any) => ({
          ...e,
          id: e.id || e._id,
        }));
        this._empresas.set(normalized);

        const current = this._selectedEmpresa();
        if (current) {
          const refreshed = normalized.find((e) => e.id === current.id);
          if (refreshed) this._selectedEmpresa.set(refreshed);
        }
      }),
      finalize(() => this._loading.set(false)),
    );
  }

  selectEmpresa(empresa: Empresa | null): void {
    this._selectedEmpresa.set(empresa);
    this._selectedRuta.set(null);
  }

  selectEmpresaById(id: string): void {
    const found = this._empresas().find((e) => e.id === id || (e as any)._id === id) ?? null;
    this.selectEmpresa(found);
  }

  /** Carga detalle (rutas/empleados) de una empresa y la selecciona. */
  loadAndSelectEmpresa(id: string): Observable<Empresa> {
    this._loading.set(true);
    return this.empresaSvc.getEmpresa(id).pipe(
      tap((empresa) => {
        const normalized = { ...empresa, id: empresa.id || (empresa as any)._id };
        this._selectedEmpresa.set(normalized);
        this._empresas.update((list) => {
          const idx = list.findIndex((e) => e.id === normalized.id);
          if (idx >= 0) {
            const copy = [...list];
            copy[idx] = normalized;
            return copy;
          }
          return [...list, normalized];
        });
      }),
      finalize(() => this._loading.set(false)),
    );
  }

  selectRuta(ruta: Ruta | null): void {
    this._selectedRuta.set(ruta);
  }

  /** Payload temporal al navegar a páginas de detalle (evita action sheets). */
  private readonly _detailPayload = signal<unknown>(null);
  readonly detailPayload = computed(() => this._detailPayload());

  setDetailPayload(payload: unknown): void {
    this._detailPayload.set(payload);
  }

  clearDetailPayload(): void {
    this._detailPayload.set(null);
  }

  /** Incrementa al mutar datos para forzar refresco de listados. */
  private readonly _revision = signal(0);
  readonly revision = computed(() => this._revision());

  invalidate(): void {
    this._revision.update((v) => v + 1);
  }

  /** Quita una empresa del cache local (UI inmediata). */
  removeEmpresaLocal(id: string): void {
    this._empresas.update((list) => list.filter((e) => e.id !== id && (e as any)._id !== id));
    if (this._selectedEmpresa()?.id === id) {
      this._selectedEmpresa.set(null);
      this._selectedRuta.set(null);
    }
    this.invalidate();
  }

  /** Actualiza/inserta empresa en cache local. */
  upsertEmpresaLocal(empresa: Empresa): void {
    const normalized = { ...empresa, id: empresa.id || (empresa as any)._id };
    this._empresas.update((list) => {
      const idx = list.findIndex((e) => e.id === normalized.id);
      if (idx < 0) return [...list, normalized];
      const copy = [...list];
      copy[idx] = { ...copy[idx], ...normalized };
      return copy;
    });
    this.invalidate();
  }

  clear(): void {
    this._selectedEmpresa.set(null);
    this._selectedRuta.set(null);
    this._detailPayload.set(null);
  }
}
