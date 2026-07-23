import { Component, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs/operators';

import { UtilsService } from '../../../services/utils.service';
import { Ruta } from 'src/app/models';
import { AddUpdateRutaComponent } from 'src/app/shared/components/add-update-ruta/add-update-ruta.component';
import { RutaModalComponent } from 'src/app/shared/components/ruta-modal/ruta-modal.component';
import { RutaService } from 'src/app/services/ruta.service';
import { EmpresaService } from 'src/app/services/empresa.service';

type RutaFilter = 'all' | 'open' | 'closed' | 'locked';

@Component({
  selector: 'app-rutas',
  templateUrl: './rutas.page.html',
  styleUrls: ['./rutas.page.scss'],
})
export class RutasPage {
  private readonly utilsSvc = inject(UtilsService);
  private readonly rutaSvc = inject(RutaService);
  private readonly empresaSvc = inject(EmpresaService);

  loading = true;
  loadError = false;

  readonly rutas = signal<Ruta[]>([]);
  readonly searchQuery = signal('');
  readonly filter = signal<RutaFilter>('all');

  readonly resumen = computed(() => {
    const list = this.rutas();
    let abiertas = 0;
    let cerradas = 0;
    let bloqueadas = 0;
    for (const r of list) {
      if (r.status) abiertas++;
      else cerradas++;
      if (r.isLocked) bloqueadas++;
    }
    return {
      total: list.length,
      abiertas,
      cerradas,
      bloqueadas,
    };
  });

  readonly filteredRutas = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const f = this.filter();
    return this.rutas().filter((ruta) => {
      if (f === 'open' && !ruta.status) return false;
      if (f === 'closed' && ruta.status) return false;
      if (f === 'locked' && !ruta.isLocked) return false;
      if (!q) return true;
      return (ruta.nombre || '').toLowerCase().includes(q);
    });
  });

  ionViewWillEnter(): void {
    this.getRutas();
  }

  get canManageRutas(): boolean {
    const user = this.utilsSvc.getFromLocalStorage('user') as { rol?: string } | null;
    return !!user && (user.rol === 'ADMIN' || user.rol === 'SUPERADMIN');
  }

  onSearch(ev: CustomEvent): void {
    this.searchQuery.set(String(ev.detail?.value ?? ''));
  }

  setFilter(value: RutaFilter): void {
    this.filter.set(value);
  }

  trackByRutaId(_index: number, ruta: Ruta): string {
    return ruta.id;
  }

  handleRefresh(event: any): void {
    this.getRutas(event);
  }

  getRutas(event?: any): void {
    const isRefresh = !!event;
    if (!isRefresh) {
      this.loading = true;
    }
    this.loadError = false;

    this.rutaSvc
      .getRutasByEmpresa()
      .pipe(
        finalize(() => {
          this.loading = false;
          if (event) {
            event.target.complete();
          }
        }),
      )
      .subscribe({
        next: ({ rutas }) => {
          const list = rutas ?? [];
          this.rutas.set(list);
          this.empresaSvc.setRutas(list);
          this.loadError = false;
        },
        error: () => {
          this.loadError = true;
          this.utilsSvc.presentToast({
            message: 'Error al obtener las rutas',
            duration: 2500,
            color: 'danger',
          });
        },
      });
  }

  async presentActions(ruta: Ruta, event?: Event): Promise<void> {
    event?.stopPropagation();

    const buttons: Array<{
      text: string;
      role?: string;
      handler?: () => void;
    }> = [
      {
        text: 'Ver detalle',
        handler: () => this.viewRuta(ruta),
      },
    ];

    if (this.canManageRutas) {
      buttons.unshift({
        text: 'Editar ruta',
        handler: () => this.addUpdateRuta(ruta),
      });
      buttons.push({
        text: 'Eliminar ruta',
        role: 'destructive',
        handler: () => this.deleteRuta(ruta),
      });
    }

    buttons.push({ text: 'Cancelar', role: 'cancel' });

    await this.utilsSvc.presentActionSheet({ buttons });
  }

  async viewRuta(ruta: Ruta): Promise<void> {
    await this.utilsSvc.presentModal({
      component: RutaModalComponent,
      cssClass: 'add-update-modal',
      componentProps: { ruta },
    });
  }

  async addUpdateRuta(ruta?: Ruta): Promise<void> {
    if (!this.canManageRutas) {
      this.utilsSvc.presentToast({
        message: 'No tienes permisos para realizar esta operación',
        duration: 3500,
        color: 'danger',
      });
      return;
    }

    const success = await this.utilsSvc.presentModal({
      component: AddUpdateRutaComponent,
      cssClass: 'add-update-modal',
      componentProps: { ruta },
    });

    if (success) {
      this.utilsSvc.presentToast({
        message: ruta ? 'Ruta actualizada correctamente' : 'Ruta creada correctamente',
        duration: 2500,
        color: 'success',
      });
      this.getRutas();
    }
  }

  deleteRuta(ruta: Ruta): void {
    if (!this.canManageRutas) {
      this.utilsSvc.presentToast({
        message: 'No tienes permisos para eliminar rutas',
        duration: 3500,
        color: 'danger',
      });
      return;
    }

    const nombre = ruta.nombre || 'esta ruta';
    this.utilsSvc.presentAlert({
      header: 'Eliminar ruta',
      message: `Se eliminará ${nombre} y, en cascada, sus clientes, créditos, mora, pagos/movimientos, cajas, peticiones y tracking. Los empleados solo se desasignan. Esta acción es irreversible.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sí, eliminar',
          role: 'destructive',
          handler: () => {
            this.rutaSvc.deleteRuta(ruta.id).subscribe({
              next: () => {
                this.utilsSvc.presentToast({
                  message: 'Ruta eliminada correctamente',
                  duration: 2500,
                  color: 'success',
                });
                this.getRutas();
              },
              error: () => {
                this.utilsSvc.presentToast({
                  message: 'Error al eliminar la ruta',
                  duration: 3500,
                  color: 'danger',
                });
              },
            });
          },
        },
      ],
    });
  }
}
