import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Pago } from 'src/app/models';
import { UtilsService } from '../../../services/utils.service';
import { PagosService } from 'src/app/services/pagos.service';

@Component({
  selector: 'app-update-pago',
  templateUrl: './update-pago.component.html',
  styleUrls: ['./update-pago.component.scss'],
})
export class UpdatePagoComponent  implements OnInit {

  @Input()
  pago: Pago;

  public form = new FormGroup({
    valor: new FormControl(null, [Validators.required, Validators.min(0)])
  })

  constructor(
    private utilsSvc: UtilsService,
    private pagoSvc: PagosService
  ) { }

  ngOnInit() {
    if(!!this.pago) {
      this.form.patchValue(this.pago)
    }
  }

  updatePago() {
    this.pagoSvc.updatePago(this.pago._id, {...this.form.value})
      .subscribe({
        next: () => {
          this.utilsSvc.dismissModal({success: true})
        },
        error: async(err)  => {
          await this.utilsSvc.presentAlert({
            header: 'Error',
            message: err.error.message,
            buttons: ['OK']
          })
        }
      })
  }

  setNumberInput(){
    let { valor } = this.form.controls;

    if(valor.value) valor.setValue(parseFloat(valor.value))
  }

}
