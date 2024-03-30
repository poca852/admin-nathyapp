import { Caja } from "./";

export interface Ruta {
   _id: string;
   nombre: string
   clientes: number;
   clientes_activos: number;
   gastos: number;
   inversiones: number;
   retiros: number;
   ciudad: string;
   pais: string;
   estado: string;
   cartera: number
   total_cobrado: number;
   total_prestado: number;
   status: boolean;
   isLocked: boolean;
   ultimo_cierre: string;
   ultima_apertura: string;
   ingresar_gastos_cobrador: boolean;
   caja_actual: Caja;
   ultima_caja: Caja;
   turno: number;
   empresa?: string;
   autoOpen: boolean;
}