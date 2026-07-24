import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';

export interface CajaLockEvent {
  ruta: string;
  isLocked: boolean;
}

export interface CajaCloseEvent {
  ruta: string;
  status?: boolean;
}

export interface CobradorPresenceEvent {
  cobradorId: string;
  nombre: string;
  rutaId?: string;
  online: boolean;
  at: string;
}

export interface CobradorLocationEvent {
  cobradorId: string;
  nombre: string;
  rutaId?: string;
  lng: number;
  lat: number;
  at: string;
}

export interface TrackingPuntoDto {
  lng: number;
  lat: number;
  at: string;
  accuracy?: number;
}

export interface CobradorTrackingHoy {
  cobradorId: string;
  nombre: string;
  rutaId?: string;
  online: boolean;
  ultimaUbicacion?: TrackingPuntoDto;
  puntos: TrackingPuntoDto[];
}

export interface TrackingSnapshotEvent {
  empresaId: string;
  cobradores: CobradorTrackingHoy[];
}

@Injectable({
  providedIn: 'root'
})
export class WsService {

  constructor(private socket: Socket) { }

  connect(token?: string): void {
    const io = this.socket.ioSocket as {
      auth?: { token?: string };
      connected?: boolean;
    };

    if (token) {
      // Si ya hay sesión viva con el mismo token, no forzar reconnect
      // (evita "WebSocket is closed before the connection is established").
      if (io?.connected && io.auth?.token === token) {
        return;
      }
      io.auth = { token };
    }

    if (io?.connected) {
      this.socket.disconnect();
    }
    this.socket.connect();
  }

  disconnect(): void {
    if (this.socket.ioSocket?.connected) {
      this.socket.disconnect();
    }
  }

  get connected(): boolean {
    return !!this.socket.ioSocket?.connected;
  }

  /** Observable de conexión / reconexión (útil para re-pedir snapshots). */
  onConnect(): Observable<void> {
    return this.socket.fromEvent<void>('connect');
  }

  emit(event: string, payload?: any, callback?: Function) {
    if (!this.connected) return;
    if (typeof callback === 'function') {
      this.socket.emit(event, payload, callback);
      return;
    }
    if (payload !== undefined) {
      this.socket.emit(event, payload);
      return;
    }
    this.socket.emit(event);
  }

  listen<T = any>(event: string): Observable<T> {
    return this.socket.fromEvent<T>(event);
  }

  blockCaja(rutaId: string): void {
    this.emit('admin-block-caja', { ruta: rutaId });
  }

  unblockCaja(rutaId: string): void {
    this.emit('admin-unblock-caja', { ruta: rutaId });
  }

  closeCaja(rutaId: string): void {
    this.emit('admin-close-caja', { ruta: rutaId });
  }

  onBlockCaja(): Observable<CajaLockEvent> {
    return this.listen<CajaLockEvent>('block-caja');
  }

  onUnblockCaja(): Observable<CajaLockEvent> {
    return this.listen<CajaLockEvent>('unblock-caja');
  }

  onCloseCaja(): Observable<CajaCloseEvent> {
    return this.listen<CajaCloseEvent>('close-caja');
  }

  requestTrackingSnapshot(): void {
    this.emit('tracking:subscribe');
  }

  onCobradorPresence(): Observable<CobradorPresenceEvent> {
    return this.listen<CobradorPresenceEvent>('cobrador:presence');
  }

  onCobradorLocation(): Observable<CobradorLocationEvent> {
    return this.listen<CobradorLocationEvent>('cobrador:location');
  }

  onTrackingSnapshot(): Observable<TrackingSnapshotEvent> {
    return this.listen<TrackingSnapshotEvent>('tracking:snapshot');
  }
}
