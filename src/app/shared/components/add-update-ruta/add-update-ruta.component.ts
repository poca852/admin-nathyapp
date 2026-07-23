import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
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

const TIME_ZONES = [
  'America/Bogota',
  'America/Guatemala',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'America/Lima',
  'America/New_York',
  'UTC',
];

const CURRENCIES = ['COP', 'GTQ', 'MXN', 'BRL', 'USD'];

@Component({
  selector: 'add-update-ruta',
  templateUrl: './add-update-ruta.component.html',
  styleUrls: ['./add-update-ruta.component.scss'],
})
export class AddUpdateRutaComponent implements OnInit, OnDestroy {
  @Input() ruta!: Ruta;
  /** Empresa destino (Super Admin). Si no viene, usa EmpresaService.empresa(). */
  @Input() empresaId?: string;

  private readonly rutaSvc = inject(RutaService);
  private readonly utilsSvc = inject(UtilsService);
  private readonly empresaSvc = inject(EmpresaService);
  private paisSub?: Subscription;

  readonly countries = Object.keys(COUNTRY_DATA);
  timeZones = [...TIME_ZONES];
  currencies = [...CURRENCIES];

  form = new FormGroup({
    nombre: new FormControl('', [Validators.required]),
    pais: new FormControl('', [Validators.required]),
    ciudad: new FormControl('', [Validators.required]),
    autoOpen: new FormControl(false, [Validators.required]),
    empresa: new FormControl(''),
    timeZone: new FormControl('', [Validators.required]),
    currency: new FormControl('', [Validators.required]),
  });

  ionViewWillEnter(): void {
    this.initComponent();
    this.setupCountryChange();
  }

  ngOnInit(): void {
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

  private resolveEmpresaId(): string | undefined {
    return this.empresaId || this.empresaSvc.empresa()?.id || undefined;
  }

  initComponent(): void {
    const empId = this.resolveEmpresaId();
    if (this.ruta) {
      const tz = this.ruta.timeZone || '';
      const cur = this.ruta.currency || '';
      // Asegurar que valores custom aparezcan en los selects
      if (tz && !this.timeZones.includes(tz)) {
        this.timeZones = [tz, ...this.timeZones];
      }
      if (cur && !this.currencies.includes(cur)) {
        this.currencies = [cur, ...this.currencies];
      }
      this.form.patchValue({
        nombre: this.ruta.nombre,
        pais: this.ruta.pais,
        ciudad: this.ruta.ciudad,
        autoOpen: this.ruta.autoOpen,
        empresa: empId,
        timeZone: tz,
        currency: cur,
      });
    } else {
      this.form.patchValue({ empresa: empId });
    }
  }

  private payload() {
    return this.form.value;
  }

  async updateRuta(): Promise<void> {
    const loading = await this.utilsSvc.loading();
    await loading.present();

    this.rutaSvc.updateRuta(this.ruta.id || (this.ruta as any)._id, this.payload()).subscribe({
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
    const empresaId = this.resolveEmpresaId();
    if (!empresaId) {
      this.utilsSvc.presentAlert({
        header: 'Error',
        message: 'Selecciona una empresa para crear la ruta',
        buttons: ['OK'],
      });
      return;
    }

    const loading = await this.utilsSvc.loading();
    await loading.present();

    this.rutaSvc.addRuta(this.payload(), empresaId).subscribe({
      next: () => {
        if (this.empresaSvc.empresa()?.id === empresaId) {
          this.empresaSvc.setEmpresa(empresaId);
        }
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
