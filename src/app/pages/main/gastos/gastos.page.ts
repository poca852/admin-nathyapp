import { Component, OnInit, ViewChild, signal } from '@angular/core';
import { UtilsService } from '../../../services/utils.service';
import { RutaService } from '../../../services/ruta.service';
import { Gasto, Ruta } from 'src/app/models';
import { IonModal } from '@ionic/angular';
import * as moment from 'moment';
import { GastosService } from '../../../services/gastos.service';
import { Subscription } from 'rxjs';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { UpdateGastoComponent } from 'src/app/shared/components/update-gasto/update-gasto.component';

@Component({
  selector: 'app-gastos',
  templateUrl: './gastos.page.html',
  styleUrls: ['./gastos.page.scss'],
})
export class GastosPage implements OnInit {

  @ViewChild('modal') modal: IonModal;

  public gastos: Gasto[] = [];
  private _dateSelected = signal<string>(moment().utc(true).format('YYYY-MM-DD'));
  currentRuta?: Ruta;

  constructor(
    private utilsSvc: UtilsService,
    private gastoSvc: GastosService,
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter() {}

  get currentDate(): string {
    return moment(this._dateSelected()).utc(true).toISOString();
  }

  private setGastos() {
    this.gastoSvc.getGastosByDate(this.currentDate, this.currentRuta._id)
      .subscribe({
        next: gastos => {
          this.gastos = gastos;
        }
      })
  }

  sePuedeEditar(date: Date): boolean {

    const dateParse = moment(date).utc(true).format('DD/MM/YYYY');
    return dateParse === moment().utc(true).format('DD/MM/YYYY');

  }

  async onChangeDay(e) {

    this._dateSelected.set(moment(e.detail.value).utc(true).format('YYYY-MM-DD'));
    this.modal.dismiss();
    this.setGastos();

  }

  async editGasto(gasto: Gasto) {

    if (!this.sePuedeEditar(gasto.fecha)) {
      return this.utilsSvc.presentAlert({
        header: 'Informacion',
        message: 'Solo puedes editar los gastos del dia de hoy.',
        buttons: ['OK']
      })
    }

    let success = await this.utilsSvc.presentModal({
      component: UpdateGastoComponent,
      cssClass: 'add-update-modal',
      componentProps: { gasto }
    })

    if (success) {
      this.setGastos()
    }
  }

  onChangeRuta(ruta: Ruta) {
    this.currentRuta = ruta;
    this.setGastos();
  }

}
