import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import {
  WsAuthEvent,
  WsAuthEventSummaryItem,
  WsAuthFailureReason,
} from 'src/app/models/ws-auth-event.interface';
import { WsAuthEventsService } from 'src/app/services/ws-auth-events.service';
import { UtilsService } from 'src/app/services/utils.service';

type ReasonFilter = 'ALL' | WsAuthFailureReason;
type HoursFilter = 6 | 24 | 48 | 168;

const REASON_LABELS: Record<WsAuthFailureReason, string> = {
  NO_TOKEN: 'Sin token',
  NO_SID: 'Sin sid',
  USER_NOT_FOUND: 'Usuario no existe',
  USER_INACTIVE: 'Usuario inactivo',
  NO_ACTIVE_SESSION: 'Sin sesión activa',
  SESSION_MISMATCH: 'Sesión distinta',
  NO_EMPRESA: 'Sin empresa',
  JWT_EXPIRED: 'JWT expirado',
  JWT_INVALID: 'JWT inválido',
};

@Component({
  selector: 'app-sa-noc',
  templateUrl: './sa-noc.page.html',
  styleUrls: ['./sa-noc.page.scss'],
})
export class SaNocPage implements OnInit, OnDestroy {
  private readonly eventsSvc = inject(WsAuthEventsService);
  private readonly utilsSvc = inject(UtilsService);
  private readonly router = inject(Router);
  private navSub?: Subscription;

  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly events = signal<WsAuthEvent[]>([]);
  readonly summary = signal<WsAuthEventSummaryItem[]>([]);
  readonly total = signal(0);
  readonly searchQuery = signal('');
  readonly reasonFilter = signal<ReasonFilter>('ALL');
  readonly hoursFilter = signal<HoursFilter>(48);
  readonly selected = signal<WsAuthEvent | null>(null);

  readonly filtered = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const list = this.events();
    if (!q) return list;
    return list.filter((e) => {
      const hay = [
        e.message,
        e.reason,
        e.userNombre,
        e.username,
        e.userId,
        e.empresaId,
        e.ipAddress,
        e.userRol,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  });

  readonly summaryTotal = computed(() =>
    this.summary().reduce((acc, s) => acc + s.count, 0),
  );

  ngOnInit(): void {
    this.navSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        if (this.isListUrl(e.urlAfterRedirects || e.url)) {
          this.refresh();
        }
      });
    this.refresh();
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }

  ionViewWillEnter(): void {
    this.refresh();
  }

  private isListUrl(url: string): boolean {
    return /\/super-admin\/noc\/?$/.test(url.split('?')[0]);
  }

  refresh(event?: CustomEvent): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.eventsSvc
      .getEvents({
        reason: this.reasonFilter(),
        hours: this.hoursFilter(),
        limit: 200,
      })
      .pipe(
        finalize(() => {
          this.loading.set(false);
          (event?.target as HTMLIonRefresherElement)?.complete?.();
        }),
      )
      .subscribe({
        next: (res) => {
          this.events.set(
            (res.items || []).map((e) => ({
              ...e,
              _id: e._id || (e as any).id,
              id: (e as any).id || e._id,
            })),
          );
          this.summary.set(res.summary || []);
          this.total.set(res.total ?? 0);
        },
        error: () => {
          this.loadError.set(true);
          this.utilsSvc.presentToast({
            message: 'No se pudieron cargar los eventos WS',
            duration: 3000,
            color: 'danger',
            icon: 'alert-circle-outline',
          });
        },
      });
  }

  onSearch(ev: CustomEvent): void {
    this.searchQuery.set(String((ev.detail as { value?: string })?.value || ''));
  }

  onReasonFilterChange(ev: CustomEvent): void {
    this.reasonFilter.set(
      ((ev.detail as { value?: ReasonFilter })?.value || 'ALL') as ReasonFilter,
    );
    this.refresh();
  }

  onHoursFilterChange(ev: CustomEvent): void {
    const value = Number((ev.detail as { value?: number })?.value) as HoursFilter;
    this.hoursFilter.set(value || 48);
    this.refresh();
  }

  openDetail(event: WsAuthEvent): void {
    this.selected.set(event);
  }

  closeDetail(): void {
    this.selected.set(null);
  }

  reasonLabel(reason: WsAuthFailureReason): string {
    return REASON_LABELS[reason] || reason;
  }

  reasonColor(reason: WsAuthFailureReason): string {
    switch (reason) {
      case 'JWT_EXPIRED':
        return 'warning';
      case 'USER_INACTIVE':
      case 'USER_NOT_FOUND':
        return 'danger';
      case 'SESSION_MISMATCH':
      case 'NO_ACTIVE_SESSION':
        return 'tertiary';
      case 'NO_TOKEN':
      case 'NO_SID':
      case 'JWT_INVALID':
        return 'medium';
      default:
        return 'primary';
    }
  }

  whoLabel(e: WsAuthEvent): string {
    return e.userNombre || e.username || e.userId || 'Desconocido';
  }

  formatDate(value?: string | null): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString();
  }

  trackById(_: number, item: WsAuthEvent): string {
    return item._id || item.id || item.createdAt;
  }
}
