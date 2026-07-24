import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Ruta } from 'src/app/models';
import { SubTipo } from 'src/app/models/sub-tipo.enum';
import { SuperAdminContextService } from 'src/app/services/super-admin-context.service';
import { UtilsService } from 'src/app/services/utils.service';
import { AddUpdateMovimientoComponent } from 'src/app/shared/components/add-update-movimiento/add-update-movimiento.component';
import { SaMovimientoOficina } from './sa-operaciones.page';

@Component({
  selector: 'app-sa-oficina-detail',
  templateUrl: './sa-oficina-detail.page.html',
  styleUrls: ['./sa-oficina-detail.page.scss'],
})
export class SaOficinaDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly utilsSvc = inject(UtilsService);
  private readonly ctx = inject(SuperAdminContextService);

  readonly movimiento = signal<SaMovimientoOficina | null>(null);
  readonly ruta = signal<Ruta | null>(null);
  readonly fecha = signal<string | null>(null);

  readonly titulo = computed(() => {
    const m = this.movimiento();
    if (!m) return 'Movimiento';
    return m.concepto || this.getSubTipoLabel(m.subTipo);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const payload = this.ctx.detailPayload() as {
      data?: SaMovimientoOficina;
      ruta?: Ruta;
      fecha?: string;
    } | null;

    if (payload?.data && payload.data.id === id) {
      this.movimiento.set(payload.data);
      this.ruta.set(payload.ruta || null);
      this.fecha.set(payload.fecha || null);
      return;
    }
    this.movimiento.set(null);
  }

  getSubTipoLabel(subTipo: SubTipo): string {
    const labels: Record<string, string> = {
      [SubTipo.GASTO]: 'Gasto',
      [SubTipo.INVERSION]: 'Inversión',
      [SubTipo.RETIRO]: 'Retiro',
    };
    return labels[subTipo] ?? subTipo;
  }

  async editMovimiento(): Promise<void> {
    const movimiento = this.movimiento();
    const ruta = this.ruta();
    if (!movimiento || !ruta) return;

    const fechaSeleccionada = this.fecha()
      ? new Date(this.fecha()!)
      : new Date(movimiento.fecha);

    const result = await this.utilsSvc.presentModal({
      component: AddUpdateMovimientoComponent,
      cssClass: 'add-update-modal',
      componentProps: {
        movimiento,
        type: movimiento.subTipo,
        ruta,
        fechaSeleccionada,
        allowAnyDate: true,
      },
    });

    if (result?.success) {
      this.utilsSvc.presentToast({
        message: 'Movimiento actualizado',
        color: 'success',
        duration: 2500,
      });
      this.ctx.invalidate();
      this.utilsSvc.routerLink('/main/super-admin/operaciones');
    }
  }
}
