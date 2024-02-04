import { Cliente, Credito } from "./";

export interface Pago{
   _id?: string;
   fecha: string;
   valor: number;
   ruta?: string;
   credito?: Credito;
   cliente?: Cliente;
   observaciones?: string;
 }

 export interface PagoResponse {
  pago: Pago;
  message: string;
  urlMessage: string;
 }
 