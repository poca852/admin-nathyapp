import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { CajaMovimiento } from 'src/app/models/caja-movimiento.interface';
import { HistorialCredito } from 'src/app/models';
import { CreditosService } from 'src/app/services/creditos.service';
import { UtilsService } from 'src/app/services/utils.service';
import { MapModalComponent } from '../map-modal/map-modal.component';

@Component({
  selector: 'app-modal-historial-credito',
  templateUrl: './modal-historial-credito.component.html',
  styleUrls: ['./modal-historial-credito.component.scss'],
})
export class ModalHistorialCreditoComponent implements OnInit {
  private readonly creditosSvc = inject(CreditosService);
  private readonly utilsSvc = inject(UtilsService);

  /** Resumen del crédito cerrado (desde GET /credito/historial). */
  @Input() credito!: HistorialCredito;

  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly pagos = signal<CajaMovimiento[]>([]);

  readonly totalPagado = computed(() =>
    this.pagos().reduce((sum, p) => sum + Number(p.monto || 0), 0),
  );

  readonly totalConMonto = computed(
    () => this.pagos().filter((p) => Number(p.monto) > 0).length,
  );

  ngOnInit(): void {
    this.loadPagos();
  }

  creditoId(): string {
    return this.credito?.id || this.credito?._id || '';
  }

  frecuenciaLabel(): string {
    const f = (this.credito?.frecuencia_cobro || '').toLowerCase();
    return f === 'diario' ? 'Diario' : f === 'semanal' ? 'Semanal' : this.credito?.frecuencia_cobro || '—';
  }

  stateLabel(): string {
    const raw = this.credito?.state;
    switch (raw) {
      case 'BUENO':
        return 'Bueno';
      case 'REGULAR':
        return 'Regular';
      case 'MALO':
        return 'Malo';
    }

    // Créditos antiguos pueden no tener state persistido: inferir por días
    const dias = Number(this.credito?.dias_tardados_en_pagar);
    if (Number.isFinite(dias)) {
      if (dias <= 3) return 'Bueno';
      if (dias < 7) return 'Regular';
      return 'Malo';
    }

    return 'Sin dato';
  }

  async verUbicacion(pago: CajaMovimiento): Promise<void> {
    if (!pago.ubication || pago.ubication.length < 2) {
      this.utilsSvc.presentToast({
        message: 'Este pago no tiene ubicación registrada',
        color: 'warning',
        duration: 2200,
      });
      return;
    }

    await this.utilsSvc.presentModal({
      component: MapModalComponent,
      cssClass: 'map',
      componentProps: { lngLat: pago.ubication },
    });
  }

  retry(): void {
    this.loadPagos();
  }

  dismiss(): void {
    this.utilsSvc.dismissModal();
  }

  private loadPagos(): void {
    const creditoId = this.creditoId();
    const rutaId = this.credito?.ruta;

    if (!creditoId || !rutaId) {
      this.loadError.set(true);
      this.utilsSvc.presentToast({
        message: 'No se pudo identificar el crédito cerrado',
        duration: 3000,
        color: 'danger',
      });
      return;
    }

    this.loading.set(true);
    this.loadError.set(false);

    this.creditosSvc.getHistorialPagos(rutaId, creditoId).subscribe({
      next: (pagos) => {
        this.pagos.set(pagos ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.pagos.set([]);
        this.loading.set(false);
        this.loadError.set(true);
        this.utilsSvc.presentToast({
          message: 'Error al cargar los pagos del crédito',
          duration: 3000,
          color: 'danger',
          icon: 'alert-circle-outline',
        });
      },
    });
  }
}
