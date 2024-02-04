import { Credito } from "./";

export interface Cliente {
   _id: string;
   status: boolean;
   state: boolean;
   dpi: string;
   nombre: string;
   alias: string;
   ciudad: string;
   direccion: string;
   telefono: string;
   img?: string;
   ruta: string;
   creditos: Credito[];
   ubication: number[];
   document_image?: string;
   business_image?: string;
   house_image?: string;
}

export interface CreateCliente {
  dpi: string;
  nombre: string;
  alias: string;
  ciudad: string;
  direccion: string;
  telefono: string;
  ruta?: string;
}