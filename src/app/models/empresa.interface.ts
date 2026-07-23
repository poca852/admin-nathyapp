import { Ruta, User } from "./";

export type SubscriptionStatus = 'ACTIVE' | 'GRACE' | 'OVERDUE' | 'SUSPENDED';

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
   isSubscriptionPaid?: boolean;
   subscriptionGraceDays?: number;
   accessSuspended?: boolean;
   accessSuspendedAt?: string | null;
   accessSuspendedReason?: 'PAYMENT' | 'MANUAL' | null;
   subscriptionStatus?: SubscriptionStatus;
   daysPastDue?: number;
}

export interface ResponseBackup {
   file: any,
   sentEmail: boolean
}
