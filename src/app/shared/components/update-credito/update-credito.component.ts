import { Component, OnInit, Input } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Credito, FrecuenciaCobro, NuevoCredito } from 'src/app/models';
import { UtilsService } from '../../../services/utils.service';
import { CreditosService } from '../../../services/creditos.service';
import { Subject, takeUntil } from 'rxjs';
import { RenovacionDetalle } from 'src/app/pages/main/renovaciones/interfaces/renovacion-report.interface';

@Component({
  selector: 'app-update-credito',
  templateUrl: './update-credito.component.html',
  styleUrls: ['./update-credito.component.scss'],
})
export class UpdateCreditoComponent implements OnInit {

  @Input()
  credito: RenovacionDetalle;

  ngUnsubscribe = new Subject<void>();

  form = new FormGroup({
    valor_credito: new FormControl(null, [Validators.required]),
    interes: new FormControl(null, [Validators.required]),
    total_cuotas: new FormControl(null, [Validators.required]),
    valor_cuota: new FormControl({ value: null, disabled: true }),
    esAutomatico: new FormControl(true, [Validators.required]),
    frecuencia_cobro: new FormControl(FrecuenciaCobro.DIARIO, [Validators.required]),
  })

  constructor(
    private utilsSvc: UtilsService,
    private creditoSvc: CreditosService,
  ) { }

  ngOnInit() { }

  ionViewWillEnter() {
    this.setupFormValueChanges();
  }

  ionViewWillLeave() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  onInputChange(event: any, control: FormControl): void {
    const newValue = event.target.value;
    if (newValue && typeof newValue === 'string') {
      const numericValue = parseFloat(newValue);

      if (!isNaN(numericValue)) {
        control.setValue(numericValue, { emitEvent: false });
      }
    }
  }

  private setupFormValueChanges(): void {
    this.form.get('esAutomatico')?.valueChanges.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((esAutomatico) => {
        const interesControl = this.form.get('interes');
        const valorCuotaControl = this.form.get('valor_cuota');

        if (esAutomatico) {
          interesControl?.enable();
          interesControl?.setValidators([Validators.required]);
          valorCuotaControl?.setValue(null);
          valorCuotaControl?.disable();
        } else {
          interesControl?.setValue(null);
          interesControl?.disable();
          valorCuotaControl?.enable();
          valorCuotaControl?.setValidators([Validators.required]);
        }

        interesControl?.updateValueAndValidity();
        valorCuotaControl?.updateValueAndValidity();
      });
  }

  async confirmEdit() {

    await this.utilsSvc.presentAlert({
      header: 'Confirmacion',
      message: '¿Desea actualizar este credito?',
      buttons: [
        {
          text: 'Si, editar',
        },
        {
          text: 'No, cancelar',
          role: 'cancel'
        }
      ]
    })

  }

  async editarCredito() {
    const loading = await this.utilsSvc.loading();
    await loading.present();
    this.creditoSvc.updateCredito(this.credito.creditoId, { ...this.form.value, rutaId: this.credito.rutaId }).subscribe({
      next: (credito) => {
        loading.dismiss();
        this.utilsSvc.presentToast({
          color: 'success',
          message: 'Credito Actualizado Correctamente',
          duration: 3000
        })
        this.utilsSvc.dismissModal({ success: true });
      },
      error: err => {
        console.log(err.error)
        loading.dismiss();
        this.utilsSvc.presentAlert({
          header: 'Error',
          message: 'Error al actualizar credito, hable con el administrador del sistema',
          buttons: ['OK']
        })
        this.utilsSvc.dismissModal({ success: false })
      }
    })

  }

}
