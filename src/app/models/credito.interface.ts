import { Pago, Cliente, Ruta } from "./";

export enum TipoDeCliente {
   BUENO="success",
   REGULAR="warning",
   MALO="danger"
};

export enum FrecuenciaCobro {
  DIARIO="diario",
  SEMANAL="semanal"
}

export interface Credito {
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
  cliente: Cliente;
  ruta: Ruta;
  ultimo_pago: string;
  notas?: string;
  atraso: number;
  dias_transcurridos?: number;
  frecuencia_cobro: FrecuenciaCobro;
  se_cobran_domingos: boolean;
  turno: number;
  clasificacion?: TipoDeCliente;
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