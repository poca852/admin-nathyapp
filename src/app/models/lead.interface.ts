export type LeadStatus = 'NEW' | 'CONTACTED' | 'CONVERTED' | 'REJECTED';

export interface Lead {
  _id?: string;
  id?: string;
  nombre: string;
  email: string;
  phone: string;
  empresaNombre: string;
  origen?: string;
  status: LeadStatus;
  notas?: string;
  empresaId?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConvertLeadPayload {
  username: string;
  password: string;
  country?: string;
  dayOfPay?: number;
}

export interface ConvertLeadResponse {
  ok: boolean;
  lead: Lead;
  empresaId: string;
  userId: string;
}
