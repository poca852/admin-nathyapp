import { Injectable } from '@angular/core';
import { UtilsService } from './utils.service';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root'
})
export class WsService {

  constructor(
    private socket: Socket,
    private utiilsSvc: UtilsService,
  ) { }

  emit( event: string, payload?: any, callback?: Function ) {
    this.socket.emit( event, payload, callback );
  }

  listen( event: string ) {
    return this.socket.fromEvent( event );
  }
  
}
