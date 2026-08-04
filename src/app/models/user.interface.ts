import { Empresa, Ruta } from "./";

export interface User {
   _id?: string;
   id?: string;
   nombre: string;
   rol: string;
   estado: boolean;
   username: string;
   password?: string;
   ruta?: Ruta;
   rutas?: Array<Ruta | string>;
   empresa: string;
   token?: string;
   ubication?: number[];
   /** Sesión única activa (expuesto por API para admins). */
   hasActiveSession?: boolean;
   activeSessionExpiresAt?: string | Date | null;
 }
 export interface AddUser{
  nombre: string;
  username: string;
  password?: string;
  ruta?: string;
  rutas?: string[];
  rol: string;
 }
