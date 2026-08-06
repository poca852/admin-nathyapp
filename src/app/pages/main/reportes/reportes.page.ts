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
  METRIC_GLOSSARY,
  ChartPeriodPoint,
  ChartRutaPoint,
  ReporteCajaHistoricoResponse,
  ReporteCarteraResponse,
  ReporteFinancieroResponse,
  ReporteOficinaResponse,
  ReporteTab,
  SerieDiariaFinanciero,
} from 'src/app/models/reportes.interface';
import { EmpresaService } from 'src/app/services/empresa.service';
import { ReportesService } from 'src/app/services/reportes.service';
import { RutaService } from 'src/app/services/ruta.service';
import { UtilsService } from 'src/app/services/utils.service';
import { resolveRutaCurrency } from 'src/app/helpers/money.helpers';

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.page.html',
  styleUrls: ['./reportes.page.scss'],
})
export class ReportesPage {
  private static readonly MAX_RANGO_DIAS = 365;
  private static readonly CHART_DAILY_LIMIT = 45;

  private readonly destroyRef = inject(DestroyRef);
  private readonly reportesSvc = inject(ReportesService);
  private readonly rutaSvc = inject(RutaService);
  private readonly empresaSvc = inject(EmpresaService);
  private readonly utilsSvc = inject(UtilsService);

  public readonly glossary = METRIC_GLOSSARY;
  public readonly activeTab = signal<ReporteTab>('cartera');
  public readonly fechaInicio = signal(this.toApiDate(startOfMonth(new Date())));
  public readonly fechaFin = signal(this.toApiDate(new Date()));
  public readonly selectedRouteId = signal<string>('all');
  public readonly refreshTrigger = signal(0);
  public readonly showGlossary = signal(false);
  public readonly exporting = signal(false);

  public readonly loading = signal(false);
  public readonly error = signal<string | null>(null);

  public readonly reporteCartera = signal<ReporteCarteraResponse | null>(null);
  public readonly reporteFinanciero = signal<ReporteFinancieroResponse | null>(null);
  public readonly reporteOficina = signal<ReporteOficinaResponse | null>(null);
  public readonly reporteCaja = signal<ReporteCajaHistoricoResponse | null>(null);
  public readonly reporteGraficas = signal<ReporteFinancieroResponse | null>(null);

