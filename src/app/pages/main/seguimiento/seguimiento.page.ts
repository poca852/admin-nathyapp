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
import {
  colorForCobrador as colorForCobradorHelper,
  filterPagosByRutaId,
  resolveRutaMeta as resolveRutaMetaHelper,
  resolveSelectedRutaId,
  toggleSelectedCobradorId,
} from 'src/app/helpers/seguimiento.helpers';

type PagoMapaDia = {
  id: string;
  monto: number;
  lng: number;
  lat: number;
  clienteNombre: string;
  clienteAlias?: string;
  at?: string;
  color: string;
  rutaId?: string;
  rutaNombre?: string;
  cobradorNombre?: string;
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

  /** Ruta del cobrador seleccionado (filtra pagos del mapa). */
  get selectedRutaId(): string | null {
    return resolveSelectedRutaId(this.selectedId, this.cobradores);
  }

  get selectedRutaNombre(): string | null {
    const rutaId = this.selectedRutaId;
    if (!rutaId) return null;
    return this.resolveRutaMeta(rutaId).rutaNombre || null;
  }

  /** Pagos visibles: todos, o solo los de la ruta del cobrador seleccionado. */
  get pagosVisibles(): PagoMapaDia[] {
    return filterPagosByRutaId(this.pagosDia, this.selectedRutaId);
  }

  selectCobrador(item: CobradorTrackingHoy): void {
    // Segundo clic desactiva el filtro y vuelve a mostrar todas las rutas
    this.selectedId = toggleSelectedCobradorId(this.selectedId, item.cobradorId);
    this.drawAllTrails();
    this.syncPagoMarkers();
    this.cdr.markForCheck();

    if (!this.selectedId) {
      this.fitAllMarkers();
      return;
    }

    const last = item.ultimaUbicacion;
    if (last && this.map) {
      this.map.flyTo({ center: [last.lng, last.lat], zoom: 15 });
    } else {
      this.fitVisiblePagos();
    }
  }

  clearRutaFilter(): void {
    this.selectedId = null;
    this.drawAllTrails();
    this.syncPagoMarkers();
    this.fitAllMarkers();
    this.cdr.markForCheck();
  }

  /** Color estable por cobrador (leyenda / marcador / trail / pagos). */
  colorForCobrador(cobradorId: string): string {
    return colorForCobradorHelper(cobradorId);
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
            .map((p) => {
              const rutaId = p.ruta ? String(p.ruta) : undefined;
              const meta = this.resolveRutaMeta(rutaId);
              return {
                id: String(p._id),
                monto: p.monto,
                lng: p.ubication[0],
                lat: p.ubication[1],
                clienteNombre: p.cliente?.nombre || 'Cliente',
                clienteAlias: p.cliente?.alias || undefined,
                at: p.createdAt || p.fecha,
                rutaId,
                rutaNombre: meta.rutaNombre,
                cobradorNombre: meta.cobradorNombre,
                color: meta.color,
              };
            });
          this.syncPagoMarkers();
          this.cdr.markForCheck();
        },
        error: () => {
          this.pagosDia = [];
        },
      }),
    );
  }

  /** Empareja ruta → cobrador (si está en lista) o color por rutaId. */
  private resolveRutaMeta(rutaId?: string): {
    color: string;
    rutaNombre?: string;
    cobradorNombre?: string;
  } {
    const rutas = this.empresaSvc.rutas() || this.empresaSvc.empresa()?.rutas || [];
    return resolveRutaMetaHelper(rutaId, this.cobradores, rutas);
  }

  private refreshPagoColors(): void {
    if (!this.pagosDia.length) return;
    this.pagosDia = this.pagosDia.map((p) => {
      const meta = this.resolveRutaMeta(p.rutaId);
      return {
        ...p,
        color: meta.color,
        rutaNombre: meta.rutaNombre || p.rutaNombre,
        cobradorNombre: meta.cobradorNombre || p.cobradorNombre,
      };
    });
    this.syncPagoMarkers();
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
          this.refreshPagoColors();
          this.syncMarkers();
          this.drawAllTrails();
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
          this.refreshPagoColors();
          this.syncMarkers();
          this.drawAllTrails();
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
          this.refreshPagoColors();
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
          this.drawAllTrails();
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
          type: 'FeatureCollection',
          features: [],
        },
      });
      this.map.addLayer({
        id: this.trailLayerId,
        type: 'line',
        source: this.trailSourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': [
            'case',
            ['==', ['get', 'selected'], 1],
            5.5,
            3,
          ],
          'line-opacity': [
            'case',
            ['==', ['get', 'selected'], 1],
            0.92,
            0.42,
          ],
        },
      });
      this.syncMarkers();
      this.syncPagoMarkers();
      this.drawAllTrails();
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

      const color = this.colorForCobrador(cob.cobradorId);
      const rutaNombre = this.resolveRutaMeta(cob.rutaId).rutaNombre;
      const popupHtml = `<strong>${this.escapeHtml(cob.nombre)}</strong><br/>${
        cob.online ? 'En línea' : 'Desconectado'
      }${
        rutaNombre
          ? `<br/><span style="color:#4b5563">Ruta: ${this.escapeHtml(rutaNombre)}</span>`
          : ''
      }`;
      let marker = this.markers.get(cob.cobradorId);
      if (!marker) {
        const el = document.createElement('div');
        el.className = 'cobrador-marker';
        el.innerHTML = `<span class="dot ${cob.online ? 'online' : 'offline'}" style="background:${color}; box-shadow:0 0 0 3px ${color}55"></span>`;
        marker = new Marker({ element: el })
          .setLngLat([loc.lng, loc.lat])
          .setPopup(new Popup({ offset: 16 }).setHTML(popupHtml))
          .addTo(this.map);
        this.markers.set(cob.cobradorId, marker);
      } else {
        marker.setLngLat([loc.lng, loc.lat]);
        marker.getPopup()?.setHTML(popupHtml);
        const el = marker.getElement();
        const dot = el.querySelector('.dot') as HTMLElement | null;
        if (dot) {
          dot.classList.toggle('online', cob.online);
          dot.classList.toggle('offline', !cob.online);
          dot.style.background = color;
          dot.style.boxShadow = `0 0 0 3px ${color}55`;
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

    for (const pago of this.pagosVisibles) {
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
      const rutaHtml = pago.rutaNombre
        ? `<div class="pago-popup-line">Ruta: ${this.escapeHtml(pago.rutaNombre)}</div>`
        : '';
      const cobradorHtml = pago.cobradorNombre
        ? `<div class="pago-popup-line">Cobrador: ${this.escapeHtml(pago.cobradorNombre)}</div>`
        : '';
      const popupHtml = `
        <div class="pago-popup">
          <div class="pago-popup-title">${nombre}</div>
          ${aliasHtml}
          ${rutaHtml}
          ${cobradorHtml}
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

  /** Dibuja todos los recorridos; el seleccionado resalta vía properties.selected. */
  private drawAllTrails(): void {
    if (!this.map) return;
    const source = this.map.getSource(this.trailSourceId) as GeoJSONSource | undefined;
    if (!source) return;

    const features = this.cobradores
      .map((cob) => {
        const coordinates = (cob.puntos ?? []).map((p) => [p.lng, p.lat]);
        if (coordinates.length < 2) return null;
        return {
          type: 'Feature' as const,
          properties: {
            color: this.colorForCobrador(cob.cobradorId),
            selected: this.selectedId === cob.cobradorId ? 1 : 0,
            cobradorId: cob.cobradorId,
          },
          geometry: {
            type: 'LineString' as const,
            coordinates,
          },
        };
      })
      .filter((f): f is NonNullable<typeof f> => !!f);

    source.setData({
      type: 'FeatureCollection',
      features,
    });
  }

  private fitAllMarkers(): void {
    if (!this.map) return;
    const coords: [number, number][] = this.cobradores
      .map((c) => c.ultimaUbicacion)
      .filter((u): u is NonNullable<typeof u> => !!u)
      .map((u) => [u.lng, u.lat] as [number, number]);

    if (this.showPagosDia) {
      for (const p of this.pagosVisibles) {
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

  private fitVisiblePagos(): void {
    if (!this.map || !this.showPagosDia) return;
    const coords = this.pagosVisibles.map(
      (p) => [p.lng, p.lat] as [number, number],
    );
    if (coords.length === 0) return;
    if (coords.length === 1) {
      this.map.flyTo({ center: coords[0], zoom: 15 });
      return;
    }
    const bounds = coords.reduce(
      (b, c) => b.extend(c),
      new LngLatBounds(coords[0], coords[0]),
    );
    this.map.fitBounds(bounds, { padding: 60, maxZoom: 15 });
  }
}
