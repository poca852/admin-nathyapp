import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UtilsService } from '../../services/utils.service';
import { User } from '../../models/user.interface';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {

  authSvc = inject(AuthService);
  utilsSvc = inject(UtilsService);

  form = new FormGroup({
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required])
  })

  ionViewWillLeave() {
    this.form.reset();
  }

  ngOnInit() {
  }

  async submit() {
    
    if( this.form.valid ){

      const { username, password } = this.form.value;

      const loading = await this.utilsSvc.loading();
      await loading.present();

      this.authSvc.login(username, password).subscribe({
        next: async (isAuth) => {

          await loading.dismiss();

          if(isAuth){

            let user = this.utilsSvc.getFromLocalStorage('user') as User;
  
            this.utilsSvc.routerLink('/main/home');
  
  
            this.utilsSvc.presentToast({
              message: `Te damos la bienvenida ${user.nombre.toLowerCase()}`,
              duration: 1000,
              color: 'primary',
              position: 'middle',
              icon: 'person-circle-outline'
            })

          }else {

            this.utilsSvc.presentToast({
              message: `Usted no tiene permisos`,
              duration: 2000,
              color: 'danger',
              position: 'middle',
              icon: 'person-circle-outline'
            })

            this.form.reset();

          }

          

        },
        error: err => {
          
          this.utilsSvc.presentToast({
            message: err.error.message,
            duration: 1000,
            color: 'primary',
            position: 'middle',
            icon: 'alert-circle-outline'
          })

          loading.dismiss();

        }
      })

    }

  }

}
