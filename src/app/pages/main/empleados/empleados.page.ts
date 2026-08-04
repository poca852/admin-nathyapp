import { Component, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs/operators';

import { EmpleadosService } from 'src/app/services/empleados.service';
import { UtilsService } from '../../../services/utils.service';
import { User } from 'src/app/models';
import { AddUpdateEmployeComponent } from '../../../shared/components/add-update-employe/add-update-employe.component';
import { EmpresaService } from '../../../services/empresa.service';
import { RoleService } from 'src/app/services/role.service';

type EmployeFilter = 'all' | 'active' | 'blocked' | 'cobrador' | 'supervisor' | 'admin';

@Component({
  selector: 'app-empleados',
  templateUrl: './empleados.page.html',
  styleUrls: ['./empleados.page.scss'],
})
export class EmpleadosPage {
  private readonly employeSvc = inject(EmpleadosService);
  private readonly utilsSvc = inject(UtilsService);
  private readonly empresaSvc = inject(EmpresaService);
  private readonly roleSvc = inject(RoleService);

  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly employes = signal<User[]>([]);
  readonly searchQuery = signal('');
  readonly filter = signal<EmployeFilter>('all');

  readonly resumen = computed(() => {
    const list = this.employes();
    return {
      total: list.length,
      activos: list.filter((e) => e.estado).length,
      bloqueados: list.filter((e) => !e.estado).length,
    };
  });

  readonly filteredEmployes = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const f = this.filter();

    return this.employes().filter((item) => {
      if (f === 'active' && !item.estado) return false;
      if (f === 'blocked' && item.estado) return false;
      if (f === 'cobrador' && item.rol !== 'COBRADOR') return false;
      if (f === 'supervisor' && item.rol !== 'SUPERVISOR') return false;
      if (f === 'admin' && item.rol !== 'ADMIN' && item.rol !== 'SUPERADMIN') return false;

      if (!q) return true;

      const nombre = (item.nombre || '').toLowerCase();
      const username = (item.username || '').toLowerCase();
      const rol = (item.rol || '').toLowerCase();
      return (
        nombre.includes(q) ||
        username.includes(q) ||
        rol.includes(q)
      );
    });
  });

  ionViewWillEnter(): void {
    this.loadEmpleados();
  }

  get canManage(): boolean {
    return this.roleSvc.isAdminOrSuperAdmin();
  }


  onSearch(ev: CustomEvent): void {
    this.searchQuery.set(String(ev.detail?.value ?? ''));
  }

  setFilter(value: EmployeFilter): void {
    this.filter.set(value);
  }

  trackById(_index: number, employe: User): string {
    return employe._id;
  }

  handleRefresh(event: any): void {
    this.loadEmpleados(event);
  }

  loadEmpleados(event?: any): void {
    const isRefresh = !!event;
    if (!isRefresh) {
      this.loading.set(true);
    }
    this.loadError.set(false);

    this.empresaSvc
      .getEmpleados()
      .pipe(
        finalize(() => {
          this.loading.set(false);
          event?.target?.complete?.();
        }),
      )
      .subscribe({
        next: (empleados) => {
          this.employes.set(empleados ?? []);
        },
        error: () => {
          this.employes.set([]);
          this.loadError.set(true);
          this.utilsSvc.presentToast({
            message: 'Error al cargar los empleados',
            duration: 3000,
            color: 'danger',
            icon: 'alert-circle-outline',
          });
        },
      });
  }

  rutaLabel(employe: User): string {
    if (employe.rol === 'COBRADOR') {
      return employe.ruta?.nombre ? employe.ruta.nombre : 'Sin ruta';
    }
    if (employe.rol === 'SUPERVISOR') {
      const n = Array.isArray(employe.rutas) ? employe.rutas.length : 0;
      return n === 1 ? '1 ruta' : `${n} rutas`;
    }
    return '—';
  }

  async lockUser(employe: User): Promise<void> {
    const loading = await this.utilsSvc.loading();
    await loading.present();

    this.employeSvc.updateEmploye(employe._id, { estado: !employe.estado }).subscribe({
      next: () => {
        loading.dismiss();
        this.utilsSvc.presentToast({
          message: employe.estado ? 'Empleado bloqueado' : 'Empleado desbloqueado',
          duration: 2500,
          color: 'success',
          icon: 'checkmark-outline',
        });
        this.loadEmpleados();
      },
      error: (err) => {
        loading.dismiss();
        this.utilsSvc.presentToast({
          message: err.error?.message || 'No se pudo actualizar el estado',
          duration: 3000,
          color: 'danger',
          icon: 'alert-circle-outline',
        });
      },
    });
  }

  async deleteUser(employe: User): Promise<void> {
    const loading = await this.utilsSvc.loading();
    await loading.present();

    this.empresaSvc.deleteEmpleado(employe._id).subscribe({
      next: () => {
        loading.dismiss();
        this.utilsSvc.presentToast({
          message: 'Empleado eliminado',
          duration: 2500,
          color: 'success',
          icon: 'checkmark-outline',
        });
        this.loadEmpleados();
      },
      error: async (err) => {
        loading.dismiss();
        await this.utilsSvc.presentAlert({
          header: 'Alerta',
          message: err.error?.message || 'No se pudo eliminar',
          buttons: ['OK'],
        });
      },
    });
  }

  public async presentActions(employe: User): Promise<void> {
    if (!this.canManage) {
      this.utilsSvc.presentToast({
        message: 'No tienes permiso para realizar esta acción',
        duration: 3500,
        color: 'danger',
        icon: 'lock-closed-outline',
      });
      return;
    }

    let text = 'Bloquear';
    let message = `¿Está seguro de bloquear a ${employe.nombre}?`;

    if (!employe.estado) {
      text = 'Desbloquear';
      message = `¿Está seguro de desbloquear a ${employe.nombre}?`;
    }

    await this.utilsSvc.presentActionSheet({
      header: `Acciones para ${employe.nombre}`,
      buttons: [
        {
          text: 'Actualizar',
          handler: () => {
            setTimeout(() => this.addUpdateEmploye(employe), 200);
          },
        },
        ...(employe.hasActiveSession
          ? [
              {
                text: 'Liberar sesión',
                handler: async () => {
                  await this.utilsSvc.presentAlert({
                    header: 'Liberar sesión',
                    message: `¿Cerrar la sesión activa de ${employe.nombre}?`,
                    buttons: [
                      {
                        text: 'Sí',
                        handler: () => this.clearSession(employe),
                      },
                      {
                        text: 'Cancelar',
                        role: 'cancel',
                      },
                    ],
                  });
                },
              },
            ]
          : []),
        {
          text,
          handler: async () => {
            await this.utilsSvc.presentAlert({
              header: 'Confirmación',
              message,
              buttons: [
                {
                  text: 'Sí',
                  handler: () => this.lockUser(employe),
                },
                {
                  text: 'Cancelar',
                  role: 'cancel',
                },
              ],
            });
          },
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.utilsSvc.presentAlert({
              header: 'Confirmación',
              message: `¿Está seguro de eliminar a ${employe.nombre}? Esta acción no se podrá revertir.`,
              buttons: [
                {
                  text: 'Sí, eliminar',
                  handler: () => this.deleteUser(employe),
                },
                {
                  text: 'Cancelar',
                  role: 'cancel',
                },
              ],
            });
          },
        },
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => this.employeSvc.removeCurrentEmploye(),
        },
      ],
    });
  }

  async clearSession(employe: User): Promise<void> {
    const id = employe._id || employe.id;
    if (!id) return;

    const loading = await this.utilsSvc.loading();
    await loading.present();

    this.employeSvc.clearSession(id).subscribe({
      next: () => {
        loading.dismiss();
        this.utilsSvc.presentToast({
          message: 'Sesión liberada',
          duration: 2500,
          color: 'success',
          icon: 'checkmark-outline',
        });
        this.loadEmpleados();
      },
      error: (err) => {
        loading.dismiss();
        this.utilsSvc.presentToast({
          message: err.error?.message || 'No se pudo liberar la sesión',
          duration: 3000,
          color: 'danger',
          icon: 'alert-circle-outline',
        });
      },
    });
  }

  async addUpdateEmploye(employe?: User): Promise<void> {
    if (!this.canManage) {
      this.utilsSvc.presentToast({
        message: 'No tienes permiso para realizar esta acción',
        duration: 3500,
        color: 'danger',
        icon: 'lock-closed-outline',
      });
      return;
    }

    const success = await this.utilsSvc.presentModal({
      component: AddUpdateEmployeComponent,
      cssClass: 'add-update-modal',
      componentProps: { employe },
    });

    if (success) {
      this.loadEmpleados();
    }
  }
}
