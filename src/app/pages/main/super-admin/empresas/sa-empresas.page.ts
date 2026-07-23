import { Component, computed, inject, signal, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { Empresa, SubscriptionStatus } from 'src/app/models';
import { SuperAdminContextService } from 'src/app/services/super-admin-context.service';
import { UtilsService } from 'src/app/services/utils.service';
import { UpdateEmpresaComponent } from 'src/app/shared/components/update-empresa/update-empresa.component';

type EmpresaFilter = 'ALL' | 'OVERDUE' | 'GRACE' | 'SUSPENDED';

@Component({
  selector: 'app-sa-empresas',
  templateUrl: './sa-empresas.page.html',
  styleUrls: ['./sa-empresas.page.scss'],
})
export class SaEmpresasPage implements OnDestroy {
  private readonly utilsSvc = inject(UtilsService);
  private readonly router = inject(Router);
  readonly ctx = inject(SuperAdminContextService);
  private navSub?: Subscription;

  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly searchQuery = signal('');
  readonly statusFilter = signal<EmpresaFilter>('ALL');

  readonly overdueCount = computed(() =>
    this.ctx.empresas().filter((e) => e.subscriptionStatus === 'OVERDUE').length,
  );

  readonly suspendedCount = computed(() =>
    this.ctx.empresas().filter((e) => e.subscriptionStatus === 'SUSPENDED' || e.accessSuspended).length,
  );

  readonly filtered = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();
    let list = this.ctx.empresas();

    if (status === 'OVERDUE') {
      list = list.filter((e) => e.subscriptionStatus === 'OVERDUE');
    } else if (status === 'GRACE') {
      list = list.filter((e) => e.subscriptionStatus === 'GRACE');
    } else if (status === 'SUSPENDED') {
      list = list.filter((e) => e.subscriptionStatus === 'SUSPENDED' || e.accessSuspended);
    }

    if (!q) return list;
    return list.filter((e) =>
      (e.name || '').toLowerCase().includes(q) ||
      (e.email || '').toLowerCase().includes(q) ||
      (e.country || '').toLowerCase().includes(q),
    );
  });

  ngOnInit(): void {
    this.navSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        if (this.isListUrl(e.urlAfterRedirects || e.url)) {
          this.refresh();
        }
      });
    this.refresh();
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }

  ionViewWillEnter(): void {
    this.refresh();
  }

  private isListUrl(url: string): boolean {
    return /\/super-admin\/empresas\/?$/.test(url.split('?')[0]);
  }

  refresh(event?: CustomEvent): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.ctx.loadEmpresas().pipe(
      finalize(() => {
        this.loading.set(false);
        (event?.target as HTMLIonRefresherElement)?.complete?.();
      }),
    ).subscribe({
      error: () => {
        this.loadError.set(true);
        this.utilsSvc.presentToast({
          message: 'No se pudieron cargar las empresas',
          duration: 3000,
          color: 'danger',
          icon: 'alert-circle-outline',
        });
      },
    });
  }

  onSearch(ev: CustomEvent): void {
    this.searchQuery.set(String(ev.detail?.value ?? ''));
  }

  onFilterChange(ev: CustomEvent): void {
    this.statusFilter.set((ev.detail?.value as EmpresaFilter) || 'ALL');
  }

  statusColor(status?: SubscriptionStatus): string {
    switch (status) {
      case 'OVERDUE':
        return 'danger';
      case 'GRACE':
        return 'warning';
      case 'SUSPENDED':
        return 'dark';
      default:
        return 'success';
    }
  }

  statusLabel(status?: SubscriptionStatus): string {
    switch (status) {
      case 'OVERDUE':
        return 'Vencida';
      case 'GRACE':
        return 'En gracia';
      case 'SUSPENDED':
        return 'Suspendida';
      default:
        return 'Al día';
    }
  }

  trackById(_: number, e: Empresa): string {
    return e.id;
  }

  openDetail(empresa: Empresa): void {
    const id = empresa.id || (empresa as any)._id;
    this.utilsSvc.routerLink('/main/super-admin/empresas/:id', { id });
  }

  async createEmpresa(): Promise<void> {
    const result = await this.utilsSvc.presentModal({
      component: UpdateEmpresaComponent,
      cssClass: 'add-update-modal',
      componentProps: { createMode: true },
    });
    if (result?.success) {
      this.ctx.invalidate();
      this.refresh();
    }
  }
}
