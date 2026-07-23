import { Component, inject, signal } from '@angular/core';

import { Caja } from 'src/app/models';
import { SuperAdminContextService } from 'src/app/services/super-admin-context.service';
import { UtilsService } from 'src/app/services/utils.service';
import { UpdateCajaComponent } from 'src/app/shared/components/update-caja/update-caja.component';

@Component({
  selector: 'app-sa-caja-detail',
  templateUrl: './sa-caja-detail.page.html',
  styleUrls: ['./sa-caja-detail.page.scss'],
})
export class SaCajaDetailPage {
  private readonly utilsSvc = inject(UtilsService);
  private readonly ctx = inject(SuperAdminContextService);

  readonly caja = signal<Caja | null>(null);

  ngOnInit(): void {
    const payload = this.ctx.detailPayload() as { data?: Caja } | null;
    this.caja.set(payload?.data || null);
  }

  async editCaja(): Promise<void> {
    const current = this.caja();
    if (!current) return;
    const result = await this.utilsSvc.presentModal({
      component: UpdateCajaComponent,
      cssClass: 'add-update-modal',
      componentProps: { caja: current },
    });
    if (result?.success) {
      this.utilsSvc.presentToast({
        message: 'Caja actualizada',
        color: 'success',
        duration: 2500,
      });
      this.ctx.invalidate();
      this.utilsSvc.routerLink('/main/super-admin/operaciones');
    }
  }
}
