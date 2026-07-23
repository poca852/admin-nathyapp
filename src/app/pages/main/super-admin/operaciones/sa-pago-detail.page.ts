import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { MovimientoCaja } from 'src/app/models/movimiento-caja.interface';
import { PagosService } from 'src/app/services/pagos.service';
import { SuperAdminContextService } from 'src/app/services/super-admin-context.service';
import { UtilsService } from 'src/app/services/utils.service';
import { UpdatePagoComponent } from 'src/app/shared/components/update-pago/update-pago.component';

@Component({
  selector: 'app-sa-pago-detail',
  templateUrl: './sa-pago-detail.page.html',
  styleUrls: ['./sa-pago-detail.page.scss'],
})
export class SaPagoDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly pagosSvc = inject(PagosService);
  private readonly utilsSvc = inject(UtilsService);
  private readonly ctx = inject(SuperAdminContextService);

  readonly pago = signal<MovimientoCaja | null>(null);

  readonly concepto = computed(() => {
    const p = this.pago();
    return p?.concepto || p?.tipoMovimiento || 'Pago';
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const payload = this.ctx.detailPayload() as { data?: MovimientoCaja } | null;
    if (payload?.data && ((payload.data.id || (payload.data as any)._id) === id)) {
      this.pago.set(payload.data);
      return;
    }
    this.pago.set(null);
  }

  async editPago(): Promise<void> {
    const pago = this.pago();
    if (!pago) return;
    const result = await this.utilsSvc.presentModal({
      component: UpdatePagoComponent,
      cssClass: 'add-update-modal',
      componentProps: { pago },
    });
    if (result?.success) {
      this.utilsSvc.presentToast({
        message: 'Pago actualizado',
        color: 'success',
        duration: 2500,
      });
      this.ctx.invalidate();
      this.utilsSvc.routerLink('/main/super-admin/operaciones');
    }
  }

  confirmDelete(): void {
    const pago = this.pago();
    if (!pago) return;
    const id = pago.id || (pago as any)._id;
    this.utilsSvc.presentAlert({
      header: 'Eliminar pago',
      message: '¿Eliminar este pago? Acción irreversible.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.pagosSvc.deletePago(id!).subscribe({
              next: () => {
                this.utilsSvc.presentToast({
                  message: 'Pago eliminado',
                  color: 'success',
                  duration: 2500,
                });
                this.ctx.invalidate();
                this.utilsSvc.routerLink('/main/super-admin/operaciones');
              },
              error: (err) => this.utilsSvc.presentToast({
                message: err.error?.message || 'Error al eliminar',
                color: 'danger',
                duration: 3000,
              }),
            });
          },
        },
      ],
    });
  }
}
