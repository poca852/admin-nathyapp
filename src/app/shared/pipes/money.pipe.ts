import { Pipe, PipeTransform, inject } from '@angular/core';
import { formatMoney, resolveRutaCurrency } from 'src/app/helpers/money.helpers';
import { EmpresaService } from 'src/app/services/empresa.service';

/**
 * Formatea montos con la moneda de la ruta actual, o una explícita.
 *
 * La moneda se resuelve por ruta (currency → pais de la ruta), nunca por el
 * país de la empresa: una empresa de Brasil puede tener rutas en Guatemala.
 *
 * @example
 * {{ 500 | money }}
 * {{ ruta.cartera | money:ruta.currency }}
 */
@Pipe({
  name: 'money',
  standalone: true,
  // Depende de la ruta activa en EmpresaService cuando no se pasa currency.
  pure: false,
})
export class MoneyPipe implements PipeTransform {
  private readonly empresaSvc = inject(EmpresaService);

  transform(
    value: number | null | undefined,
    currency?: string | null,
  ): string {
    const ruta = this.empresaSvc.ruta();
    const code =
      currency ||
      resolveRutaCurrency({
        currency: ruta?.currency,
        pais: ruta?.pais,
      });

    return formatMoney(value, code);
  }
}
