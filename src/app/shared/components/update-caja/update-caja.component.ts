import { Component, Input, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Caja } from 'src/app/models';
import { CajaService } from 'src/app/services/caja.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-update-caja',
  templateUrl: './update-caja.component.html',
  styleUrls: ['./update-caja.component.scss'],
})
export class UpdateCajaComponent implements OnInit {
  @Input() caja!: Caja;

  private readonly cajaSvc = inject(CajaService);
  readonly utilsSvc = inject(UtilsService);

  saving = false;

  form = new FormGroup({
    base: new FormControl<number | null>(null, [Validators.required]),
    inversion: new FormControl<number | null>(null, [Validators.min(0)]),
    retiro: new FormControl<number | null>(null, [Validators.min(0)]),
    gasto: new FormControl<number | null>(null, [Validators.min(0)]),
  });

  ngOnInit(): void {
    if (this.caja) {
      this.form.patchValue({
        base: Number(this.caja.base ?? 0),
        inversion: Number(this.caja.inversion ?? 0),
        retiro: Number(this.caja.retiro ?? 0),
        gasto: Number(this.caja.gasto ?? 0),
      });
    }
  }

  submit(): void {
    if (this.form.invalid || this.saving) return;
    const id = this.caja.id || this.caja._id;
    if (!id) return;

    const raw = this.form.getRawValue();
    this.saving = true;
    this.cajaSvc.updateCaja(id, {
      base: Number(raw.base),
      inversion: Number(raw.inversion ?? 0),
      retiro: Number(raw.retiro ?? 0),
      gasto: Number(raw.gasto ?? 0),
    }).subscribe({
      next: () => {
        this.saving = false;
        this.utilsSvc.presentToast({
          message: 'Caja actualizada',
          color: 'success',
          duration: 2500,
        });
        this.utilsSvc.dismissModal({ success: true });
      },
      error: (err) => {
        this.saving = false;
        this.utilsSvc.presentToast({
          message: err.error?.message || 'No se pudo actualizar la caja',
          color: 'danger',
          duration: 3500,
        });
      },
    });
  }
}
