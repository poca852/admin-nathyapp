import { Component, Input, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MovimientoCaja } from 'src/app/models/movimiento-caja.interface';
import { UtilsService } from '../../../services/utils.service';
import { PagosService } from 'src/app/services/pagos.service';

@Component({
  selector: 'app-update-pago',
  templateUrl: './update-pago.component.html',
  styleUrls: ['./update-pago.component.scss'],
})
export class UpdatePagoComponent implements OnInit {

  @Input() pago: MovimientoCaja;

  private utilsSvc = inject(UtilsService);
  private pagoSvc = inject(PagosService);

  public form = new FormGroup({
    monto: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
  });

  ngOnInit() {
    if (this.pago) {
      this.form.patchValue({ monto: this.pago.monto });
    }
  }

  private get movimientoId(): string | null {
    return this.pago?.id || (this.pago as any)?._id || null;
  }

  setNumberInput() {
    const { monto } = this.form.controls;
    if (monto.value != null) {
      monto.setValue(parseFloat(String(monto.value)));
    }
  }

  async updatePago() {
    if (this.form.invalid || !this.movimientoId) return;

    const loading = await this.utilsSvc.loading();
    await loading.present();

    const monto = this.form.value.monto as number;

    this.pagoSvc.updatePago(this.movimientoId, { monto }).subscribe({
      next: () => {
        loading.dismiss();
        this.utilsSvc.dismissModal({ success: true });
        this.utilsSvc.presentToast({
          message: 'Pago actualizado correctamente',
          duration: 1500,
          color: 'success',
          icon: 'checkmark-outline',
        });
      },
      error: async (err) => {
        loading.dismiss();
        await this.utilsSvc.presentAlert({
          header: 'Error',
          message: err.error?.message || 'No se pudo actualizar el pago',
          buttons: ['OK'],
        });
      },
    });
  }

  async confirmDelete() {
    await this.utilsSvc.presentAlert({
      header: 'Eliminar pago',
      message: '¿Estás seguro de que quieres eliminar este pago? Esta acción es irreversible.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Sí, eliminar',
          handler: () => {
            this.deletePago();
          },
        },
      ],
    });
  }

  private async deletePago() {
    if (!this.movimientoId) {
      await this.utilsSvc.presentToast({
        message: 'No se encontró el identificador del pago',
        duration: 3000,
        color: 'danger',
        icon: 'alert-circle-outline',
      });
      return;
    }

    const loading = await this.utilsSvc.loading();
    await loading.present();

    this.pagoSvc.deletePago(this.movimientoId).subscribe({
      next: () => {
        loading.dismiss();
        this.utilsSvc.dismissModal({ success: true });
        this.utilsSvc.presentToast({
          message: 'Pago eliminado correctamente',
          duration: 2500,
          color: 'success',
          icon: 'checkmark-outline',
        });
      },
      error: async (err) => {
        loading.dismiss();
        await this.utilsSvc.presentAlert({
          header: 'Error',
          message: err.error?.message || 'No se pudo eliminar el pago',
          buttons: ['OK'],
        });
      },
    });
  }
}
