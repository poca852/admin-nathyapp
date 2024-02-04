import { Component, Input, OnInit } from '@angular/core';
import { RutaService } from '../../../services/ruta.service';
import { Ruta } from 'src/app/models';
import { UtilsService } from '../../../services/utils.service';
import { EmpresaService } from '../../../services/empresa.service';

@Component({
  selector: 'card-ruta',
  templateUrl: './card-ruta.component.html',
  styleUrls: ['./card-ruta.component.scss'],
})
export class CardRutaComponent  implements OnInit {

  @Input()
  ruta: Ruta;

  constructor(
    private rutaSvc: RutaService,
    private utilsSvc: UtilsService,
    private empresaSvc: EmpresaService
  ) { }

  ngOnInit() {}

  updateRutas() {
    console.log('hello')
    this.empresaSvc.setEmpresa();
  }

}
