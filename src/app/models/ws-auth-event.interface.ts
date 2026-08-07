export type WsAuthFailureReason =
  | 'NO_TOKEN'
  | 'NO_SID'
  | 'USER_NOT_FOUND'
  | 'USER_INACTIVE'
  | 'NO_ACTIVE_SESSION'
  | 'SESSION_MISMATCH'
  | 'NO_EMPRESA'
  | 'JWT_EXPIRED'
  | 'JWT_INVALID';

export interface WsAuthEvent {
  _id: string;
  id?: string;
  reason: WsAuthFailureReason;
  message: string;
  userId?: string;
  username?: string;
  userNombre?: string;
  userRol?: string;
  empresaId?: string;
  userEstado?: boolean;
  tokenSid?: string;
  hasActiveSession?: boolean;
  activeSessionExpiresAt?: string | null;
  socketId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface WsAuthEventSummaryItem {
  reason: WsAuthFailureReason;
  count: number;
}

export interface WsAuthEventsResponse {
  items: WsAuthEvent[];
  total: number;
  hours: number;
  limit: number;
  summary: WsAuthEventSummaryItem[];
}
