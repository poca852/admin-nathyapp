import { ChangeDetectorRef, Component, OnDestroy, computed } from '@angular/core';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { RutaService } from '../../../services/ruta.service';
import { UtilsService } from '../../../services/utils.service';
import { Ruta } from '../../../models';
import { EmpresaService } from 'src/app/services/empresa.service';
import { environment } from 'src/environments/environment';
import { UpdateNotesModalComponent } from 'src/app/shared/components/update-notes-modal/update-notes-modal.component';
import {
  CajaCloseEvent,
  CajaLockEvent,
  WsService,
} from 'src/app/services/ws.service';
import { formatMoney, resolveRutaCurrency } from 'src/app/helpers/money.helpers';

const WS_ACTION_TIMEOUT_MS = 10_000;

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnDestroy {
  loading = true;
  loadError = false;
  /** Ruta id con acción en curso (HTTP o WS). */
  actionPendingId: string | null = null;

  readonly resumen = computed(() => {
    const rutas = this.empresaSvc.rutas() ?? [];
    let abiertas = 0;
    let cerradas = 0;
    let bloqueadas = 0;
    for (const r of rutas) {
      if (r.status) abiertas++;
      else cerradas++;
      if (r.isLocked) bloqueadas++;
    }
    return {
      total: rutas.length,
      abiertas,
      cerradas,
      bloqueadas,
    };
  });

  private subs = new Subscription();
  private pendingTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private rutaSvc: RutaService,
    public utilsSvc: UtilsService,
    public empresaSvc: EmpresaService,
    private ws: WsService,
    private cdr: ChangeDetectorRef,
  ) {}

  ionViewWillEnter(): void {
    this.checkUpdateNotes();
    this.bindWsFeedback();
    this.loadRutas();
  }

  ionViewWillLeave(): void {
    this.clearPending();
    this.subs.unsubscribe();
    this.subs = new Subscription();
  }

  ngOnDestroy(): void {
    this.clearPending();
    this.subs.unsubscribe();
  }

  private bindWsFeedback(): void {
    this.subs.unsubscribe();
    this.subs = new Subscription();

    this.subs.add(
      this.ws.onCloseCaja().subscribe((event: CajaCloseEvent) => {
        if (event?.ruta && this.matchesPending(event.ruta)) {
          this.clearPending();
        }
      }),
    );
    this.subs.add(
      this.ws.onBlockCaja().subscribe((event: CajaLockEvent) => {
        if (event?.ruta && this.matchesPending(event.ruta)) {
          this.clearPending();
        }
      }),
    );
    this.subs.add(
      this.ws.onUnblockCaja().subscribe((event: CajaLockEvent) => {
        if (event?.ruta && this.matchesPending(event.ruta)) {
          this.clearPending();
        }
      }),
    );
  }

  private matchesPending(rutaId: string): boolean {
    return this.actionPendingId === rutaId;
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
    const isRefresh = !!event;
    if (!isRefresh) {
      this.loading = true;
    }
    this.loadError = false;

    this.rutaSvc
      .getRutasByEmpresa()
      .pipe(
        finalize(() => {
          this.loading = false;
          if (event) {
            event.target.complete();
          }
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: ({ rutas }) => {
          this.empresaSvc.setRutas(rutas);
          this.loadError = false;
        },
        error: () => {
          this.loadError = true;
          this.utilsSvc.presentToast({
            message: 'Error al obtener las rutas',
            duration: 2000,
            position: 'bottom',
            color: 'danger',
          });
        },
      });
  }

  trackByRutaId(_index: number, ruta: Ruta): string {
    return ruta.id;
  }

  isPending(ruta: Ruta): boolean {
    return (
      this.actionPendingId === ruta.id ||
      (!!ruta._id && this.actionPendingId === ruta._id)
    );
  }

  formatCartera(ruta: Ruta): string | null {
    const value = Number(ruta.cartera);
    if (!Number.isFinite(value)) return null;
    return formatMoney(value, resolveRutaCurrency(ruta));
  }

  formatRutaMoment(ruta: Ruta): string | null {
    const raw = ruta.status ? ruta.ultima_apertura : ruta.ultimo_cierre;
    if (!raw) return null;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleString('es', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  momentLabel(ruta: Ruta): string {
    return ruta.status ? 'Abierta desde' : 'Cerrada desde';
  }

  async confirmToggle(ruta: Ruta): Promise<void> {
    if (this.actionPendingId) return;

    const nombre = ruta.nombre || 'esta ruta';
    const header = ruta.status ? 'Cerrar ruta' : 'Abrir ruta';
    const message = ruta.status
      ? `Se cerrará la caja del día de ${nombre}. Los cobradores no podrán seguir operando hasta que se vuelva a abrir.`
      : `Se abrirá la caja del día de ${nombre} para iniciar operaciones.`;

    await this.utilsSvc.presentAlert({
      header,
      message,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: ruta.status ? 'Cerrar' : 'Abrir',
          handler: () => this.toggleRutaStatus(ruta),
        },
      ],
    });
  }

  async toggleRutaStatus(ruta: Ruta): Promise<void> {
    if (this.actionPendingId) return;

    if (ruta.status) {
      this.beginPending(ruta.id);
      this.ws.closeCaja(ruta.id);
      return;
    }

    this.beginPending(ruta.id);
    this.rutaSvc.newCaja(ruta.id).subscribe({
      next: () => {
        this.clearPending();
        this.loadRutas();
      },
      error: () => {
        this.clearPending();
        this.utilsSvc.presentToast({
          message: 'Error al abrir la ruta',
          duration: 2000,
          position: 'bottom',
          color: 'danger',
        });
      },
    });
  }

  async confirmToggleLock(ruta: Ruta): Promise<void> {
    if (this.actionPendingId) return;

    const willLock = !ruta.isLocked;
    const nombre = ruta.nombre || 'esta ruta';
    const header = willLock ? 'Bloquear caja' : 'Desbloquear caja';
    const message = willLock
      ? `Se bloqueará la caja de ${nombre}. El cobrador no podrá registrar movimientos hasta desbloquearla.`
      : `Se desbloqueará la caja de ${nombre} para continuar operaciones.`;

    await this.utilsSvc.presentAlert({
      header,
      message,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: willLock ? 'Bloquear' : 'Desbloquear',
          handler: () => this.toggleRutaLock(ruta),
        },
      ],
    });
  }

  toggleRutaLock(ruta: Ruta): void {
    if (this.actionPendingId) return;
    this.beginPending(ruta.id);
    if (ruta.isLocked) {
      this.ws.unblockCaja(ruta.id);
    } else {
      this.ws.blockCaja(ruta.id);
    }
  }

  private beginPending(rutaId: string): void {
    this.clearPendingTimerOnly();
    this.actionPendingId = rutaId;
    this.cdr.markForCheck();
    this.pendingTimer = setTimeout(() => {
      if (this.actionPendingId !== rutaId) return;
      this.actionPendingId = null;
      this.pendingTimer = null;
      this.cdr.markForCheck();
      this.utilsSvc.presentToast({
        message: 'No se pudo confirmar la acción. Desliza para actualizar.',
        duration: 3000,
        position: 'bottom',
        color: 'warning',
      });
    }, WS_ACTION_TIMEOUT_MS);
  }

  private clearPending(): void {
    this.actionPendingId = null;
    this.clearPendingTimerOnly();
    this.cdr.markForCheck();
  }

  private clearPendingTimerOnly(): void {
    if (this.pendingTimer != null) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = null;
    }
  }
}
