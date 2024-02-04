import { Component, OnInit, inject, Input } from '@angular/core';
import { RutaService } from '../../../services/ruta.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { City, Country, Ruta, State } from 'src/app/models';
import { CountriesService } from '../../../services/countries.service';
import { filter, switchMap, tap } from 'rxjs';
import { UtilsService } from '../../../services/utils.service';
import { EmpresaService } from 'src/app/services/empresa.service';

@Component({
  selector: 'add-update-ruta',
  templateUrl: './add-update-ruta.component.html',
  styleUrls: ['./add-update-ruta.component.scss'],
})
export class AddUpdateRutaComponent  implements OnInit {

  @Input()
  ruta: Ruta;

  private rutaSvc = inject(RutaService);
  private countrySvc = inject(CountriesService);
  private utilsSvc = inject(UtilsService);
  private empresaSvc = inject(EmpresaService);

  form = new FormGroup({
    nombre: new FormControl('', [Validators.required]),
    pais: new FormControl('', [Validators.required]),
    ciudad: new FormControl('', [Validators.required]),
    estado: new FormControl('', [Validators.required]),
    ingresar_gastos_cobrador: new FormControl(true),
  })

  paises: Country[] = [];
  estados: State[] = [];
  cities: City[] = [];

  constructor() { }

  ngOnInit() {
    this.onCountryChange();
    this.onEstadoChange();
  }

  ionViewWillEnter() {
    this.initComponent();
  }

  initComponent() {
    if(!!this.ruta){
      this.form.patchValue({...this.ruta});
    }

    this.countrySvc.getPaises()
      .subscribe((paises) => this.paises = paises)
  }

  async onCountryChange(): Promise<void> {

      this.form.controls.pais.valueChanges
        .pipe(
          tap(() => this.form.controls.estado.touched ?? this.form.controls.estado.setValue('')),
          switchMap((country) => this.countrySvc.getEstadosByCountry(country))
        )
        .subscribe(estados => {
          this.estados = estados;
        })
  }

  async onEstadoChange(): Promise<void> {

    this.form.controls.estado.valueChanges
      .pipe(
        tap(() => this.form.controls.ciudad.touched ?? this.form.controls.ciudad.setValue('')),
        filter( (value: string) => value.length > 0),
        switchMap( (estado) => this.countrySvc.getCitiesByEstado(estado))
      )
      .subscribe(cities => {
        this.cities = cities;
      })
  }

  async updateRuta() {

    const loading = await this.utilsSvc.loading();
    loading.present();

    this.rutaSvc.updateRuta(this.ruta._id, this.form.value)
      .subscribe({
        next: () => {
          loading.dismiss();
          this.utilsSvc.dismissModal({success: true});
        },
        error: err => {
          loading.dismiss()
          this.utilsSvc.presentAlert({
            header: 'Error',
            message: err.error.message,
            buttons: ['OK']
          })
        }
      })

  }

  async addRuta() {

    const loading = await this.utilsSvc.loading();
    loading.present();

    this.rutaSvc.addRuta(this.form.value)
      .subscribe({
        next: ruta => {

          this.empresaSvc.addRuta(this.utilsSvc.getFromLocalStorage('user').empresa, ruta._id).subscribe({
            next: () => {
              loading.dismiss();
              this.utilsSvc.dismissModal({success: true});
            },
            error: err => {
              loading.dismiss();
              this.utilsSvc.dismissModal({success: false});
            }
          })
          
        },
        error: err => {
          loading.dismiss();
          this.utilsSvc.presentAlert({
            header: 'Error',
            message: err.error.message,
            buttons: ['OK']
          })
        }
      })
  }

  async submit() {

    if(!!this.ruta) {
      return this.updateRuta();
    }

    return this.addRuta();

  }


}
