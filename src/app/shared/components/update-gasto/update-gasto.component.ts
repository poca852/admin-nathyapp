import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Gasto, ListaDeGastos } from 'src/app/models';
import { GastosService } from '../../../services/gastos.service';
import { UtilsService } from '../../../services/utils.service';

@Component({
  selector: 'app-update-gasto',
  templateUrl: './update-gasto.component.html',
  styleUrls: ['./update-gasto.component.scss'],
})
export class UpdateGastoComponent  implements OnInit {

  @Input()
  gasto: Gasto;

  public form = new FormGroup({
    gasto: new FormControl(''),
    fecha: new FormControl(),
    valor: new FormControl(),
    nota: new FormControl(''),
  })

  constructor(
    private gastoSvc: GastosService,
    private utilsSvc: UtilsService,
  ) { }

  ngOnInit() {
   this.initComponent();
  }

  get listOfGastos(): ListaDeGastos[] {
    return this.gastoSvc.listOfGastos();
  }

  setNumberInput(){
    let { valor } = this.form.controls;

    if(valor.value) valor.setValue(parseFloat(valor.value))
  }

  private initComponent() {
    if(!!this.gasto){
      this.form.patchValue({
        gasto: this.gasto.gasto._id,
        fecha: this.gasto.fecha,
        valor: this.gasto.valor,
        nota: this.gasto.nota
      });
    }
  }

  async updateGasto() {
    this.gastoSvc.updateGasto(this.gasto._id, {...this.form.value})
      .subscribe({
        next: () => {
          this.utilsSvc.dismissModal({success: true})
        },
        error: err => console.log(err)
      })
  }

}
