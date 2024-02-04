import { Component, OnInit, inject } from '@angular/core';
import { UtilsService } from '../../../services/utils.service';
import { PagosService } from '../../../services/pagos.service';
import { Pago, Ruta } from 'src/app/models';
import * as moment from 'moment';
import { RutaService } from '../../../services/ruta.service';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'table-pagos',
  templateUrl: './table-pagos.component.html',
  styleUrls: ['./table-pagos.component.scss'],
})
export class TablePagosComponent  implements OnInit {

  private utilsSvc = inject(UtilsService);
  private pagosSvc = inject(PagosService);
  private rutaSvc = inject(RutaService);
  private notificacionSvc = inject(NotificacionesService);
  private changeRutaNotificacion: Subscription;

  public readonly today = moment().utc(true).format('DD/MM/YYYY');

  constructor() { 
    // this.changeRutaNotificacion = this.notificacionSvc.changeRuta$.subscribe(() => {
    //   this.pagosSvc.getPagosByRutaAndDate(this.ruta._id, this.today)
    // })
  }

  ngOnInit() {}

  get pagos(): Pago[] {
    return this.pagosSvc.pagos();
  }

  // get ruta(): Ruta {
  //   return this.rutaSvc.currentRuta();
  // }

}
