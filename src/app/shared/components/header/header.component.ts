import { Component, Input, OnInit, inject, computed } from '@angular/core';
import { UtilsService } from 'src/app/services/utils.service';
import { PwaInstallService } from 'src/app/services/pwa-install.service';
import { PeticionesService } from 'src/app/services/peticiones.service';
import { NotificacionesModalComponent } from '../notificaciones-modal/notificaciones-modal.component';

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

  cantidadPendientes = computed(() => this.peticionesSvc.cantidadPendientes());

  constructor() { }

  ngOnInit() { }

  dismissModal() {
    this.utilsSvc.dismissModal();
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
}
