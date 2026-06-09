import { Pipe, PipeTransform } from '@angular/core';
import { formatNumber } from '@angular/common';
import { normalizeInteresPercent } from '../utils/interes.util';

@Pipe({
  name: 'interesPercent',
  standalone: true,
})
export class InteresPercentPipe implements PipeTransform {
  transform(
    value: number | null | undefined,
    digitsInfo = '1.0-2',
    locale = 'en'
  ): string {
    const normalized = normalizeInteresPercent(value);

    if (normalized == null) {
      return '—';
    }

    return `${formatNumber(normalized, locale, digitsInfo)}%`;
  }
}
