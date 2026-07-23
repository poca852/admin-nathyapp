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
import { AplicarPerdonarMoraComponent, MoraModalMode } from 'src/app/shared/components/aplicar-perdonar-mora/aplicar-perdonar-mora.component';

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
    const cliente = this.cliente() || this.clienteSvc.currentCliente();
    if (!cliente?.telefono) return;

    window.open(`tel:${cliente.telefono}`, '_system');
  }

  async editCliente(): Promise<void> {
    const user = this.utilsSvc.getFromLocalStorage('user') as { rol?: string } | null;
    if (!user || (user.rol !== 'ADMIN' && user.rol !== 'SUPERADMIN')) {
      this.utilsSvc.presentToast({
        message: 'Usted no tiene los permisos necesarios',
        duration: 3500,
        color: 'danger',
      });
      return;
    }

    const clienteActual = this.cliente() || this.clienteSvc.currentCliente();
    if (!clienteActual) {
      this.utilsSvc.presentToast({
        message: 'No se pudo cargar el cliente para editar',
        duration: 3000,
        color: 'warning',
      });
      return;
    }

    const success = await this.utilsSvc.presentModal({
      component: UpdateClienteComponent,
      cssClass: 'add-update-modal',
      componentProps: { cliente: clienteActual },
    });

    if (success) {
      this.getCliente();

      const rutaId = this.empresaSvc.ruta()?.id;
      if (rutaId) {
        this.clienteSvc.getClientesByRuta(rutaId).subscribe({
          next: (clientes) => this.clienteSvc.setClientes(clientes),
        });
      }
    }
  }

  async openHistorialCredito(credito: HistorialCredito): Promise<void> {
    if (!credito?.id && !(credito as any)?._id) {
      this.utilsSvc.presentToast({
        message: 'Este crédito no tiene identificador para cargar pagos',
        duration: 3000,
        color: 'warning',
      });
      return;
    }

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
    const ubication = this.cliente()?.ubication;

    if (!ubication || ubication.length < 2) {
      return this.utilsSvc.presentAlert({
        header: 'Información',
        message: 'Este cliente aún no tiene la ubicación',
        buttons: ['OK'],
      });
    }

    const [a, b] = ubication.map(Number);
    const latLooksInvalid =
      !Number.isFinite(a) ||
      !Number.isFinite(b) ||
      (Math.abs(b) > 90 && Math.abs(a) > 90);

    // Aviso temprano si ambos ejes están fuera de rango latitud (dato claramente corrupto)
    if (latLooksInvalid && Math.abs(a) > 90 && Math.abs(b) > 90) {
      return this.utilsSvc.presentAlert({
        header: 'Ubicación inválida',
        message:
          'Las coordenadas guardadas no son válidas. Solicita al cobrador un nuevo cambio de ubicación para este cliente.',
        buttons: ['OK'],
      });
    }

    await this.utilsSvc.presentModal({
      component: MapModalComponent,
      cssClass: 'map',
      componentProps: { lngLat: ubication },
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

  async openMoraModal(credito: Credito, mode: MoraModalMode): Promise<void> {
    if (!credito.cobraMora) {
      this.utilsSvc.presentToast({
        message: 'La empresa no tiene habilitado el cobro de mora',
        duration: 3000,
        color: 'warning',
      });
      return;
    }

    const success = await this.utilsSvc.presentModal({
      component: AplicarPerdonarMoraComponent,
      cssClass: 'add-update-modal',
      componentProps: { credito, mode },
    });

    if (success) {
      this.getCliente();
    }
  }

  private getCliente(): void {
    this.loading.set(true);

    this.clienteSvc
      .getClienteById(this.idCliente)
      .pipe(
        tap((resp) => {
          this.cliente.set(resp.cliente);
          this.creditoActual.set(resp.credito);
          if (resp.cliente) {
            this.clienteSvc.setCurrentCliente(resp.cliente);
          }
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
