import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SubTipo } from 'src/app/models/sub-tipo.enum';
import { UtilsService } from 'src/app/services/utils.service';
import { OficinaService } from 'src/app/services/oficina.service';
import { Ruta, CategoriaGasto } from 'src/app/models';

@Component({
  selector: 'app-add-update-movimiento',
  templateUrl: './add-update-movimiento.component.html',
  styleUrls: ['./add-update-movimiento.component.scss'],
})
export class AddUpdateMovimientoComponent implements OnInit {

  @Input() movimiento: any;
  @Input() type: SubTipo;
  @Input() ruta: Ruta;
  @Input() fechaSeleccionada: Date;

  private readonly utilsSvc = inject(UtilsService);
  private readonly oficinaSvc = inject(OficinaService);

  public readonly SubTipo = SubTipo;
  public readonly CategoriaGasto = CategoriaGasto;
  public readonly categories = Object.values(CategoriaGasto);
  public readonly isEditable = signal<boolean>(true);

  public form = new FormGroup({
    id: new FormControl(''),
    subTipo: new FormControl('', [Validators.required]),
    monto: new FormControl(null, [Validators.required, Validators.min(0)]),
    concepto: new FormControl(null, [Validators.required]),
    categoriaGasto: new FormControl(null),
    comentario: new FormControl(null),
    fecha: new FormControl(new Date().toISOString()),
  });

  ngOnInit() {
    this.checkIfIsSameDay();
    this.initForm();
  }

  private checkIfIsSameDay() {
    const today = new Date();
    const targetDate = this.movimiento ? new Date(this.movimiento.fecha) : this.fechaSeleccionada;

    const isSameDay =
      today.getFullYear() === targetDate.getFullYear() &&
      today.getMonth() === targetDate.getMonth() &&
      today.getDate() === targetDate.getDate();

    this.isEditable.set(isSameDay);

    if (!isSameDay && this.movimiento) {
      this.utilsSvc.presentToast({
        message: 'Solo se pueden editar movimientos del mismo día',
        duration: 3000,
        color: 'warning',
        icon: 'lock-closed-outline'
      });
      this.form.disable();
    }
  }

  private initForm() {
    if (this.movimiento) {
      this.form.patchValue({
        id: this.movimiento.id,
        subTipo: this.type,
        monto: this.movimiento.valor,
        concepto: this.movimiento.concepto,
        categoriaGasto: this.movimiento.categoriaGasto,
        comentario: this.movimiento.comentario,
        fecha: new Date(this.movimiento.fecha).toISOString()
      });
    } else {
      this.form.patchValue({
        subTipo: this.type,
        fecha: this.fechaSeleccionada.toISOString()
      });
    }
  }

  async submit() {
    if (this.form.invalid || !this.isEditable()) return;

    const loading = await this.utilsSvc.loading();
    await loading.present();

    if (this.movimiento) {
      this.updateMovimiento(loading);
    } else {
      // Placeholder para creación futura
      setTimeout(() => {
        loading.dismiss();
        this.utilsSvc.presentToast({
          message: 'Funcionalidad de creación en desarrollo',
          duration: 2000,
          color: 'medium'
        });
        this.utilsSvc.dismissModal({ success: true });
      }, 1000);
    }
  }

  private updateMovimiento(loading: HTMLIonLoadingElement) {
    const { id, monto, concepto, comentario, categoriaGasto } = this.form.value;
    console.log(this.form.value);
    const data: any = {
      monto,
      concepto,
      comentario
    };

    if (this.type === SubTipo.GASTO) {
      data.categoriaGasto = categoriaGasto;
    }

    this.oficinaSvc.updateMovimiento(id, data).subscribe({
      next: (success) => {
        loading.dismiss();
        if (success) {
          this.utilsSvc.dismissModal({ success: true });
          this.utilsSvc.presentToast({
            message: 'Movimiento actualizado correctamente',
            duration: 1500,
            color: 'success',
            icon: 'checkmark-outline'
          });
        }
      },
      error: (err) => {
        loading.dismiss();
        this.utilsSvc.presentAlert({
          header: 'Error',
          message: err.error.message || 'No se pudo actualizar el movimiento',
          buttons: ['OK']
        });
      }
    });
  }

}
