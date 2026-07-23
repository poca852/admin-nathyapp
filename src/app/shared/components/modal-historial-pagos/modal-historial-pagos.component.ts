import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { CajaMovimiento } from 'src/app/models/caja-movimiento.interface';
import { CreditosService } from 'src/app/services/creditos.service';
import { UtilsService } from 'src/app/services/utils.service';
import { MapModalComponent } from '../map-modal/map-modal.component';

@Component({
  selector: 'app-modal-historial-pagos',
  templateUrl: './modal-historial-pagos.component.html',
  styleUrls: ['./modal-historial-pagos.component.scss'],
})
export class ModalHistorialPagosComponent implements OnInit {

  private readonly creditosSvc = inject(CreditosService);
  private readonly utilsSvc = inject(UtilsService);

  @Input() creditoId!: string;
  @Input() rutaId!: string;

  readonly loading = signal(false);
  readonly pagos = signal<CajaMovimiento[]>([]);

  ngOnInit(): void {
    this.loadPagos();
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
      cssClass: 'add-update-modal',
      componentProps: {
        lngLat: pago.ubication,
      },
    });
  }

  private loadPagos(): void {
    this.loading.set(true);
    this.creditosSvc.getHistorialPagos(this.rutaId, this.creditoId).subscribe({
      next: (pagos) => {
        this.pagos.set(pagos);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
