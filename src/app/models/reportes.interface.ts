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
  /** @deprecated Alias de interesContractual */
  gananciaPotencial: number;
  interesContractual: number;
  interesPendiente: number;
  interesCobradoAcumulado: number;
  cajaTotalEmpresa: number;
  liquidezOperativa: number;
  totalClientes: number;
  clientesActivos: number;
  creditosActivos: number;
  /** Créditos REGULAR o MALO (nombre histórico) */
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
  interesContractual: number;
  interesPendiente: number;
  interesCobradoAcumulado: number;
  cajaActual: number;
  liquidezOperativa: number;
  totalClientes: number;
  clientesActivos: number;
  creditosActivos: number;
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
  resultadoPeriodo: number;
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
  cajaFinalUltimoDia: number;
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

export type ReporteTab = 'cartera' | 'financiero' | 'oficina' | 'caja' | 'graficas';

export interface ChartPeriodPoint {
  label: string;
  cobros: number;
  prestamos: number;
  ganancia: number;
  gastos: number;
}

export interface ChartRutaPoint {
  rutaId: string;
  nombre: string;
  cobros: number;
  prestamos: number;
  ganancia: number;
  gastos: number;
}

export interface ReporteQueryParams {
  fechaInicio?: string;
  fechaFin?: string;
  rutaId?: string;
}

/** Textos de ayuda en lenguaje sencillo para el administrador. */
export const METRIC_GLOSSARY: Record<string, string> = {
  cartera:
    'Lo que todavía te deben los clientes con crédito activo.',
  capitalPrestado:
    'Cuánto dinero prestaste en total (el monto original de cada crédito).',
  interesContractual:
    'La ganancia completa que tendrías si todos los créditos activos se pagan hasta el final. No es lo que ya cobraste.',
  interesPendiente:
    'De esa ganancia, cuánto todavía te falta por cobrar.',
  interesCobradoAcumulado:
    'De esa ganancia, cuánto ya te han pagado.',
  cajaTotalEmpresa:
    'El dinero que hay ahora en las cajas de todas las rutas.',
  liquidezOperativa:
    'El dinero en caja más lo que te deben. Es como ver “todo tu dinero” junto.',
  morosidad:
    'De cada 100 créditos, cuántos van atrasados (Regular o Malo).',
  interesCobrado:
    'Cuánto de lo cobrado en estas fechas corresponde a ganancia (interés), no a capital.',
  cobros: 'Todo el dinero que entró por pagos de clientes en estas fechas.',
  prestamos: 'Todo el dinero que salió en préstamos nuevos en estas fechas.',
  gastos: 'Todo lo que se gastó en estas fechas.',
  retiros: 'Dinero que se sacó de la caja en estas fechas.',
  inversiones: 'Dinero que se metió a la caja en estas fechas.',
  resultadoPeriodo: 'La ganancia cobrada menos los gastos de estas fechas.',
  netoCapital: 'Dinero metido a la caja menos dinero sacado.',
  pretendido: 'La meta de cobro del día (lo que se esperaba cobrar).',
  eficienciaCobro: 'De la meta del día, qué porcentaje se logró cobrar.',
  cajaFinal:
    'Cuánto dinero quedó en la caja al final del día.',
  cajaFinalUltimoDia:
    'Cuánto dinero había en caja el último día con registro en estas fechas.',
};
