import { Component, Input, OnInit, inject, computed } from '@angular/core';
import { UtilsService } from 'src/app/services/utils.service';
import { PwaInstallService } from 'src/app/services/pwa-install.service';
import { PeticionesService } from 'src/app/services/peticiones.service';
import { AnnouncementsService } from 'src/app/services/announcements.service';
import { EmpresaService } from 'src/app/services/empresa.service';
import { RoleService } from 'src/app/services/role.service';
import { OfflineService } from 'src/app/services/offline.service';
import { Roles } from 'src/app/models/roles.enum';
import { NotificacionesModalComponent } from '../notificaciones-modal/notificaciones-modal.component';
import { AnnouncementsInboxModalComponent } from '../announcements-inbox-modal/announcements-inbox-modal.component';
import { AnnouncementAlertModalComponent } from '../announcement-alert-modal/announcement-alert-modal.component';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  @Input()
  title!: string;

  @Input() backButton: string;

  @Input() isModal: boolean;

  @Input() showMenu: boolean;

  utilsSvc = inject(UtilsService);
  pwaInstallSvc = inject(PwaInstallService);
  peticionesSvc = inject(PeticionesService);
  announcementsSvc = inject(AnnouncementsService);
  empresaSvc = inject(EmpresaService);
  roleSvc = inject(RoleService);
  offlineSvc = inject(OfflineService);
  private readonly modalCtrl = inject(ModalController);

  cantidadPendientes = computed(() => this.peticionesSvc.cantidadPendientes());
  avisosCount = computed(() => this.announcementsSvc.unreadCount());
  isOffline = computed(() => this.offlineSvc.isOffline());
  showAvisos = computed(() => {
    const rol = this.roleSvc.rol();
    return rol === Roles.admin || rol === Roles.supervisor;
  });
  showPaymentDue = computed(
    () => this.showAvisos() && this.empresaSvc.paymentDue(),
  );
  paymentDueLabel = computed(() => this.empresaSvc.paymentDueLabel());

  constructor() { }

  ngOnInit() { }

  dismissModal() {
    this.utilsSvc.dismissModal();
  }

  async mostrarAvisoOffline(): Promise<void> {
    await this.utilsSvc.presentToast({
      message: 'Sin conexión a internet. Algunas funciones no están disponibles.',
      duration: 2500,
      color: 'warning',
      position: 'top',
      icon: 'cloud-offline-outline',
    });
  }

  async installPwa() {
    try {
      await this.pwaInstallSvc.showInstallPrompt();
    } catch (error) {
      console.warn('PWA install prompt failed', error);
    }
  }

  abrirNotificaciones() {
    this.utilsSvc.presentModal({
      component: NotificacionesModalComponent,
      componentProps: {}
    });
  }

  abrirAvisos() {
    this.utilsSvc.presentModal({
      component: AnnouncementsInboxModalComponent,
      componentProps: {}
    });
  }

  async abrirPagoPendiente(): Promise<void> {
    const paymentReminder = this.announcementsSvc
      .visibleBanners()
      .find((a) => a.type === 'PAYMENT_REMINDER');

    if (paymentReminder) {
      const modal = await this.modalCtrl.create({
        component: AnnouncementAlertModalComponent,
        componentProps: {
          announcement: paymentReminder,
          queueTotal: 1,
          queueIndex: 1,
        },
        cssClass: 'announcement-alert-modal',
        backdropDismiss: !paymentReminder.requiresAck,
      });
      await modal.present();
      return;
    }

    const day = this.empresaSvc.empresa()?.dayOfPay;
    await this.utilsSvc.presentAlert({
      header: 'Pago pendiente',
      message: day != null
        ? `Tu suscripción está marcada como no pagada. Día de pago: ${day}. Contacta a soporte para regularizar y evitar la suspensión.`
        : 'Tu suscripción está marcada como no pagada. Contacta a soporte para regularizar y evitar la suspensión.',
      buttons: ['Entendido'],
    });
  }
}
