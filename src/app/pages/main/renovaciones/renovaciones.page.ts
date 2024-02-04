import { Component, OnInit, ViewChild } from '@angular/core';
import { MomentService } from 'src/app/config/plugins/moment.plugin';
import { Credito } from 'src/app/models';
import { CreditosService } from '../../../services/creditos.service';
import { UtilsService } from '../../../services/utils.service';
import { ModalHistorialCreditoComponent } from 'src/app/shared/components/modal-historial-credito/modal-historial-credito.component';
import { IonModal } from '@ionic/angular';
import { UpdateCreditoComponent } from '../../../shared/components/update-credito/update-credito.component';
import { ClienteService } from 'src/app/services/cliente.service';

@Component({
  selector: 'app-renovaciones',
  templateUrl: './renovaciones.page.html',
  styleUrls: ['./renovaciones.page.scss'],
})
export class RenovacionesPage implements OnInit {

  @ViewChild('modalRenocaciones') modalRenocaciones: IonModal;
  creditos: Credito[] = [];
  loading: boolean = true;
  currentDate = this.moment.nowWithFormat('DD/MM/YYYY');

  constructor(
    public moment: MomentService,
    private creditoSvc: CreditosService,
    private clienteSvc: ClienteService,
    private utilsSvc: UtilsService,
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.getRenovaciones();
  }

  getRenovaciones(){
    this.creditoSvc.getRenovaciones(this.currentDate)
      .subscribe({
        next: creditos => {
          this.creditos = creditos
          this.loading = false;
        }
      })
  }

  async openModal(credito: Credito) {
    await this.utilsSvc.presentModal({
      component: ModalHistorialCreditoComponent,
      cssClass: 'add-update-modal',
      componentProps: {credito}
    })
  }

  async updateModal(credito: Credito) {

    if(this.utilsSvc.getFromLocalStorage('user').rol !== 'ADMIN'){
      this.utilsSvc.presentToast({
        message: 'Usted no tiene permiso para realizar esta operacion.',
        duration: 3500,
        color: 'danger'
      })
      return;
    }

    let success = await this.utilsSvc.presentModal({
      component: UpdateCreditoComponent,
      cssClass: 'add-update-modal',
      componentProps: {credito}
    })

    if(success) this.getRenovaciones();
  }

  async deleteCredito(credito: Credito){

    if(this.utilsSvc.getFromLocalStorage('user').rol !== 'ADMIN'){
      this.utilsSvc.presentToast({
        message: 'Usted no tiene permiso para realizar esta operacion.',
        duration: 3500,
        color: 'danger'
      })
      return;
    }

    this.creditoSvc.deleteCredito(credito._id).subscribe({
      next: () => {
        this.utilsSvc.presentToast({
          color: 'success',
          message: 'Credito eliminado correctamente',
          duration: 3000
        })
        this.getRenovaciones();
      }
    })
  }

  async presentAcionSheet(credito: Credito) {
    await this.utilsSvc.presentActionSheet({
      header: `Acciones para ${credito.cliente.nombre}`,
      buttons: [
        {
          text: 'Ver Información',
          handler: () => {
            this.clienteSvc.setCurrentCliente(credito.cliente);
            this.utilsSvc.routerLink('/main/detail-cliente')
          }
        },
        {
          text: 'Actualizar',
          handler: () => this.updateModal(credito)
        },
        {
          text: 'Eliminar',
          handler: () => this.deleteCredito(credito)
        },
        {
          text: 'Cancelar',
          role: 'cancel'
        }
      ]
    })
  }

  onChangeDay(e) {

    this.currentDate = this.moment.fecha(e.detail.value,'DD/MM/YYYY');
    this.getRenovaciones();
    this.modalRenocaciones.dismiss()

  }

}
