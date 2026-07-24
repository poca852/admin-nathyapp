import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
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
import { AnnouncementReceiptsModalComponent } from 'src/app/shared/components/announcement-receipts-modal/announcement-receipts-modal.component';

@Component({
  selector: 'app-sa-mensajes',
  templateUrl: './sa-mensajes.page.html',
  styleUrls: ['./sa-mensajes.page.scss'],
})
export class SaMensajesPage implements OnInit, OnDestroy {
  private readonly announcementsSvc = inject(AnnouncementsService);
  private readonly utilsSvc = inject(UtilsService);
  private readonly modalCtrl = inject(ModalController);
  readonly ctx = inject(SuperAdminContextService);

  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly saving = signal(false);
  readonly items = signal<Announcement[]>([]);
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);

  private sub?: Subscription;

  readonly activeCount = computed(
    () => this.items().filter((a) => a.isActive).length,
  );

  readonly formTitle = computed(() =>
    this.editingId() ? 'Editar aviso' : 'Nuevo aviso',
  );

  readonly submitLabel = computed(() =>
    this.editingId() ? 'Guardar' : 'Enviar',
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
    this.editingId.set(null);
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

  openEdit(item: Announcement): void {
    this.editingId.set(item.id);
    const empresaIds = item.empresaIds || [];
    this.form.reset({
      title: item.title,
      body: item.body,
      type: item.type,
      severity: item.severity,
      scope: item.scope,
      empresaId: item.scope === 'EMPRESA' ? empresaIds[0] || null : null,
      empresaIds: item.scope === 'MULTI' ? [...empresaIds] : [],
      dismissible: item.dismissible !== false,
      requiresAck: !!item.requiresAck,
    });
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
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

    const payload = {
      title: raw.title!.trim(),
      body: raw.body!.trim(),
      type: raw.type,
      severity: raw.severity,
      scope,
      empresaIds,
      dismissible: !!raw.dismissible,
      requiresAck: !!raw.requiresAck,
      audience: ['ADMIN', 'SUPERVISOR'] as Announcement['audience'],
    };

    const editId = this.editingId();
    this.saving.set(true);

    const req$ = editId
      ? this.announcementsSvc.update(editId, payload)
      : this.announcementsSvc.create(payload);

    req$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.showForm.set(false);
        this.editingId.set(null);
        this.utilsSvc.presentToast({
          message: editId ? 'Aviso actualizado' : 'Aviso enviado',
          color: 'success',
          duration: 2500,
        });
        this.refresh();
      },
      error: (err) => {
        this.utilsSvc.presentToast({
          message:
            err.error?.message ||
            (editId ? 'No se pudo actualizar el aviso' : 'No se pudo crear el aviso'),
          color: 'danger',
          duration: 3500,
        });
      },
    });
  }

  async openReceipts(item: Announcement): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: AnnouncementReceiptsModalComponent,
      componentProps: { announcement: item },
    });
    await modal.present();
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
