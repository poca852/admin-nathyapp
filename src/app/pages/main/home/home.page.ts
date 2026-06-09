import { Component } from '@angular/core';
import { RutaService } from '../../../services/ruta.service';
import { UtilsService } from '../../../services/utils.service';
import { Ruta } from '../../../models';
import { EmpresaService } from 'src/app/services/empresa.service';
import { finalize } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UpdateNotesModalComponent } from 'src/app/shared/components/update-notes-modal/update-notes-modal.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage {
  loading = true;

  constructor(
    private rutaSvc: RutaService,
    public utilsSvc: UtilsService,
    public empresaSvc: EmpresaService
  ) { }

  ionViewWillEnter(): void {
    this.checkUpdateNotes();
    this.loadRutas();
  }

  private checkUpdateNotes(): void {
    const seenVersion = this.utilsSvc.getFromLocalStorage('app_version_seen');
    if (seenVersion !== environment.version) {
      this.utilsSvc.presentModal({
        component: UpdateNotesModalComponent,
        cssClass: 'update-notes-modal',
      });
      this.utilsSvc.saveInLocalStorage('app_version_seen', environment.version);
    }
  }

  loadRutas(event?: any): void {
    this.loading = true;
    this.rutaSvc.getRutasByEmpresa()
      .pipe(finalize(() => {
        this.loading = false;
        if (event) {
          event.target.complete();
        }
      }))
      .subscribe({
        next: ({ rutas }) => {
          this.empresaSvc.setRutas(rutas);
        },
        error: (err) => {
          this.utilsSvc.presentToast({
            message: 'Error al obtener las rutas',
            duration: 2000,
            position: 'bottom',
            color: 'danger'
          });
        }
      });
  }

  trackByRutaId(index: number, ruta: Ruta): string {
    return ruta.id;
  }

  async confirmToggle(ruta: Ruta): Promise<void> {
    const message = ruta.status ? '¿Cerrar ruta?' : '¿Abrir ruta?';
    const header = 'Confirmación';

    await this.utilsSvc.presentAlert({
      header,
      message,
      buttons: [
        {
          text: 'Sí',
          handler: () => this.toggleRutaStatus(ruta)
        },
        {
          text: 'No',
          role: 'cancel'
        }
      ]
    });
  }

  async toggleRutaStatus(ruta: Ruta): Promise<void> {
    const loadingMessage = ruta.status ? 'Cerrando ruta...' : 'Abriendo ruta...';
    const loading = await this.utilsSvc.loading({ message: loadingMessage });
    await loading.present();

    const request = ruta.status
      ? this.rutaSvc.closeCaja(ruta.id)
      : this.rutaSvc.newCaja(ruta.id);

    request.subscribe({
      next: () => {
        loading.dismiss();
        if (ruta.status) {
          this.utilsSvc.presentToast({
            message: 'Ruta cerrada correctamente',
            duration: 2000,
            position: 'bottom',
            color: 'success'
          });
        }
        this.loadRutas();
      },
      error: (err) => {
        loading.dismiss();
        this.utilsSvc.presentToast({
          message: `Error al ${ruta.status ? 'cerrar' : 'abrir'} la ruta`,
          duration: 2000,
          position: 'bottom',
          color: 'danger'
        });
      }
    });
  }
}
