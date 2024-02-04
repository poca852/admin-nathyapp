import { Component, OnInit, inject, Output, EventEmitter } from '@angular/core';
import { RutaService } from '../../../services/ruta.service';
import { UtilsService } from '../../../services/utils.service';
import { Ruta } from 'src/app/models';
import { FormBuilder, FormControl } from '@angular/forms';
import { NotificacionesService } from '../../../services/notificaciones.service';
import { EmpresaService } from '../../../services/empresa.service';

@Component({
  selector: 'select-ruta',
  templateUrl: './select-ruta.component.html',
  styleUrls: ['./select-ruta.component.scss'],
})
export class SelectRutaComponent  implements OnInit {

  @Output()
  onEmitRuta = new EventEmitter<Ruta>();

  private utilsSvc = inject(UtilsService);
  private fb = inject(FormBuilder);
  private comunicacionSvc = inject(NotificacionesService);
  private empresaSvc = inject(EmpresaService);

  public rutaControl: FormControl = this.fb.control(null);

  constructor() { }

  ngOnInit() {}

  get rutas() {
    return this.empresaSvc.empresa()?.rutas;
  }

  public async handleChangeSelect(e): Promise<void> {

    const loading = await this.utilsSvc.loading({message: 'Cambiando ruta'});
    await loading.present();

    const selectRuta = this.rutas.find( (ruta) => ruta._id === e.detail.value);

    this.onEmitRuta.emit(selectRuta);
    
    this.empresaSvc.setRuta(selectRuta);
    this.comunicacionSvc.notificarChangeRuta();

    await loading.dismiss();

  }

}
