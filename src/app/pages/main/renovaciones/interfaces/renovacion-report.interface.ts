
export interface RenovacionDetalle {
  cliente: string;
  alias?: string;
  monto: number;
  fecha: Date;
}

export interface RutaReport {
  rutaId: string;
  nombre: string;
  renovaciones: RenovacionDetalle[];
  totalMonto: number;
  cantidad: number;
}

export interface EmpresaReport {
  empresaId: string;
  nombre: string;
  rutas: RutaReport[];
  totalEmpresa: number;
  cantidadEmpresa: number;
}
