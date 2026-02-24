import { Component, OnInit, ViewChild } from '@angular/core';
import { DatetimeCustomEvent, IonModal } from '@ionic/angular';
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

  dateSelect: Date;
  ruta: Ruta;

  currentCaja?: Caja;

  constructor(
    private cajaSvc: CajaService,
    private utilsSvc: UtilsService,
  ) { }

  ngOnInit() {
  }

  onChangeDay(e: DatetimeCustomEvent ) {
    const dateValue = Array.isArray(e.detail.value) ? e.detail.value[0] : e.detail.value;
    if (dateValue) {
      const newDate = new Date(dateValue);
      newDate.setHours(0,0,0,0);
      this.dateSelect = newDate;
      this.searchCaja();
      this.modalCaja.dismiss()
    }
  }

  onChangeRuta(ruta: Ruta) {
    this.ruta = ruta;
  }

  searchCaja() {
    this.cajaSvc.getCajaByRutaAndDate(this.ruta.id, this.dateSelect.toISOString()).subscribe({
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
