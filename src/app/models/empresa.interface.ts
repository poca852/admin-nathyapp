import { Ruta, User } from "./";

export interface Empresa {
   _id?: string;
   name: string;
   email?: string;
   dayOfPay: number;
   country: string;
   owner?: User; 
   employes: User[];
   rutas: Ruta[];
}

export interface ResponseBackup {
   file: any,
   sentEmail: boolean
}