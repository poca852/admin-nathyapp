import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { GeoJSONSource, LngLatBounds, Map as MapboxMap, Marker, Popup } from 'mapbox-gl';

import { EmpresaService } from 'src/app/services/empresa.service';
import { TrackingService } from 'src/app/services/tracking.service';
import { PagosService } from 'src/app/services/pagos.service';
import {
  CobradorLocationEvent,
  CobradorPresenceEvent,
  CobradorTrackingHoy,
  TrackingSnapshotEvent,
  WsService,
} from 'src/app/services/ws.service';
import { UtilsService } from 'src/app/services/utils.service';

type PagoMapaDia = {
  id: string;
  monto: number;
  lng: number;
  lat: number;
  clienteNombre: string;
  clienteAlias?: string;
  at?: string;
  color: string;
};

@Component({
  selector: 'app-seguimiento',
  templateUrl: './seguimiento.page.html',
  styleUrls: ['./seguimiento.page.scss'],
})
export class SeguimientoPage implements OnDestroy {
  @ViewChild('mapContainer') mapContainer?: ElementRef<HTMLDivElement>;

  private readonly empresaSvc = inject(EmpresaService);
  private readonly trackingSvc = inject(TrackingService);
  private readonly pagosSvc = inject(PagosService);
  private readonly ws = inject(WsService);
  private readonly utilsSvc = inject(UtilsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);

  cobradores: CobradorTrackingHoy[] = [];
  selectedId: string | null = null;
  loading = false;
  showPagosDia = true;
  pagosDia: PagoMapaDia[] = [];

  private map?: MapboxMap;
  private markers = new Map<string, Marker>();
  private pagoMarkers = new Map<string, Marker>();
  private subs = new Subscription();
  private resizeObserver?: ResizeObserver;
  private trailSourceId = 'cobrador-trail';
  private trailLayerId = 'cobrador-trail-line';
  private snapshotTimer?: ReturnType<typeof setInterval>;
  private didFitBounds = false;

  ionViewWillEnter(): void {
    this.loading = true;
    this.didFitBounds = false;
    this.loadHttp();
    this.loadPagosDia();
    this.bindSocket();
    this.requestSnapshotWhenReady();
  }

  ionViewDidEnter(): void {
    setTimeout(() => this.initMap(), 50);
  }

  ionViewWillLeave(): void {
    this.clearSnapshotTimer();
    this.subs.unsubscribe();
    this.subs = new Subscription();
    this.destroyMap();
  }

  ngOnDestroy(): void {
    this.clearSnapshotTimer();
    this.subs.unsubscribe();
    this.destroyMap();
  }

  get onlineCount(): number {
    return this.cobradores.filter((c) => c.online).length;
  }

  selectCobrador(item: CobradorTrackingHoy): void {
    this.selectedId = item.cobradorId;
    this.drawTrail(item);
    const last = item.ultimaUbicacion;
    if (last && this.map) {
      this.map.flyTo({ center: [last.lng, last.lat], zoom: 15 });
    }
  }

  togglePagosDia(): void {
    this.showPagosDia = !this.showPagosDia;
    this.syncPagoMarkers();
    this.cdr.markForCheck();
  }

  /** Llamado desde el toggle del template (ngModel ya actualizó showPagosDia). */
  syncPagoMarkersFromToggle(): void {
    this.syncPagoMarkers();
    this.cdr.markForCheck();
  }

  private loadPagosDia(): void {
    const empresaId = this.resolveEmpresaId();
    if (!empresaId) return;

    this.subs.add(
      this.pagosSvc.getPagosConUbicacionEmpresa(empresaId, new Date()).subscribe({
        next: (list) => {
          this.pagosDia = (list ?? [])
            .filter((p) => Array.isArray(p.ubication) && p.ubication.length === 2)
            .map((p) => ({
              id: String(p._id),
              monto: p.monto,
              lng: p.ubication[0],
              lat: p.ubication[1],
              clienteNombre: p.cliente?.nombre || 'Cliente',
              clienteAlias: p.cliente?.alias || undefined,
              at: p.createdAt || p.fecha,
              color: this.colorForPagoId(String(p._id)),
            }));
          this.syncPagoMarkers();
          this.cdr.markForCheck();
        },
        error: () => {
          this.pagosDia = [];
        },
      }),
    );
  }

