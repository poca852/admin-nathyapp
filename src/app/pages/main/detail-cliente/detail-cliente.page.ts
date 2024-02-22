import { Component } from '@angular/core';
import { UtilsService } from '../../../services/utils.service';
import { ClienteService } from 'src/app/services/cliente.service';
import { Cliente, Credito, Ruta } from 'src/app/models';
import { ViewImageComponent } from 'src/app/shared/components/view-image/view-image.component';
import { UpdateClienteComponent } from 'src/app/shared/components/update-cliente/update-cliente.component';
import { RutaService } from '../../../services/ruta.service';
import { ModalHistorialCreditoComponent } from 'src/app/shared/components/modal-historial-credito/modal-historial-credito.component';
import { EmpresaService } from '../../../services/empresa.service';
import { MapModalComponent } from 'src/app/shared/components/map-modal/map-modal.component';

@Component({
  selector: 'app-detail-cliente',
  templateUrl: './detail-cliente.page.html',
  styleUrls: ['./detail-cliente.page.scss'],
})
export class DetailClientePage {

  public loading: boolean = true;

  constructor(
    private utilsSvc: UtilsService,
    private clienteSvc: ClienteService,
    private rutaSvc: RutaService,
    private empresaSvc: EmpresaService,
  ) { }

  ionViewWillEnter() {
    this.loading = false;
    if(!this.currentCliente){
      this.utilsSvc.routerLink('/main/clientes')
    }
  }

  ionViewWillLeave() {
    this.clienteSvc.removeCurrentCliente();
  }

  get currentCliente(): Cliente {
    return this.clienteSvc.currentCliente();
  }

  public llamarCliente() {
    const telefono = `tel:${this.currentCliente.telefono}`;

    window.open(telefono, "_system");
  }

  async editCliente() {

    if(this.utilsSvc.getFromLocalStorage('user').rol !== 'ADMIN') {
      this.utilsSvc.presentToast({
        message: 'Usted no tiene los permisos necesarios',
        duration: 3500,
        color: 'danger'
      })

      return
    }

    let success = await this.utilsSvc.presentModal({
      component: UpdateClienteComponent,
      cssClass: 'add-update-modal',
      componentProps: {cliente: this.currentCliente} 
    })

    if(success){
      this.loading = true;
      this.clienteSvc.getClientesByRuta(this.empresaSvc.ruta()._id)
        .subscribe({
          next: clientes => {
            this.clienteSvc.setClientes(clientes)
            let currentCliente = clientes.find(cliente => cliente._id === this.currentCliente._id)
            this.clienteSvc.setCurrentCliente(currentCliente);
            this.loading = false;
          }
        })
    }
  }

  async openHistorialCredito(credito: Credito) {
    await this.utilsSvc.presentModal({
      component: ModalHistorialCreditoComponent,
      cssClass: 'add-update-modal',
      componentProps: {credito}
    })
  }

  async viewImage(url: string) {
    await this.utilsSvc.presentModal({
      component: ViewImageComponent,
      cssClass: 'add-update-modal',
      componentProps: {url}
    })
  }

  async viewMap() {

    if( this.currentCliente.ubication.length === 0 ){
      return this.utilsSvc.presentAlert({
        header: 'Información',
        message: 'Este cliente aun no tiene la ubicacion',
        buttons: ['OK']
      })
    }

    await this.utilsSvc.presentModal({
      component: MapModalComponent,
      cssClass: 'map',
      componentProps: { lngLat: this.currentCliente.ubication }
    })
  }

}
