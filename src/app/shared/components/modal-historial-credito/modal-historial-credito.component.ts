import { Component, Input, OnInit } from '@angular/core';
import { Credito } from 'src/app/models';
import { UtilsService } from '../../../services/utils.service';

@Component({
  selector: 'app-modal-historial-credito',
  templateUrl: './modal-historial-credito.component.html',
  styleUrls: ['./modal-historial-credito.component.scss'],
})
export class ModalHistorialCreditoComponent  implements OnInit {

  @Input()
  credito: Credito;

  constructor(
    private utilsSvc: UtilsService
  ) { }

  ngOnInit() {}

}
