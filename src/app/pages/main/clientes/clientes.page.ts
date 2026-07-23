import { Component, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs/operators';

import { UtilsService } from '../../../services/utils.service';
import { ClienteService } from '../../../services/cliente.service';
import { Cliente, Ruta } from 'src/app/models';
import { EmpresaService } from '../../../services/empresa.service';

type ClienteFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.page.html',
  styleUrls: ['./clientes.page.scss'],
})
export class ClientesPage {
  private readonly utilsSvc = inject(UtilsService);
  private readonly clienteSvc = inject(ClienteService);
  readonly empresaSvc = inject(EmpresaService);

  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly searched = signal(false);
  readonly currentRuta = signal<Ruta | null>(null);
  readonly clientes = signal<Cliente[]>([]);
  readonly searchQuery = signal('');
  readonly filter = signal<ClienteFilter>('all');

  readonly resumen = computed(() => {
    const list = this.clientes();
    return {
      total: list.length,
      activos: list.filter((c) => c.status).length,
      inactivos: list.filter((c) => !c.status).length,
    };
  });

  readonly filteredClientes = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const f = this.filter();

    return this.clientes().filter((item) => {
      if (f === 'active' && !item.status) return false;
      if (f === 'inactive' && item.status) return false;

      if (!q) return true;

      const nombre = (item.nombre || '').toLowerCase();
      const alias = (item.alias || '').toLowerCase();
      const dpi = (item.dpi || '').toLowerCase();
      const telefono = (item.telefono || '').toLowerCase();

      return (
        nombre.includes(q) ||
        alias.includes(q) ||
        dpi.includes(q) ||
        telefono.includes(q)
      );
    });
  });

  ionViewWillEnter(): void {
    this.searchQuery.set('');
    this.filter.set('all');
    const preselected = this.empresaSvc.ruta();
    if (preselected?.id) {
      this.currentRuta.set(preselected);
      this.loadClientes();
    }
  }

  ionViewWillLeave(): void {
    this.clientes.set([]);
    this.searched.set(false);
    this.loadError.set(false);
    this.loading.set(false);
    this.searchQuery.set('');
    this.filter.set('all');
  }

  onChangeRuta(ruta: Ruta): void {
    this.searchQuery.set('');
    this.filter.set('all');
    this.currentRuta.set(ruta ?? null);
    if (ruta) {
      this.empresaSvc.setRuta(ruta);
    }
    this.loadClientes();
  }

  onSearch(ev: CustomEvent): void {
    this.searchQuery.set(String(ev.detail?.value ?? ''));
  }

  setFilter(value: ClienteFilter): void {
    this.filter.set(value);
  }

  trackById = (_index: number, cliente: Cliente): string => {
    return cliente.id || cliente._id || '';
  };

  clienteId(cliente: Cliente): string {
    return cliente.id || cliente._id || '';
  }

  hasUbication(cliente: Cliente): boolean {
    return Array.isArray(cliente.ubication) && cliente.ubication.length >= 2;
  }

  handleRefresh(event: any): void {
    this.loadClientes(event);
  }

  loadClientes(event?: any): void {
    const rutaId = this.currentRuta()?.id;
    if (!rutaId) {
      event?.target?.complete?.();
      return;
    }

    const isRefresh = !!event;
    if (!isRefresh) {
      this.loading.set(true);
    }
    this.loadError.set(false);
    this.searched.set(true);

    this.clienteSvc
      .getClientesByRuta(rutaId)
      .pipe(
        finalize(() => {
          this.loading.set(false);
          event?.target?.complete?.();
        }),
      )
      .subscribe({
        next: (clientes) => {
          const list = clientes ?? [];
          this.clientes.set(list);
          this.clienteSvc.setClientes(list);
        },
        error: () => {
          this.clientes.set([]);
          this.loadError.set(true);
          this.utilsSvc.presentToast({
            message: 'Error al cargar los clientes',
            duration: 3000,
            color: 'danger',
            icon: 'alert-circle-outline',
          });
        },
      });
  }

  goToCliente(cliente: Cliente): void {
    const id = this.clienteId(cliente);
    if (!id) {
      this.utilsSvc.presentToast({
        message: 'No se encontró el identificador del cliente',
        duration: 3000,
        color: 'danger',
      });
      return;
    }

    this.clienteSvc.setCurrentCliente(cliente);
    this.utilsSvc.routerLink('/main/detail-cliente/:idCliente', { idCliente: id });
  }
}
