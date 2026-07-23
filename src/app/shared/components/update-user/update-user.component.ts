import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { User } from 'src/app/models';
import { AuthService } from 'src/app/services/auth.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-update-user',
  templateUrl: './update-user.component.html',
  styleUrls: ['./update-user.component.scss'],
})
export class UpdateUserComponent implements OnInit {
  @Input() user: User;

  form = new FormGroup({
    nombre: new FormControl('', [Validators.required, Validators.minLength(3)]),
    username: new FormControl('', [Validators.required, Validators.minLength(3)]),
    password: new FormControl('', [Validators.minLength(6)]),
  });

  saving = false;

  constructor(
    private readonly utilsSvc: UtilsService,
    private readonly authSvc: AuthService,
  ) {}

  ngOnInit(): void {
    if (this.user) {
      this.form.patchValue({
        nombre: this.user.nombre || '',
        username: this.user.username || '',
        password: '',
      });
    }
  }

  updateUser(): void {
    if (this.form.invalid || this.saving) return;

    const { nombre, username, password } = this.form.getRawValue();
    const payload: { nombre?: string; username?: string; password?: string } = {
      nombre: nombre?.trim() || undefined,
      username: username?.trim() || undefined,
    };

    const pwd = password?.trim();
    if (pwd) {
      payload.password = pwd;
    }

    this.saving = true;
    this.authSvc.updateMe(payload).subscribe({
      next: () => {
        this.saving = false;
        this.utilsSvc.presentToast({
          message: 'Perfil actualizado correctamente',
          duration: 2500,
          color: 'success',
          icon: 'checkmark-circle-outline',
        });
        this.utilsSvc.dismissModal({ success: true });
      },
      error: async (err) => {
        this.saving = false;
        await this.utilsSvc.presentAlert({
          header: 'No se pudo actualizar',
          message:
            err?.error?.message ||
            'Revisa los datos e inténtalo de nuevo.',
          buttons: ['OK'],
        });
      },
    });
  }
}
