import { Component, inject } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Announcement } from 'src/app/models';
import { AnnouncementsService } from 'src/app/services/announcements.service';
import { UtilsService } from 'src/app/services/utils.service';
import { AnnouncementAlertModalComponent } from '../announcement-alert-modal/announcement-alert-modal.component';

@Component({
  selector: 'app-announcements-inbox-modal',
  templateUrl: './announcements-inbox-modal.component.html',
  styleUrls: ['./announcements-inbox-modal.component.scss'],
})
export class AnnouncementsInboxModalComponent {
  readonly announcementsSvc = inject(AnnouncementsService);
  private readonly modalCtrl = inject(ModalController);
  private readonly utilsSvc = inject(UtilsService);

  close(): void {
    this.modalCtrl.dismiss();
  }

  severityClass(severity: Announcement['severity']): string {
    return severity || 'info';
  }

  typeLabel(type: Announcement['type']): string {
    switch (type) {
      case 'PAYMENT_REMINDER':
        return 'Pago';
      case 'UPDATE':
        return 'Update';
      case 'WARNING':
        return 'Alerta';
      default:
        return 'Info';
    }
  }

  iconName(severity: Announcement['severity']): string {
    if (severity === 'critical') return 'alert-circle';
    if (severity === 'warning') return 'warning';
    return 'megaphone';
  }

  async openDetail(item: Announcement): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: AnnouncementAlertModalComponent,
      componentProps: {
        announcement: item,
        queueTotal: 1,
        queueIndex: 1,
      },
      cssClass: 'announcement-alert-modal',
      backdropDismiss: !item.requiresAck && !!item.dismissible,
    });
    await modal.present();
  }

  dismiss(item: Announcement, event?: Event): void {
    event?.stopPropagation();
    if (!item.dismissible) return;
    this.announcementsSvc.dismiss(item.id).subscribe({
      error: (err) => {
        this.utilsSvc.presentToast({
          message: err.error?.message || 'No se pudo cerrar el aviso',
          color: 'danger',
          duration: 3000,
        });
      },
    });
  }

  trackById(_: number, a: Announcement): string {
    return a.id;
  }
}
