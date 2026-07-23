import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { Empresa, Ruta, User } from 'src/app/models';
import { EmpresaService } from 'src/app/services/empresa.service';
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
  private readonly utilsSvc = inject(UtilsService);
  private readonly ctx = inject(SuperAdminContextService);

  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly empresa = signal<Empresa | null>(null);

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
