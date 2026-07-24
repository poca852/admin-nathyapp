import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { finalize } from 'rxjs/operators';

import {
  Announcement,
  AnnouncementReceiptRecipient,
  AnnouncementReceiptStatus,
  AnnouncementReceiptsReport,
} from 'src/app/models';
import { AnnouncementsService } from 'src/app/services/announcements.service';
import { UtilsService } from 'src/app/services/utils.service';

type FilterKey = 'all' | AnnouncementReceiptStatus;

@Component({
  selector: 'app-announcement-receipts-modal',
  templateUrl: './announcement-receipts-modal.component.html',
  styleUrls: ['./announcement-receipts-modal.component.scss'],
})
export class AnnouncementReceiptsModalComponent implements OnInit {
  @Input({ required: true }) announcement!: Announcement;

  private readonly modalCtrl = inject(ModalController);
  private readonly announcementsSvc = inject(AnnouncementsService);
  private readonly utilsSvc = inject(UtilsService);

  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly report = signal<AnnouncementReceiptsReport | null>(null);
  readonly filter = signal<FilterKey>('all');

  readonly filters: { value: FilterKey; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'unread', label: 'No vistos' },
    { value: 'read', label: 'Vistos' },
    { value: 'acknowledged', label: 'Confirmados' },
    { value: 'dismissed', label: 'Descartados' },
  ];

  readonly filteredRecipients = computed(() => {
    const list = this.report()?.recipients || [];
    const f = this.filter();
    if (f === 'all') return list;
    if (f === 'read') {
      return list.filter((r) => r.status !== 'unread');
    }
    return list.filter((r) => r.status === f);
  });

  ngOnInit(): void {
    this.load();
  }

  close(): void {
    this.modalCtrl.dismiss();
  }

  setFilter(value: FilterKey): void {
    this.filter.set(value);
  }

  statusLabel(status: AnnouncementReceiptStatus): string {
    switch (status) {
      case 'dismissed':
        return 'Descartado';
      case 'acknowledged':
        return 'Confirmado';
      case 'read':
        return 'Visto';
      default:
        return 'No visto';
    }
  }

  statusColor(status: AnnouncementReceiptStatus): string {
    switch (status) {
      case 'dismissed':
        return 'medium';
      case 'acknowledged':
        return 'success';
      case 'read':
        return 'primary';
      default:
        return 'warning';
    }
  }

  formatDate(value: string | null): string {
    if (!value) return '—';
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  }

  trackByUser(_: number, r: AnnouncementReceiptRecipient): string {
    return r.userId;
  }

  reload(): void {
    this.load();
  }

  private load(): void {
    const id = this.announcement?.id;
    if (!id) {
      this.loading.set(false);
      this.loadError.set(true);
      return;
    }

    this.loading.set(true);
    this.loadError.set(false);
    this.announcementsSvc
      .listReceipts(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (report) => this.report.set(report),
        error: () => {
          this.loadError.set(true);
          this.utilsSvc.presentToast({
            message: 'No se pudieron cargar las lecturas',
            color: 'danger',
            duration: 3000,
          });
        },
      });
  }
}
