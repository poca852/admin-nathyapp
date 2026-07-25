import { Injectable, OnDestroy, inject, isDevMode } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { Subscription, filter } from 'rxjs';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root',
})
export class PwaUpdateService implements OnDestroy {
  private readonly swUpdate = inject(SwUpdate);
  private readonly utilsSvc = inject(UtilsService);
  private readonly subscriptions = new Subscription();
  private promptOpen = false;

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Escucha versiones nuevas del Angular Service Worker y ofrece recargar.
   * No-op en desarrollo (SW deshabilitado).
   */
  init(): void {
    if (isDevMode() || !this.swUpdate.isEnabled) {
      return;
    }

    this.subscriptions.add(
      this.swUpdate.versionUpdates
        .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
        .subscribe(() => {
          void this.promptReload();
        }),
    );

    window.addEventListener('online', () => {
      void this.checkForUpdate();
    });
  }

  async checkForUpdate(): Promise<void> {
    if (!this.swUpdate.isEnabled) {
      return;
    }
    try {
      await this.swUpdate.checkForUpdate();
    } catch {
      // Silenciar: fallos de red o SW aún no listo.
    }
  }

  private async promptReload(): Promise<void> {
    if (this.promptOpen) {
      return;
    }
    this.promptOpen = true;

    const alert = await this.utilsSvc.alertCtrl.create({
      header: 'Nueva versión disponible',
      message: 'Hay una actualización lista. Recarga para usarla.',
      backdropDismiss: false,
      mode: 'md',
      buttons: [
        {
          text: 'Ahora no',
          role: 'cancel',
          handler: () => {
            this.promptOpen = false;
          },
        },
        {
          text: 'Recargar',
          handler: () => {
            void this.activateAndReload();
          },
        },
      ],
    });

    await alert.present();
  }

  private async activateAndReload(): Promise<void> {
    try {
      await this.swUpdate.activateUpdate();
    } finally {
      document.location.reload();
    }
  }
}
