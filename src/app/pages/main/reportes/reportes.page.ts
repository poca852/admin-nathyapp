import {
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { format, startOfMonth, differenceInDays } from 'date-fns';
import {
  catchError,
  combineLatest,
  finalize,
  Observable,
  of,
  switchMap,
  tap,
} from 'rxjs';
import {
  ReporteCajaHistoricoResponse,
  ReporteCarteraResponse,
  ReporteFinancieroResponse,
  ReporteOficinaResponse,
  ReporteTab,
} from 'src/app/models/reportes.interface';
import { EmpresaService } from 'src/app/services/empresa.service';
import { ReportesService } from 'src/app/services/reportes.service';
import { RutaService } from 'src/app/services/ruta.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.page.html',
  styleUrls: ['./reportes.page.scss'],
})
export class ReportesPage {
  private static readonly MAX_RANGO_DIAS = 365;

  private readonly destroyRef = inject(DestroyRef);
  private readonly reportesSvc = inject(ReportesService);
  private readonly rutaSvc = inject(RutaService);
  private readonly empresaSvc = inject(EmpresaService);
  private readonly utilsSvc = inject(UtilsService);

  public readonly activeTab = signal<ReporteTab>('cartera');
  public readonly fechaInicio = signal(this.toApiDate(startOfMonth(new Date())));
  public readonly fechaFin = signal(this.toApiDate(new Date()));
  public readonly selectedRouteId = signal<string>('all');
  public readonly refreshTrigger = signal(0);

  public readonly loading = signal(false);
  public readonly error = signal<string | null>(null);

  public readonly reporteCartera = signal<ReporteCarteraResponse | null>(null);
  public readonly reporteFinanciero = signal<ReporteFinancieroResponse | null>(null);
  public readonly reporteOficina = signal<ReporteOficinaResponse | null>(null);
  public readonly reporteCaja = signal<ReporteCajaHistoricoResponse | null>(null);

  public readonly rutas = computed(() => this.empresaSvc.rutas());
  public readonly hasDateRange = computed(() => this.activeTab() !== 'cartera');
  public readonly hasReportData = computed(() => {
    switch (this.activeTab()) {
      case 'cartera':
        return !!this.reporteCartera();
      case 'financiero':
        return !!this.reporteFinanciero();
      case 'oficina':
        return !!this.reporteOficina();
      case 'caja':
        return !!this.reporteCaja();
    }
  });

  public readonly gastosPorCategoriaEntries = computed(() => {
    const categorias = this.reporteOficina()?.gastosPorCategoria ?? {};
    return Object.entries(categorias).sort(([, a], [, b]) => b - a);
  });

  constructor() {
    this.setupReactiveReports();
  }

  ionViewWillEnter(): void {
    this.loadRutas();
  }

  onTabChange(event: CustomEvent): void {
    this.activeTab.set(event.detail.value as ReporteTab);
  }

  onRouteChange(event: CustomEvent): void {
    this.selectedRouteId.set(event.detail.value);
  }

  onFechaInicioChange(event: CustomEvent): void {
    const value = this.extractDateValue(event.detail.value);
    if (value) {
      this.fechaInicio.set(this.toApiDate(value));
    }
  }

  onFechaFinChange(event: CustomEvent): void {
    const value = this.extractDateValue(event.detail.value);
    if (value) {
      this.fechaFin.set(this.toApiDate(value));
    }
  }

  refresh(): void {
    this.refreshTrigger.update((v) => v + 1);
  }

  formatDisplayDate(isoDate: string): string {
    const [year, month, day] = isoDate.split('-').map(Number);
    return format(new Date(year, month - 1, day), 'dd MMM yyyy');
  }

  trackByRutaId(_index: number, ruta: { rutaId: string }): string {
    return ruta.rutaId;
  }

  trackByFecha(_index: number, item: { fecha: string }): string {
    return item.fecha;
  }

