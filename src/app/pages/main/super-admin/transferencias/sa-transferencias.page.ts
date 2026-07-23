import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { Empresa, Ruta, User } from 'src/app/models';
import { EmpresaService } from 'src/app/services/empresa.service';
import { SuperAdminContextService } from 'src/app/services/super-admin-context.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-sa-transferencias',
  templateUrl: './sa-transferencias.page.html',
  styleUrls: ['./sa-transferencias.page.scss'],
})
export class SaTransferenciasPage {
  private readonly empresaSvc = inject(EmpresaService);
  private readonly utilsSvc = inject(UtilsService);
  readonly ctx = inject(SuperAdminContextService);

  readonly saving = signal(false);
  readonly fromRutas = signal<Ruta[]>([]);
  readonly fromEmpleados = signal<User[]>([]);
  readonly toRutas = signal<Ruta[]>([]);
  readonly segment = signal<'empleado' | 'ruta'>('empleado');

  empleadoForm = new FormGroup({
    fromEmpresaId: new FormControl('', [Validators.required]),
    toEmpresaId: new FormControl('', [Validators.required]),
    empleadoId: new FormControl('', [Validators.required]),
    rutaId: new FormControl<string | null>(null),
  });

  rutaForm = new FormGroup({
    fromEmpresaId: new FormControl('', [Validators.required]),
    toEmpresaId: new FormControl('', [Validators.required]),
    rutaId: new FormControl('', [Validators.required]),
  });

  ngOnInit(): void {
    // Intentional no-op: la carga real es en ionViewWillEnter
  }

  ionViewWillEnter(): void {
    if (this.ctx.empresas().length === 0) {
      this.ctx.loadEmpresas().subscribe();
    }
  }

  setSegment(value: 'empleado' | 'ruta'): void {
    this.segment.set(value);
  }

  async onFromEmpresaEmpleado(ev: CustomEvent): Promise<void> {
    const id = String(ev.detail?.value || '');
    this.empleadoForm.patchValue({ fromEmpresaId: id, empleadoId: '', rutaId: null });
    if (!id) {
      this.fromEmpleados.set([]);
      return;
    }
    try {
      const detail = await firstValueFrom(this.empresaSvc.getEmpresa(id));
      this.fromEmpleados.set(detail.employes || []);
    } catch {
      this.fromEmpleados.set([]);
    }
  }

  async onToEmpresaEmpleado(ev: CustomEvent): Promise<void> {
    const id = String(ev.detail?.value || '');
    this.empleadoForm.patchValue({ toEmpresaId: id, rutaId: null });
    if (!id) {
      this.toRutas.set([]);
      return;
    }
    try {
      const detail = await firstValueFrom(this.empresaSvc.getEmpresa(id));
      this.toRutas.set(detail.rutas || []);
    } catch {
      this.toRutas.set([]);
    }
  }

  async onFromEmpresaRuta(ev: CustomEvent): Promise<void> {
    const id = String(ev.detail?.value || '');
    this.rutaForm.patchValue({ fromEmpresaId: id, rutaId: '' });
    if (!id) {
      this.fromRutas.set([]);
      return;
    }
    try {
      const detail = await firstValueFrom(this.empresaSvc.getEmpresa(id));
      this.fromRutas.set(detail.rutas || []);
    } catch {
      this.fromRutas.set([]);
    }
  }

  async submitEmpleado(): Promise<void> {
    if (this.empleadoForm.invalid || this.saving()) return;
    const value = this.empleadoForm.getRawValue();
    if (value.fromEmpresaId === value.toEmpresaId) {
      this.utilsSvc.presentToast({
        message: 'Origen y destino deben ser distintas',
        color: 'warning',
        duration: 2500,
      });
      return;
    }

    this.saving.set(true);
    this.empresaSvc.moveEmpleado({
      empleadoId: value.empleadoId!,
      fromEmpresaId: value.fromEmpresaId!,
      toEmpresaId: value.toEmpresaId!,
      rutaId: value.rutaId || undefined,
    }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.utilsSvc.presentToast({
          message: res.message || 'Empleado movido',
          color: 'success',
          duration: 2500,
        });
        this.ctx.invalidate();
        this.ctx.loadEmpresas().subscribe();
        this.empleadoForm.reset();
        this.fromEmpleados.set([]);
        this.toRutas.set([]);
      },
      error: (err) => {
        this.saving.set(false);
        this.utilsSvc.presentToast({
          message: err.error?.message || 'No se pudo mover el empleado',
          color: 'danger',
          duration: 3500,
        });
      },
    });
  }

  async submitRuta(): Promise<void> {
    if (this.rutaForm.invalid || this.saving()) return;
    const value = this.rutaForm.getRawValue();
    if (value.fromEmpresaId === value.toEmpresaId) {
      this.utilsSvc.presentToast({
        message: 'Origen y destino deben ser distintas',
        color: 'warning',
        duration: 2500,
      });
      return;
    }

    this.saving.set(true);
    this.empresaSvc.moveRuta({
      rutaId: value.rutaId!,
      fromEmpresaId: value.fromEmpresaId!,
      toEmpresaId: value.toEmpresaId!,
    }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.utilsSvc.presentToast({
          message: res.message || 'Ruta movida',
          color: 'success',
          duration: 2500,
        });
        this.ctx.invalidate();
        this.ctx.loadEmpresas().subscribe();
        this.rutaForm.reset();
        this.fromRutas.set([]);
      },
      error: (err) => {
        this.saving.set(false);
        this.utilsSvc.presentToast({
          message: err.error?.message || 'No se pudo mover la ruta',
          color: 'danger',
          duration: 3500,
        });
      },
    });
  }

  empresaId(e: Empresa): string {
    return e.id || (e as any)._id;
  }

  userId(u: User): string {
    return u._id || u.id || '';
  }

  rutaId(r: Ruta): string {
    return r.id || (r as any)._id;
  }
}
