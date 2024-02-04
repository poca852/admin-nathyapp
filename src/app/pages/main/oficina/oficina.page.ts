import { Component, OnInit, ViewChild, signal } from '@angular/core';
import { UtilsService } from '../../../services/utils.service';
import { GastosService } from '../../../services/gastos.service';
import { InversionesService } from '../../../services/inversiones.service';
import { RetirosService } from '../../../services/retiros.service';
import { EmpresaService } from '../../../services/empresa.service';
import { FormControl, FormGroup } from '@angular/forms';
import * as moment from 'moment';
import { Ruta } from 'src/app/models';
import { IonModal } from '@ionic/angular';

enum Oficina {
  GASTOS = 'gasto',
  RETIRO = 'retiro',
  INVERSION = 'invesion',
}

@Component({
  selector: 'app-oficina',
  templateUrl: './oficina.page.html',
  styleUrls: ['./oficina.page.scss'],
})
export class OficinaPage implements OnInit {
  
  @ViewChild('modal') modal: IonModal;

  private _dateSelected = signal<string>(moment().utc(true).format('YYYY-MM-DD'));
  currentRuta?: Ruta;
  listOficina: Oficina[] = [Oficina.GASTOS, Oficina.INVERSION, Oficina.RETIRO]
  oficina = new FormControl();

  data: any[] = []

  constructor(
    private empresaSvc: EmpresaService,
    private utilsSvc: UtilsService,
    private gastoSvc: GastosService,
    private inversionSvc: InversionesService,
    private retiroSvc: RetirosService,
  ) { }

  ngOnInit() {
  }

  onChangeDay(e){
    this._dateSelected.set(moment(e.detail.value).utc(true).format('YYYY-MM-DD'));
    this.modal.dismiss();
  }

  onChangeRuta(ruta: Ruta) {
    this.currentRuta = ruta;
  }

  private getGastos() {
    this.gastoSvc.getGastosByDate(this._dateSelected(), this.currentRuta._id)
      .subscribe({
        next: gastos => {
          this.data = gastos;
        }
      })
  }

  getInversiones() {
    this.inversionSvc.getInversionesByDate(this._dateSelected(), this.currentRuta._id)
      .subscribe({
        next: inversiones => {
          this.data = inversiones
        }
      })
  }

  getRetiros() {
    this.retiroSvc.getRetirosByDate(this._dateSelected(), this.currentRuta._id)
      .subscribe({
        next: retiros => {
          this.data = retiros
        }
      })
  }

  submit() {
    
    if(this.oficina.value === Oficina.GASTOS) return this.getGastos();
    if(this.oficina.value === Oficina.INVERSION) return this.getInversiones();
    if(this.oficina.value === Oficina.RETIRO) return this.getRetiros();
  }

}
