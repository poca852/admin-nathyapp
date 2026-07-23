import {
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Platform } from '@ionic/angular';
import { saveAs } from 'file-saver';
import { finalize } from 'rxjs/operators';

import { Empresa } from '../../../models/empresa.interface';
import { EmpresaService } from '../../../services/empresa.service';
import { UtilsService } from '../../../services/utils.service';
import { UpdateEmpresaComponent } from '../../../shared/components/update-empresa/update-empresa.component';

@Component({
  selector: 'app-empresa',
  templateUrl: './empresa.page.html',
  styleUrls: ['./empresa.page.scss'],
})
export class EmpresaPage {
  private readonly empresaSvc = inject(EmpresaService);
  private readonly utilsSvc = inject(UtilsService);
  private readonly platform = inject(Platform);

  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly backupLoading = signal(false);

  readonly empresa = computed(() => this.empresaSvc.empresa());

  readonly resumen = computed(() => {
    const e = this.empresa();
    return {
      rutas: e?.rutas?.length ?? 0,
      empleados: e?.employes?.length ?? 0,
      dayOfPay: e?.dayOfPay ?? null,
      phone: e?.phone || null,
      email: e?.email || null,
      cobraMora: !!e?.cobraMora,
      porcentajeMora: e?.porcentajeMora ?? 0,
    };
  });

  get canManage(): boolean {
    const user = this.utilsSvc.getFromLocalStorage('user');
    return !!user && (user.rol === 'ADMIN' || user.rol === 'SUPERADMIN');
  }

  ionViewWillEnter(): void {
    this.refreshEmpresa();
  }

  ionViewWillLeave(): void {
    this.loadError.set(false);
    this.loading.set(false);
    this.backupLoading.set(false);
  }

  handleRefresh(event?: CustomEvent): void {
    this.refreshEmpresa(event);
  }

  refreshEmpresa(event?: CustomEvent): void {
    const id =
      this.empresa()?.id ||
      this.utilsSvc.getFromLocalStorage('user')?.empresa;

    if (!id) {
      this.loadError.set(true);
      (event?.target as HTMLIonRefresherElement)?.complete?.();
      return;
    }

    this.loading.set(true);
    this.loadError.set(false);

    this.empresaSvc
      .getEmpresa(id)
      .pipe(
        finalize(() => {
          this.loading.set(false);
          (event?.target as HTMLIonRefresherElement)?.complete?.();
        }),
      )
      .subscribe({
        next: (empresa: Empresa) => {
          this.empresaSvc.applyEmpresa(empresa);
          this.loadError.set(false);
        },
        error: () => {
          this.loadError.set(true);
          this.utilsSvc.presentToast({
            message: 'No se pudo cargar la empresa',
            duration: 3000,
            color: 'danger',
            icon: 'alert-circle-outline',
          });
        },
      });
  }

  async editEmpresa(): Promise<void> {
    if (!this.canManage) {
      this.utilsSvc.presentToast({
        message: 'No tienes permiso para editar la empresa',
        duration: 3000,
        color: 'danger',
        icon: 'lock-closed-outline',
      });
      return;
    }

    const current = this.empresa();
    if (!current?.id) return;

    const success = await this.utilsSvc.presentModal({
      component: UpdateEmpresaComponent,
      cssClass: 'add-update-modal',
      componentProps: { empresa: current },
    });

    if (success) {
      this.refreshEmpresa();
    }
  }

  async confirmBackup(): Promise<void> {
    const e = this.empresa();
    if (!e?.id || this.backupLoading()) return;

    const isHybrid = this.platform.is('hybrid');
    const message = isHybrid
      ? `Se enviará la copia de seguridad al correo ${e.email || '(sin email)'}. ¿Continuar?`
      : 'Se descargará un archivo CSV con la copia de seguridad. ¿Continuar?';

    await this.utilsSvc.presentAlert({
      header: 'Copia de seguridad',
      message,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: isHybrid ? 'Enviar' : 'Descargar',
          handler: () => {
            void this.runBackup();
          },
        },
      ],
    });
  }

  private async runBackup(): Promise<void> {
    const e = this.empresa();
    if (!e?.id || this.backupLoading()) return;

    if (this.platform.is('hybrid')) {
      if (!e.email) {
        await this.utilsSvc.presentAlert({
          header: 'Email requerido',
          message:
            'Actualiza la empresa con un correo válido antes de enviar la copia.',
          buttons: ['OK'],
        });
        return;
      }

      this.backupLoading.set(true);
      this.empresaSvc.sendBackup(e.id, e.email).subscribe({
        next: (ok) => {
          this.backupLoading.set(false);
          if (ok) {
            this.utilsSvc.presentToast({
              color: 'success',
              message: `Copia enviada a ${e.email}`,
              duration: 3000,
              icon: 'cloud-download-outline',
            });
          }
        },
        error: (err) => {
          this.backupLoading.set(false);
          this.utilsSvc.presentAlert({
            header: 'Error',
            message:
              err?.error?.message ||
              'No se pudo procesar la copia de seguridad. Contacta al administrador.',
            buttons: ['OK'],
          });
        },
      });
      return;
    }

    this.backupLoading.set(true);
    this.empresaSvc.getBackUp(e.id).subscribe({
      next: (response) => {
        this.backupLoading.set(false);
        this.downloadFile(response);
      },
      error: (err) => {
        this.backupLoading.set(false);
        this.utilsSvc.presentAlert({
          header: 'Error',
          message:
            err?.error?.message ||
            'No se pudo procesar la copia de seguridad. Contacta al administrador.',
          buttons: ['OK'],
        });
      },
    });
  }

  private downloadFile(buffer: ArrayBuffer): void {
    const e = this.empresa();
    const blob = new Blob([buffer], { type: 'text/csv;charset=utf-8' });
    const fileName = `${e?.name || 'empresa'}_backup.csv`;
    saveAs(blob, fileName);
    this.utilsSvc.presentToast({
      color: 'success',
      message: 'Copia descargada',
      duration: 3000,
      icon: 'cloud-download-outline',
    });
  }

  goToEmpleados(): void {
    this.utilsSvc.routerLink('/main/empleados');
  }

  goToRutas(): void {
    this.utilsSvc.routerLink('/main/rutas');
  }
}
