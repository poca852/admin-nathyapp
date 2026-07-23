import { Component, Input, OnInit } from '@angular/core';
import { BaseCalculoMora, Empresa, MoraConfig } from 'src/app/models';
import { UtilsService } from '../../../services/utils.service';
import { EmpresaService } from '../../../services/empresa.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { PAISES_SOPORTADOS } from '../../../services/countries.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-update-empresa',
  templateUrl: './update-empresa.component.html',
  styleUrls: ['./update-empresa.component.scss'],
})
export class UpdateEmpresaComponent implements OnInit {

  @Input() empresa: Empresa;
  /** Si true y no hay empresa, crea una nueva. */
  @Input() createMode = false;

  readonly paises = PAISES_SOPORTADOS;

  readonly basesCalculo: { value: BaseCalculoMora; label: string; tip: string }[] = [
    {
      value: 'VALOR_CUOTA',
      label: 'Valor de la cuota',
      tip: 'La mora se calcula como un % sobre el valor de la cuota.',
    },
    {
      value: 'SALDO',
      label: 'Saldo',
      tip: 'La mora se calcula como un % sobre el saldo pendiente del crédito.',
    },
    {
      value: 'VALOR_CREDITO',
      label: 'Valor del crédito',
      tip: 'La mora se calcula como un % sobre el valor original del crédito.',
    },
  ];

  readonly tips = {
    cobraMora:
      'Activa el cobro de mora en toda la empresa. Si está desactivado, no se podrá aplicar, perdonar ni cobrar mora en ningún crédito.',
    permiteMoraVoluntaria:
      'Si está activo, el cobrador puede decidir aplicar mora en el momento del cobro, además de la mora ya registrada en el crédito.',
    porcentajeMora:
      'Porcentaje usado para calcular la mora sugerida según la base seleccionada (cuota, saldo o valor del crédito).',
    baseCalculoMora:
      'Define sobre qué monto se aplica el porcentaje de mora para obtener el valor sugerido.',
  };

  form = new FormGroup({
    name: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    phone: new FormControl(''),
    dayOfPay: new FormControl<number | null>(null, [
      Validators.min(1),
      Validators.max(31),
    ]),
    subscriptionGraceDays: new FormControl<number | null>(3, [
      Validators.min(0),
      Validators.max(31),
    ]),
    country: new FormControl('', [Validators.required]),
    cobraMora: new FormControl(false),
    permiteMoraVoluntaria: new FormControl(false),
    porcentajeMora: new FormControl(0, [Validators.min(0)]),
    baseCalculoMora: new FormControl<BaseCalculoMora>('VALOR_CUOTA'),
  });

  saving = false;

  constructor(
    private utilsSvc: UtilsService,
    private empresaSvc: EmpresaService,
  ) { }

  ngOnInit() {
    if (this.empresa) {
      this.form.patchValue({
        name: this.empresa.name,
        email: this.empresa.email,
        phone: this.empresa.phone || '',
        dayOfPay: this.empresa.dayOfPay ?? null,
        subscriptionGraceDays: this.empresa.subscriptionGraceDays ?? 3,
        country: this.empresa.country,
        cobraMora: this.empresa.cobraMora ?? false,
        permiteMoraVoluntaria: this.empresa.permiteMoraVoluntaria ?? false,
        porcentajeMora: this.empresa.porcentajeMora ?? 0,
        baseCalculoMora: this.empresa.baseCalculoMora ?? 'VALOR_CUOTA',
      });
    }
  }

  get cobraMora(): boolean {
    return !!this.form.controls.cobraMora.value;
  }

  editEmpresa() {
    if (this.form.invalid || this.saving) return;

    const {
      name,
      email,
      phone,
      dayOfPay,
      subscriptionGraceDays,
      country,
      cobraMora,
      permiteMoraVoluntaria,
      porcentajeMora,
      baseCalculoMora,
    } = this.form.getRawValue();

    const moraConfig: MoraConfig = {
      cobraMora: !!cobraMora,
      permiteMoraVoluntaria: cobraMora ? !!permiteMoraVoluntaria : false,
      porcentajeMora: cobraMora ? Number(porcentajeMora ?? 0) : 0,
      baseCalculoMora: (baseCalculoMora ?? 'VALOR_CUOTA') as BaseCalculoMora,
    };

    const empresaPayload: Partial<Empresa> = {
      name: name || undefined,
      email: email || undefined,
      phone: phone?.trim() || undefined,
      dayOfPay:
        dayOfPay != null && Number.isFinite(Number(dayOfPay))
          ? Number(dayOfPay)
          : undefined,
      subscriptionGraceDays:
        subscriptionGraceDays != null && Number.isFinite(Number(subscriptionGraceDays))
          ? Number(subscriptionGraceDays)
          : undefined,
      country: country || undefined,
    };

    this.saving = true;

    if (this.createMode || !this.empresa?.id) {
      this.empresaSvc
        .createEmpresa({
          name: name!,
          country: country!,
          email: email || undefined,
          phone: phone?.trim() || undefined,
          dayOfPay: empresaPayload.dayOfPay,
          subscriptionGraceDays: empresaPayload.subscriptionGraceDays,
          ...moraConfig,
        } as any)
        .subscribe({
          next: () => {
            this.saving = false;
            this.utilsSvc.presentToast({
              message: 'Empresa creada correctamente',
              duration: 2500,
              color: 'success',
              icon: 'checkmark-circle-outline',
            });
            this.utilsSvc.dismissModal({ success: true });
          },
          error: (err) => {
            this.saving = false;
            this.utilsSvc.presentToast({
              message: err.error?.message || 'No se pudo crear la empresa',
              duration: 3500,
              color: 'danger',
              icon: 'alert-circle-outline',
            });
          },
        });
      return;
    }

    forkJoin({
      empresa: this.empresaSvc.editEmpresa(this.empresa.id, empresaPayload),
      mora: this.empresaSvc.updateMoraConfig(this.empresa.id, moraConfig),
    }).subscribe({
      next: () => {
        this.saving = false;
        this.utilsSvc.presentToast({
          message: 'Empresa actualizada correctamente',
          duration: 2500,
          color: 'success',
          icon: 'checkmark-circle-outline',
        });
        this.utilsSvc.dismissModal({ success: true });
      },
      error: err => {
        this.saving = false;
        this.utilsSvc.presentToast({
          message: err.error?.message || 'No se pudo actualizar la empresa',
          duration: 3500,
          color: 'danger',
          icon: 'alert-circle-outline',
        });
      }
    });
  }

}
