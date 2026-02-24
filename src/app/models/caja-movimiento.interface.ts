import { CategoriaGasto } from "./categoria-gasto.enum";
import { SubTipo } from "./sub-tipo.enum";
import { TipoMovimiento } from "./tipo-movimiento.enum";

export interface CajaMovimiento {
  id: string;
  caja: string;
  monto: number;
  tipoMovimiento: TipoMovimiento;
  subTipo: SubTipo;
  ruta: string;
  createdAt: Date;
  updatedAt: Date;
  concepto?: string;
  comentario?: string;
  cliente?: string;
  credito?: string;
  categoriaGasto?: CategoriaGasto;
}
