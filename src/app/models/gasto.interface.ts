import { ListaDeGastos } from "./";

export interface Gasto{
   _id?: string;
   gasto: ListaDeGastos;
   fecha: Date;
   valor: number;
   nota?: string;
   ruta: string;
}

export interface NewGasto {
   gasto: string,
   valor: string,
   nota?: string;
   ruta?: string,
   fecha?: Date | string,
}