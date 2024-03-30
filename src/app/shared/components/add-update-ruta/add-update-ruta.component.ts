import { Component, inject, Input } from '@angular/core';
import { RutaService } from '../../../services/ruta.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Ruta } from 'src/app/models';
import { UtilsService } from '../../../services/utils.service';
import { EmpresaService } from 'src/app/services/empresa.service';

@Component({
  selector: 'add-update-ruta',
  templateUrl: './add-update-ruta.component.html',
  styleUrls: ['./add-update-ruta.component.scss'],
})
export class AddUpdateRutaComponent {

  @Input()
  ruta: Ruta;

  private rutaSvc = inject(RutaService);
  private utilsSvc = inject(UtilsService);
  private empresaSvc = inject(EmpresaService);

  form = new FormGroup({
    nombre: new FormControl('', [Validators.required]),
    pais: new FormControl('', [Validators.required]),
    ciudad: new FormControl('', [Validators.required]),
    estado: new FormControl('', [Validators.required]),
    ingresar_gastos_cobrador: new FormControl(true),
    have_login_falso: new FormControl(true),
    senha: new FormControl(''),
    autoOpen: new FormControl(false, [Validators.required])
  })

  constructor() { }

  ionViewWillEnter() {
    this.initComponent();
  }

  initComponent() {
    if(!!this.ruta){
      this.form.patchValue({...this.ruta});
    }
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
              this.empresaSvc.setEmpresa();
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
