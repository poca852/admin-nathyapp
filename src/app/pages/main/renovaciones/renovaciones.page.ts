import { Component, OnInit, ViewChild, signal, computed, effect } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { combineLatest, switchMap, tap } from 'rxjs';
import { Credito } from 'src/app/models';
import { CreditosService } from '../../../services/creditos.service';
import { UtilsService } from '../../../services/utils.service';
import { ModalHistorialCreditoComponent } from 'src/app/shared/components/modal-historial-credito/modal-historial-credito.component';
import { IonModal } from '@ionic/angular';
import { UpdateCreditoComponent } from '../../../shared/components/update-credito/update-credito.component';
import { ClienteService } from 'src/app/services/cliente.service';
import { RutaService } from 'src/app/services/ruta.service';
import { format } from 'date-fns';
import { Ruta } from 'src/app/models';
import { EmpresaReport } from './interfaces/renovacion-report.interface';

@Component({
  selector: 'app-renovaciones',
  templateUrl: './renovaciones.page.html',
  styleUrls: ['./renovaciones.page.scss'],
})
export class RenovacionesPage implements OnInit {

  @ViewChild('modalRenocaciones') modalRenocaciones: IonModal;

  public report = signal<EmpresaReport | null>(null);
  public loading = signal<boolean>(false);
  public selectedDate = signal<string>(new Date().toISOString());
  public selectedRouteId = signal<string>('all');

  constructor(
    private creditoSvc: CreditosService,
    private clienteSvc: ClienteService,
    private rutaSvc: RutaService,
    private utilsSvc: UtilsService,
  ) {
    this.setupReactiveFiltering();
  }

  private setupReactiveFiltering() {
    combineLatest([
      toObservable(this.selectedDate),
      toObservable(this.selectedRouteId)
    ]).pipe(
      tap(() => this.loading.set(true)),
      switchMap(([dateStr, routeId]) => {
        const dateFormatted = format(new Date(dateStr), 'MM/dd/yyyy');
        const rId = routeId === 'all' ? undefined : routeId;
        return this.creditoSvc.getRenovaciones(dateFormatted, rId);
      })
    ).subscribe({
      next: report => {
        console.log(report);
        this.report.set(report || null);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error in reactive filtering:', err);
        this.loading.set(false);
        this.report.set(null);
      }
    });
  }

  ngOnInit() {
  }

  ionViewWillEnter() {
  }

  getRenovaciones() {
    // Manually trigger a refresh if needed (e.g., after update/delete)
    // By re-setting the same values, the combineLatest will trigger if we ensure they emit
    // but better to just call the logic again or use a Refresh trigger.
    // For now, let's keep it simple and just re-request.
    const dateStr = this.selectedDate();
    const routeId = this.selectedRouteId();

    this.loading.set(true);
    const dateFormatted = format(new Date(dateStr), 'MM/dd/yyyy');
    const rId = routeId === 'all' ? undefined : routeId;

    this.creditoSvc.getRenovaciones(dateFormatted, rId)
      .subscribe({
        next: report => {
          console.log(report);
          this.report.set(report[0] || null);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.report.set(null);
        }
      });
  }

  async openModal(credito: Credito) {
    await this.utilsSvc.presentModal({
      component: ModalHistorialCreditoComponent,
      cssClass: 'add-update-modal',
      componentProps: { credito }
    })
  }

  async updateModal(credito: Credito) {

    if (this.utilsSvc.getFromLocalStorage('user').rol !== 'ADMIN') {
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
      componentProps: { credito }
    })

    if (success) this.getRenovaciones();
  }

  async deleteCredito(credito: Credito) {

    if (this.utilsSvc.getFromLocalStorage('user').rol !== 'ADMIN') {
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

  async presentAcionSheet(credito: any) {
    console.log(credito)
    await this.utilsSvc.presentActionSheet({
      buttons: [
        {
          text: 'Ver Información',
          handler: () => {
            this.utilsSvc.routerLink('/main/detail-cliente/:idCliente', { idCliente: credito.id })
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

  onChangeDay(e: any) {
    this.selectedDate.set(e.detail.value);
    if (this.modalRenocaciones) this.modalRenocaciones.dismiss();
  }

  handleRutaChange(ruta: Ruta) {
    this.selectedRouteId.set(ruta ? ruta.id : 'all');
  }

}
