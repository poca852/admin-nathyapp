export type AnnouncementType =
  | 'UPDATE'
  | 'PAYMENT_REMINDER'
  | 'WARNING'
  | 'INFO';

export type AnnouncementSeverity = 'info' | 'warning' | 'critical';

export type AnnouncementScope = 'GLOBAL' | 'EMPRESA' | 'MULTI';

export type AnnouncementAudience = 'ADMIN' | 'SUPERVISOR';

export type AnnouncementReceiptStatus =
  | 'unread'
  | 'read'
  | 'acknowledged'
  | 'dismissed';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  type: AnnouncementType;
  severity: AnnouncementSeverity;
  scope: AnnouncementScope;
  empresaIds: string[];
  audience: AnnouncementAudience[];
  startsAt: string;
  endsAt?: string | null;
  dismissible: boolean;
  requiresAck: boolean;
  isActive: boolean;
  createdBy?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  dismissed?: boolean;
  acknowledged?: boolean;
  read?: boolean;
}

export type CreateAnnouncementPayload = {
  title: string;
  body: string;
  type?: AnnouncementType;
  severity?: AnnouncementSeverity;
  scope?: AnnouncementScope;
  empresaIds?: string[];
  audience?: AnnouncementAudience[];
  startsAt?: string;
  endsAt?: string;
  dismissible?: boolean;
  requiresAck?: boolean;
  isActive?: boolean;
};

export interface AnnouncementReceiptSummary {
  audienceTotal: number;
  read: number;
  acknowledged: number;
  dismissed: number;
  unread: number;
}

export interface AnnouncementReceiptRecipient {
  userId: string;
  name: string;
  username?: string;
  rol: string;
  empresaId?: string | null;
  empresaName?: string | null;
  readAt: string | null;
  acknowledgedAt: string | null;
  dismissedAt: string | null;
  status: AnnouncementReceiptStatus;
}

export interface AnnouncementReceiptsReport {
  announcementId: string;
  title: string;
  summary: AnnouncementReceiptSummary;
  recipients: AnnouncementReceiptRecipient[];
}
