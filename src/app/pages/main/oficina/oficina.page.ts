import { Component, ViewChild, signal, inject, computed } from '@angular/core';
import { UtilsService } from '../../../services/utils.service';
import { EmpresaService } from '../../../services/empresa.service';
import { OficinaService } from '../../../services/oficina.service';
import { Ruta } from 'src/app/models';
import { SubTipo } from 'src/app/models/sub-tipo.enum';
import { AddUpdateMovimientoComponent } from 'src/app/shared/components/add-update-movimiento/add-update-movimiento.component';
import { IonModal } from '@ionic/angular';
import { ResumenOficinaResponse, MovimientoResumen } from './interfaces/resumen-oficina.interface';

interface MovimientoOficina {
  id: string;
  subTipo: SubTipo;
  concepto?: string;
  valor: number;
  fecha: Date | string;
  comentario?: string;
  categoriaGasto?: string;
}

@Component({
  selector: 'app-oficina',
  templateUrl: './oficina.page.html',
  styleUrls: ['./oficina.page.scss'],
})
export class OficinaPage {

  private readonly utilsSvc = inject(UtilsService);
  private readonly empresaSvc = inject(EmpresaService);
  private readonly oficinaSvc = inject(OficinaService);

  @ViewChild('modalOficina') modalOficina!: IonModal;

  public SubTipo = SubTipo;
  public readonly dateSelect = signal<Date>(new Date());
  public readonly currentRuta = signal<Ruta | null>(null);

  public readonly resumen = signal<ResumenOficinaResponse | null>(null);
  public readonly movimientos = signal<MovimientoOficina[]>([]);
  public readonly rutas = computed(() => this.empresaSvc.rutas());

  public readonly totalGastos = computed(() => this.resumen()?.gastos?.total || 0);
  public readonly totalInversiones = computed(() => this.resumen()?.inversiones?.total || 0);
  public readonly totalRetiros = computed(() => this.resumen()?.retiros?.total || 0);

  onChangeDay(e: CustomEvent): void {
    const dateValue = Array.isArray(e.detail.value) ? e.detail.value[0] : e.detail.value;
    if (dateValue) {
      const newDate = new Date(dateValue);
      newDate.setHours(0, 0, 0, 0);
      this.dateSelect.set(newDate);
      this.modalOficina.dismiss();
      this.fetchMovimientos();
    }
  }

  onChangeRuta(ruta: Ruta): void {
    this.currentRuta.set(ruta);
    this.fetchMovimientos();
  }

  getSubTipoLabel(subTipo: SubTipo): string {
    const labels: Record<string, string> = {
      [SubTipo.GASTO]: 'Gasto',
      [SubTipo.INVERSION]: 'Inversión',
      [SubTipo.RETIRO]: 'Retiro',
    };
    return labels[subTipo] ?? subTipo;
  }

  async addOrUpdateMovimiento(type: SubTipo, movimiento?: MovimientoOficina) {
    const success = await this.utilsSvc.presentModal({
      component: AddUpdateMovimientoComponent,
      componentProps: {
        movimiento,
        type,
        ruta: this.currentRuta(),
        fechaSeleccionada: this.dateSelect()
      },
      cssClass: 'add-update-modal'
    });

    if (success) {
      this.fetchMovimientos();
    }
  }

  private async fetchMovimientos(): Promise<void> {
    const ruta = this.currentRuta();
    if (!ruta) return;

    const fecha = this.formatDate(this.dateSelect());
    const loading = await this.utilsSvc.loading();
    await loading.present();

    this.oficinaSvc.getResumen(ruta.id, fecha).subscribe({
      next: (res) => {
        this.resumen.set(res);

        const movimientos: MovimientoOficina[] = [
          ...this.mapToMovimientoOficina(res.gastos?.movimientos || [], SubTipo.GASTO),
          ...this.mapToMovimientoOficina(res.inversiones?.movimientos || [], SubTipo.INVERSION),
          ...this.mapToMovimientoOficina(res.retiros?.movimientos || [], SubTipo.RETIRO),
        ];

        // Ordenar del más reciente al más antiguo
        movimientos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

        this.movimientos.set(movimientos);

        if (movimientos.length === 0) {
          this.utilsSvc.presentToast({
            message: 'No se encontraron movimientos',
            duration: 3000,
            color: 'warning',
            icon: 'search-outline',
          });
        }
      },
      error: () => {
        this.utilsSvc.presentToast({
          message: 'Error al cargar los movimientos',
          duration: 3000,
          color: 'danger',
          icon: 'alert-circle-outline',
        });
      },
      complete: () => loading.dismiss(),
    });
  }

  private mapToMovimientoOficina(movs: MovimientoResumen[], subTipo: SubTipo): MovimientoOficina[] {
    return movs.map(m => ({
      id: m.id,
      subTipo,
      concepto: m.concepto,
      valor: m.monto,
      fecha: m.fecha,
      comentario: m.comentario,
      categoriaGasto: m.categoriaGasto
    }));
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
