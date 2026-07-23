import { Component, OnInit, Input } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { Ruta, User } from 'src/app/models';
import { UtilsService } from '../../../services/utils.service';
import { EmpleadosService } from 'src/app/services/empleados.service';
import { EmpresaService } from '../../../services/empresa.service';

export enum Roles {
  admin = 'ADMIN',
  cobrador = 'COBRADOR',
  supervisor = 'SUPERVISOR',
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
    ruta: new FormControl<string | null>(null),
    rutas: new FormControl<string[]>([]),
    rol: new FormControl('', [Validators.required]),
  });

  public roles: Roles[] = [Roles.admin, Roles.cobrador, Roles.supervisor];

  constructor(
    private utilsSvc: UtilsService,
    private employeSvc: EmpleadosService,
    private empresaSvc: EmpresaService,
  ) {}

  ngOnInit() {
    if (this.employe) {
      const rutasIds = this.extractRutaIds(this.employe.rutas);
      this.form.patchValue({
        nombre: this.employe.nombre,
        username: this.employe.username,
        password: null,
        ruta: this.employe.ruta?.id || (this.employe.ruta as any)?._id || null,
        rutas: rutasIds,
        rol: this.employe.rol,
      });
    } else {
      this.form.controls.password.setValidators([
        Validators.required,
        Validators.minLength(6),
      ]);
      this.form.controls.password.updateValueAndValidity();
    }
  }

  ionViewWillLeave() {
    this.form.reset();
  }

  get rutas(): Ruta[] {
    return this.empresaSvc.rutas();
  }

  rolLabel(rol: Roles | string): string {
    switch (rol) {
      case Roles.admin:
        return 'Administrador';
      case Roles.cobrador:
        return 'Cobrador';
      case Roles.supervisor:
        return 'Supervisor';
      default:
        return String(rol);
    }
  }

  private extractRutaIds(rutas: User['rutas']): string[] {
    if (!Array.isArray(rutas)) return [];
    return rutas
      .map((r: any) => (typeof r === 'string' ? r : r?.id || r?._id))
      .filter(Boolean);
  }

  async updateEmploye() {
    if (!this.form.controls.password.value) {
      this.form.controls.password.setValue(null);
    }

    const loading = await this.utilsSvc.loading();
    await loading.present();

    const payload = this.buildPayload();

    this.employeSvc.updateEmploye(this.employe._id, payload).subscribe({
      next: () => {
        loading.dismiss();
        this.utilsSvc.dismissModal({ success: true });
      },
      error: async (err) => {
        loading.dismiss();
        await this.utilsSvc.presentAlert({
          header: 'Alerta',
          message: err.error?.message || 'Error al actualizar',
          buttons: ['OK'],
        });
      },
    });
  }

  async addEmploye() {
    const loading = await this.utilsSvc.loading();
    await loading.present();

    const payload = this.buildPayload();

    this.empresaSvc.addEmpleado(payload).subscribe({
      next: () => {
        loading.dismiss();
        this.utilsSvc.dismissModal({ success: true });
      },
      error: (err) => {
        loading.dismiss();
        this.utilsSvc.presentAlert({
          header: 'Alerta',
          message: err.error?.message || 'Error al crear empleado',
          buttons: ['OK'],
        });
      },
    });
  }

  private buildPayload(): Record<string, unknown> {
    const value = { ...this.form.value };
    const payload: Record<string, unknown> = {
      nombre: value.nombre,
      username: value.username,
      rol: value.rol,
    };

    if (value.password) {
      payload['password'] = value.password;
    }

    if (value.rol === Roles.cobrador && value.ruta) {
      payload['ruta'] = value.ruta;
    }

    if (value.rol === Roles.supervisor && Array.isArray(value.rutas) && value.rutas.length > 0) {
      payload['rutas'] = value.rutas;
    }

    return payload;
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.employe) {
      return this.updateEmploye();
    }

    return this.addEmploye();
  }

  onRolChange(e: CustomEvent): void {
    const rol = e.detail.value;
    if (rol !== Roles.cobrador) {
      this.form.controls.ruta.setValue(null);
    }

    if (rol !== Roles.supervisor) {
      this.form.controls.rutas.setValue([]);
    }
  }
}
