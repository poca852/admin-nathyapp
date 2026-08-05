import { Component, computed, inject, signal, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { Lead, LeadStatus } from 'src/app/models';
import { PAISES_SOPORTADOS } from 'src/app/services/countries.service';
import { LeadsService } from 'src/app/services/leads.service';
import { UtilsService } from 'src/app/services/utils.service';

type LeadFilter = 'ALL' | LeadStatus;

@Component({
  selector: 'app-sa-solicitudes',
  templateUrl: './sa-solicitudes.page.html',
  styleUrls: ['./sa-solicitudes.page.scss'],
})
export class SaSolicitudesPage implements OnDestroy {
  private readonly leadsSvc = inject(LeadsService);
  private readonly utilsSvc = inject(UtilsService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private navSub?: Subscription;

  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly leads = signal<Lead[]>([]);
  readonly searchQuery = signal('');
  readonly statusFilter = signal<LeadFilter>('ALL');
  readonly converting = signal(false);
  readonly convertLead = signal<Lead | null>(null);
  readonly paises = PAISES_SOPORTADOS;

  readonly convertForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    country: ['Guatemala', [Validators.required]],
  });

  readonly newCount = computed(
    () => this.leads().filter((l) => l.status === 'NEW').length,
  );

  readonly filtered = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();
    let list = this.leads();

    if (status !== 'ALL') {
      list = list.filter((l) => l.status === status);
    }

    if (!q) return list;
    return list.filter(
      (l) =>
        (l.nombre || '').toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q) ||
        (l.empresaNombre || '').toLowerCase().includes(q) ||
        (l.phone || '').toLowerCase().includes(q),
    );
  });

  ngOnInit(): void {
    this.navSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        if (this.isListUrl(e.urlAfterRedirects || e.url)) {
          this.refresh();
        }
      });
    this.refresh();
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }

  ionViewWillEnter(): void {
    this.refresh();
  }

  private isListUrl(url: string): boolean {
    return /\/super-admin\/solicitudes\/?$/.test(url.split('?')[0]);
  }

  refresh(event?: CustomEvent): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.leadsSvc
      .getLeads()
      .pipe(
        finalize(() => {
          this.loading.set(false);
          (event?.target as HTMLIonRefresherElement)?.complete?.();
        }),
      )
      .subscribe({
        next: (list) =>
          this.leads.set(
            (list || []).map((l: any) => ({
              ...l,
              _id: l._id || l.id,
              id: l.id || l._id,
              empresaId: l.empresaId?._id || l.empresaId || undefined,
              userId: l.userId?._id || l.userId || undefined,
            })),
          ),
        error: () => {
          this.loadError.set(true);
          this.utilsSvc.presentToast({
            message: 'No se pudieron cargar las solicitudes',
            duration: 3000,
            color: 'danger',
            icon: 'alert-circle-outline',
          });
        },
      });
  }

  onSearch(ev: CustomEvent): void {
    this.searchQuery.set(String(ev.detail?.value ?? ''));
  }

  onFilterChange(ev: CustomEvent): void {
    this.statusFilter.set((ev.detail?.value as LeadFilter) || 'ALL');
  }

  statusColor(status?: LeadStatus): string {
    switch (status) {
      case 'NEW':
        return 'primary';
      case 'CONTACTED':
        return 'warning';
      case 'CONVERTED':
        return 'success';
      case 'REJECTED':
        return 'medium';
      default:
        return 'medium';
    }
  }

  statusLabel(status?: LeadStatus): string {
    switch (status) {
      case 'NEW':
        return 'Nueva';
      case 'CONTACTED':
        return 'Contactada';
      case 'CONVERTED':
        return 'Convertida';
      case 'REJECTED':
        return 'Rechazada';
      default:
        return status || '—';
    }
  }

  trackById(_: number, lead: Lead): string {
    return lead.id || lead._id || lead.email;
  }

  async openActions(lead: Lead): Promise<void> {
    const canConvert = lead.status === 'NEW' || lead.status === 'CONTACTED';
    const buttons: any[] = [];

    if (canConvert) {
      buttons.push({
        text: 'Marcar contactada',
        icon: 'call-outline',
        handler: () => this.setStatus(lead, 'CONTACTED'),
      });
      buttons.push({
        text: 'Aprobar / Convertir',
        icon: 'checkmark-circle-outline',
        handler: () => this.openConvert(lead),
      });
      buttons.push({
        text: 'Rechazar',
        icon: 'close-circle-outline',
        role: 'destructive',
        handler: () => this.rejectLead(lead),
      });
    }

    if (lead.status === 'CONVERTED' && lead.empresaId) {
      buttons.push({
        text: 'Ver empresa',
        icon: 'business-outline',
        handler: () =>
          this.router.navigateByUrl(
            `/main/super-admin/empresas/${lead.empresaId}`,
          ),
      });
    }

    buttons.push({
      text: 'Eliminar',
      icon: 'trash-outline',
      role: 'destructive',
      handler: () => this.deleteLead(lead),
    });
    buttons.push({ text: 'Cancelar', icon: 'close-outline', role: 'cancel' });

    await this.utilsSvc.presentActionSheet({
      header: lead.empresaNombre || lead.nombre,
      subHeader: lead.email,
      buttons,
    });
  }

  openConvert(lead: Lead): void {
    this.convertForm.reset({
      username: '',
      password: '',
      country: 'Guatemala',
    });
    this.convertLead.set(lead);
  }

  closeConvert(): void {
    this.convertLead.set(null);
  }

  submitConvert(): void {
    const lead = this.convertLead();
    if (!lead || this.convertForm.invalid) {
      this.convertForm.markAllAsTouched();
      return;
    }

    const id = lead.id || lead._id;
    if (!id) return;

    const { username, password, country } = this.convertForm.getRawValue();
    this.converting.set(true);

    this.leadsSvc
      .convertLead(id, { username, password, country })
      .pipe(finalize(() => this.converting.set(false)))
      .subscribe({
        next: (res) => {
          this.closeConvert();
          this.utilsSvc.presentToast({
            message: 'Solicitud convertida: empresa y dueño ADMIN creados',
            duration: 3000,
            color: 'success',
            icon: 'checkmark-circle-outline',
          });
          this.refresh();
          const empresaId = res?.empresaId;
          if (empresaId) {
            // Cerrar modal antes de navegar para evitar que Ionic lo deje colgado
            setTimeout(() => {
              this.router.navigateByUrl(
                `/main/super-admin/empresas/${empresaId}`,
              );
            }, 150);
          }
        },
        error: (err) => {
          this.converting.set(false);
          const message =
            err?.error?.message ||
            'No se pudo convertir la solicitud';
          this.utilsSvc.presentToast({
            message: Array.isArray(message) ? message.join(', ') : message,
            duration: 4000,
            color: 'danger',
            icon: 'alert-circle-outline',
          });
        },
      });
  }

  private setStatus(lead: Lead, status: LeadStatus): void {
    const id = lead.id || lead._id;
    if (!id) return;

    this.leadsSvc.updateLead(id, { status }).subscribe({
      next: () => {
        this.utilsSvc.presentToast({
          message: `Solicitud marcada como ${this.statusLabel(status).toLowerCase()}`,
          duration: 2500,
          color: 'success',
          icon: 'checkmark-circle-outline',
        });
        this.refresh();
      },
      error: () => {
        this.utilsSvc.presentToast({
          message: 'No se pudo actualizar la solicitud',
          duration: 3000,
          color: 'danger',
          icon: 'alert-circle-outline',
        });
      },
    });
  }

  private async rejectLead(lead: Lead): Promise<void> {
    const id = lead.id || lead._id;
    if (!id) return;

    await this.utilsSvc.presentAlert({
      header: 'Rechazar solicitud',
      message: `¿Rechazar la solicitud de ${lead.empresaNombre}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Rechazar',
          role: 'destructive',
          handler: () => {
            this.leadsSvc.updateLead(id, { status: 'REJECTED' }).subscribe({
              next: () => {
                this.utilsSvc.presentToast({
                  message: 'Solicitud rechazada',
                  duration: 2500,
                  color: 'medium',
                  icon: 'close-circle-outline',
                });
                this.refresh();
              },
              error: () => {
                this.utilsSvc.presentToast({
                  message: 'No se pudo rechazar la solicitud',
                  duration: 3000,
                  color: 'danger',
                  icon: 'alert-circle-outline',
                });
              },
            });
          },
        },
      ],
    });
  }

  private async deleteLead(lead: Lead): Promise<void> {
    const id = lead.id || lead._id;
    if (!id) return;

    await this.utilsSvc.presentAlert({
      header: 'Eliminar solicitud',
      message: `¿Eliminar permanentemente la solicitud de ${lead.empresaNombre}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.leadsSvc.deleteLead(id).subscribe({
              next: () => {
                this.utilsSvc.presentToast({
                  message: 'Solicitud eliminada',
                  duration: 2500,
                  color: 'success',
                  icon: 'trash-outline',
                });
                this.refresh();
              },
              error: () => {
                this.utilsSvc.presentToast({
                  message: 'No se pudo eliminar',
                  duration: 3000,
                  color: 'danger',
                  icon: 'alert-circle-outline',
                });
              },
            });
          },
        },
      ],
    });
  }
}