  private setupReactiveReports(): void {
    combineLatest([
      toObservable(this.activeTab),
      toObservable(this.fechaInicio),
      toObservable(this.fechaFin),
      toObservable(this.selectedRouteId),
      toObservable(this.refreshTrigger),
    ])
      .pipe(
        switchMap(([tab, fechaInicio, fechaFin, routeId]) => {
          const rutaId = routeId === 'all' ? undefined : routeId;
          this.loading.set(true);
          this.error.set(null);

          if (tab !== 'cartera') {
            const rangoError = this.validarRangoFechas(fechaInicio, fechaFin);
            if (rangoError) {
              this.error.set(rangoError);
              this.setReportForTab(tab, null);
              this.loading.set(false);
              return of(null);
            }
          }

          return this.fetchReport(tab, fechaInicio, fechaFin, rutaId).pipe(
            tap((data) => this.setReportForTab(tab, data)),
            catchError(() => {
              this.error.set('No se pudo cargar el reporte. Verifica el rango de fechas e intenta de nuevo.');
              this.setReportForTab(tab, null);
              return of(null);
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private fetchReport(
    tab: ReporteTab,
    fechaInicio: string,
    fechaFin: string,
    rutaId?: string,
  ): Observable<
    | ReporteCarteraResponse
    | ReporteFinancieroResponse
    | ReporteOficinaResponse
    | ReporteCajaHistoricoResponse
  > {
    switch (tab) {
      case 'cartera':
        return this.reportesSvc.getCartera(rutaId);
      case 'financiero':
        return this.reportesSvc.getFinanciero(fechaInicio, fechaFin, rutaId);
      case 'oficina':
        return this.reportesSvc.getOficina(fechaInicio, fechaFin, rutaId);
      case 'caja':
        return this.reportesSvc.getCajaHistorico(fechaInicio, fechaFin, rutaId);
    }
  }

  private setReportForTab(
    tab: ReporteTab,
    data:
      | ReporteCarteraResponse
      | ReporteFinancieroResponse
      | ReporteOficinaResponse
      | ReporteCajaHistoricoResponse
      | null,
  ): void {
    switch (tab) {
      case 'cartera':
        this.reporteCartera.set(data as ReporteCarteraResponse | null);
        break;
      case 'financiero':
        this.reporteFinanciero.set(data as ReporteFinancieroResponse | null);
        break;
      case 'oficina':
        this.reporteOficina.set(data as ReporteOficinaResponse | null);
        break;
      case 'caja':
        this.reporteCaja.set(data as ReporteCajaHistoricoResponse | null);
        break;
    }
  }

  private loadRutas(): void {
    if (this.rutas().length > 0) {
      return;
    }

    this.rutaSvc.getRutasByEmpresa().subscribe({
      next: ({ rutas }) => this.empresaSvc.setRutas(rutas),
      error: () => {
        this.utilsSvc.presentToast({
          message: 'Error al cargar las rutas',
          duration: 2500,
          color: 'danger',
        });
      },
    });
  }

  private extractDateValue(value: string | string[] | null | undefined): Date | null {
    const raw = Array.isArray(value) ? value[0] : value;
    if (!raw) {
      return null;
    }
    return new Date(raw);
  }

  private toApiDate(date: Date): string {
    return format(date, 'yyyy-MM-dd');
  }

  private validarRangoFechas(fechaInicio: string, fechaFin: string): string | null {
    const inicio = new Date(`${fechaInicio}T00:00:00`);
    const fin = new Date(`${fechaFin}T00:00:00`);

    if (inicio > fin) {
      return 'La fecha de inicio debe ser anterior o igual a la fecha de fin.';
    }

    if (differenceInDays(fin, inicio) > ReportesPage.MAX_RANGO_DIAS) {
      return `El rango máximo permitido es ${ReportesPage.MAX_RANGO_DIAS} días.`;
    }

    return null;
  }
}
