import {
  Component,
  OnDestroy,
  effect,
  inject,
} from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Announcement } from 'src/app/models';
import { AnnouncementsService } from 'src/app/services/announcements.service';
import { AnnouncementAlertModalComponent } from '../announcement-alert-modal/announcement-alert-modal.component';

/**
 * Host invisible: abre un modal centrado cuando hay avisos pendientes.
 */
@Component({
  selector: 'app-announcement-banner',
  template: '',
  styles: [':host { display: none; }'],
})
export class AnnouncementBannerComponent implements OnDestroy {
  private readonly announcementsSvc = inject(AnnouncementsService);
  private readonly modalCtrl = inject(ModalController);

  private opening = false;
  private open = false;
  private currentId: string | null = null;
  private destroyed = false;

  constructor() {
    effect(() => {
      const banner = this.announcementsSvc.criticalBanner();
      const total = this.announcementsSvc.visibleBanners().length;
      void this.maybeOpen(banner, total);
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
  }

  private async maybeOpen(
    banner: Announcement | null,
    total: number,
  ): Promise<void> {
    if (this.destroyed || this.opening || this.open) return;
    if (!banner?.id) return;
    if (this.currentId === banner.id) return;

    this.opening = true;
    this.currentId = banner.id;

    try {
      const modal = await this.modalCtrl.create({
        component: AnnouncementAlertModalComponent,
        componentProps: {
          announcement: banner,
          queueTotal: total,
          queueIndex: 1,
        },
        cssClass: 'announcement-alert-modal',
        backdropDismiss: !banner.requiresAck && !!banner.dismissible,
        showBackdrop: true,
      });

      this.open = true;
      await modal.present();

      const { data, role } = await modal.onDidDismiss();
      this.open = false;

      // Si cerró por backdrop y era dismissible, marcar dismiss
      if (
        role === 'backdrop' &&
        banner.dismissible &&
        !banner.requiresAck
      ) {
        this.announcementsSvc.dismiss(banner.id).subscribe({ error: () => undefined });
      }

      // Permitir abrir el siguiente aviso de la cola
      this.currentId = null;

      // Si quedó handled y hay más, el effect volverá a disparar
      void data;
    } catch {
      this.open = false;
      this.currentId = null;
    } finally {
      this.opening = false;
    }
  }
}
