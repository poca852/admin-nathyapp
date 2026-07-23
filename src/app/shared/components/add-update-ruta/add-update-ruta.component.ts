import { Component, inject, Input, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

import { RutaService } from '../../../services/ruta.service';
import { Ruta } from 'src/app/models';
import { UtilsService } from '../../../services/utils.service';
import { EmpresaService } from 'src/app/services/empresa.service';

const COUNTRY_DATA: Record<string, { timeZone: string; currency: string }> = {
  Colombia: { timeZone: 'America/Bogota', currency: 'COP' },
  Guatemala: { timeZone: 'America/Guatemala', currency: 'GTQ' },
  Brasil: { timeZone: 'America/Sao_Paulo', currency: 'BRL' },
  México: { timeZone: 'America/Mexico_City', currency: 'MXN' },
};

@Component({
  selector: 'add-update-ruta',
  templateUrl: './add-update-ruta.component.html',
  styleUrls: ['./add-update-ruta.component.scss'],
})
export class AddUpdateRutaComponent implements OnDestroy {
  @Input() ruta!: Ruta;

  private readonly rutaSvc = inject(RutaService);
  private readonly utilsSvc = inject(UtilsService);
  private readonly empresaSvc = inject(EmpresaService);
  private paisSub?: Subscription;

  readonly countries = Object.keys(COUNTRY_DATA);

  form = new FormGroup({
    nombre: new FormControl('', [Validators.required]),
    pais: new FormControl('', [Validators.required]),
    ciudad: new FormControl('', [Validators.required]),
    autoOpen: new FormControl(false, [Validators.required]),
    empresa: new FormControl(this.empresaSvc.empresa()?.id),
    timeZone: new FormControl('', [Validators.required]),
    currency: new FormControl('', [Validators.required]),
  });

  ionViewWillEnter(): void {
    this.initComponent();
    this.setupCountryChange();
  }

  ngOnDestroy(): void {
    this.paisSub?.unsubscribe();
  }

  setupCountryChange(): void {
    this.paisSub?.unsubscribe();
    this.paisSub = this.form.controls.pais.valueChanges.subscribe((pais) => {
      if (pais && COUNTRY_DATA[pais]) {
        this.form.patchValue({
          timeZone: COUNTRY_DATA[pais].timeZone,
          currency: COUNTRY_DATA[pais].currency,
        });
      }
    });
  }

  initComponent(): void {
    if (this.ruta) {
      this.form.patchValue({
        nombre: this.ruta.nombre,
        pais: this.ruta.pais,
        ciudad: this.ruta.ciudad,
        autoOpen: this.ruta.autoOpen,
        empresa: this.empresaSvc.empresa()?.id,
        timeZone: this.ruta.timeZone,
        currency: this.ruta.currency,
      });
    }
  }

  private payload() {
    return this.form.value;
  }

  async updateRuta(): Promise<void> {
    const loading = await this.utilsSvc.loading();
    await loading.present();

    this.rutaSvc.updateRuta(this.ruta.id, this.payload()).subscribe({
      next: () => {
        loading.dismiss();
        this.utilsSvc.dismissModal({ success: true });
      },
      error: (err) => {
        loading.dismiss();
        this.utilsSvc.presentAlert({
          header: 'Error',
          message: err?.error?.message || 'No se pudo actualizar la ruta',
          buttons: ['OK'],
        });
      },
    });
  }

  async addRuta(): Promise<void> {
    const loading = await this.utilsSvc.loading();
    await loading.present();

    this.rutaSvc.addRuta(this.payload(), this.empresaSvc.empresa()?.id).subscribe({
      next: () => {
        this.empresaSvc.setEmpresa(this.empresaSvc.empresa()?.id);
        this.utilsSvc.dismissModal({ success: true });
        loading.dismiss();
      },
      error: (err) => {
        loading.dismiss();
        this.utilsSvc.presentAlert({
          header: 'Error',
          message: err?.error?.message || 'No se pudo crear la ruta',
          buttons: ['OK'],
        });
      },
    });
  }

  async submit(): Promise<void> {
    if (this.ruta) {
      return this.updateRuta();
    }
    return this.addRuta();
  }
}
