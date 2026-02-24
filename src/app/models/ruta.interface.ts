
export interface Ruta {
   id: string;
   _id?: string;
   nombre: string
   ciudad: string;
   pais: string;
   status: boolean;
   isLocked: boolean;
   caja_actual: string;
   ultima_caja: string;
   empresa?: string;
   autoOpen: boolean;
}
