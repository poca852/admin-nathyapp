import { Component, OnInit, ViewChild } from '@angular/core';
import { IonModal } from '@ionic/angular';
import { MomentService } from '../../../config/plugins/moment.plugin';
import { Caja, Ruta } from 'src/app/models';
import { CajaService } from '../../../services/caja.service';
import { UtilsService } from '../../../services/utils.service';

@Component({
  selector: 'app-caja',
  templateUrl: './caja.page.html',
  styleUrls: ['./caja.page.scss'],
})
export class CajaPage implements OnInit {

  @ViewChild('modalCaja') modalCaja: IonModal;

  dateSelect: string = this.moment.nowWithFormat('DD/MM/YYYY');
  ruta: Ruta;

  currentCaja?: Caja;

  constructor(
    private moment: MomentService,
    private cajaSvc: CajaService,
    private utilsSvc: UtilsService,
  ) { }

  ngOnInit() {
  }

  onChangeDay(e) {
    this.dateSelect =  this.moment.fecha(e.detail.value, 'DD/MM/YYYY');
    this.searchCaja();
    this.modalCaja.dismiss()
  }

  onChangeRuta(ruta: Ruta) {
    this.ruta = ruta;
    this.searchCaja()
  }

  searchCaja() {

    this.cajaSvc.getCajaByRutaAndDate(this.ruta._id, this.dateSelect).subscribe({
      next: caja => {
        this.currentCaja = caja;
      },
      error: err => {
        this.currentCaja = null;
        this.utilsSvc.presentAlert({
          header: 'Alerta',
          message: err.error.message,
          buttons: ['OK']
        })
      }
    })

  }

}
