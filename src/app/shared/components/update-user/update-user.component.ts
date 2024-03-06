import { Component, Input, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { User } from 'src/app/models';
import { EmpleadosService } from 'src/app/services/empleados.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-update-user',
  templateUrl: './update-user.component.html',
  styleUrls: ['./update-user.component.scss'],
})
export class UpdateUserComponent implements OnDestroy {

  @Input() user: User;

  public form = new FormGroup({
    nombre: new FormControl('', [Validators.required]),
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.minLength(6)]),
  })

  constructor(
    private readonly utilsSvc: UtilsService,
    private readonly empleadoSvc: EmpleadosService,
  ) { }

  ionViewWillEnter() {
    
    if(!!this.user){
      this.form.patchValue({
        ...this.user,
        password: null
      })
    }

  }

  ngOnDestroy(): void {
    this.form.reset()
  }

  public updateUser = async () => {
    this.empleadoSvc.updateEmploye(this.user._id, this.form.value)
      .subscribe({
        next: () => {

          let { nombre, username } = this.form.value;

          this.utilsSvc.saveInLocalStorage('user', {
            ...this.user,
            nombre, username
          })
          
          this.utilsSvc.dismissModal({ success: true })

        },
        error: async (err) => {
          await this.utilsSvc.presentAlert({
            header: 'Alerta',
            message: err.error.message,
            buttons: ['OK']
          })
          this.utilsSvc.dismissModal({ success: false })
        },
      })
  }



}
