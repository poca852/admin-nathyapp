import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { FrecuenciaCobro } from 'src/app/models';
import { RenovacionDetalle } from 'src/app/pages/main/renovaciones/interfaces/renovacion-report.interface';
import { CreditosService } from '../../../services/creditos.service';
import { EmpresaService } from '../../../services/empresa.service';
import { UtilsService } from '../../../services/utils.service';

@Component({
  selector: 'app-update-credito',
  templateUrl: './update-credito.component.html',
  styleUrls: ['./update-credito.component.scss'],
})
export class UpdateCreditoComponent implements OnInit, OnDestroy {
  @Input() credito!: RenovacionDetalle;

  private readonly utilsSvc = inject(UtilsService);
  private readonly creditoSvc = inject(CreditosService);
  private readonly empresaSvc = inject(EmpresaService);
  private readonly destroy$ = new Subject<void>();

  readonly FrecuenciaCobro = FrecuenciaCobro;
  submitting = false;

  form = new FormGroup({
    valor_credito: new FormControl<number | null>(null, [Validators.required]),
    interes: new FormControl<number | null>(null, [Validators.required]),
    total_cuotas: new FormControl<number | null>(null, [Validators.required]),
    valor_cuota: new FormControl<number | null>({ value: null, disabled: true }),
    esAutomatico: new FormControl(true, [Validators.required]),
    frecuencia_cobro: new FormControl(FrecuenciaCobro.DIARIO, [Validators.required]),
  });

  get isAutomatico(): boolean {
    return !!this.form.controls.esAutomatico.value;
  }

  ngOnInit(): void {
    this.setupFormValueChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onInputChange(event: Event, control: FormControl): void {
    const target = event.target as HTMLInputElement | null;
    const newValue = target?.value;
    if (newValue && typeof newValue === 'string') {
      const numericValue = parseFloat(newValue);
      if (!Number.isNaN(numericValue)) {
        control.setValue(numericValue, { emitEvent: false });
      }
    }
  }

  private setupFormValueChanges(): void {
    this.form.controls.esAutomatico.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((esAutomatico) => {
        const interesControl = this.form.controls.interes;
        const valorCuotaControl = this.form.controls.valor_cuota;

        if (esAutomatico) {
          interesControl.enable();
          interesControl.setValidators([Validators.required]);
          valorCuotaControl.setValue(null);
          valorCuotaControl.disable();
          valorCuotaControl.clearValidators();
        } else {
          interesControl.setValue(null);
          interesControl.disable();
          interesControl.clearValidators();
          valorCuotaControl.enable();
          valorCuotaControl.setValidators([Validators.required]);
        }

        interesControl.updateValueAndValidity();
        valorCuotaControl.updateValueAndValidity();
      });
  }

  async editarCredito(): Promise<void> {
    if (this.form.invalid || this.submitting || !this.credito?.creditoId) return;

    if (!this.esDelDiaActual()) {
      await this.utilsSvc.presentAlert({
        header: 'No permitido',
        message:
          'Solo se pueden actualizar créditos o renovaciones del día de hoy. Modificar uno de otro día afectaría otra caja.',
        buttons: ['OK'],
      });
      return;
    }

    await this.utilsSvc.presentAlert({
      header: 'Confirmar actualización',
      message: `¿Actualizar el crédito de ${this.credito.nombre}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sí, actualizar',
          handler: () => {
            void this.submitUpdate();
          },
        },
      ],
    });
  }

  private esDelDiaActual(): boolean {
    if (!this.credito?.fecha) return false;
    const ruta = this.empresaSvc
      .rutas()
      .find((r) => r.id === this.credito.rutaId || r._id === this.credito.rutaId);
    const timeZone = ruta?.timeZone || 'UTC';
    const hoy = this.formatYmdInTimeZone(new Date(), timeZone);
    const fechaItem = this.formatYmdInTimeZone(new Date(this.credito.fecha), timeZone);
    return hoy === fechaItem;
  }

  private formatYmdInTimeZone(date: Date, timeZone: string): string {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date);
    } catch {
      return date.toISOString().slice(0, 10);
    }
  }

  private async submitUpdate(): Promise<void> {
    if (this.form.invalid || this.submitting) return;

    this.submitting = true;
    const loading = await this.utilsSvc.loading({ message: 'Actualizando crédito...' });
    await loading.present();

    const payload = {
      ...this.form.getRawValue(),
      rutaId: this.credito.rutaId,
    };

    this.creditoSvc.updateCredito(this.credito.creditoId, payload).subscribe({
      next: () => {
        loading.dismiss();
        this.submitting = false;
        this.utilsSvc.presentToast({
          color: 'success',
          message: 'Crédito actualizado correctamente',
          duration: 3000,
          icon: 'checkmark-circle-outline',
        });
        this.utilsSvc.dismissModal({ success: true });
      },
      error: (err) => {
        loading.dismiss();
        this.submitting = false;
        this.utilsSvc.presentAlert({
          header: 'Error',
          message:
            err?.error?.message ||
            'No se pudo actualizar el crédito. Inténtalo de nuevo o contacta al administrador.',
          buttons: ['OK'],
        });
      },
    });
  }
}
