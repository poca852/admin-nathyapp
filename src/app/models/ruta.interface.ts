import { Caja } from './caja.interface';

export interface Ruta {
   id: string;
   _id?: string;
   nombre: string
   ciudad: string;
   pais: string;
   status: boolean;
   isLocked: boolean;
   caja_actual: string | Caja;
   ultima_caja: string | Caja;
   empresa?: string;
   autoOpen: boolean;
   ultima_apertura: string;
   ultimo_cierre: string;
   cartera: number;
   total_clientes: number;
   clientes_activos: number;
   ganancia_total: number;
   timeZone: string;
   currency: string;
}
