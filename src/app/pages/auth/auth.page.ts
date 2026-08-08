import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
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
    password: new FormControl('', [Validators.required]),
  });

  ionViewWillLeave() {
    this.form.reset();
  }

  ngOnInit() {
  }

  async submit() {
    if (!this.form.valid) {
      return;
    }

    const { username, password } = this.form.value;
    const autoForce = this.authSvc.shouldAutoForceLogin();
    await this.attemptLogin(username!, password!, autoForce, autoForce);
  }

  private async attemptLogin(
    username: string,
    password: string,
    force: boolean,
    fromAutoForce = false,
  ): Promise<void> {
    const loading = await this.utilsSvc.loading();
    await loading.present();

    this.authSvc.login(username, password, { force }).subscribe({
      next: async (isAuth) => {
        await loading.dismiss();

        if (isAuth) {
          const user = this.utilsSvc.getFromLocalStorage('user') as User;
          const homeUrl =
            user?.rol === 'SUPERADMIN'
              ? '/main/super-admin/empresas'
              : '/main/home';

          this.utilsSvc.routerLink(homeUrl);

          this.utilsSvc.presentToast({
            message: `Te damos la bienvenida ${user.nombre.toLowerCase()}`,
            duration: 1000,
            color: 'primary',
            position: 'middle',
            icon: 'person-circle-outline',
          });
          return;
        }

        this.form.reset();
        this.utilsSvc.presentToast({
          message: 'Usted no tiene permisos',
          duration: 2000,
          color: 'danger',
          position: 'middle',
          icon: 'person-circle-outline',
        });
      },
      error: async (err) => {
        await loading.dismiss();

        const raw = err?.error?.message;
        const message = Array.isArray(raw)
          ? raw.join(' ')
          : (raw ||
            (err?.status === 0
              ? 'No se pudo conectar con el servidor.'
              : 'Ocurrió un error inesperado'));
        const suspended = err?.error?.error === 'SUBSCRIPTION_SUSPENDED';
        const sessionActive = err?.error?.error === 'SESSION_ALREADY_ACTIVE';
        const blocked = err?.error?.error === 'USER_BLOCKED';

        if (sessionActive && !force && this.authSvc.shouldAutoForceLogin()) {
          await this.attemptLogin(username, password, true, true);
          return;
        }

        if (sessionActive && !force) {
          await this.utilsSvc.presentAlert({
            header: 'Sesión activa',
            message:
              'Hay una sesión activa (puede ser de este mismo dispositivo tras un reinicio). Puedes cerrarla e ingresar.',
            buttons: [
              { text: 'Cancelar', role: 'cancel' },
              {
                text: 'Cerrar la otra sesión e ingresar',
                handler: () => {
                  void this.attemptLogin(username, password, true);
                },
              },
            ],
          });
          return;
        }

        this.utilsSvc.presentToast({
          message:
            fromAutoForce && sessionActive
              ? 'No se pudo recuperar la sesión anterior. Intenta de nuevo.'
              : message,
          duration: suspended || blocked || sessionActive ? 4000 : 2000,
          color: suspended || blocked || sessionActive ? 'danger' : 'primary',
          position: 'middle',
          icon: 'alert-circle-outline',
        });
      },
    });
  }

}
