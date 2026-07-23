import { Component, inject, Input } from '@angular/core';
import { Router } from '@angular/router';

import { Ruta } from 'src/app/models';
import { Caja } from 'src/app/models/caja.interface';
import { RutaService } from 'src/app/services/ruta.service';
import { EmpresaService } from 'src/app/services/empresa.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'ruta-modal',
  templateUrl: './ruta-modal.component.html',
  styleUrls: ['./ruta-modal.component.scss'],
})
export class RutaModalComponent {
  @Input() ruta!: Ruta;

  loading = true;
  loadError = false;

  private readonly rutaSvc = inject(RutaService);
  private readonly empresaSvc = inject(EmpresaService);
  private readonly utilsSvc = inject(UtilsService);
  private readonly router = inject(Router);

  ionViewWillEnter(): void {
    this.loadDetalle();
  }

  loadDetalle(): void {
    if (!this.ruta?.id) {
      this.loading = false;
      this.loadError = true;
      return;
    }

    this.loading = true;
    this.loadError = false;
    this.rutaSvc.getRutaById(this.ruta.id).subscribe({
      next: (ruta) => {
        this.ruta = ruta;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
        this.utilsSvc.presentToast({
          message: 'No se pudo cargar el detalle de la ruta',
          duration: 2500,
          color: 'danger',
        });
      },
    });
  }

  get cajaActual(): Caja | null {
    const caja = this.ruta?.caja_actual;
    if (!caja || typeof caja === 'string') return null;
    return caja as Caja;
  }

  async goTo(path: '/main/caja' | '/main/pagos'): Promise<void> {
    this.empresaSvc.setRuta(this.ruta);
    await this.utilsSvc.dismissModal();
    await this.router.navigateByUrl(path);
  }
}
