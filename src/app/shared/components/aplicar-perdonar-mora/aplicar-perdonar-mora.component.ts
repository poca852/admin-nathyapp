import { Component, Input, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Credito } from 'src/app/models';
import { CreditosService } from 'src/app/services/creditos.service';
import { UtilsService } from 'src/app/services/utils.service';

export type MoraModalMode = 'aplicar' | 'perdonar';

@Component({
  selector: 'app-aplicar-perdonar-mora',
  templateUrl: './aplicar-perdonar-mora.component.html',
  styleUrls: ['./aplicar-perdonar-mora.component.scss'],
})
export class AplicarPerdonarMoraComponent implements OnInit {

  @Input() mode: MoraModalMode = 'aplicar';
  @Input() credito!: Credito;

  private readonly utilsSvc = inject(UtilsService);
  private readonly creditosSvc = inject(CreditosService);

  form = new FormGroup({
    monto: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    motivo: new FormControl(''),
  });

  get title(): string {
    return this.mode === 'aplicar' ? 'Aplicar mora' : 'Perdonar mora';
  }

  get submitLabel(): string {
    return this.mode === 'aplicar' ? 'Aplicar' : 'Perdonar';
  }

  get creditoId(): string {
    return this.credito?.id || this.credito?._id;
  }

  ngOnInit(): void {
    if (this.mode === 'aplicar' && this.credito?.moraSugerida != null && this.credito.moraSugerida > 0) {
      this.form.patchValue({ monto: this.credito.moraSugerida });
    }

    if (this.mode === 'perdonar') {
      const max = this.credito?.mora_adeudada ?? 0;
      this.form.controls.monto.setValidators([
        Validators.required,
        Validators.min(0.01),
        Validators.max(max),
      ]);
      this.form.controls.monto.updateValueAndValidity();
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid || !this.creditoId) return;

    const monto = Number(this.form.value.monto);
    const motivo = this.form.value.motivo?.trim() || undefined;

    if (!Number.isFinite(monto) || monto < 0.01) return;

    if (this.mode === 'perdonar') {
      const adeudada = this.credito.mora_adeudada ?? 0;
      if (monto > adeudada) {
        await this.utilsSvc.presentAlert({
          header: 'Error',
          message: 'No se puede perdonar más de la mora adeudada',
          buttons: ['OK'],
        });
        return;
      }
    }

    const loading = await this.utilsSvc.loading();
    await loading.present();

    const body = { monto, ...(motivo ? { motivo } : {}) };
    const request$ = this.mode === 'aplicar'
      ? this.creditosSvc.aplicarMora(this.creditoId, body)
      : this.creditosSvc.perdonarMora(this.creditoId, body);

    request$.subscribe({
      next: () => {
        loading.dismiss();
        this.utilsSvc.presentToast({
          message: this.mode === 'aplicar' ? 'Mora aplicada correctamente' : 'Mora perdonada correctamente',
          duration: 2000,
          color: 'success',
          icon: 'checkmark-outline',
        });
        this.utilsSvc.dismissModal({ success: true });
      },
      error: async (err) => {
        loading.dismiss();
        await this.utilsSvc.presentAlert({
          header: 'Error',
          message: err.error?.message || 'No se pudo completar la operación',
          buttons: ['OK'],
        });
      },
    });
  }
}
