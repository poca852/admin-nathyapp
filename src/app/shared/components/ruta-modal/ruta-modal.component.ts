import { Component, Input, OnInit } from '@angular/core';
import { Ruta } from 'src/app/models';

@Component({
  selector: 'ruta-modal',
  templateUrl: './ruta-modal.component.html',
  styleUrls: ['./ruta-modal.component.scss'],
})
export class RutaModalComponent  implements OnInit {

  @Input()
  ruta: Ruta;

  constructor() { }

  ngOnInit() {}

}
