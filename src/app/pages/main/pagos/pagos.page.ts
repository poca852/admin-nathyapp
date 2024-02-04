import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { RutaService } from '../../../services/ruta.service';
import { UtilsService } from '../../../services/utils.service';
import { Empresa, Pago, Ruta } from 'src/app/models';
import * as moment from 'moment';
import { PagosService } from '../../../services/pagos.service';
import { Subscription } from 'rxjs';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { IonModal } from '@ionic/angular';
import { UpdatePagoComponent } from 'src/app/shared/components/update-pago/update-pago.component';
import { EmpresaService } from '../../../services/empresa.service';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-pagos',
  templateUrl: './pagos.page.html',
  styleUrls: ['./pagos.page.scss'],
})
export class PagosPage implements OnInit {

  private rutaSvc = inject(RutaService);
  private utilsSvc = inject(UtilsService);
  private pagosSvc = inject(PagosService);
  private empresaSvc = inject(EmpresaService);
  
  public rutaControl = new FormControl(null);

  private dateSelect = moment().utc(true).format('DD/MM/YYYY');
  currentRuta?: Ruta;

  @ViewChild('modalPagos') modalPagos: IonModal;


  constructor() { }

  ngOnInit() {
  }

  get rutas(): Ruta[] {
    return this.empresaSvc.rutas();
  }

  get today(): string {
    return this.rutaSvc.today;
  }

  get pagos(): Pago[] {
    return this.pagosSvc.pagos();
  }

  private async setPagos() {
    const loading = await this.utilsSvc.loading();
    await loading.present();

    this.pagosSvc.getPagosByRutaAndDate(this.currentRuta._id, this.dateSelect)
      .subscribe({
        next: pagos => this.pagosSvc.setPagos(pagos)
      })

    loading.dismiss()
  }

  onChangeDay(e) {

    this.dateSelect = moment(e.detail.value).format('DD/MM/YYYY');
    this.modalPagos.dismiss()
    this.setPagos();

  }

  onChangeRuta(ruta: any) {

    this.currentRuta = ruta;

    this.setPagos()

  }

  async updatePago(pago: Pago) {

    if(this.utilsSvc.getFromLocalStorage('user').rol !== 'ADMIN') {
      this.utilsSvc.presentToast({
        message: 'No tienes permisos necesarios',
        duration: 3500,
        color: 'danger'
      })
      return;
    }

    let fechaDelPago = pago.fecha.split(' ')[0];

    if (fechaDelPago !== this.today) {
      return this.utilsSvc.presentAlert({
        header: 'Importante',
        message: 'No puedes actualizar un pago distinto al dia de hoy, para poder relizar esto debe hablar con el administrador',
        buttons: ['OK']
      })
    }

    let success = await this.utilsSvc.presentModal({
      component: UpdatePagoComponent,
      cssClass: 'add-update-modal',
      componentProps: { pago }
    })

    if (success) {
      this.setPagos()
    }
  }

}
