import { Component, inject, Input, signal } from '@angular/core';
import { switchMap, tap } from 'rxjs';
import { UtilsService } from '../../../services/utils.service';
import { ClienteService } from 'src/app/services/cliente.service';
import { Cliente, Credito, FrecuenciaCobro, HistorialCredito, TipoDeCliente } from 'src/app/models';
import { ViewImageComponent } from 'src/app/shared/components/view-image/view-image.component';
import { UpdateClienteComponent } from 'src/app/shared/components/update-cliente/update-cliente.component';
import { ModalHistorialCreditoComponent } from 'src/app/shared/components/modal-historial-credito/modal-historial-credito.component';
import { EmpresaService } from '../../../services/empresa.service';
import { MapModalComponent } from 'src/app/shared/components/map-modal/map-modal.component';
import { ModalHistorialPagosComponent } from 'src/app/shared/components/modal-historial-pagos/modal-historial-pagos.component';
import { CreditosService } from 'src/app/services/creditos.service';
import { calcularCuotasPagadas, calcularGananciaCredito, calcularGananciaCobrada, calcularGananciaPendiente } from 'src/app/shared/utils/interes.util';

@Component({
  selector: 'app-detail-cliente',
  templateUrl: './detail-cliente.page.html',
  styleUrls: ['./detail-cliente.page.scss'],
})
export class DetailClientePage {
  public readonly TipoDeCliente = TipoDeCliente;

  private readonly creditosSvc = inject(CreditosService);
  private readonly utilsSvc = inject(UtilsService);
  private readonly clienteSvc = inject(ClienteService);
  private readonly empresaSvc = inject(EmpresaService);

  readonly loading = signal(false);
  readonly cliente = signal<Cliente | null>(null);
  readonly creditoActual = signal<Credito | null>(null);
  readonly historialCreditos = signal<HistorialCredito[]>([]);

  @Input() idCliente!: string;

  ionViewWillEnter(): void {
    this.getCliente();
  }

  ionViewWillLeave(): void {
    this.clienteSvc.removeCurrentCliente();
  }

  llamarCliente(): void {
    const cliente = this.clienteSvc.currentCliente();
    if (!cliente) return;

    window.open(`tel:${cliente.telefono}`, '_system');
  }

  async editCliente(): Promise<void> {
    if (this.utilsSvc.getFromLocalStorage('user').rol !== 'ADMIN') {
      this.utilsSvc.presentToast({
        message: 'Usted no tiene los permisos necesarios',
        duration: 3500,
        color: 'danger',
      });
      return;
    }

    const success = await this.utilsSvc.presentModal({
      component: UpdateClienteComponent,
      cssClass: 'add-update-modal',
      componentProps: { cliente: this.clienteSvc.currentCliente() },
    });

    if (success) {
      this.loading.set(true);
      this.clienteSvc.getClientesByRuta(this.empresaSvc.ruta().id).subscribe({
        next: (clientes) => {
          this.clienteSvc.setClientes(clientes);
          const currentCliente = clientes.find(
            (c) => c._id === this.clienteSvc.currentCliente()?._id
          );
          if (currentCliente) {
            this.clienteSvc.setCurrentCliente(currentCliente);
          }
          this.loading.set(false);
        },
      });
    }
  }

  async openHistorialCredito(credito: Credito): Promise<void> {
    await this.utilsSvc.presentModal({
      component: ModalHistorialCreditoComponent,
      cssClass: 'add-update-modal',
      componentProps: { credito },
    });
  }

  async viewImage(url: string): Promise<void> {
    await this.utilsSvc.presentModal({
      component: ViewImageComponent,
      cssClass: 'add-update-modal',
      componentProps: { url },
    });
  }

  async viewMap(): Promise<void> {

    if (!this.cliente() || this.cliente()?.ubication.length === 0) {
      return this.utilsSvc.presentAlert({
        header: 'Información',
        message: 'Este cliente aún no tiene la ubicación',
        buttons: ['OK'],
      });
    }

    await this.utilsSvc.presentModal({
      component: MapModalComponent,
      cssClass: 'map',
      componentProps: { lngLat: this.cliente()?.ubication },
    });
  }

  gananciaCredito(credito: Credito): number {
    return calcularGananciaCredito(credito.total_pagar, credito.valor_credito);
  }

  gananciaCobrada(credito: Credito): number {
    const ganancia = this.gananciaCredito(credito);
    return calcularGananciaCobrada(ganancia, credito.abonos, credito.total_pagar);
  }

  gananciaPendiente(credito: Credito): number {
    return calcularGananciaPendiente(this.gananciaCredito(credito), this.gananciaCobrada(credito));
  }

  cuotasPagadas(credito: Credito): number {
    return calcularCuotasPagadas(credito.abonos, credito.valor_cuota, credito.total_cuotas);
  }

  frecuenciaCobroLabel(frecuencia: FrecuenciaCobro | string): string {
    return frecuencia === FrecuenciaCobro.DIARIO ? 'Diario' : 'Semanal';
  }

  async openHistorialPagos(credito: Credito): Promise<void> {
    await this.utilsSvc.presentModal({
      component: ModalHistorialPagosComponent,
      cssClass: 'add-update-modal',
      componentProps: {
        creditoId: credito.id,
        rutaId: credito.ruta
      },
    });
  }

  private getCliente(): void {
    this.loading.set(true);

    this.clienteSvc
      .getClienteById(this.idCliente)
      .pipe(
        tap((resp) => {
          this.cliente.set(resp.cliente);
          this.creditoActual.set(resp.credito);
        }),
        switchMap(() => this.creditosSvc.getHistorialCreditos(this.idCliente))
      )
      .subscribe({
        next: (historial) => {
          this.historialCreditos.set(historial);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }
}
