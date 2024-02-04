import { Ruta } from "./";

export interface Caja {
   _id: string;
   fecha: string;
   base: number;
   inversion: number;
   retiro: number;
   gasto: number;
   cobro: number;
   prestamo: number;
   total_clientes: number;
   clientes_pendientes: number;
   renovaciones: number;
   caja_final: number
   pretendido: number
   extra: number;
   ruta: Ruta;
 }