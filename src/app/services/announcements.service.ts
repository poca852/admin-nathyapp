import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Observable, Subscription, tap } from 'rxjs';

import { environment } from 'src/environments/environment';
import {
  Announcement,
  AuthStatus,
  CreateAnnouncementPayload,
} from '../models';
import { Roles } from '../models/roles.enum';
import { AuthService } from './auth.service';
import { EmpresaService } from './empresa.service';
import { WsService } from './ws.service';

@Injectable({
  providedIn: 'root',
})
export class AnnouncementsService {
  private readonly http = inject(HttpClient);
  private readonly authSvc = inject(AuthService);
  private readonly empresaSvc = inject(EmpresaService);
  private readonly ws = inject(WsService);
  private readonly baseUrl = environment.baseUrl;

  private readonly _items = signal<Announcement[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private wsSub?: Subscription;

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly visibleBanners = computed(() =>
    this._items().filter(
      (a) =>
        a.isActive !== false &&
        !a.dismissed &&
        !(a.requiresAck && a.acknowledged),
    ),
  );

  readonly criticalBanner = computed(
    () =>
      this.visibleBanners().find((a) => a.severity === 'critical') ??
      this.visibleBanners()[0] ??
      null,
  );

  readonly unreadCount = computed(() => this.visibleBanners().length);

  constructor() {
    effect(
      () => {
        const status = this.authSvc.authStatus();
        const user = this.authSvc.currentUser();
        const isTenantAdmin =
          !!user &&
          (user.rol === Roles.admin || user.rol === Roles.supervisor);

        if (status === AuthStatus.authenticated && isTenantAdmin) {
          this.loadMine();
          this.bindWs();
        } else {
          this.unbindWs();
          this._items.set([]);
        }
      },
      { allowSignalWrites: true },
    );
  }

  loadMine(): void {
    this._loading.set(true);
    this._error.set(null);
    this.http.get<Announcement[]>(`${this.baseUrl}/announcements/me`).subscribe({
      next: (list) => {
        this._items.set(
          (list || []).map((a: any) => ({
            ...a,
            id: a.id || a._id,
          })),
        );
        this._loading.set(false);
      },
      error: () => {
        this._error.set('No se pudieron cargar los avisos');
        this._loading.set(false);
      },
    });
  }

  listAll(): Observable<Announcement[]> {
    return this.http.get<Announcement[]>(`${this.baseUrl}/announcements`);
  }

  create(payload: CreateAnnouncementPayload): Observable<Announcement> {
    return this.http.post<Announcement>(`${this.baseUrl}/announcements`, payload);
  }

  update(
    id: string,
    payload: Partial<CreateAnnouncementPayload>,
  ): Observable<Announcement> {
    return this.http.patch<Announcement>(
      `${this.baseUrl}/announcements/${id}`,
      payload,
    );
  }

  deactivate(id: string): Observable<Announcement> {
    return this.http.post<Announcement>(
      `${this.baseUrl}/announcements/${id}/deactivate`,
      {},
    );
  }

  remove(id: string): Observable<{ ok: boolean; id: string }> {
    return this.http.delete<{ ok: boolean; id: string }>(
      `${this.baseUrl}/announcements/${id}`,
    );
  }

  dismiss(id: string): Observable<{ ok: boolean }> {
    const prev = this._items();
    this._items.update((list) => list.filter((a) => a.id !== id));

    return this.http
      .post<{ ok: boolean }>(`${this.baseUrl}/announcements/${id}/dismiss`, {})
      .pipe(
        tap({
          error: () => this._items.set(prev),
        }),
      );
  }

  acknowledge(id: string): Observable<{ ok: boolean }> {
    this._items.update((list) =>
      list.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)),
    );

    return this.http.post<{ ok: boolean }>(
      `${this.baseUrl}/announcements/${id}/ack`,
      {},
    );
  }

  upsertLocal(announcement: Announcement): void {
    const normalized = {
      ...announcement,
      id: announcement.id || (announcement as any)._id,
      dismissed: false,
    };
    this._items.update((list) => {
      const idx = list.findIndex((a) => a.id === normalized.id);
      if (idx >= 0) {
        const copy = [...list];
        copy[idx] = { ...copy[idx], ...normalized };
        return copy;
      }
      return [normalized, ...list];
    });
  }

  private bindWs(): void {
    if (this.wsSub) return;

    this.wsSub = new Subscription();
    this.wsSub.add(
      this.ws.listen<Announcement>('announcement:new').subscribe((payload) => {
        if (!payload?.id && !(payload as any)?._id) return;
        this.upsertLocal(payload);
        if (payload.type === 'PAYMENT_REMINDER') {
          this.empresaSvc.patchSubscriptionLocal({ isSubscriptionPaid: false });
        }
      }),
    );
    this.wsSub.add(
      this.ws
        .listen<{
          isSubscriptionPaid?: boolean;
          subscriptionStatus?: string;
          dayOfPay?: number;
        }>('subscription:updated')
        .subscribe((payload) => {
          if (!payload) return;
          this.empresaSvc.patchSubscriptionLocal({
            isSubscriptionPaid: payload.isSubscriptionPaid,
            subscriptionStatus: payload.subscriptionStatus as any,
            dayOfPay: payload.dayOfPay,
          });
          if (payload.isSubscriptionPaid) {
            // Quitar recordatorios locales ya no vigentes
            this._items.update((list) =>
              list.filter((a) => a.type !== 'PAYMENT_REMINDER'),
            );
          } else {
            this.loadMine();
          }
        }),
    );
  }

  private unbindWs(): void {
    this.wsSub?.unsubscribe();
    this.wsSub = undefined;
  }
}
