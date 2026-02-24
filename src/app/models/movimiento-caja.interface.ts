import { CategoriaGasto } from "./categoria-gasto.enum";
import { SubTipo } from "./sub-tipo.enum";
import { TipoMovimiento } from "./tipo-movimiento.enum";

export interface MovimientoCaja {
  id: string;
  caja: string;
  monto: number;
  tipoMovimiento: TipoMovimiento;
  subTipo: SubTipo;
  ruta: string;
  fecha: Date;
  createdAt: Date;
  updatedAt: Date;
  concepto?: string;
  comentario?: string;
  cliente?: {
    nombre: string,
    id: string,
    alias: string
  };
  credito?: string;
  categoriaGasto?: CategoriaGasto;
}
