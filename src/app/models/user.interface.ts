import { Empresa, Ruta } from "./";

export interface User {
   _id: string;
   nombre: string;
   rol: string;
   estado: boolean;
   username: string;
   password?: string;
   ruta?: Ruta;
   rutas?: string[];
   empresa: string;
   token?: string;
   ubication: number[];
   close_ruta?: boolean;
 }

 export interface AddUser{
  nombre: string;
  username: string;
  password: string;
  ruta?: string;
  rutas?: string[];
  rol: any[];
  close_ruta?: boolean;
 }