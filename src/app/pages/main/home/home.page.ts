import { Component, OnDestroy, OnInit } from '@angular/core';
import { RutaService } from '../../../services/ruta.service';
import { UtilsService } from '../../../services/utils.service';
import { Empresa, User } from 'src/app/models';
import { Ruta } from '../../../models';
import { EmpresaService } from '../../../services/empresa.service';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { Subscription } from 'rxjs';
import { WsService } from '../../../services/ws.service';

@Component({
  selector: 'app-rutero',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {

  public loading: boolean = true;
  public empresa!: Empresa;
  private logoutSubs: Subscription;
  public rutas: Ruta[] = [];

  constructor(
    private rutaSvc: RutaService,
    public utilsSvc: UtilsService,
    private notificacionesSvc: NotificacionesService,
    private ws: WsService,
  ) { }

  ngOnDestroy(): void {
    this.logoutSubs.unsubscribe();
  }

  ngOnInit(): void {
    this.logoutSubs = this.notificacionesSvc.logOut$.subscribe(() => {
      this.rutas = [];
    })
  }

  ionViewWillEnter() {
    this.getRutas();
  }

  getRutas() {
    this.loading = true;
    this.rutaSvc.getRutasByEmpresa().subscribe({
      next: rutas => {
        this.rutas = rutas;
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

      this.rutaSvc.newCaja(ruta._id).subscribe({
        next: () => {
          loading.dismiss();
        }
      })

      return;
    }

    this.rutaSvc.closeCaja(ruta._id).subscribe({
      next: () => {
        loading.dismiss();
        this.utilsSvc.presentToast({
          message: 'Ruta cerrada',
          duration: 2000,
          position: 'bottom',
          color: 'success'
        })
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
