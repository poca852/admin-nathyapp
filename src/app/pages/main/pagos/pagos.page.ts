import { Component, OnInit, inject, ViewChild, signal, computed } from '@angular/core';
import { UtilsService } from '../../../services/utils.service';
import { Ruta } from 'src/app/models';
import { PagosService } from '../../../services/pagos.service';
import { IonModal } from '@ionic/angular';
import { EmpresaService } from '../../../services/empresa.service';
import { MovimientoCaja } from 'src/app/models/movimiento-caja.interface';
import { UpdatePagoComponent } from 'src/app/shared/components/update-pago/update-pago.component';

@Component({
  selector: 'app-pagos',
  templateUrl: './pagos.page.html',
  styleUrls: ['./pagos.page.scss'],
})
export class PagosPage implements OnInit {

  private utilsSvc = inject(UtilsService);
  private pagosSvc = inject(PagosService);
  private empresaSvc = inject(EmpresaService);

  public dateSelect = signal<Date>(new Date());
  public currentRuta = signal<Ruta | null>(null);

  public rutas = computed(() => this.empresaSvc.rutas());
  public pagos = computed(() => this.pagosSvc.pagos());

  @ViewChild('modalPagos') modalPagos!: IonModal;

  ngOnInit() {
    // Inicializar si es necesario
  }

  private async fetchPagos() {
    const rutaId = this.currentRuta()?.id;
    const date = this.dateSelect();

    if (!rutaId) return;

    const loading = await this.utilsSvc.loading();
    await loading.present();

    this.pagosSvc.getPagosByRutaAndDate(rutaId, date)
      .subscribe({
        next: (pagos) => {
          this.pagosSvc.setPagos(pagos);
          if (pagos.length === 0) {
            this.utilsSvc.presentToast({
              message: 'No se encontraron resultados',
              duration: 3000,
              color: 'warning',
              icon: 'search-outline'
            });
          }
        },
        error: (err) => {
          this.utilsSvc.presentToast({
            message: 'Error al cargar los pagos',
            duration: 3000,
            color: 'danger',
            icon: 'alert-circle-outline'
          });
        },
        complete: () => {
          loading.dismiss();
        }
      });
  }

  onChangeDay(e: any) {
    const dateValue = Array.isArray(e.detail.value) ? e.detail.value[0] : e.detail.value;
    if (dateValue) {
      const newDate = new Date(dateValue);
      newDate.setHours(0, 0, 0, 0);
      this.dateSelect.set(newDate);
      this.modalPagos.dismiss();
      this.fetchPagos();
    }
  }

  onChangeRuta(ruta: Ruta) {
    this.currentRuta.set(ruta);
    this.fetchPagos();
  }

  private isAdmin(): boolean {
    const user = this.utilsSvc.getFromLocalStorage('user');
    if (user?.rol === 'ADMIN' || user?.rol === 'SUPERADMIN') return true;

    this.utilsSvc.presentToast({
      message: 'No tienes permisos necesarios',
      duration: 3500,
      color: 'danger',
      icon: 'lock-closed-outline'
    });
    return false;
  }

  async presentAcciones(pago: MovimientoCaja) {
    if (!this.isAdmin()) return;

    await this.utilsSvc.presentActionSheet({
      header: 'Acciones del pago',
      buttons: [
        {
          text: 'Actualizar',
          handler: () => {
            setTimeout(() => this.updatePago(pago), 200);
          }
        },
        {
          text: 'Eliminar',
          handler: () => {
            setTimeout(() => this.confirmDeletePago(pago), 200);
          }
        },
        {
          text: 'Cancelar',
          role: 'cancel'
        }
      ]
    });
  }

  async updatePago(pago: MovimientoCaja) {
    const success = await this.utilsSvc.presentModal({
      component: UpdatePagoComponent,
      cssClass: 'add-update-modal',
      componentProps: { pago }
    });

    if (success) {
      this.fetchPagos();
    }
  }

  async confirmDeletePago(pago: MovimientoCaja) {
    await this.utilsSvc.presentAlert({
      header: 'Eliminar pago',
      message: '¿Estás seguro de que quieres eliminar este pago? Esta acción es irreversible.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Sí, eliminar',
          handler: () => {
            this.deletePago(pago);
          }
        }
      ]
    });
  }

  private async deletePago(pago: MovimientoCaja) {
    const movimientoId = pago?.id || (pago as any)?._id;

    if (!movimientoId) {
      await this.utilsSvc.presentToast({
        message: 'No se encontró el identificador del pago',
        duration: 3000,
        color: 'danger',
        icon: 'alert-circle-outline'
      });
      return;
    }

    const loading = await this.utilsSvc.loading();
    await loading.present();

    this.pagosSvc.deletePago(movimientoId).subscribe({
      next: () => {
        loading.dismiss();
        this.utilsSvc.presentToast({
          message: 'Pago eliminado correctamente',
          duration: 2500,
          color: 'success',
          icon: 'checkmark-outline'
        });
        this.fetchPagos();
      },
      error: (err) => {
        loading.dismiss();
        this.utilsSvc.presentToast({
          message: err.error?.message || 'Error al eliminar el pago',
          duration: 3500,
          color: 'danger',
          icon: 'alert-circle-outline'
        });
      }
    });
  }

}

