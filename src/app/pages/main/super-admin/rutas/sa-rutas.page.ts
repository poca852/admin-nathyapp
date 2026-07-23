import { Component, computed, inject, signal, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { Ruta } from 'src/app/models';
import { RutaService } from 'src/app/services/ruta.service';
import { SuperAdminContextService } from 'src/app/services/super-admin-context.service';
import { UtilsService } from 'src/app/services/utils.service';
import { AddUpdateRutaComponent } from 'src/app/shared/components/add-update-ruta/add-update-ruta.component';

@Component({
  selector: 'app-sa-rutas',
  templateUrl: './sa-rutas.page.html',
  styleUrls: ['./sa-rutas.page.scss'],
})
export class SaRutasPage implements OnDestroy {
  private readonly rutaSvc = inject(RutaService);
  private readonly utilsSvc = inject(UtilsService);
  private readonly router = inject(Router);
  readonly ctx = inject(SuperAdminContextService);
  private navSub?: Subscription;

  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly rutas = signal<Ruta[]>([]);
  readonly selectedEmpresaId = signal<string | null>(null);
  readonly searchQuery = signal('');
  /** Filtro especial: rutas sin empresa */
  static readonly ORPHAN_FILTER = '__none__';

  readonly filtered = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const empresaId = this.selectedEmpresaId();
    return this.rutas().filter((r) => {
      const rid = this.empresaOf(r);
      if (empresaId === SaRutasPage.ORPHAN_FILTER) {
        if (rid) return false;
      } else if (empresaId) {
        if (rid !== empresaId) return false;
      }
      if (!q) return true;
      return (
        (r.nombre || '').toLowerCase().includes(q) ||
        (r.ciudad || '').toLowerCase().includes(q) ||
        (r.pais || '').toLowerCase().includes(q)
      );
    });
  });

  readonly orphanCount = computed(() =>
    this.rutas().filter((r) => !this.empresaOf(r)).length,
  );

  ngOnInit(): void {
    this.navSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        if (this.isListUrl(e.urlAfterRedirects || e.url)) {
          this.ensureEmpresasAndLoad();
        }
      });
    this.ensureEmpresasAndLoad();
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }

  ionViewWillEnter(): void {
    this.ensureEmpresasAndLoad();
  }

  private isListUrl(url: string): boolean {
    return /\/super-admin\/rutas\/?$/.test(url.split('?')[0]);
  }

  private ensureEmpresasAndLoad(): void {
    if (this.ctx.empresas().length === 0) {
      this.ctx.loadEmpresas().subscribe({ next: () => this.loadRutas() });
    } else {
      this.loadRutas();
    }
  }

  onEmpresaChange(ev: CustomEvent): void {
    const id = String(ev.detail?.value || '') || null;
    this.selectedEmpresaId.set(id === 'null' ? null : id);
  }

  onSearch(ev: CustomEvent): void {
    this.searchQuery.set(String(ev.detail?.value ?? ''));
  }

  loadRutas(event?: CustomEvent): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.rutaSvc.getRutasByUser().pipe(
      finalize(() => {
        this.loading.set(false);
        (event?.target as HTMLIonRefresherElement)?.complete?.();
      }),
    ).subscribe({
      next: (list) => this.rutas.set((list || []).map((r: any) => ({
        ...r,
        id: r.id || r._id,
        _id: r._id || r.id,
      }))),
      error: () => {
        this.loadError.set(true);
        this.rutas.set([]);
        this.utilsSvc.presentToast({
          message: 'No se pudieron cargar las rutas',
          color: 'danger',
          duration: 3000,
        });
      },
    });
  }

  empresaOf(ruta: Ruta): string {
    const emp = (ruta as any).empresa;
    if (!emp) return '';
    if (typeof emp === 'string') return emp;
    return emp.id || emp._id || '';
  }

  empresaName(ruta: Ruta): string {
    const id = this.empresaOf(ruta);
    if (!id) return 'Sin empresa';
    return this.ctx.empresas().find((e) => e.id === id)?.name || id || '—';
  }

  isOrphan(ruta: Ruta): boolean {
    return !this.empresaOf(ruta);
  }

  trackById(_: number, r: Ruta): string {
    return r.id || (r as any)._id;
  }

  openDetail(ruta: Ruta): void {
    const id = ruta.id || (ruta as any)._id;
    this.ctx.setDetailPayload(ruta);
    this.utilsSvc.routerLink('/main/super-admin/rutas/:id', { id });
  }

  async createRuta(): Promise<void> {
    const empresaId = this.selectedEmpresaId() || this.ctx.empresas()[0]?.id;
    if (!empresaId) {
      this.utilsSvc.presentToast({
        message: 'Primero crea o selecciona una empresa',
        color: 'warning',
        duration: 3000,
      });
      return;
    }

    const result = await this.utilsSvc.presentModal({
      component: AddUpdateRutaComponent,
      cssClass: 'add-update-modal',
      componentProps: { empresaId },
    });
    if (result?.success) {
      this.ctx.invalidate();
      this.loadRutas();
    }
  }
}
