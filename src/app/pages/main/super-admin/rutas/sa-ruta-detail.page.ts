import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AlertInput } from '@ionic/angular';

import { Ruta } from 'src/app/models';
import { EmpresaService } from 'src/app/services/empresa.service';
import { RutaService } from 'src/app/services/ruta.service';
import { SuperAdminContextService } from 'src/app/services/super-admin-context.service';
import { UtilsService } from 'src/app/services/utils.service';
import { AddUpdateRutaComponent } from 'src/app/shared/components/add-update-ruta/add-update-ruta.component';

@Component({
  selector: 'app-sa-ruta-detail',
  templateUrl: './sa-ruta-detail.page.html',
  styleUrls: ['./sa-ruta-detail.page.scss'],
})
export class SaRutaDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly rutaSvc = inject(RutaService);
  private readonly empresaSvc = inject(EmpresaService);
  private readonly utilsSvc = inject(UtilsService);
  private readonly ctx = inject(SuperAdminContextService);

  readonly loading = signal(true);
  readonly ruta = signal<Ruta | null>(null);

  readonly empresaLabel = computed(() => {
    const r = this.ruta();
    if (!r) return '—';
    const emp = (r as any).empresa;
    if (!emp) return 'Sin empresa';
    const id = typeof emp === 'string' ? emp : (emp.id || emp._id);
    if (typeof emp === 'object' && emp.name) return emp.name;
    return this.ctx.empresas().find((e) => e.id === id)?.name || id || '—';
  });

  readonly empresaId = computed(() => {
    const r = this.ruta();
    if (!r) return undefined;
    const emp = (r as any).empresa;
    if (!emp) return undefined;
    return typeof emp === 'string' ? emp : (emp.id || emp._id);
  });

  readonly isOrphan = computed(() => !this.empresaId());

  ngOnInit(): void {
    this.resolveRuta();
  }

  private async resolveRuta(): Promise<void> {
    this.loading.set(true);
    const id = this.route.snapshot.paramMap.get('id');
    const cached = this.ctx.detailPayload() as Ruta | null;

    if (this.ctx.empresas().length === 0) {
      try {
        await firstValueFrom(this.ctx.loadEmpresas());
      } catch { /* ignore */ }
    }

    if (cached && ((cached as any).id === id || (cached as any)._id === id)) {
      this.ruta.set(cached);
      this.loading.set(false);
      // refrescar en background por si el cache está desactualizado
      this.fetchRuta(id!);
      return;
    }

    await this.fetchRuta(id!);
  }

  private async fetchRuta(id: string): Promise<void> {
    try {
      const detail = await firstValueFrom(this.rutaSvc.getRutaById(id));
      this.ruta.set({
        ...detail,
        id: detail.id || (detail as any)._id,
        _id: (detail as any)._id || detail.id,
      } as Ruta);
    } catch {
      if (!this.ruta()) this.ruta.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  async editRuta(): Promise<void> {
    const ruta = this.ruta();
    if (!ruta) return;
    const result = await this.utilsSvc.presentModal({
      component: AddUpdateRutaComponent,
      cssClass: 'add-update-modal',
      componentProps: {
        ruta,
        empresaId: this.empresaId(),
      },
    });
    if (result?.success) {
      this.ctx.clearDetailPayload();
      this.ctx.invalidate();
      this.resolveRuta();
    }
  }

  async assignEmpresa(): Promise<void> {
    const ruta = this.ruta();
    if (!ruta || !this.isOrphan()) return;

    if (this.ctx.empresas().length === 0) {
      await firstValueFrom(this.ctx.loadEmpresas());
    }
    const empresas = this.ctx.empresas();
    if (empresas.length === 0) {
      this.utilsSvc.presentToast({
        message: 'No hay empresas para asignar',
        color: 'warning',
        duration: 3000,
      });
      return;
    }

    const inputs: AlertInput[] = empresas.map((e) => ({
      type: 'radio',
      label: e.name,
      value: e.id,
    }));

    await this.utilsSvc.presentAlert({
      header: 'Asignar a empresa',
      message: `Elige la empresa para "${ruta.nombre}"`,
      inputs,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Asignar',
          handler: (empresaId: string) => {
            if (!empresaId) return false;
            this.doAssign(ruta, empresaId);
            return true;
          },
        },
      ],
    });
  }

  private async doAssign(ruta: Ruta, empresaId: string): Promise<void> {
    const loading = await this.utilsSvc.loading();
    await loading.present();
    const rutaId = ruta.id || (ruta as any)._id;

    this.empresaSvc.assignRuta({ rutaId, empresaId }).subscribe({
      next: (res) => {
        loading.dismiss();
        this.utilsSvc.presentToast({
          message: res.message || 'Ruta asignada',
          color: 'success',
          duration: 2500,
        });
        this.ctx.invalidate();
        this.ctx.clearDetailPayload();
        this.resolveRuta();
      },
      error: (err) => {
        loading.dismiss();
        this.utilsSvc.presentToast({
          message: err.error?.message || 'No se pudo asignar',
          color: 'danger',
          duration: 3500,
        });
      },
    });
  }

  confirmDelete(): void {
    const ruta = this.ruta();
    if (!ruta) return;
    this.utilsSvc.presentAlert({
      header: 'Eliminar ruta',
      message:
        `¿Eliminar "${ruta.nombre}"?\n\n` +
        'Se borrarán en cascada: clientes, créditos, mora, pagos/movimientos, cajas, ' +
        'peticiones de ubicación y tracking. Los empleados solo se desasignan (no se eliminan).',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar todo',
          role: 'destructive',
          handler: () => this.doDelete(ruta),
        },
      ],
    });
  }

  private async doDelete(ruta: Ruta): Promise<void> {
    const loading = await this.utilsSvc.loading();
    await loading.present();
    const id = ruta.id || (ruta as any)._id;

    this.rutaSvc.deleteRuta(id).subscribe({
      next: () => {
        loading.dismiss();
        this.utilsSvc.presentToast({
          message: 'Ruta y datos relacionados eliminados',
          duration: 3000,
          color: 'success',
          icon: 'checkmark-outline',
        });
        this.ctx.clearDetailPayload();
        this.ctx.invalidate();
        this.utilsSvc.routerLink('/main/super-admin/rutas');
      },
      error: async (err) => {
        loading.dismiss();
        await this.utilsSvc.presentAlert({
          header: 'Alerta',
          message: err.error?.message || 'No se pudo eliminar la ruta',
          buttons: ['OK'],
        });
      },
    });
  }
}
