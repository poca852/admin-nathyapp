import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { User } from 'src/app/models';
import { EmpleadosService } from 'src/app/services/empleados.service';
import { EmpresaService } from 'src/app/services/empresa.service';
import { SuperAdminContextService } from 'src/app/services/super-admin-context.service';
import { UtilsService } from 'src/app/services/utils.service';
import { AddUpdateEmployeComponent } from 'src/app/shared/components/add-update-employe/add-update-employe.component';

@Component({
  selector: 'app-sa-usuario-detail',
  templateUrl: './sa-usuario-detail.page.html',
  styleUrls: ['./sa-usuario-detail.page.scss'],
})
export class SaUsuarioDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly employeSvc = inject(EmpleadosService);
  private readonly empresaSvc = inject(EmpresaService);
  private readonly utilsSvc = inject(UtilsService);
  private readonly ctx = inject(SuperAdminContextService);

  readonly loading = signal(true);
  readonly user = signal<User | null>(null);

  readonly empresaLabel = computed(() => {
    const u = this.user();
    if (!u) return '—';
    const emp = u.empresa as any;
    if (!emp) return '—';
    if (typeof emp === 'string') {
      return this.ctx.empresas().find((e) => e.id === emp)?.name || emp;
    }
    return emp.name || emp.id || '—';
  });

  ngOnInit(): void {
    this.resolveUser();
  }

  private async resolveUser(): Promise<void> {
    this.loading.set(true);
    const id = this.route.snapshot.paramMap.get('id');
    const cached = this.ctx.detailPayload() as User | null;

    if (cached && (cached._id === id || cached.id === id)) {
      this.user.set(cached);
      this.loading.set(false);
      return;
    }

    if (this.ctx.empresas().length === 0) {
      try {
        await firstValueFrom(this.ctx.loadEmpresas());
      } catch { /* ignore */ }
    }

    try {
      const list = await firstValueFrom(this.employeSvc.getEmployes());
      const found = (list || []).find((u: any) => (u._id || u.id) === id) || null;
      this.user.set(found ? {
        ...found,
        _id: (found as any)._id || found.id,
        id: found.id || (found as any)._id,
      } : null);
    } catch {
      this.user.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  async editUser(): Promise<void> {
    const user = this.user();
    if (!user) return;

    const empresaId =
      (typeof user.empresa === 'string' ? user.empresa : (user.empresa as any)?.id)
      || this.ctx.empresas()[0]?.id;

    let rutasOverride = this.ctx.empresas().find((e) => e.id === empresaId)?.rutas || [];
    if (empresaId) {
      try {
        const detail = await firstValueFrom(this.empresaSvc.getEmpresa(empresaId));
        rutasOverride = detail?.rutas || [];
      } catch { /* keep */ }
    }

    const result = await this.utilsSvc.presentModal({
      component: AddUpdateEmployeComponent,
      cssClass: 'add-update-modal',
      componentProps: {
        employe: user,
        allowSuperAdmin: true,
        empresaId,
        rutasOverride,
      },
    });
    if (result?.success) {
      this.ctx.invalidate();
      this.resolveUser();
    }
  }

  toggleBlock(): void {
    const user = this.user();
    if (!user) return;
    const id = user._id || user.id!;
    const next = !user.estado;
    this.employeSvc.updateEmploye(id, { estado: next }).subscribe({
      next: () => {
        this.user.set({ ...user, estado: next });
        this.ctx.invalidate();
        this.utilsSvc.presentToast({
          message: next ? 'Usuario desbloqueado' : 'Usuario bloqueado',
          color: 'success',
          duration: 2500,
        });
      },
      error: (err) => this.utilsSvc.presentToast({
        message: err.error?.message || 'Error',
        color: 'danger',
        duration: 3000,
      }),
    });
  }

  confirmDelete(): void {
    const user = this.user();
    if (!user) return;
    this.utilsSvc.presentAlert({
      header: 'Eliminar empleado',
      message: `¿Eliminar a ${user.nombre}? Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.doDelete(user),
        },
      ],
    });
  }

  private async doDelete(user: User): Promise<void> {
    const id = String(user._id || user.id || '').trim();
    if (!id || id === 'undefined' || id === 'null') {
      await this.utilsSvc.presentAlert({
        header: 'Alerta',
        message: 'No se pudo determinar el id del usuario',
        buttons: ['OK'],
      });
      return;
    }

    const loading = await this.utilsSvc.loading();
    await loading.present();

    this.employeSvc.deleteUser(id).subscribe({
      next: () => {
        loading.dismiss();
        this.utilsSvc.presentToast({
          message: 'Empleado eliminado',
          duration: 2500,
          color: 'success',
          icon: 'checkmark-outline',
        });
        this.ctx.clearDetailPayload();
        this.ctx.invalidate();
        this.utilsSvc.routerLink('/main/super-admin/usuarios');
      },
      error: async (err) => {
        loading.dismiss();
        const msg =
          err?.error?.message ||
          err?.message ||
          (typeof err?.error === 'string' ? err.error : null) ||
          'No se pudo eliminar';
        await this.utilsSvc.presentAlert({
          header: 'Alerta',
          message: Array.isArray(msg) ? msg.join(', ') : String(msg),
          buttons: ['OK'],
        });
      },
    });
  }
}
