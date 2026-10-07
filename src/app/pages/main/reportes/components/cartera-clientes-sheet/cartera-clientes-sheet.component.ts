import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  EventEmitter,
  Output,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Subscription, catchError, finalize, of } from 'rxjs';
import {
  CarteraClienteItem,
  ClasificacionCartera,
} from 'src/app/models/reportes.interface';
import { Cliente } from 'src/app/models';
import { ClienteService } from 'src/app/services/cliente.service';
import { ReportesService } from 'src/app/services/reportes.service';
import { UtilsService } from 'src/app/services/utils.service';
import { MoneyPipe } from 'src/app/shared/pipes/money.pipe';

export type CarteraSheetFilter = 'all' | ClasificacionCartera;

@Component({
  selector: 'app-cartera-clientes-sheet',
  standalone: true,
  imports: [CommonModule, IonicModule, MoneyPipe],
  templateUrl: './cartera-clientes-sheet.component.html',
  styleUrls: ['./cartera-clientes-sheet.component.scss'],
})
export class CarteraClientesSheetComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly reportesSvc = inject(ReportesService);
  private readonly clienteSvc = inject(ClienteService);
  private readonly utilsSvc = inject(UtilsService);
  private loadSub?: Subscription;
  private wasOpen = false;

  readonly isOpen = input(false);
  readonly rutaId = input<string | undefined>(undefined);
  readonly initialFilter = input<CarteraSheetFilter>('all');

  @Output() closed = new EventEmitter<void>();

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly items = signal<CarteraClienteItem[]>([]);
  readonly filter = signal<CarteraSheetFilter>('all');
  readonly searchQuery = signal('');

  readonly filteredItems = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const filter = this.filter();
    return this.items().filter((item) => {
      if (filter !== 'all' && item.state !== filter) {
        return false;
      }
      if (!q) {
        return true;
      }
      const haystack = [item.nombre, item.alias, item.dpi, item.telefono]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  });

  readonly title = computed(() => {
    switch (this.filter()) {
      case 'BUENO':
        return 'Clientes buenos';
      case 'REGULAR':
        return 'Clientes regulares';
      case 'MALO':
        return 'Clientes malos';
      default:
        return 'Clientes de cartera';
    }
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.loadSub?.unsubscribe());

    effect(() => {
      const open = this.isOpen();
      if (!open) {
        this.wasOpen = false;
        return;
      }

      const rutaId = this.rutaId();

      if (!this.wasOpen) {
        this.filter.set(this.initialFilter());
        this.searchQuery.set('');
        this.wasOpen = true;
      }

      this.loadItems(rutaId);
    }, { allowSignalWrites: true });
  }

  onDidDismiss(): void {
    this.closed.emit();
  }

  setFilter(filter: CarteraSheetFilter): void {
    this.filter.set(filter);
  }

  onSearch(event: CustomEvent): void {
    this.searchQuery.set((event.detail?.value as string) ?? '');
  }

  reload(): void {
    this.loadItems(this.rutaId());
  }

  badgeColor(state: ClasificacionCartera): string {
    switch (state) {
      case 'BUENO':
        return 'success';
      case 'REGULAR':
        return 'warning';
      case 'MALO':
        return 'danger';
    }
  }

  badgeLabel(state: ClasificacionCartera): string {
    switch (state) {
      case 'BUENO':
        return 'Bueno';
      case 'REGULAR':
        return 'Regular';
      case 'MALO':
        return 'Malo';
    }
  }

  goToCliente(item: CarteraClienteItem): void {
    const cliente: Cliente = {
      id: item.clienteId,
      _id: item.clienteId,
      status: true,
      state: true,
      dpi: item.dpi || '',
      nombre: item.nombre,
      alias: item.alias || '',
      ciudad: '',
      direccion: '',
      telefono: item.telefono || '',
      ruta: item.rutaId,
      creditos: [],
      ubication: [],
    };

    this.clienteSvc.setCurrentCliente(cliente);
    this.closed.emit();
    this.utilsSvc.routerLink('/main/detail-cliente/:idCliente', {
      idCliente: item.clienteId,
    });
  }

  private loadItems(rutaId?: string): void {
    this.loadSub?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);

    this.loadSub = this.reportesSvc
      .getCarteraClientes(rutaId)
      .pipe(
        catchError(() => {
          this.error.set('No se pudo cargar el listado. Intenta de nuevo.');
          return of({ items: [], total: 0, clasificacion: null });
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((res) => {
        this.items.set(res.items ?? []);
      });
  }
}
