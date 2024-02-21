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

  constructor(
    private rutaSvc: RutaService,
    public utilsSvc: UtilsService,
    private empresaSvc: EmpresaService,
    private notificacionesSvc: NotificacionesService,
    private ws: WsService,
  ) { }

  ngOnDestroy(): void {
    this.logoutSubs.unsubscribe();
  }

  ngOnInit(): void {
    this.logoutSubs = this.notificacionesSvc.logOut$.subscribe(() => {
      this.empresa = null;
    })
  }

  ionViewWillEnter() {
    this.getEmpresa();
  }

  getEmpresa() {
    this.loading = true;
    this.empresaSvc.getEmpresa().subscribe({
      next: empresa => {
        this.empresa = empresa;
        this.loading = false;
      },
      error: err => {
        this.loading = false;
      }
    })
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
          this.getEmpresa();
          loading.dismiss();
        }
      })

      return;
    }

    this.rutaSvc.closeCaja(ruta._id).subscribe({
      next: () => {
        this.getEmpresa();
        loading.dismiss();
        this.ws.emit('admin-close-caja', {ruta: ruta._id})
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
