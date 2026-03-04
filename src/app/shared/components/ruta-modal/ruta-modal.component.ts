import { Component, inject, Input, OnInit } from '@angular/core';
import { Ruta } from 'src/app/models';
import { RutaService } from 'src/app/services/ruta.service';

@Component({
  selector: 'ruta-modal',
  templateUrl: './ruta-modal.component.html',
  styleUrls: ['./ruta-modal.component.scss'],
})
export class RutaModalComponent {

  @Input()
  ruta: Ruta;

  private rutaSvc = inject(RutaService)

  constructor() { }

  ionViewWillEnter() {
    this.rutaSvc.getRutaById(this.ruta.id).subscribe({
      next: (ruta) => {
        this.ruta = ruta;
      }
    })
  }

  ionViewWillLeave() {
  }

}
