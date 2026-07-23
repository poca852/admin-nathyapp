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

  readonly titulo = computed(() => {
    const c = this.cliente();
    return c?.nombre || c?.alias || 'Cliente';
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const payload = this.ctx.detailPayload() as { data?: Cliente } | null;
    if (payload?.data && ((payload.data.id || (payload.data as any)._id) === id)) {
      this.cliente.set(payload.data);
      return;
    }
    this.cliente.set(null);
  }

  async editCliente(): Promise<void> {
    const cliente = this.cliente();
    if (!cliente) return;
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

  confirmDelete(): void {
    const cliente = this.cliente();
    if (!cliente) return;
    this.utilsSvc.presentAlert({
      header: 'Eliminar cliente',
      message: `¿Eliminar a ${cliente.nombre || cliente.alias}? Debe no tener crédito activo.`,
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
