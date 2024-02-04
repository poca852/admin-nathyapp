import { Component, OnInit, inject } from '@angular/core';
import { UtilsService } from '../../../services/utils.service';
import { Ruta } from 'src/app/models';
import { AddUpdateRutaComponent } from 'src/app/shared/components/add-update-ruta/add-update-ruta.component';
import { RutaModalComponent } from 'src/app/shared/components/ruta-modal/ruta-modal.component';
import { EmpresaService } from '../../../services/empresa.service';
import { Empresa } from '../../../models/empresa.interface';

@Component({
  selector: 'app-rutas',
  templateUrl: './rutas.page.html',
  styleUrls: ['./rutas.page.scss'],
})
export class RutasPage implements OnInit {

  private utilsSvc = inject(UtilsService);
  private empresaSvc = inject(EmpresaService);
  public empresa: Empresa;
  public loading: boolean = true;
  
  constructor() { }

  ngOnInit() {
    this.getEmpresa();
  }

  ionViewWillEnter() {
    
  }

  handleRefresh(event) {
    setTimeout(() => {
      this.getEmpresa();
      event.target.complete();
    }, 2000);
  }

  getEmpresa(){
    this.loading = true;
    this.empresaSvc.getEmpresa().subscribe({
      next: empresa => {
        this.empresa = empresa;
        this.loading = false;
      },
      error: err => {
        this.loading = false
      }
    })
  }
  
  async presentActions(ruta: Ruta) {

    await this.utilsSvc.presentActionSheet({
      buttons: [
        {
          text: 'Actualizar Ruta',
          handler: () => this.addUpdateRuta(ruta)
        },
        {
          text: 'Ver detalle',
          handler: () => this.viewRuta(ruta)
        },
        {
          text: 'Cancelar',
          role: 'cancel'
        }
      ]
    })

  }

  async viewRuta(ruta?: Ruta){
    await this.utilsSvc.presentModal({
      component: RutaModalComponent,
      cssClass: 'add-update-modal',
      componentProps: {ruta}
    })
  }

  async addUpdateRuta(ruta?: Ruta){

    if(this.utilsSvc.getFromLocalStorage('user').rol !== 'ADMIN') {
      this.utilsSvc.presentToast({
        message: 'Usted no tiene permisos para realizar esta operacion',
        duration: 3500,
        color: 'danger'
      })
      return;
    }

    let success = await this.utilsSvc.presentModal({
      component: AddUpdateRutaComponent,
      cssClass: 'add-update-modal',
      componentProps: { ruta }
    })

    if(success) {
      this.getEmpresa();
    }
  }

}
