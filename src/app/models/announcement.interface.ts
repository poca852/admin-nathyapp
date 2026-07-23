export type AnnouncementType =
  | 'UPDATE'
  | 'PAYMENT_REMINDER'
  | 'WARNING'
  | 'INFO';

export type AnnouncementSeverity = 'info' | 'warning' | 'critical';

export type AnnouncementScope = 'GLOBAL' | 'EMPRESA' | 'MULTI';

export type AnnouncementAudience = 'ADMIN' | 'SUPERVISOR';

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
