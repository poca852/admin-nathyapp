import { Component, OnDestroy, OnInit } from '@angular/core';
import { NotificacionesService } from './services/notificaciones.service';
import { Subscription } from 'rxjs';
import { EmpresaService } from './services/empresa.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {

  private logOutSubs: Subscription;

  constructor(
    private notificacionesSvc: NotificacionesService,
    private empresaSvc: EmpresaService,
  ) {}

  ngOnDestroy(): void {
    this.logOutSubs.unsubscribe()
  }

  ngOnInit(): void {
    this.logOutSubs = this.notificacionesSvc.logOut$.subscribe(( ) => {
      this.empresaSvc.removeRuta();
      this.empresaSvc.removeRutas();
    })
  }

}
