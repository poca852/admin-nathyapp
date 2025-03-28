import { Component, OnInit } from '@angular/core';
import { saveAs } from 'file-saver';

import { EmpresaService } from '../../../services/empresa.service';
import { UtilsService } from '../../../services/utils.service';
import { Empresa } from '../../../models/empresa.interface'
import { Platform } from '@ionic/angular';
import { UpdateEmpresaComponent } from '../../../shared/components/update-empresa/update-empresa.component';

@Component({
  selector: 'app-empresa',
  templateUrl: './empresa.page.html',
  styleUrls: ['./empresa.page.scss'],
})
export class EmpresaPage implements OnInit {

  constructor(
    private empresaSvc: EmpresaService,
    public utilsSvc: UtilsService,
    private platform: Platform,
  ) { }

  ngOnInit() {
  }

  get empresa(): Empresa {
    return this.empresaSvc.empresa();
  }

  getBackup() {

    if(!this.platform.is('hybrid')){
      this.empresaSvc.getBackUp(this.empresa._id).subscribe({
        next: (response) => {
          this.downloadFile(response)
        },
        error: err => {
          this.utilsSvc.presentAlert({
            header: 'Alerta',
            message: 'No se pudo procesar la copia de segurdad por favor hable con el administrador del sistema',
            buttons: ['OK']
          })
        }
      })
      return;
    }

    if(!this.empresa.email){
      this.utilsSvc.presentAlert({
        header: 'Alerta',
        message: 'Actualice su informacion con un correo valido',
        buttons: ['OK']
      })
      return;
    }

    this.empresaSvc.sendBackup(this.empresa._id, this.empresa.email).subscribe({
      next: (response) => {

        if(response){
          this.utilsSvc.presentToast({
            color: 'success',
            message: `La copia se envio a ${this.empresa.email}`,
            duration: 3000,
            icon: 'cloud-download-outline'
          })
        }

      },
      error: err => {
        this.utilsSvc.presentAlert({
          header: 'Alerta',
          message: 'No se pudo procesar la copia de segurdad por favor hable con el administrador del sistema',
          buttons: ['OK']
        })
      }
    })

  }

  private async downloadFile(buffer: ArrayBuffer) {

    const blod = new Blob([buffer], {type: 'application/csv'});

    const fileName =  `${this.empresa.name}_backup.csv`;

    saveAs(blod, fileName)
    this.utilsSvc.presentToast({
      color: 'success',
      message: `Copia Descargada`,
      duration: 3000,
      icon: 'cloud-download-outline'
    })
  }

  async editEmpresa() {

    if(this.utilsSvc.getFromLocalStorage('user').rol !== 'ADMIN') return;

    let success = await this.utilsSvc.presentModal({
      component: UpdateEmpresaComponent,
      cssClass: 'add-update-modal',
      componentProps: {empresa: this.empresa}
    })

    if(success) {
      // TODO: pendiente de implementar
    }
  }

}
