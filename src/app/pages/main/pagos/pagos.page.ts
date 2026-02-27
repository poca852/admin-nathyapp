import { Component, OnInit, inject, ViewChild, signal, computed } from '@angular/core';
import { UtilsService } from '../../../services/utils.service';
import { Ruta } from 'src/app/models';
import { PagosService } from '../../../services/pagos.service';
import { IonModal } from '@ionic/angular';
import { EmpresaService } from '../../../services/empresa.service';
import { MovimientoCaja } from 'src/app/models/movimiento-caja.interface';

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

  async updatePago(pago: MovimientoCaja) {
    const user = this.utilsSvc.getFromLocalStorage('user');
    if (user?.rol !== 'ADMIN') {
      this.utilsSvc.presentToast({
        message: 'No tienes permisos necesarios',
        duration: 3500,
        color: 'danger',
        icon: 'lock-closed-outline'
      });
      return;
    }

    // TODO: Implementar actualización de pago cuando esté listo el componente
    this.utilsSvc.presentToast({
      message: 'Funcionalidad de edición próximamente disponible',
      duration: 2000,
      color: 'secondary'
    });
  }

}

