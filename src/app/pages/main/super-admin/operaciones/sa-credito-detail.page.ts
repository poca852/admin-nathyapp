import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Credito } from 'src/app/models';
import { CreditosService } from 'src/app/services/creditos.service';
import { EmpresaService } from 'src/app/services/empresa.service';
import { SuperAdminContextService } from 'src/app/services/super-admin-context.service';
import { UtilsService } from 'src/app/services/utils.service';
import { UpdateCreditoComponent } from 'src/app/shared/components/update-credito/update-credito.component';

@Component({
  selector: 'app-sa-credito-detail',
  templateUrl: './sa-credito-detail.page.html',
  styleUrls: ['./sa-credito-detail.page.scss'],
})
export class SaCreditoDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly creditoSvc = inject(CreditosService);
  private readonly empresaSvc = inject(EmpresaService);
  private readonly utilsSvc = inject(UtilsService);
  private readonly ctx = inject(SuperAdminContextService);

  readonly credito = signal<Credito | null>(null);
  readonly rutaId = signal<string | null>(null);

  readonly titulo = computed(() => {
    const c = this.credito();
    return c?.cliente?.nombre || c?.cliente?.alias || 'Crédito';
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const payload = this.ctx.detailPayload() as { data?: Credito; rutaId?: string } | null;
    if (payload?.data && ((payload.data.id || payload.data._id) === id)) {
      this.credito.set(payload.data);
      this.rutaId.set(payload.rutaId || null);
      return;
    }
    this.credito.set(null);
  }

  async editCredito(): Promise<void> {
    const credito = this.credito();
    const rutaId = this.rutaId();
    if (!credito || !rutaId) return;

    const creditoId = credito.id || credito._id;
    const detalle = {
      id: creditoId,
      nombre: credito.cliente?.nombre || credito.cliente?.alias || 'Cliente',
      alias: credito.cliente?.alias,
      monto: credito.valor_credito,
      fecha: new Date(credito.fecha_inicio || Date.now()),
      creditoId,
      movimientoId: '',
      rutaId,
      valor_credito: credito.valor_credito,
      interes: credito.interes,
      total_cuotas: credito.total_cuotas,
      valor_cuota: credito.valor_cuota,
      frecuencia_cobro: credito.frecuencia_cobro,
    };

    const empresa = this.ctx.selectedEmpresa();
    if (empresa?.rutas) {
      this.empresaSvc.setRutas(empresa.rutas);
    }

    const result = await this.utilsSvc.presentModal({
      component: UpdateCreditoComponent,
      cssClass: 'add-update-modal',
      componentProps: { credito: detalle, allowAnyDate: true },
    });
    if (result?.success) {
      this.utilsSvc.presentToast({
        message: 'Crédito actualizado',
        color: 'success',
        duration: 2500,
      });
      this.ctx.invalidate();
      this.utilsSvc.routerLink('/main/super-admin/operaciones');
    }
  }

  confirmDelete(): void {
    const credito = this.credito();
    if (!credito) return;
    const creditoId = credito.id || credito._id;
    this.utilsSvc.presentAlert({
      header: 'Eliminar crédito',
      message: '¿Eliminar este crédito? Acción irreversible.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.creditoSvc.deleteCreditoAsSuperAdmin(creditoId).subscribe({
              next: () => {
                this.utilsSvc.presentToast({
                  message: 'Crédito eliminado',
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
