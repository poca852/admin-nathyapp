import { Pago, Cliente, Ruta } from "./";

export enum TipoDeCliente {
  BUENO = 'BUENO',
  REGULAR = 'REGULAR',
  MALO = 'MALO',
};

export enum FrecuenciaCobro {
  DIARIO = "diario",
  SEMANAL = "semanal"
}

export interface Credito {
  id?: string;
  _id: string;
  pagos: Pago[];
  status: boolean;
  valor_credito: number;
  interes: number;
  total_cuotas: number;
  total_pagar: number;
  abonos: number;
  saldo: number;
  valor_cuota: number;
  fecha_inicio: string;
  dueDate: Date;
  cliente: Cliente;
  ruta: string;
  ultimo_pago: string;
  notas?: string;
  atraso: number;
  dias_transcurridos?: number;
  frecuencia_cobro: FrecuenciaCobro;
  se_cobran_domingos: boolean;
  turno: number;
  state?: TipoDeCliente;
  daysOverdue?: number;
}

export interface NuevoCredito {
  valor_credito: number;
  interes?: number;
  total_cuotas: number;
  frecuencia_cobro: FrecuenciaCobro;
  se_cobran_domingos: boolean;
  total_pagar?: number;
  saldo?: number;
  valor_cuota?: number;
  fecha_inicio: string;
  cliente?: string;
  ruta?: string;
  notas?: string;
  esAutomatico: boolean;
}

export interface HistorialCredito {
  _id: string;
  valor_credito: number;
  interes: number;
  fecha_inicio: Date;
  frecuencia_cobro: string;
  total_cuotas: number;
  ultimo_pago: Date;
  dias_tardados_en_pagar: number;
}
