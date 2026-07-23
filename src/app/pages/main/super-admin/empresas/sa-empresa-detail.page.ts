import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { Empresa, Ruta, SubscriptionStatus, User } from 'src/app/models';
import { EmpresaService } from 'src/app/services/empresa.service';
import { RutaService } from 'src/app/services/ruta.service';
import { SuperAdminContextService } from 'src/app/services/super-admin-context.service';
import { UtilsService } from 'src/app/services/utils.service';
import { UpdateEmpresaComponent } from 'src/app/shared/components/update-empresa/update-empresa.component';
import { AddUpdateRutaComponent } from 'src/app/shared/components/add-update-ruta/add-update-ruta.component';

@Component({
  selector: 'app-sa-empresa-detail',
  templateUrl: './sa-empresa-detail.page.html',
  styleUrls: ['./sa-empresa-detail.page.scss'],
})
export class SaEmpresaDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly empresaSvc = inject(EmpresaService);
  private readonly rutaSvc = inject(RutaService);
  private readonly utilsSvc = inject(UtilsService);
  private readonly ctx = inject(SuperAdminContextService);

  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly empresa = signal<Empresa | null>(null);
  readonly billingBusy = signal(false);
  readonly lockBusyId = signal<string | null>(null);

  readonly rutas = computed(() => {
    const list = this.empresa()?.rutas || [];
    return list.map((r: any) => ({
      ...r,
      id: r.id || r._id,
      _id: r._id || r.id,
    })) as Ruta[];
  });

  readonly empleados = computed(() => {
    const list = this.empresa()?.employes || [];
    return list.map((u: any) => ({
      ...u,
      id: u.id || u._id,
      _id: u._id || u.id,
    })) as User[];
  });

  readonly owner = computed(() => {
    const o = this.empresa()?.owner as any;
    if (!o) return null;
    if (typeof o === 'string') {
      return { id: o, _id: o, nombre: '', username: o, rol: '', estado: true } as User;
    }
    return {
      ...o,
      id: o.id || o._id,
      _id: o._id || o.id,
      nombre: o.nombre || '',
      username: o.username || '',
      rol: o.rol || '',
      estado: o.estado !== false,
    } as User;
  });

  readonly resumen = computed(() => {
    const e = this.empresa();
    const owner = this.owner();
    if (!e) {
      return {
        rutas: 0,
        empleados: 0,
        email: '',
        phone: '',
        country: '',
        dayOfPay: null as number | null,
        cobraMora: false,
        porcentajeMora: 0,
        isSubscriptionPaid: true,
        subscriptionGraceDays: 3,
        accessSuspended: false,
        subscriptionStatus: 'ACTIVE' as SubscriptionStatus,
        daysPastDue: 0,
      };
    }
    return {
      rutas: e.rutas?.length || 0,
      empleados: e.employes?.length || 0,
      email: e.email || '',
      phone: e.phone || '',
      country: e.country || '',
      dayOfPay: e.dayOfPay ?? null,
      cobraMora: !!e.cobraMora,
      porcentajeMora: e.porcentajeMora ?? 0,
      ownerName: owner?.nombre || owner?.username || '',
      ownerUsername: owner?.username || '',
      isSubscriptionPaid: e.isSubscriptionPaid !== false,
      subscriptionGraceDays: e.subscriptionGraceDays ?? 3,
      accessSuspended: !!e.accessSuspended,
      subscriptionStatus: (e.subscriptionStatus || 'ACTIVE') as SubscriptionStatus,
      daysPastDue: e.daysPastDue ?? 0,
    };
  });

  ionViewWillEnter(): void {
    this.load();
  }

  ngOnInit(): void {
    this.load();
  }

  load(event?: CustomEvent): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loadError.set(true);
      this.loading.set(false);
      (event?.target as HTMLIonRefresherElement)?.complete?.();
      return;
    }

    this.loading.set(true);
    this.loadError.set(false);
    this.ctx.loadAndSelectEmpresa(id).pipe(
      finalize(() => {
        this.loading.set(false);
        (event?.target as HTMLIonRefresherElement)?.complete?.();
      }),
    ).subscribe({
      next: (empresa) => {
        this.empresa.set({ ...empresa, id: empresa.id || (empresa as any)._id });
      },
      error: () => {
        this.loadError.set(true);
        this.empresa.set(null);
      },
    });
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

  trackRuta(_: number, r: Ruta): string {
    return r.id || (r as any)._id;
  }

  trackUser(_: number, u: User): string {
    return u._id || u.id || '';
  }

  openRuta(ruta: Ruta): void {
    const id = ruta.id || (ruta as any)._id;
    this.ctx.setDetailPayload(ruta);
    this.utilsSvc.routerLink('/main/super-admin/rutas/:id', { id });
  }

  confirmToggleRutaLock(event: Event, ruta: Ruta): void {
    event.stopPropagation();
    event.preventDefault();

    const id = ruta.id || (ruta as any)._id;
    if (!id || this.lockBusyId()) return;

    const willLock = !ruta.isLocked;
    if (willLock && !ruta.status) {
      this.utilsSvc.presentToast({
        message: 'No se puede bloquear una ruta cerrada. Ábrela primero.',
        color: 'warning',
        duration: 3500,
        icon: 'alert-circle-outline',
      });
      return;
    }

    const nombre = ruta.nombre || 'esta ruta';
    this.utilsSvc.presentAlert({
      header: willLock ? 'Bloquear ruta' : 'Desbloquear ruta',
      message: willLock
        ? `Se bloqueará "${nombre}". El cobrador no podrá operar hasta desbloquearla.`
        : `Se desbloqueará "${nombre}" para continuar operaciones.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: willLock ? 'Bloquear' : 'Desbloquear',
          role: willLock ? 'destructive' : undefined,
          handler: () => this.doToggleRutaLock(id, willLock),
        },
      ],
    });
  }

  private doToggleRutaLock(rutaId: string, willLock: boolean): void {
    this.lockBusyId.set(rutaId);
    const req$ = willLock
      ? this.rutaSvc.lockRuta(rutaId)
      : this.rutaSvc.unlockRuta(rutaId);

    req$.subscribe({
      next: () => {
        this.empresa.update((emp) => {
          if (!emp) return emp;
          return {
            ...emp,
            rutas: (emp.rutas || []).map((r: any) => {
              const rid = r.id || r._id;
              return rid === rutaId ? { ...r, isLocked: willLock } : r;
            }),
          };
        });
        this.empresaSvc.updateRutaLock(rutaId, willLock);
        this.lockBusyId.set(null);
        this.utilsSvc.presentToast({
          message: willLock ? 'Ruta bloqueada' : 'Ruta desbloqueada',
          duration: 2500,
          color: willLock ? 'warning' : 'success',
          icon: willLock ? 'lock-closed-outline' : 'lock-open-outline',
        });
      },
      error: (err) => {
        this.lockBusyId.set(null);
        this.utilsSvc.presentToast({
          message: err.error?.message || 'No se pudo cambiar el bloqueo',
          duration: 3500,
          color: 'danger',
          icon: 'alert-circle-outline',
        });
      },
    });
  }

  openUsuario(user: User): void {
    const id = user._id || user.id!;
    this.ctx.setDetailPayload(user);
    this.utilsSvc.routerLink('/main/super-admin/usuarios/:id', { id });
  }

  openOwner(): void {
    const owner = this.owner();
    if (!owner?.id && !owner?._id) return;
    this.openUsuario(owner);
  }

  async createRuta(): Promise<void> {
    const empresa = this.empresa();
    if (!empresa?.id) return;
    const result = await this.utilsSvc.presentModal({
      component: AddUpdateRutaComponent,
      cssClass: 'add-update-modal',
      componentProps: { empresaId: empresa.id },
    });
    if (result?.success) {
      this.ctx.invalidate();
      this.load();
    }
  }

  async editEmpresa(): Promise<void> {
    const empresa = this.empresa();
    if (!empresa) return;
    const result = await this.utilsSvc.presentModal({
      component: UpdateEmpresaComponent,
      cssClass: 'add-update-modal',
      componentProps: { empresa },
    });
    if (result?.success) {
      this.ctx.invalidate();
      this.load();
    }
  }

  togglePaid(): void {
    const empresa = this.empresa();
    if (!empresa?.id || this.billingBusy()) return;
    const next = !(empresa.isSubscriptionPaid !== false);
    this.billingBusy.set(true);
    this.empresaSvc.updateSubscription(empresa.id, { isSubscriptionPaid: next }).subscribe({
      next: (updated) => {
        this.patchBilling(updated);
        this.billingBusy.set(false);
        this.utilsSvc.presentToast({
          message: next ? 'Marcada como pagada' : 'Marcada como no pagada',
          duration: 2500,
          color: 'success',
          icon: 'checkmark-circle-outline',
        });
      },
      error: (err) => {
        this.billingBusy.set(false);
        this.utilsSvc.presentToast({
          message: err.error?.message || 'No se pudo actualizar el pago',
          duration: 3000,
          color: 'danger',
          icon: 'alert-circle-outline',
        });
      },
    });
  }

  confirmSuspend(): void {
    const empresa = this.empresa();
    if (!empresa?.id) return;
    this.utilsSvc.presentAlert({
      header: 'Suspender acceso',
      message:
        `¿Suspender "${empresa.name}"?\n\n` +
        'Los ADMIN, SUPERVISOR y COBRADOR de esta empresa no podrán iniciar sesión ni usar la API hasta que la reactives.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Suspender',
          role: 'destructive',
          handler: () => this.doSuspend(empresa.id),
        },
      ],
    });
  }

  confirmUnsuspend(): void {
    const empresa = this.empresa();
    if (!empresa?.id) return;
    this.utilsSvc.presentAlert({
      header: 'Reactivar acceso',
      message:
        `¿Reactivar "${empresa.name}"?\n\n` +
        'También puedes marcarla como pagada al reactivar.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Solo reactivar',
          handler: () => this.doUnsuspend(empresa.id, false),
        },
        {
          text: 'Reactivar y marcar pagada',
          handler: () => this.doUnsuspend(empresa.id, true),
        },
      ],
    });
  }

  private doSuspend(id: string): void {
    this.billingBusy.set(true);
    this.empresaSvc.suspendEmpresa(id, 'PAYMENT').subscribe({
      next: (updated) => {
        this.patchBilling(updated);
        this.billingBusy.set(false);
        this.utilsSvc.presentToast({
          message: 'Empresa suspendida',
          duration: 2500,
          color: 'warning',
          icon: 'lock-closed-outline',
        });
      },
      error: (err) => {
        this.billingBusy.set(false);
        this.utilsSvc.presentToast({
          message: err.error?.message || 'No se pudo suspender',
          duration: 3000,
          color: 'danger',
          icon: 'alert-circle-outline',
        });
      },
    });
  }

  private doUnsuspend(id: string, markPaid: boolean): void {
    this.billingBusy.set(true);
    this.empresaSvc.unsuspendEmpresa(id, markPaid).subscribe({
      next: (updated) => {
        this.patchBilling(updated);
        this.billingBusy.set(false);
        this.utilsSvc.presentToast({
          message: markPaid ? 'Reactivada y marcada como pagada' : 'Empresa reactivada',
          duration: 2500,
          color: 'success',
          icon: 'lock-open-outline',
        });
      },
      error: (err) => {
        this.billingBusy.set(false);
        this.utilsSvc.presentToast({
          message: err.error?.message || 'No se pudo reactivar',
          duration: 3000,
          color: 'danger',
          icon: 'alert-circle-outline',
        });
      },
    });
  }

  private patchBilling(updated: Partial<Empresa>): void {
    const current = this.empresa();
    if (!current) return;
    const next = {
      ...current,
      ...updated,
      id: current.id,
      employes: current.employes,
      rutas: current.rutas,
      owner: current.owner,
    };
    this.empresa.set(next);
    this.ctx.invalidate();
  }

  confirmDelete(): void {
    const empresa = this.empresa();
    if (!empresa) return;
    this.utilsSvc.presentAlert({
      header: 'Eliminar empresa',
      message:
        `¿Eliminar "${empresa.name}"?\n\n` +
        'Se borrarán en cascada: rutas, clientes, créditos, mora, pagos, cajas, ' +
        'peticiones, tracking y empleados de la empresa. Esta acción es irreversible.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar todo',
          role: 'destructive',
          handler: () => this.doDelete(empresa),
        },
      ],
    });
  }

  private async doDelete(empresa: Empresa): Promise<void> {
    const loading = await this.utilsSvc.loading();
    await loading.present();
    this.empresaSvc.deleteEmpresa(empresa.id).subscribe({
      next: () => {
        loading.dismiss();
        this.ctx.removeEmpresaLocal(empresa.id);
        this.utilsSvc.presentToast({
          message: 'Empresa y datos relacionados eliminados',
          duration: 3000,
          color: 'success',
          icon: 'checkmark-circle-outline',
        });
        this.utilsSvc.routerLink('/main/super-admin/empresas');
      },
      error: (err) => {
        loading.dismiss();
        this.utilsSvc.presentToast({
          message: err.error?.message || 'No se pudo eliminar',
          duration: 3500,
          color: 'danger',
          icon: 'alert-circle-outline',
        });
      },
    });
  }
}
