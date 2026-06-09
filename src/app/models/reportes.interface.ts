export interface PeriodoReporte {
  fechaInicio: string;
  fechaFin: string;
}

export interface DistribucionEstado {
  BUENO: number;
  REGULAR: number;
  MALO: number;
}

export interface TotalesCarteraEmpresa {
  cartera: number;
  capitalPrestado: number;
  gananciaPotencial: number;
  totalClientes: number;
  clientesActivos: number;
  clientesMorosos: number;
  porcentajeMorosidad: number;
  distribucionEstado: DistribucionEstado;
}

export interface ReporteCarteraRuta {
  rutaId: string;
  nombre: string;
  cartera: number;
  capitalPrestado: number;
  gananciaPotencial: number;
  totalClientes: number;
  clientesActivos: number;
  clientesMorosos: number;
  distribucionEstado: DistribucionEstado;
}

export interface ReporteCarteraResponse {
  empresaId: string;
  nombre: string;
  totalesEmpresa: TotalesCarteraEmpresa;
  rutas: ReporteCarteraRuta[];
}

export interface TotalesFinancieroEmpresa {
  cobros: number;
  prestamosOtorgados: number;
  interesCobrado: number;
  gastos: number;
  retiros: number;
  inversiones: number;
}

export interface SerieDiariaFinanciero {
  fecha: string;
  cobros: number;
  prestamosOtorgados: number;
  interesCobrado: number;
  gastos: number;
}

export interface ReporteFinancieroRuta {
  rutaId: string;
  nombre: string;
  cobros: number;
  prestamosOtorgados: number;
  interesCobrado: number;
  gastos: number;
  retiros: number;
  inversiones: number;
}

export interface ReporteFinancieroResponse {
  empresaId: string;
  nombre: string;
  periodo: PeriodoReporte;
  totalesEmpresa: TotalesFinancieroEmpresa;
  seriesDiarias: SerieDiariaFinanciero[];
  rutas: ReporteFinancieroRuta[];
}

export interface MovimientoDetalle {
  id: string;
  monto: number;
  concepto: string;
  comentario: string;
  categoriaGasto?: string;
  fecha: Date | string;
}

export interface GrupoMovimiento {
  total: number;
  movimientos: MovimientoDetalle[];
}

export interface GrupoGastos extends GrupoMovimiento {
  porCategoria: Record<string, number>;
}

export interface ReporteOficinaRuta {
  rutaId: string;
  nombre: string;
  timeZone: string;
  currency: string;
  gastos: GrupoGastos;
  retiros: GrupoMovimiento;
  inversiones: GrupoMovimiento;
}

export interface TotalesOficinaEmpresa {
  gastos: number;
  retiros: number;
  inversiones: number;
  netoCapital: number;
}

export interface ReporteOficinaResponse {
  empresaId: string;
  nombre: string;
  periodo: PeriodoReporte;
  totalesEmpresa: TotalesOficinaEmpresa;
  gastosPorCategoria: Record<string, number>;
  rutas: ReporteOficinaRuta[];
}

export interface SerieDiariaCaja {
  fecha: string;
  cobro: number;
  prestamo: number;
  gasto: number;
  cajaFinal: number;
  pretendido: number;
  eficienciaCobro: number | null;
}

export interface TotalesCajaHistoricoEmpresa {
  cobro: number;
  prestamo: number;
  gasto: number;
  retiro: number;
  inversion: number;
  promedioEficienciaCobro: number;
}

export interface ReporteCajaHistoricoRuta {
  rutaId: string;
  nombre: string;
  seriesDiarias: SerieDiariaCaja[];
}

export interface ReporteCajaHistoricoResponse {
  empresaId: string;
  nombre: string;
  periodo: PeriodoReporte;
  totalesEmpresa: TotalesCajaHistoricoEmpresa;
  seriesDiarias: SerieDiariaCaja[];
  rutas: ReporteCajaHistoricoRuta[];
}

export type ReporteTab = 'cartera' | 'financiero' | 'oficina' | 'caja';

export interface ReporteQueryParams {
  fechaInicio?: string;
  fechaFin?: string;
  rutaId?: string;
}
