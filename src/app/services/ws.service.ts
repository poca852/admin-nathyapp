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

@Injectable({
  providedIn: 'root'
})
export class WsService {

  constructor(private socket: Socket) { }

  emit(event: string, payload?: any, callback?: Function) {
    this.socket.emit(event, payload, callback);
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
}
