import { Component, OnInit, effect, inject, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';

import { UtilsService } from '../../../services/utils.service';
import { Ruta } from 'src/app/models';
import { NotificacionesService } from '../../../services/notificaciones.service';
import { EmpresaService } from '../../../services/empresa.service';

@Component({
  selector: 'select-ruta',
  templateUrl: './select-ruta.component.html',
  styleUrls: ['./select-ruta.component.scss'],
})
export class SelectRutaComponent implements OnInit {
  @Output()
  onEmitRuta = new EventEmitter<Ruta>();

  private readonly utilsSvc = inject(UtilsService);
  private readonly fb = inject(FormBuilder);
  private readonly comunicacionSvc = inject(NotificacionesService);
  private readonly empresaSvc = inject(EmpresaService);

  public rutaControl: FormControl = this.fb.control(null);

  get rutas() {
    return this.empresaSvc.rutas();
  }

  constructor() {
    // Mantener el select alineado con la ruta global (p. ej. al venir de Caja)
    effect(() => {
      const current = this.empresaSvc.ruta();
      if (current?.id && this.rutaControl.value !== current.id) {
        this.rutaControl.setValue(current.id, { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    const current = this.empresaSvc.ruta();
    if (current?.id) {
      this.rutaControl.setValue(current.id, { emitEvent: false });
    }
  }

  public async handleChangeSelect(e): Promise<void> {
    const loading = await this.utilsSvc.loading({ message: 'Cambiando ruta' });
    await loading.present();

    const selectRuta = this.rutas.find((ruta) => ruta.id === e.detail.value);

    this.onEmitRuta.emit(selectRuta);
    this.empresaSvc.setRuta(selectRuta);
    this.comunicacionSvc.notificarChangeRuta();

    await loading.dismiss();
  }
}
