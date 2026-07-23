import { Component, ViewChild, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonModal } from '@ionic/angular';
import { finalize } from 'rxjs/operators';

import { UtilsService } from '../../../services/utils.service';
import { Ruta } from 'src/app/models';
import { PagosService } from '../../../services/pagos.service';
import { EmpresaService } from '../../../services/empresa.service';
import { MovimientoCaja } from 'src/app/models/movimiento-caja.interface';
import { UpdatePagoComponent } from 'src/app/shared/components/update-pago/update-pago.component';

@Component({
  selector: 'app-pagos',
  templateUrl: './pagos.page.html',
  styleUrls: ['./pagos.page.scss'],
})
export class PagosPage {
  private readonly utilsSvc = inject(UtilsService);
  private readonly pagosSvc = inject(PagosService);
  private readonly empresaSvc = inject(EmpresaService);
  private readonly route = inject(ActivatedRoute);

  readonly dateSelect = signal<Date>(this.startOfToday());
  readonly currentRuta = signal<Ruta | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly searched = signal(false);

  readonly rutas = computed(() => this.empresaSvc.rutas());
  readonly pagos = computed(() => this.pagosSvc.pagos());

  readonly totalCobrado = computed(() =>
    this.pagos().reduce((sum, p) => sum + Number(p.monto || 0), 0),
  );

  readonly totalConMonto = computed(
    () => this.pagos().filter((p) => Number(p.monto) > 0).length,
  );

  readonly totalSinPago = computed(
    () => this.pagos().filter((p) => Number(p.monto) === 0).length,
  );

  @ViewChild('modalPagos') modalPagos!: IonModal;

  ionViewWillEnter(): void {
    this.syncFromNavigation();
    if (this.currentRuta()?.id) {
      this.fetchPagos();
    }
  }

  ionViewWillLeave(): void {
    // Evita flash de datos de otra ruta/fecha al volver a entrar.
    this.pagosSvc.setPagos([]);
    this.searched.set(false);
    this.loadError.set(false);
    this.loading.set(false);
  }

  private startOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private syncFromNavigation(): void {
    const preselected = this.empresaSvc.ruta();
    if (preselected?.id) {
      this.currentRuta.set(preselected);
    }

    const fechaParam = this.route.snapshot.queryParamMap.get('fecha');
    if (fechaParam) {
      const parsed = new Date(fechaParam);
      if (!Number.isNaN(parsed.getTime())) {
        parsed.setHours(0, 0, 0, 0);
        this.dateSelect.set(parsed);
      }
    }
  }

  private async fetchPagos(event?: any): Promise<void> {
    const rutaId = this.currentRuta()?.id;
    const date = this.dateSelect();

    if (!rutaId) {
      event?.target?.complete?.();
      return;
    }

    this.loading.set(true);
    this.loadError.set(false);
    this.searched.set(true);

    this.pagosSvc
      .getPagosByRutaAndDate(rutaId, date)
      .pipe(
        finalize(() => {
          this.loading.set(false);
          event?.target?.complete?.();
        }),
      )
      .subscribe({
        next: (pagos) => {
          this.pagosSvc.setPagos(pagos ?? []);
        },
        error: () => {
          this.pagosSvc.setPagos([]);
          this.loadError.set(true);
          this.utilsSvc.presentToast({
            message: 'Error al cargar los pagos',
            duration: 3000,
            color: 'danger',
            icon: 'alert-circle-outline',
          });
        },
      });
  }

  handleRefresh(event?: any): void {
    this.fetchPagos(event);
  }

  onChangeDay(e: any): void {
    const dateValue = Array.isArray(e.detail.value)
      ? e.detail.value[0]
      : e.detail.value;
    if (dateValue) {
      const newDate = new Date(dateValue);
      newDate.setHours(0, 0, 0, 0);
      this.dateSelect.set(newDate);
      this.modalPagos.dismiss();
      this.fetchPagos();
    }
  }

  onChangeRuta(ruta: Ruta): void {
    this.currentRuta.set(ruta);
    this.empresaSvc.setRuta(ruta);
    this.fetchPagos();
  }

  private isAdmin(): boolean {
    const user = this.utilsSvc.getFromLocalStorage('user');
    if (user?.rol === 'ADMIN' || user?.rol === 'SUPERADMIN') return true;

    this.utilsSvc.presentToast({
      message: 'No tienes permisos necesarios',
      duration: 3500,
      color: 'danger',
      icon: 'lock-closed-outline',
    });
    return false;
  }

  async presentAcciones(pago: MovimientoCaja): Promise<void> {
    if (!this.isAdmin()) return;

    await this.utilsSvc.presentActionSheet({
      header: 'Acciones del pago',
      buttons: [
        {
          text: 'Actualizar',
          handler: () => {
            setTimeout(() => this.updatePago(pago), 200);
          },
        },
        {
          text: 'Eliminar',
          handler: () => {
            setTimeout(() => this.confirmDeletePago(pago), 200);
          },
        },
        {
          text: 'Cancelar',
          role: 'cancel',
        },
      ],
    });
  }

  async updatePago(pago: MovimientoCaja): Promise<void> {
    const success = await this.utilsSvc.presentModal({
      component: UpdatePagoComponent,
      cssClass: 'add-update-modal',
      componentProps: { pago },
    });

    if (success) {
      this.fetchPagos();
    }
  }

  async confirmDeletePago(pago: MovimientoCaja): Promise<void> {
    await this.utilsSvc.presentAlert({
      header: 'Eliminar pago',
      message: '¿Estás seguro de que quieres eliminar este pago? Esta acción es irreversible.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sí, eliminar',
          handler: () => this.deletePago(pago),
        },
      ],
    });
  }

  private async deletePago(pago: MovimientoCaja): Promise<void> {
    const movimientoId = pago?.id || (pago as any)?._id;

    if (!movimientoId) {
      await this.utilsSvc.presentToast({
        message: 'No se encontró el identificador del pago',
        duration: 3000,
        color: 'danger',
        icon: 'alert-circle-outline',
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
          icon: 'checkmark-outline',
        });
        this.fetchPagos();
      },
      error: (err) => {
        loading.dismiss();
        this.utilsSvc.presentToast({
          message: err.error?.message || 'Error al eliminar el pago',
          duration: 3500,
          color: 'danger',
          icon: 'alert-circle-outline',
        });
      },
    });
  }
}
