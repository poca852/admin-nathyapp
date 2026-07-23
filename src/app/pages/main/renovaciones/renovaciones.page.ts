import {
  Component,
  DestroyRef,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { IonModal } from '@ionic/angular';
import { format } from 'date-fns';
import {
  catchError,
  combineLatest,
  finalize,
  of,
  switchMap,
  tap,
} from 'rxjs';

import { Ruta } from 'src/app/models';
import { resolveRutaCurrency } from 'src/app/helpers/money.helpers';
import { CreditosService } from '../../../services/creditos.service';
import { EmpresaService } from '../../../services/empresa.service';
import { UtilsService } from '../../../services/utils.service';
import { UpdateCreditoComponent } from '../../../shared/components/update-credito/update-credito.component';
import {
  EmpresaReport,
  RenovacionDetalle,
  RutaReport,
} from './interfaces/renovacion-report.interface';

@Component({
  selector: 'app-renovaciones',
  templateUrl: './renovaciones.page.html',
  styleUrls: ['./renovaciones.page.scss'],
})
export class RenovacionesPage {
  @ViewChild('modalRenovaciones') modalRenovaciones!: IonModal;

  private readonly destroyRef = inject(DestroyRef);
  private readonly creditoSvc = inject(CreditosService);
  private readonly utilsSvc = inject(UtilsService);
  readonly empresaSvc = inject(EmpresaService);

  readonly report = signal<EmpresaReport | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly selectedDate = signal(new Date().toISOString());
  readonly selectedRouteId = signal('all');
  readonly searchQuery = signal('');
  readonly refreshTrigger = signal(0);
  private pendingRefreshEvent: CustomEvent | null = null;

  readonly resumen = computed(() => {
    const data = this.report();
    const total = data?.totalEmpresa ?? 0;
    const cantidad = data?.cantidadEmpresa ?? 0;
    const rutasConDatos = data?.rutas?.filter((r) => r.cantidad > 0).length ?? 0;
    return { total, cantidad, rutasConDatos };
  });

  readonly filteredRutas = computed((): RutaReport[] => {
    const data = this.report();
    if (!data?.rutas?.length) return [];

    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return data.rutas;

    return data.rutas
      .map((ruta) => {
        const renovaciones = ruta.renovaciones.filter((item) => {
          const nombre = (item.nombre || '').toLowerCase();
          const alias = (item.alias || '').toLowerCase();
          return nombre.includes(q) || alias.includes(q);
        });
        return {
          ...ruta,
          renovaciones,
          cantidad: renovaciones.length,
          totalMonto: renovaciones.reduce((sum, r) => sum + Number(r.monto || 0), 0),
        };
      })
      .filter((ruta) => ruta.renovaciones.length > 0);
  });

  readonly hasReportData = computed(
    () => (this.report()?.rutas?.some((r) => r.cantidad > 0) ?? false),
  );

  readonly reportCurrency = computed(() => {
    const rutas = this.empresaSvc.rutas();
    const selected = this.selectedRouteId();
    if (selected !== 'all') {
      const match = rutas.find((r) => r.id === selected || r._id === selected);
      if (match) return resolveRutaCurrency(match);
    }
    const first = rutas.find((r) => r.currency || r.pais);
    return first ? resolveRutaCurrency(first) : 'USD';
  });

  get canManage(): boolean {
    const user = this.utilsSvc.getFromLocalStorage('user');
    return !!user && (user.rol === 'ADMIN' || user.rol === 'SUPERADMIN');
  }

  constructor() {
    this.setupReactiveFiltering();
  }

  ionViewWillEnter(): void {
    this.searchQuery.set('');
    const preselected = this.empresaSvc.ruta();
    if (preselected?.id) {
      this.selectedRouteId.set(preselected.id);
    }
    // Misma política que Pagos/Caja/Clientes: al reentrar siempre refrescar.
    this.refresh();
  }

  ionViewWillLeave(): void {
    this.report.set(null);
    this.loadError.set(false);
    this.loading.set(false);
    this.searchQuery.set('');
  }

  private setupReactiveFiltering(): void {
    combineLatest([
      toObservable(this.selectedDate),
      toObservable(this.selectedRouteId),
      toObservable(this.refreshTrigger),
    ])
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.loadError.set(false);
        }),
        switchMap(([dateStr, routeId]) => {
          const dateFormatted = format(new Date(dateStr), 'MM/dd/yyyy');
          const rId = routeId === 'all' ? undefined : routeId;
          return this.creditoSvc.getRenovaciones(dateFormatted, rId).pipe(
            catchError(() => {
              this.loadError.set(true);
              this.utilsSvc.presentToast({
                message: 'Error al cargar las renovaciones',
                duration: 3000,
                color: 'danger',
                icon: 'alert-circle-outline',
              });
              return of(null);
            }),
            finalize(() => {
              this.loading.set(false);
              (this.pendingRefreshEvent?.target as HTMLIonRefresherElement)?.complete?.();
              this.pendingRefreshEvent = null;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (report) => {
          this.report.set(report);
        },
      });
  }

  refresh(): void {
    this.refreshTrigger.update((v) => v + 1);
  }

  handleRefresh(event: CustomEvent): void {
    this.pendingRefreshEvent = event;
    this.refresh();
  }

  onSearch(ev: CustomEvent): void {
    this.searchQuery.set(String(ev.detail?.value ?? ''));
  }

  onChangeDay(e: CustomEvent): void {
    const value = e.detail?.value;
    if (value) {
      this.selectedDate.set(value);
    }
    this.modalRenovaciones?.dismiss();
  }

  handleRutaChange(ruta: Ruta): void {
    this.selectedRouteId.set(ruta?.id || 'all');
    if (ruta) {
      this.empresaSvc.setRuta(ruta);
    }
  }

  currencyForRuta(rutaId: string): string {
    const match = this.empresaSvc
      .rutas()
      .find((r) => r.id === rutaId || r._id === rutaId);
    return match ? resolveRutaCurrency(match) : this.reportCurrency();
  }

  /** True si la renovación pertenece al día actual en la TZ de su ruta. */
  esDelDiaActual(item: RenovacionDetalle): boolean {
    if (!item?.fecha) return false;
    const ruta = this.empresaSvc
      .rutas()
      .find((r) => r.id === item.rutaId || r._id === item.rutaId);
    const timeZone = ruta?.timeZone || 'UTC';
    const hoy = this.formatYmdInTimeZone(new Date(), timeZone);
    const fechaItem = this.formatYmdInTimeZone(new Date(item.fecha), timeZone);
    return hoy === fechaItem;
  }

  private formatYmdInTimeZone(date: Date, timeZone: string): string {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date);
    } catch {
      return date.toISOString().slice(0, 10);
    }
  }

  private assertPuedeMutarHoy(item: RenovacionDetalle): boolean {
    if (this.esDelDiaActual(item)) return true;
    this.utilsSvc.presentToast({
      message:
        'Solo se pueden actualizar o eliminar renovaciones del día de hoy (afectaría otra caja)',
      duration: 4000,
      color: 'warning',
      icon: 'alert-circle-outline',
    });
    return false;
  }

  trackByRutaId = (_index: number, ruta: RutaReport): string => ruta.rutaId;

  trackByRenovacionId = (_index: number, item: RenovacionDetalle): string =>
    item.creditoId || item.movimientoId || item.id;

  async presentActionSheet(item: RenovacionDetalle): Promise<void> {
    const buttons: Array<{
      text: string;
      role?: string;
      handler?: () => void | Promise<void>;
    }> = [
      {
        text: 'Ver información',
        handler: () => {
          if (!item.id) {
            this.utilsSvc.presentToast({
              message: 'No se encontró el identificador del cliente',
              duration: 3000,
              color: 'danger',
            });
            return;
          }
          this.utilsSvc.routerLink('/main/detail-cliente/:idCliente', {
            idCliente: item.id,
          });
        },
      },
    ];

    if (this.canManage) {
      buttons.push(
        {
          text: 'Actualizar',
          handler: () => {
            if (!this.assertPuedeMutarHoy(item)) return;
            void this.updateModal(item);
          },
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            if (!this.assertPuedeMutarHoy(item)) return;
            void this.confirmDelete(item);
          },
        },
      );
    }

    buttons.push({ text: 'Cancelar', role: 'cancel' });

    await this.utilsSvc.presentActionSheet({ buttons });
  }

  async updateModal(item: RenovacionDetalle): Promise<void> {
    if (!this.canManage) {
      this.utilsSvc.presentToast({
        message: 'No tienes permiso para realizar esta operación',
        duration: 3500,
        color: 'danger',
      });
      return;
    }

    if (!this.assertPuedeMutarHoy(item)) return;

    const success = await this.utilsSvc.presentModal({
      component: UpdateCreditoComponent,
      cssClass: 'add-update-modal',
      componentProps: { credito: item },
    });

    if (success?.success) this.refresh();
  }

  async confirmDelete(item: RenovacionDetalle): Promise<void> {
    if (!this.canManage) {
      this.utilsSvc.presentToast({
        message: 'No tienes permiso para realizar esta operación',
        duration: 3500,
        color: 'danger',
      });
      return;
    }

    if (!this.assertPuedeMutarHoy(item)) return;

    await this.utilsSvc.presentAlert({
      header: 'Eliminar renovación',
      message: `¿Eliminar el crédito renovado de ${item.nombre}? Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.deleteCredito(item);
          },
        },
      ],
    });
  }

  private deleteCredito(item: RenovacionDetalle): void {
    this.creditoSvc.deleteCredito(item.creditoId, item.movimientoId).subscribe({
      next: () => {
        this.utilsSvc.presentToast({
          color: 'success',
          message: 'Crédito eliminado correctamente',
          duration: 3000,
        });
        this.refresh();
      },
      error: (err) => {
        this.utilsSvc.presentToast({
          color: 'danger',
          message:
            err?.error?.message ||
            'No se pudo eliminar el crédito',
          duration: 4000,
        });
      },
    });
  }
}
