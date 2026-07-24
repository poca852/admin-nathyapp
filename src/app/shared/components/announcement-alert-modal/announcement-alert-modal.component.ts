import { Component, Input, OnInit, inject } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { Announcement } from 'src/app/models';
import { AnnouncementsService } from 'src/app/services/announcements.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-announcement-alert-modal',
  templateUrl: './announcement-alert-modal.component.html',
  styleUrls: ['./announcement-alert-modal.component.scss'],
})
export class AnnouncementAlertModalComponent implements OnInit {
  @Input({ required: true }) announcement!: Announcement;
  @Input() queueTotal = 1;
  @Input() queueIndex = 1;

  private readonly modalCtrl = inject(ModalController);
  private readonly announcementsSvc = inject(AnnouncementsService);
  private readonly utilsSvc = inject(UtilsService);

  busy = false;

  ngOnInit(): void {
    const id = this.announcement?.id;
    if (!id) return;
    this.announcementsSvc.markRead(id).subscribe({ error: () => undefined });
  }

  get severity(): Announcement['severity'] {
    return this.announcement?.severity || 'info';
  }

  get iconName(): string {
    switch (this.severity) {
      case 'critical':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      default:
        return 'megaphone';
    }
  }

  get typeLabel(): string {
    switch (this.announcement?.type) {
      case 'PAYMENT_REMINDER':
        return 'Recordatorio de pago';
      case 'UPDATE':
        return 'Actualización';
      case 'WARNING':
        return 'Advertencia';
      default:
        return 'Aviso';
    }
  }

  get primaryLabel(): string {
    if (this.announcement?.requiresAck && !this.announcement?.acknowledged) {
      return 'Entendido';
    }
    return 'Cerrar';
  }

  get showQueue(): boolean {
    return this.queueTotal > 1;
  }

  async onPrimary(): Promise<void> {
    if (this.busy || !this.announcement) return;
    this.busy = true;

    try {
      if (this.announcement.requiresAck && !this.announcement.acknowledged) {
        await firstValueFrom(
          this.announcementsSvc.acknowledge(this.announcement.id),
        );
      }

      if (this.announcement.dismissible) {
        await firstValueFrom(
          this.announcementsSvc.dismiss(this.announcement.id),
        );
      }

      await this.modalCtrl.dismiss({ handled: true, id: this.announcement.id });
    } catch (err: any) {
      this.busy = false;
      this.utilsSvc.presentToast({
        message: err?.error?.message || 'No se pudo cerrar el aviso',
        color: 'danger',
        duration: 3000,
      });
    }
  }
}
