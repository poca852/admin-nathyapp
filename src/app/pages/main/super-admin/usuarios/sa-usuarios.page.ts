import { Component, computed, inject, signal, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

import { User } from 'src/app/models';
import { EmpleadosService } from 'src/app/services/empleados.service';
import { EmpresaService } from 'src/app/services/empresa.service';
import { SuperAdminContextService } from 'src/app/services/super-admin-context.service';
import { UtilsService } from 'src/app/services/utils.service';
import { SessionStateEvent, WsService } from 'src/app/services/ws.service';
import { AddUpdateEmployeComponent } from 'src/app/shared/components/add-update-employe/add-update-employe.component';

@Component({
  selector: 'app-sa-usuarios',
  templateUrl: './sa-usuarios.page.html',
  styleUrls: ['./sa-usuarios.page.scss'],
})
export class SaUsuariosPage implements OnDestroy {
  private readonly employeSvc = inject(EmpleadosService);
  private readonly empresaSvc = inject(EmpresaService);
  private readonly utilsSvc = inject(UtilsService);
  private readonly router = inject(Router);
  private readonly ws = inject(WsService);
  readonly ctx = inject(SuperAdminContextService);
  private navSub?: Subscription;
  private sessionSub?: Subscription;

  readonly loading = signal(false);
  readonly users = signal<User[]>([]);
  readonly selectedEmpresaId = signal<string | null>(null);
  readonly searchQuery = signal('');

  readonly filtered = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    return this.users().filter((u) => {
      if (!q) return true;
      return (
        (u.nombre || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q) ||
        (u.rol || '').toLowerCase().includes(q)
      );
    });
  });

  ngOnInit(): void {
    this.navSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        if (this.isListUrl(e.urlAfterRedirects || e.url)) {
          this.ensureEmpresasAndLoad();
        }
      });
    this.sessionSub = this.ws.onSessionState().subscribe((ev) => {
      this.applySessionState(ev);
    });
    this.ensureEmpresasAndLoad();
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
    this.sessionSub?.unsubscribe();
  }

  private applySessionState(ev: SessionStateEvent): void {
    if (!ev?.userId) return;
    const uid = String(ev.userId);
    this.users.update((list) =>
      list.map((u) => {
        const id = String(u._id || u.id || '');
        if (id !== uid) return u;
        return {
          ...u,
          hasActiveSession: !!ev.hasActiveSession,
          activeSessionExpiresAt: ev.hasActiveSession
            ? (ev.activeSessionExpiresAt ?? u.activeSessionExpiresAt)
            : null,
        };
      }),
    );
  }

  ionViewWillEnter(): void {
    this.ensureEmpresasAndLoad();
  }

  private isListUrl(url: string): boolean {
    return /\/super-admin\/usuarios\/?$/.test(url.split('?')[0]);
  }

  private ensureEmpresasAndLoad(): void {
    if (this.ctx.empresas().length === 0) {
      this.ctx.loadEmpresas().subscribe({ next: () => this.loadUsers() });
    } else {
      this.loadUsers();
    }
  }

  onEmpresaChange(ev: CustomEvent): void {
    const id = String(ev.detail?.value || '') || null;
    this.selectedEmpresaId.set(id === 'null' ? null : id);
    this.loadUsers();
  }

  onSearch(ev: CustomEvent): void {
    this.searchQuery.set(String(ev.detail?.value ?? ''));
  }

  loadUsers(): void {
    this.loading.set(true);
    const empresaId = this.selectedEmpresaId() || undefined;
    this.employeSvc.getEmployes(empresaId).pipe(
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (list) => this.users.set((list || []).map((u: any) => ({
        ...u,
        _id: u._id || u.id,
        id: u.id || u._id,
      }))),
      error: () => {
        this.users.set([]);
        this.utilsSvc.presentToast({
          message: 'No se pudieron cargar usuarios',
          duration: 3000,
          color: 'danger',
        });
      },
    });
  }

  empresaName(user: User): string {
    const emp = user.empresa as any;
    if (!emp) return '—';
    if (typeof emp === 'string') {
      return this.ctx.empresas().find((e) => e.id === emp)?.name || emp;
    }
    return emp.name || emp.id || '—';
  }

  openDetail(user: User): void {
    const id = user._id || user.id!;
    this.ctx.setDetailPayload(user);
    this.utilsSvc.routerLink(
      '/main/super-admin/usuarios/:id',
      { id },
      { state: { returnUrl: '/main/super-admin/usuarios' } },
    );
  }

  async addUpdate(user?: User): Promise<void> {
    const empresaId = this.selectedEmpresaId()
      || (typeof user?.empresa === 'string' ? user.empresa : (user?.empresa as any)?.id)
      || this.ctx.empresas()[0]?.id;

    let rutasOverride = this.ctx.empresas().find((e) => e.id === empresaId)?.rutas || [];

    if (empresaId) {
      try {
        const detail = await firstValueFrom(this.empresaSvc.getEmpresa(empresaId));
        rutasOverride = detail?.rutas || [];
      } catch { /* keep list */ }
    }

    const result = await this.utilsSvc.presentModal({
      component: AddUpdateEmployeComponent,
      cssClass: 'add-update-modal',
      componentProps: {
        employe: user,
        allowSuperAdmin: true,
        empresaId,
        rutasOverride,
      },
    });
    if (result?.success) {
      this.ctx.invalidate();
      this.loadUsers();
    }
  }
}
