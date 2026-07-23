import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import {
  Announcement,
  AnnouncementScope,
  AnnouncementSeverity,
  AnnouncementType,
  Empresa,
} from 'src/app/models';
import { AnnouncementsService } from 'src/app/services/announcements.service';
import { SuperAdminContextService } from 'src/app/services/super-admin-context.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-sa-mensajes',
  templateUrl: './sa-mensajes.page.html',
  styleUrls: ['./sa-mensajes.page.scss'],
})
export class SaMensajesPage implements OnInit, OnDestroy {
  private readonly announcementsSvc = inject(AnnouncementsService);
  private readonly utilsSvc = inject(UtilsService);
  readonly ctx = inject(SuperAdminContextService);

  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly saving = signal(false);
  readonly items = signal<Announcement[]>([]);
  readonly showForm = signal(false);

  private sub?: Subscription;

  readonly activeCount = computed(
    () => this.items().filter((a) => a.isActive).length,
  );

  readonly types: { value: AnnouncementType; label: string }[] = [
    { value: 'INFO', label: 'Información' },
    { value: 'UPDATE', label: 'Actualización' },
    { value: 'PAYMENT_REMINDER', label: 'Recordatorio de pago' },
    { value: 'WARNING', label: 'Advertencia' },
  ];

  readonly severities: { value: AnnouncementSeverity; label: string }[] = [
    { value: 'info', label: 'Info' },
    { value: 'warning', label: 'Warning' },
    { value: 'critical', label: 'Crítico' },
  ];

  readonly scopes: { value: AnnouncementScope; label: string }[] = [
    { value: 'GLOBAL', label: 'Global' },
    { value: 'EMPRESA', label: 'Una empresa' },
    { value: 'MULTI', label: 'Varias empresas' },
  ];

  form = new FormGroup({
    title: new FormControl('', [Validators.required, Validators.minLength(2)]),
    body: new FormControl('', [Validators.required, Validators.minLength(2)]),
    type: new FormControl<AnnouncementType>('INFO', { nonNullable: true }),
    severity: new FormControl<AnnouncementSeverity>('info', { nonNullable: true }),
    scope: new FormControl<AnnouncementScope>('GLOBAL', { nonNullable: true }),
    empresaId: new FormControl<string | null>(null),
    empresaIds: new FormControl<string[]>([]),
    dismissible: new FormControl(true, { nonNullable: true }),
    requiresAck: new FormControl(false, { nonNullable: true }),
  });

  ngOnInit(): void {
    if (this.ctx.empresas().length === 0) {
      this.ctx.loadEmpresas().subscribe({ next: () => undefined });
    }
    this.refresh();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  ionViewWillEnter(): void {
    this.refresh();
  }

  refresh(event?: CustomEvent): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.sub?.unsubscribe();
    this.sub = this.announcementsSvc.listAll().pipe(
      finalize(() => {
        this.loading.set(false);
        (event?.target as HTMLIonRefresherElement)?.complete?.();
      }),
    ).subscribe({
      next: (list) => {
        this.items.set(
          (list || []).map((a: any) => ({ ...a, id: a.id || a._id })),
        );
      },
      error: () => {
        this.loadError.set(true);
        this.utilsSvc.presentToast({
          message: 'No se pudieron cargar los avisos',
          color: 'danger',
          duration: 3000,
        });
      },
    });
  }

  openCreate(): void {
    this.form.reset({
      title: '',
      body: '',
      type: 'INFO',
      severity: 'info',
      scope: 'GLOBAL',
      empresaId: null,
      empresaIds: [],
      dismissible: true,
      requiresAck: false,
    });
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
  }

  severityColor(severity: AnnouncementSeverity): string {
    if (severity === 'critical') return 'danger';
    if (severity === 'warning') return 'warning';
    return 'primary';
  }

  empresaName(id: string): string {
    return this.ctx.empresas().find((e) => e.id === id)?.name || id;
  }

  submit(): void {
    if (this.form.invalid || this.saving()) return;
    const raw = this.form.getRawValue();
    const scope = raw.scope;

    let empresaIds: string[] = [];
    if (scope === 'EMPRESA') {
      if (!raw.empresaId) {
        this.utilsSvc.presentToast({
          message: 'Selecciona una empresa',
          color: 'warning',
          duration: 2500,
        });
        return;
      }
      empresaIds = [raw.empresaId];
    } else if (scope === 'MULTI') {
      empresaIds = raw.empresaIds || [];
      if (!empresaIds.length) {
        this.utilsSvc.presentToast({
          message: 'Selecciona al menos una empresa',
          color: 'warning',
          duration: 2500,
        });
        return;
      }
    }

    this.saving.set(true);
    this.announcementsSvc
      .create({
        title: raw.title!.trim(),
        body: raw.body!.trim(),
        type: raw.type,
        severity: raw.severity,
        scope,
        empresaIds,
        dismissible: !!raw.dismissible,
        requiresAck: !!raw.requiresAck,
        audience: ['ADMIN', 'SUPERVISOR'],
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.showForm.set(false);
          this.utilsSvc.presentToast({
            message: 'Aviso enviado',
            color: 'success',
            duration: 2500,
          });
          this.refresh();
        },
        error: (err) => {
          this.utilsSvc.presentToast({
            message: err.error?.message || 'No se pudo crear el aviso',
            color: 'danger',
            duration: 3500,
          });
        },
      });
  }

  confirmDeactivate(item: Announcement): void {
    this.utilsSvc.presentAlert({
      header: 'Desactivar aviso',
      message: `¿Desactivar "${item.title}"? Dejará de mostrarse a los administradores.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Desactivar',
          role: 'destructive',
          handler: () => this.doDeactivate(item.id),
        },
      ],
    });
  }

  confirmRemove(item: Announcement): void {
    this.utilsSvc.presentAlert({
      header: 'Eliminar aviso',
      message:
        `¿Eliminar permanentemente "${item.title}"?\n\n` +
        'Se borrará de la base de datos junto con los recibos de lectura. Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.doRemove(item.id),
        },
      ],
    });
  }

  private doDeactivate(id: string): void {
    this.announcementsSvc.deactivate(id).subscribe({
      next: () => {
        this.utilsSvc.presentToast({
          message: 'Aviso desactivado',
          color: 'success',
          duration: 2500,
        });
        this.refresh();
      },
      error: (err) => {
        this.utilsSvc.presentToast({
          message: err.error?.message || 'No se pudo desactivar',
          color: 'danger',
          duration: 3000,
        });
      },
    });
  }

  private doRemove(id: string): void {
    this.announcementsSvc.remove(id).subscribe({
      next: () => {
        this.utilsSvc.presentToast({
          message: 'Aviso eliminado',
          color: 'success',
          duration: 2500,
        });
        this.refresh();
      },
      error: (err) => {
        this.utilsSvc.presentToast({
          message: err.error?.message || 'No se pudo eliminar',
          color: 'danger',
          duration: 3000,
        });
      },
    });
  }

  trackById(_: number, a: Announcement): string {
    return a.id;
  }

  trackEmpresa(_: number, e: Empresa): string {
    return e.id;
  }
}
