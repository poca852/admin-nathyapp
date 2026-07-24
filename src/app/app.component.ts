import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { NotificacionesService } from './services/notificaciones.service';
import { Subscription } from 'rxjs';
import { EmpresaService } from './services/empresa.service';
import { CajaCloseEvent, CajaLockEvent, WsService } from './services/ws.service';
import { UtilsService } from './services/utils.service';
import { OfflineService } from './services/offline.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {

  private subscriptions = new Subscription();
  /** Bootstrap temprano: registra listeners online/offline al arrancar. */
  private readonly offlineSvc = inject(OfflineService);

  constructor(
    private notificacionesSvc: NotificacionesService,
    private empresaSvc: EmpresaService,
    private ws: WsService,
    private utilsSvc: UtilsService,
  ) {}

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  ngOnInit(): void {
    void this.offlineSvc.isOffline();

    this.subscriptions.add(
      this.notificacionesSvc.logOut$.subscribe(() => {
        this.empresaSvc.removeRuta();
        this.empresaSvc.removeRutas();
      })
    );

    this.listenCajaEvents();
  }

  private listenCajaEvents(): void {
    this.subscriptions.add(
      this.ws.onBlockCaja().subscribe((event: CajaLockEvent) => {
        if (!event?.ruta || !event.isLocked) return;
        this.empresaSvc.updateRutaLock(event.ruta, true);
        this.utilsSvc.presentToast({
          message: 'Ruta bloqueada',
          duration: 2000,
          position: 'bottom',
          color: 'warning',
        });
      })
    );

    this.subscriptions.add(
      this.ws.onUnblockCaja().subscribe((event: CajaLockEvent) => {
        if (!event?.ruta || event.isLocked) return;
        this.empresaSvc.updateRutaLock(event.ruta, false);
        this.utilsSvc.presentToast({
          message: 'Ruta desbloqueada',
          duration: 2000,
          position: 'bottom',
          color: 'success',
        });
      })
    );

    this.subscriptions.add(
      this.ws.onCloseCaja().subscribe((event: CajaCloseEvent) => {
        if (!event?.ruta) return;
        this.empresaSvc.updateRutaStatus(event.ruta, false);
        this.utilsSvc.presentToast({
          message: 'Ruta cerrada correctamente',
          duration: 2000,
          position: 'bottom',
          color: 'success',
        });
      })
    );
  }
}