  private resolveEmpresaId(): string | null {
    const fromSvc = this.empresaSvc.empresa()?.id;
    if (fromSvc) return fromSvc;

    const user = this.utilsSvc.getFromLocalStorage('user') as {
      empresa?: string | { id?: string; _id?: string };
    } | null;

    const empresa = user?.empresa;
    if (!empresa) return null;
    if (typeof empresa === 'string') return empresa;
    return empresa.id || empresa._id || null;
  }

  private clearSnapshotTimer(): void {
    if (this.snapshotTimer != null) {
      clearInterval(this.snapshotTimer);
      this.snapshotTimer = undefined;
    }
  }

  private requestSnapshotWhenReady(): void {
    this.clearSnapshotTimer();

    const tryRequest = () => {
      if (this.ws.connected) {
        this.ws.requestTrackingSnapshot();
        return true;
      }
      return false;
    };

    if (tryRequest()) return;

    let attempts = 0;
    this.snapshotTimer = setInterval(() => {
      attempts++;
      if (tryRequest() || attempts > 20) {
        this.clearSnapshotTimer();
      }
    }, 500);
  }

  private loadHttp(): void {
    const empresaId = this.resolveEmpresaId();

    if (!empresaId) {
      this.loading = false;
      this.utilsSvc.presentToast({
        message: 'No se pudo resolver la empresa para seguimiento',
        color: 'warning',
        duration: 2500,
      });
      return;
    }

    this.subs.add(
      this.trackingSvc.getEmpresaHoy(empresaId).subscribe({
        next: (list) => {
          this.mergeCobradores(list);
          this.loading = false;
          this.syncMarkers();
          if (!this.didFitBounds) {
            this.fitAllMarkers();
            this.didFitBounds = true;
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.utilsSvc.presentToast({
            message: 'No se pudo cargar el seguimiento',
            color: 'danger',
            duration: 2500,
          });
          this.cdr.markForCheck();
        },
      }),
    );
  }

  private bindSocket(): void {
    this.subs.add(
      this.ws.onTrackingSnapshot().subscribe((snap: TrackingSnapshotEvent) => {
        this.ngZone.run(() => {
          this.mergeCobradores(snap.cobradores ?? []);
          this.syncMarkers();
          if (!this.didFitBounds) {
            this.fitAllMarkers();
            this.didFitBounds = true;
          }
          this.cdr.detectChanges();
        });
      }),
    );

    this.subs.add(
      this.ws.onCobradorPresence().subscribe((ev: CobradorPresenceEvent) => {
        this.ngZone.run(() => {
          this.upsertPresence(ev);
          this.syncMarkers();
          this.cdr.detectChanges();
        });
      }),
    );

    this.subs.add(
      this.ws.onCobradorLocation().subscribe((ev: CobradorLocationEvent) => {
        this.ngZone.run(() => {
          this.upsertLocation(ev);
          this.syncMarkers();
          if (this.selectedId === ev.cobradorId) {
            const current = this.cobradores.find((c) => c.cobradorId === ev.cobradorId);
            if (current) this.drawTrail(current);
          }
          this.cdr.detectChanges();
        });
      }),
    );
  }

  private mergeCobradores(list: CobradorTrackingHoy[]): void {
    const map = new Map(this.cobradores.map((c) => [c.cobradorId, c]));
    for (const item of list) {
      const prev = map.get(item.cobradorId);
      map.set(item.cobradorId, {
        ...prev,
        ...item,
        puntos: item.puntos?.length ? item.puntos : prev?.puntos ?? [],
      });
    }
    this.cobradores = [...map.values()].sort((a, b) => {
      if (a.online !== b.online) return a.online ? -1 : 1;
      return a.nombre.localeCompare(b.nombre);
    });
  }

  private upsertPresence(ev: CobradorPresenceEvent): void {
    const idx = this.cobradores.findIndex((c) => c.cobradorId === ev.cobradorId);
    if (idx >= 0) {
      this.cobradores[idx] = {
        ...this.cobradores[idx],
        online: ev.online,
        nombre: ev.nombre,
        rutaId: ev.rutaId ?? this.cobradores[idx].rutaId,
      };
    } else if (ev.online) {
      this.cobradores.push({
        cobradorId: ev.cobradorId,
        nombre: ev.nombre,
        rutaId: ev.rutaId,
        online: true,
        puntos: [],
      });
    }
    this.cobradores = [...this.cobradores].sort((a, b) => {
      if (a.online !== b.online) return a.online ? -1 : 1;
      return a.nombre.localeCompare(b.nombre);
    });
  }

  private upsertLocation(ev: CobradorLocationEvent): void {
    const idx = this.cobradores.findIndex((c) => c.cobradorId === ev.cobradorId);
    const punto = { lng: ev.lng, lat: ev.lat, at: ev.at };

    if (idx >= 0) {
      const prev = this.cobradores[idx];
      const last = prev.puntos?.[prev.puntos.length - 1];
      const samePoint =
        last &&
        Math.abs(last.lng - punto.lng) < 1e-7 &&
        Math.abs(last.lat - punto.lat) < 1e-7;

      const puntos = samePoint ? [...(prev.puntos ?? [])] : [...(prev.puntos ?? []), punto];
      this.cobradores[idx] = {
        ...prev,
        online: true,
        nombre: ev.nombre,
        rutaId: ev.rutaId ?? prev.rutaId,
        ultimaUbicacion: punto,
        puntos,
      };
    } else {
      this.cobradores.push({
        cobradorId: ev.cobradorId,
        nombre: ev.nombre,
        rutaId: ev.rutaId,
        online: true,
        ultimaUbicacion: punto,
        puntos: [punto],
      });
    }
    this.cobradores = [...this.cobradores];
  }

  private initMap(): void {
    if (this.map || !this.mapContainer?.nativeElement) return;

    this.map = new MapboxMap({
      container: this.mapContainer.nativeElement,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-99.1332, 19.4326],
      zoom: 11,
      trackResize: true,
    });

    this.map.on('load', () => {
      if (!this.map) return;
      this.map.addSource(this.trailSourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: [] },
        },
      });
      this.map.addLayer({
        id: this.trailLayerId,
        type: 'line',
        source: this.trailSourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#2563eb', 'line-width': 4, 'line-opacity': 0.85 },
      });
      this.syncMarkers();
      this.syncPagoMarkers();
      this.fitAllMarkers();
    });

    this.resizeObserver = new ResizeObserver(() => this.map?.resize());
    this.resizeObserver.observe(this.mapContainer.nativeElement);
  }

  private destroyMap(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    for (const marker of this.markers.values()) {
      marker.remove();
    }
    this.markers.clear();
    for (const marker of this.pagoMarkers.values()) {
      marker.remove();
    }
    this.pagoMarkers.clear();
    this.map?.remove();
    this.map = undefined;
  }

  private syncMarkers(): void {
    if (!this.map) return;

    const activeIds = new Set<string>();

    for (const cob of this.cobradores) {
      const loc = cob.ultimaUbicacion;
      if (!loc) continue;
      activeIds.add(cob.cobradorId);

      let marker = this.markers.get(cob.cobradorId);
      const popupHtml = `<strong>${this.escapeHtml(cob.nombre)}</strong><br/>${
        cob.online ? 'En línea' : 'Desconectado'
      }`;
      if (!marker) {
        const el = document.createElement('div');
        el.className = 'cobrador-marker';
        el.innerHTML = `<span class="dot ${cob.online ? 'online' : 'offline'}"></span>`;
        marker = new Marker({ element: el })
          .setLngLat([loc.lng, loc.lat])
          .setPopup(new Popup({ offset: 16 }).setHTML(popupHtml))
          .addTo(this.map);
        this.markers.set(cob.cobradorId, marker);
      } else {
        marker.setLngLat([loc.lng, loc.lat]);
        marker.getPopup()?.setHTML(popupHtml);
        const el = marker.getElement();
        const dot = el.querySelector('.dot');
        if (dot) {
          dot.classList.toggle('online', cob.online);
          dot.classList.toggle('offline', !cob.online);
        }
      }
    }

    for (const [id, marker] of this.markers) {
      if (!activeIds.has(id)) {
        marker.remove();
        this.markers.delete(id);
      }
    }
  }

  private syncPagoMarkers(): void {
    if (!this.map) return;

    if (!this.showPagosDia) {
      for (const marker of this.pagoMarkers.values()) {
        marker.remove();
      }
      this.pagoMarkers.clear();
      return;
    }

    const activeIds = new Set<string>();

    for (const pago of this.pagosDia) {
      activeIds.add(pago.id);
      let marker = this.pagoMarkers.get(pago.id);
      const hora = pago.at
        ? new Date(pago.at).toLocaleTimeString('es', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : '';
      const nombre = this.escapeHtml(pago.clienteNombre || 'Cliente');
      const alias = pago.clienteAlias?.trim();
      const aliasHtml = alias
        ? `<div class="pago-popup-line">Alias: ${this.escapeHtml(alias)}</div>`
        : '';
      const montoTxt = Number(pago.monto).toLocaleString('es', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
      const popupHtml = `
        <div class="pago-popup">
          <div class="pago-popup-title">${nombre}</div>
          ${aliasHtml}
          <div class="pago-popup-line">Pago: $${montoTxt}</div>
          ${hora ? `<div class="pago-popup-line">${hora}</div>` : ''}
        </div>
      `;

      const labelText = alias
        ? this.escapeHtml(alias.length > 16 ? `${alias.slice(0, 15)}…` : alias)
        : '';

      if (!marker) {
        const el = document.createElement('div');
        el.className = 'pago-marker';
        el.innerHTML = `
          ${labelText ? `<span class="pago-marker-label">${labelText}</span>` : ''}
          <span class="dot-pago" style="background:${pago.color}"></span>
        `;
        marker = new Marker({ element: el, anchor: 'bottom' })
          .setLngLat([pago.lng, pago.lat])
          .setPopup(
            new Popup({
              offset: 18,
              closeButton: true,
              maxWidth: '240px',
              className: 'pago-map-popup',
            }).setHTML(popupHtml),
          )
          .addTo(this.map);
        this.pagoMarkers.set(pago.id, marker);
      } else {
        marker.setLngLat([pago.lng, pago.lat]);
        const root = marker.getElement();
        const dot = root.querySelector('.dot-pago') as HTMLElement | null;
        if (dot) dot.style.background = pago.color;

        let labelEl = root.querySelector('.pago-marker-label') as HTMLElement | null;
        if (labelText) {
          if (!labelEl) {
            labelEl = document.createElement('span');
            labelEl.className = 'pago-marker-label';
            root.insertBefore(labelEl, root.firstChild);
          }
          labelEl.textContent = alias!.length > 16 ? `${alias!.slice(0, 15)}…` : alias!;
        } else if (labelEl) {
          labelEl.remove();
        }

        marker.getPopup()?.setHTML(popupHtml);
      }
    }

    for (const [id, marker] of this.pagoMarkers) {
      if (!activeIds.has(id)) {
        marker.remove();
        this.pagoMarkers.delete(id);
      }
    }
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** Color estable por id (parece aleatorio, no cambia al refrescar). */
  private colorForPagoId(id: string): string {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    const hue = Math.abs(hash) % 360;
    const sat = 62 + (Math.abs(hash >> 8) % 20);
    const light = 42 + (Math.abs(hash >> 16) % 12);
    return `hsl(${hue} ${sat}% ${light}%)`;
  }

  private drawTrail(item: CobradorTrackingHoy): void {
    if (!this.map) return;
    const source = this.map.getSource(this.trailSourceId) as GeoJSONSource | undefined;
    if (!source) return;

    const coordinates = (item.puntos ?? []).map((p) => [p.lng, p.lat]);
    source.setData({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: coordinates.length >= 2 ? coordinates : [],
      },
    });
  }

  private fitAllMarkers(): void {
    if (!this.map) return;
    const coords: [number, number][] = this.cobradores
      .map((c) => c.ultimaUbicacion)
      .filter((u): u is NonNullable<typeof u> => !!u)
      .map((u) => [u.lng, u.lat] as [number, number]);

    if (this.showPagosDia) {
      for (const p of this.pagosDia) {
        coords.push([p.lng, p.lat]);
      }
    }

    if (coords.length === 0) return;
    if (coords.length === 1) {
      this.map.flyTo({ center: coords[0], zoom: 14 });
      return;
    }

    const bounds = coords.reduce(
      (b, c) => b.extend(c),
      new LngLatBounds(coords[0], coords[0]),
    );
    this.map.fitBounds(bounds, { padding: 60, maxZoom: 15 });
  }
}
