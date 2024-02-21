import { Component, OnInit, Input } from '@angular/core';
import { Ruta, User } from 'src/app/models';
import { UtilsService } from '../../../services/utils.service';
import { RutaService } from '../../../services/ruta.service';
import { EmpleadosService } from 'src/app/services/empleados.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { EmpresaService } from '../../../services/empresa.service';

export enum Roles {
  admin = 'ADMIN',
  cobrador = 'COBRADOR',
  supervisor = 'SUPERVISOR'
}

@Component({
  selector: 'app-add-update-employe',
  templateUrl: './add-update-employe.component.html',
  styleUrls: ['./add-update-employe.component.scss'],
})
export class AddUpdateEmployeComponent implements OnInit {

  @Input()
  employe: User;

  form = new FormGroup({
    nombre: new FormControl('', [Validators.required]),
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.minLength(6)]),
    ruta: new FormControl(''),
    rutas: new FormControl([]),
    rol: new FormControl('', [Validators.required]),
  })


  public roles: Roles[] = [Roles.admin, Roles.cobrador, Roles.supervisor];

  constructor(
    private utilsSvc: UtilsService,
    private rutaSvc: RutaService,
    private employeSvc: EmpleadosService,
    private empresaSvc: EmpresaService,
  ) { }

  ngOnInit() {
    if (!!this.employe) {
      this.form.patchValue({
        ...this.employe,
        password: null,
        ruta: this.employe.ruta?._id || null
      })
    }
  }

  ionViewWillLeave() {
    this.form.reset();
  }

  get rutas(): Ruta[] {
    return this.empresaSvc.rutas();
  }

  async updateEmploye() {
    if (!this.form.controls.password.value) {
      this.form.controls.password.setValue(null);
    }

    this.employeSvc.updateEmploye(this.employe._id, this.form.value)
      .subscribe({
        next: () => this.utilsSvc.dismissModal({ success: true }),
        error: async (err) => {
          await this.utilsSvc.presentAlert({
            header: 'Alerta',
            message: err.error.message,
            buttons: ['OK']
          })
        },
      })

  }

  async addEmploye() {   
    
    const loading = await this.utilsSvc.loading();
    loading.present();
    
    if(!this.form.controls.ruta.value) {
      delete this.form.controls.ruta;
    }
    
    if(!!this.form.controls.rutas.value) {
      delete this.form.controls.rutas;
    }

    this.empresaSvc.addEmpleado(this.form.value)
      .subscribe({
        next: user => {
          loading.dismiss();
          this.utilsSvc.dismissModal({success: true})
        },
        error: err => {
          loading.dismiss();
          this.utilsSvc.presentAlert({
            header: 'Alerta',
            message: err.error.message,
            buttons: ['OK']
          })
        }
      })
  }

  async submit(): Promise<void> {

    if (!!this.employe) {

      return this.updateEmploye();

    };

    this.addEmploye();
  }

  onRolChange(e): void {
    if (e.detail.value !== Roles.cobrador) {
      this.form.controls.ruta.setValue(null);
    }
    
    if (e.detail.value !== Roles.supervisor) {
      this.form.controls.rutas.setValue(null);
    }
  }

}
