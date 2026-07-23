import { Ruta, User } from "./";

export type BaseCalculoMora = 'VALOR_CUOTA' | 'SALDO' | 'VALOR_CREDITO';

export interface MoraConfig {
  cobraMora: boolean;
  permiteMoraVoluntaria: boolean;
  porcentajeMora: number;
  baseCalculoMora: BaseCalculoMora;
}

export interface Empresa {
   id: string;
   name: string;
   email?: string;
   phone?: string;
   dayOfPay: number;
   country: string;
   owner?: User;
   employes: User[];
   rutas: Ruta[];
   cobraMora?: boolean;
   permiteMoraVoluntaria?: boolean;
   porcentajeMora?: number;
   baseCalculoMora?: BaseCalculoMora;
}

export interface ResponseBackup {
   file: any,
   sentEmail: boolean
}
