import { Component, computed, inject, signal, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { Empresa } from 'src/app/models';
import { SuperAdminContextService } from 'src/app/services/super-admin-context.service';
import { UtilsService } from 'src/app/services/utils.service';
import { UpdateEmpresaComponent } from 'src/app/shared/components/update-empresa/update-empresa.component';

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

  readonly filtered = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const list = this.ctx.empresas();
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
