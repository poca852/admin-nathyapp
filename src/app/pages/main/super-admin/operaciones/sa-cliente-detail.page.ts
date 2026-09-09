import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Cliente } from 'src/app/models';
import { ClienteService } from 'src/app/services/cliente.service';
import { SuperAdminContextService } from 'src/app/services/super-admin-context.service';
import { UtilsService } from 'src/app/services/utils.service';
import { UpdateClienteComponent } from 'src/app/shared/components/update-cliente/update-cliente.component';

@Component({
  selector: 'app-sa-cliente-detail',
  templateUrl: './sa-cliente-detail.page.html',
  styleUrls: ['./sa-cliente-detail.page.scss'],
})
export class SaClienteDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly clienteSvc = inject(ClienteService);
  private readonly utilsSvc = inject(UtilsService);
  private readonly ctx = inject(SuperAdminContextService);

  readonly cliente = signal<Cliente | null>(null);
  readonly togglingState = signal(false);

  readonly titulo = computed(() => {
    const c = this.cliente();
    return c?.nombre || c?.alias || 'Cliente';
  });

  readonly isOperativo = computed(() => {
    const c = this.cliente();
    return c ? c.state !== false : true;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const payload = this.ctx.detailPayload() as { data?: Cliente } | null;
    if (payload?.data && ((payload.data.id || (payload.data as any)._id) === id)) {
      this.cliente.set(payload.data);
      return;
    }
    if (id) {
      this.clienteSvc.getClienteById(id).subscribe({
        next: (detail) => this.cliente.set(detail.cliente),
        error: () => this.cliente.set(null),
      });
      return;
    }
    this.cliente.set(null);
  }

  async editCliente(): Promise<void> {
    const cliente = this.cliente();
    if (!cliente) return;
    if (!this.isOperativo()) {
      this.utilsSvc.presentToast({
        message: 'Reactiva el cliente antes de editarlo',
        color: 'warning',
        duration: 2500,
      });
      return;
    }
    const result = await this.utilsSvc.presentModal({
      component: UpdateClienteComponent,
      cssClass: 'add-update-modal',
      componentProps: { cliente },
    });
    if (result?.success) {
      this.utilsSvc.presentToast({
        message: 'Cliente actualizado',
        color: 'success',
        duration: 2500,
      });
      this.ctx.invalidate();
      this.utilsSvc.routerLink('/main/super-admin/operaciones');
    }
  }

  confirmToggleState(): void {
    const cliente = this.cliente();
    if (!cliente || this.togglingState()) return;
    const next = !this.isOperativo();
    this.utilsSvc.presentAlert({
      header: next ? 'Activar cliente' : 'Desactivar cliente',
      message: next
        ? `¿Reactivar a ${cliente.nombre || cliente.alias}? Sus créditos e historial quedarán como estaban.`
        : `¿Desactivar a ${cliente.nombre || cliente.alias}? Dejará de verse en admin y cobrador; el historial se conserva.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: next ? 'Activar' : 'Desactivar',
          role: next ? undefined : 'destructive',
          handler: () => this.applyState(cliente, next),
        },
      ],
    });
  }

  private applyState(cliente: Cliente, state: boolean): void {
    const id = cliente.id || (cliente as any)._id;
    if (!id) return;
    this.togglingState.set(true);
    this.clienteSvc.setClienteState(id, state).subscribe({
      next: (updated) => {
        this.togglingState.set(false);
        this.cliente.set({ ...cliente, ...updated, state });
        this.ctx.invalidate();
        this.utilsSvc.presentToast({
          message: state ? 'Cliente activado' : 'Cliente desactivado',
          color: 'success',
          duration: 2500,
        });
      },
      error: (err) => {
        this.togglingState.set(false);
        this.utilsSvc.presentToast({
          message: err.error?.message || 'Error al cambiar estado',
          color: 'danger',
          duration: 3000,
        });
      },
    });
  }

  confirmDelete(): void {
    const cliente = this.cliente();
    if (!cliente) return;
    this.utilsSvc.presentAlert({
      header: 'Eliminar cliente',
      message: `¿Eliminar permanentemente a ${cliente.nombre || cliente.alias}? Debe no tener crédito activo. Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.clienteSvc.deleteCliente(cliente.id || (cliente as any)._id).subscribe({
              next: () => {
                this.utilsSvc.presentToast({
                  message: 'Cliente eliminado',
                  color: 'success',
                  duration: 2500,
                });
                this.ctx.invalidate();
                this.utilsSvc.routerLink('/main/super-admin/operaciones');
              },
              error: (err) => this.utilsSvc.presentToast({
                message: err.error?.message || 'Error al eliminar',
                color: 'danger',
                duration: 3000,
              }),
            });
          },
        },
      ],
    });
  }
}
