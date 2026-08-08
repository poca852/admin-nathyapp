import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { AppConfigService } from 'src/app/services/app-config.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-sa-app-version',
  templateUrl: './sa-app-version.page.html',
  styleUrls: ['./sa-app-version.page.scss'],
})
export class SaAppVersionPage implements OnInit {
  private readonly appConfigSvc = inject(AppConfigService);
  private readonly utilsSvc = inject(UtilsService);

  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly saving = signal(false);

  readonly form = new FormGroup({
    minVersionCode: new FormControl(24, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    latestVersionCode: new FormControl(24, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    forceUpdate: new FormControl(true, { nonNullable: true }),
    storeUrl: new FormControl(
      'https://play.google.com/store/apps/details?id=lat.nathyappv2.cobrador',
      {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(500)],
      },
    ),
    message: new FormControl(
      'Debes actualizar la aplicación para continuar.',
      {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(500)],
      },
    ),
  });

  ngOnInit(): void {
    this.refresh();
  }

  ionViewWillEnter(): void {
    this.refresh();
  }

  refresh(event?: CustomEvent): void {
    this.loading.set(true);
    this.loadError.set(false);

    this.appConfigSvc
      .getAdmin()
      .pipe(finalize(() => {
        this.loading.set(false);
        (event?.target as HTMLIonRefresherElement | undefined)?.complete?.();
      }))
      .subscribe({
        next: (cfg) => {
          this.form.patchValue({
            minVersionCode: cfg.minVersionCode,
            latestVersionCode: cfg.latestVersionCode,
            forceUpdate: cfg.forceUpdate,
            storeUrl: cfg.storeUrl,
            message: cfg.message,
          });
        },
        error: () => {
          this.loadError.set(true);
          this.utilsSvc.presentToast({
            message: 'No se pudo cargar la configuración de la app',
            color: 'danger',
            duration: 2500,
          });
        },
      });
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const value = this.form.getRawValue();

    this.appConfigSvc
      .update(value)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (cfg) => {
          this.form.patchValue({
            minVersionCode: cfg.minVersionCode,
            latestVersionCode: cfg.latestVersionCode,
            forceUpdate: cfg.forceUpdate,
            storeUrl: cfg.storeUrl,
            message: cfg.message,
          });
          this.utilsSvc.presentToast({
            message: 'Configuración guardada',
            color: 'success',
            duration: 2000,
          });
        },
        error: () => {
          this.utilsSvc.presentToast({
            message: 'No se pudo guardar',
            color: 'danger',
            duration: 2500,
          });
        },
      });
  }
}
