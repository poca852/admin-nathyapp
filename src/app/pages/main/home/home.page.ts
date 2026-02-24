import { Component, OnDestroy, OnInit } from '@angular/core';
import { RutaService } from '../../../services/ruta.service';
import { UtilsService } from '../../../services/utils.service';
import { Ruta } from '../../../models';

import { WsService } from '../../../services/ws.service';
import { EmpresaService } from 'src/app/services/empresa.service';

@Component({
  selector: 'app-rutero',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {

  public loading: boolean = true;

  constructor(
    private rutaSvc: RutaService,
    public utilsSvc: UtilsService,
    private ws: WsService,
    public empresaSvc: EmpresaService,
  ) { }

  ngOnDestroy(): void {
    // TODO: se debe implementar para limpiar las rutas
  }

  ngOnInit(): void {
    console.log('empresa', this.empresaSvc.empresa());
  }

  ionViewWillEnter() {
    this.getRutas();
  }

  getRutas() {
    this.loading = true;
    this.rutaSvc.getRutasByEmpresa().subscribe({
      next: ({rutas}) => {
        // Actualizar el estado de las rutas en el EmpresaService
        this.empresaSvc.setRutas(rutas);
        this.loading = false;
      },
      error: err => {
        this.loading = false;
        this.utilsSvc.presentToast({
          message: 'Error al obtener las rutas',
          duration: 2000,
          position: 'bottom'
        })
      }
    });
  }

  async openAndCloseRuta(ruta: Ruta): Promise<void> {

    let msgLoading = ruta.status ? 'Cerrando Ruta...' : 'Abriendo Ruta...'

    const loading = await this.utilsSvc.loading({
      message: msgLoading
    });

    await loading.present();

    if (!ruta.status) {

      this.rutaSvc.newCaja(ruta.id).subscribe({
        next: () => {
          loading.dismiss();
          this.getRutas();
        }
      })

      return;
    }

    this.rutaSvc.closeCaja(ruta.id).subscribe({
      next: () => {
        loading.dismiss();
        this.utilsSvc.presentToast({
          message: 'Ruta cerrada',
          duration: 2000,
          position: 'bottom',
          color: 'success'
        })
        this.getRutas();
      }
    })

  }

  async confirmacion(ruta: Ruta) {

    let message: string = ruta.status ? '¿Cerrar Ruta?' : '¿Abrir Ruta?';

    await this.utilsSvc.presentAlert({
      header: 'Confirmacion',
      message,
      buttons: [
        {
          text: 'Si',
          handler: () => this.openAndCloseRuta(ruta)
        },
        {
          text: 'No',
          role: 'cancel'
        }
      ]
    })

  }

}