  public readonly rutas = computed(() => this.empresaSvc.rutas());
  /** Moneda del filtro de ruta (o la primera disponible si es "todas"). */
  public readonly reportCurrency = computed(() => {
    const rutas = this.rutas();
    const selected = this.selectedRouteId();
    if (selected !== 'all') {
      const match = rutas.find((r) => r.id === selected || r._id === selected);
      if (match) return resolveRutaCurrency(match);
    }
    const first = rutas.find((r) => r.currency || r.pais);
    return first ? resolveRutaCurrency(first) : 'USD';
  });
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
      case 'graficas':
        return !!this.reporteGraficas();
    }
  });

  public readonly gastosPorCategoriaEntries = computed(() => {
    const categorias = this.reporteOficina()?.gastosPorCategoria ?? {};
    return Object.entries(categorias).sort(([, a], [, b]) => b - a);
  });

  public readonly maxFinancieroCobros = computed(() => {
    const series = this.reporteFinanciero()?.seriesDiarias ?? [];
    return Math.max(...series.map((d) => d.cobros), 1);
  });

  public readonly maxCajaCobro = computed(() => {
    const series = this.reporteCaja()?.seriesDiarias ?? [];
    return Math.max(...series.map((d) => d.cobro), 1);
  });

  public readonly chartPeriodPoints = computed((): ChartPeriodPoint[] => {
    const series = this.reporteGraficas()?.seriesDiarias ?? [];
    return this.buildPeriodChartPoints(series);
  });

  public readonly chartPeriodHint = computed(() => {
    const series = this.reporteGraficas()?.seriesDiarias ?? [];
    if (series.length === 0) return '';
    if (series.length <= ReportesPage.CHART_DAILY_LIMIT) {
      return 'Cada barra es un día.';
    }
    if (series.length <= 120) {
      return 'Hay muchos días: se agrupan por semana para que se vea claro.';
    }
    return 'Hay muchos días: se agrupan por mes para que se vea claro.';
  });

  public readonly maxChartPrestadoCobrado = computed(() => {
    const points = this.chartPeriodPoints();
    return Math.max(...points.flatMap((p) => [p.cobros, p.prestamos]), 1);
  });

  public readonly maxChartGananciaGastos = computed(() => {
    const points = this.chartPeriodPoints();
    return Math.max(...points.flatMap((p) => [p.ganancia, p.gastos]), 1);
  });

  public readonly chartRutaPoints = computed((): ChartRutaPoint[] => {
    const rutas = this.reporteGraficas()?.rutas ?? [];
    return [...rutas]
      .map((r) => ({
        rutaId: r.rutaId,
        nombre: r.nombre,
        cobros: r.cobros ?? 0,
        prestamos: r.prestamosOtorgados ?? 0,
        ganancia: r.interesCobrado ?? 0,
        gastos: r.gastos ?? 0,
      }))
      .sort((a, b) => b.cobros - a.cobros);
  });

  public readonly maxChartRuta = computed(() => {
    const points = this.chartRutaPoints();
    return Math.max(...points.flatMap((p) => [p.cobros, p.prestamos, p.ganancia]), 1);
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

  toggleGlossary(): void {
    this.showGlossary.update((v) => !v);
  }

  tip(key: keyof typeof METRIC_GLOSSARY): string {
    return this.glossary[key] ?? '';
  }

  barWidth(value: number, max: number): string {
    if (!max || max <= 0) return '0%';
    return `${Math.min(100, Math.round((value / max) * 100))}%`;
  }

  formatDisplayDate(isoDate: string): string {
    const [year, month, day] = isoDate.split('-').map(Number);
    return format(new Date(year, month - 1, day), 'dd MMM yyyy');
  }

  trackByRutaId(_index: number, ruta: { rutaId: string }): string {
    return ruta.rutaId;
  }

  currencyForRuta(rutaId: string, fallbackCurrency?: string | null): string {
    const match = this.rutas().find((r) => r.id === rutaId || r._id === rutaId);
    if (match) return resolveRutaCurrency(match);
    return resolveRutaCurrency({ currency: fallbackCurrency }) || this.reportCurrency();
  }

  trackByFecha(_index: number, item: { fecha: string }): string {
    return item.fecha;
  }

  trackByChartLabel(_index: number, item: { label: string }): string {
    return item.label;
  }

  exportBackup(): void {
    if (this.exporting()) return;
    this.exporting.set(true);

    this.reportesSvc.downloadBackup().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-creditos-${this.toApiDate(new Date())}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        this.exporting.set(false);
        this.utilsSvc.presentToast({
          message: 'Archivo descargado',
          duration: 2000,
          color: 'success',
        });
      },
      error: () => {
        this.exporting.set(false);
        this.utilsSvc.presentToast({
          message: 'No se pudo descargar el archivo',
          duration: 2500,
          color: 'danger',
        });
      },
    });
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
              this.error.set('No se pudo cargar el reporte. Revisa las fechas e intenta de nuevo.');
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
      case 'graficas':
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
        this.reporteCartera.set(
          data ? this.normalizeCartera(data as ReporteCarteraResponse) : null,
        );
        break;
      case 'financiero':
        this.reporteFinanciero.set(
          data ? this.normalizeFinanciero(data as ReporteFinancieroResponse) : null,
        );
        break;
      case 'oficina':
        this.reporteOficina.set(data as ReporteOficinaResponse | null);
        break;
      case 'caja':
        this.reporteCaja.set(
          data ? this.normalizeCaja(data as ReporteCajaHistoricoResponse) : null,
        );
        break;
      case 'graficas':
        this.reporteGraficas.set(
          data ? this.normalizeFinanciero(data as ReporteFinancieroResponse) : null,
        );
        break;
    }
  }

  private buildPeriodChartPoints(series: SerieDiariaFinanciero[]): ChartPeriodPoint[] {
    if (series.length === 0) {
      return [];
    }

    if (series.length <= ReportesPage.CHART_DAILY_LIMIT) {
      return series.map((d) => ({
        label: this.formatShortDate(d.fecha),
        cobros: d.cobros ?? 0,
        prestamos: d.prestamosOtorgados ?? 0,
        ganancia: d.interesCobrado ?? 0,
        gastos: d.gastos ?? 0,
      }));
    }

    if (series.length <= 120) {
      return this.aggregateByWeek(series);
    }

    return this.aggregateByMonth(series);
  }

  private aggregateByWeek(series: SerieDiariaFinanciero[]): ChartPeriodPoint[] {
    const buckets = new Map<string, ChartPeriodPoint & { sortKey: string }>();

    for (const d of series) {
      const date = this.parseIsoDate(d.fecha);
      const weekStart = this.startOfWeekMonday(date);
      const key = this.toApiDate(weekStart);
      const existing = buckets.get(key);
      if (!existing) {
        buckets.set(key, {
          label: `Sem ${this.formatShortDate(key)}`,
          cobros: d.cobros ?? 0,
          prestamos: d.prestamosOtorgados ?? 0,
          ganancia: d.interesCobrado ?? 0,
          gastos: d.gastos ?? 0,
          sortKey: key,
        });
      } else {
        existing.cobros += d.cobros ?? 0;
        existing.prestamos += d.prestamosOtorgados ?? 0;
        existing.ganancia += d.interesCobrado ?? 0;
        existing.gastos += d.gastos ?? 0;
      }
    }

    return Array.from(buckets.values())
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(({ sortKey: _s, ...point }) => point);
  }

  private aggregateByMonth(series: SerieDiariaFinanciero[]): ChartPeriodPoint[] {
    const buckets = new Map<string, ChartPeriodPoint>();

    for (const d of series) {
      const key = d.fecha.slice(0, 7);
      const existing = buckets.get(key);
      if (!existing) {
        buckets.set(key, {
          label: this.formatMonthLabel(key),
          cobros: d.cobros ?? 0,
          prestamos: d.prestamosOtorgados ?? 0,
          ganancia: d.interesCobrado ?? 0,
          gastos: d.gastos ?? 0,
        });
      } else {
        existing.cobros += d.cobros ?? 0;
        existing.prestamos += d.prestamosOtorgados ?? 0;
        existing.ganancia += d.interesCobrado ?? 0;
        existing.gastos += d.gastos ?? 0;
      }
    }

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, point]) => point);
  }

  private formatShortDate(isoDate: string): string {
    const [year, month, day] = isoDate.split('-').map(Number);
    return format(new Date(year, month - 1, day), 'dd/MM');
  }

  private formatMonthLabel(yyyyMm: string): string {
    const [year, month] = yyyyMm.split('-').map(Number);
    return format(new Date(year, month - 1, 1), 'MMM yyyy');
  }

  private parseIsoDate(isoDate: string): Date {
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private startOfWeekMonday(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    result.setDate(result.getDate() + diff);
    return result;
  }

  private normalizeCartera(report: ReporteCarteraResponse): ReporteCarteraResponse {
    const t = report.totalesEmpresa;
    const interesContractual = t.interesContractual ?? t.gananciaPotencial ?? 0;
    const cajaTotal = t.cajaTotalEmpresa ?? 0;
    const cartera = t.cartera ?? 0;
    const creditosActivos =
      t.creditosActivos ??
      (t.distribucionEstado?.BUENO ?? 0) +
        (t.distribucionEstado?.REGULAR ?? 0) +
        (t.distribucionEstado?.MALO ?? 0);

    return {
      ...report,
      totalesEmpresa: {
        ...t,
        interesContractual,
        gananciaPotencial: t.gananciaPotencial ?? interesContractual,
        interesPendiente: t.interesPendiente ?? 0,
        interesCobradoAcumulado: t.interesCobradoAcumulado ?? 0,
        cajaTotalEmpresa: cajaTotal,
        liquidezOperativa: t.liquidezOperativa ?? cajaTotal + cartera,
        creditosActivos,
      },
      rutas: (report.rutas ?? []).map((r) => {
        const contractual = r.interesContractual ?? r.gananciaPotencial ?? 0;
        const cajaActual = r.cajaActual ?? 0;
        return {
          ...r,
          interesContractual: contractual,
          gananciaPotencial: r.gananciaPotencial ?? contractual,
          interesPendiente: r.interesPendiente ?? 0,
          interesCobradoAcumulado: r.interesCobradoAcumulado ?? 0,
          cajaActual,
          liquidezOperativa: r.liquidezOperativa ?? cajaActual + (r.cartera ?? 0),
          creditosActivos:
            r.creditosActivos ??
            (r.distribucionEstado?.BUENO ?? 0) +
              (r.distribucionEstado?.REGULAR ?? 0) +
              (r.distribucionEstado?.MALO ?? 0),
        };
      }),
    };
  }

  private normalizeFinanciero(report: ReporteFinancieroResponse): ReporteFinancieroResponse {
    const t = report.totalesEmpresa;
    return {
      ...report,
      totalesEmpresa: {
        ...t,
        retiros: t.retiros ?? 0,
        inversiones: t.inversiones ?? 0,
        resultadoPeriodo:
          t.resultadoPeriodo ??
          Number(((t.interesCobrado ?? 0) - (t.gastos ?? 0)).toFixed(2)),
      },
    };
  }

  private normalizeCaja(report: ReporteCajaHistoricoResponse): ReporteCajaHistoricoResponse {
    const t = report.totalesEmpresa;
    const cajaFinalUltimoDia =
      t.cajaFinalUltimoDia ??
      (report.rutas ?? []).reduce((sum, ruta) => {
        const serie = ruta.seriesDiarias ?? [];
        if (!serie.length) return sum;
        return sum + (serie[serie.length - 1].cajaFinal ?? 0);
      }, 0);

    return {
      ...report,
      totalesEmpresa: {
        ...t,
        retiro: t.retiro ?? 0,
        inversion: t.inversion ?? 0,
        cajaFinalUltimoDia,
      },
    };
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
      return 'La fecha “Desde” no puede ser después de la fecha “Hasta”.';
    }

    if (differenceInDays(fin, inicio) > ReportesPage.MAX_RANGO_DIAS) {
      return `Solo se pueden consultar hasta ${ReportesPage.MAX_RANGO_DIAS} días a la vez.`;
    }

    return null;
  }
}
