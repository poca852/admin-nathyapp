import {
  currencyFromCountry,
  formatMoney,
  localeForCurrency,
  resolveCurrencyCode,
  resolveRutaCurrency,
  symbolForCurrency,
} from './money.helpers';

describe('money.helpers', () => {
  it('resolveCurrencyCode normaliza y usa USD por defecto', () => {
    expect(resolveCurrencyCode('gtq')).toBe('GTQ');
    expect(resolveCurrencyCode(null)).toBe('USD');
    expect(resolveCurrencyCode('')).toBe('USD');
  });

  it('currencyFromCountry mapea Guatemala a GTQ', () => {
    expect(currencyFromCountry('Guatemala')).toBe('GTQ');
    expect(currencyFromCountry('guatemala')).toBe('GTQ');
  });

  it('resolveRutaCurrency usa país si currency falta', () => {
    expect(resolveRutaCurrency({ pais: 'Guatemala' })).toBe('GTQ');
    expect(resolveRutaCurrency({ currency: 'GTQ', pais: 'Colombia' })).toBe('GTQ');
  });

  it('localeForCurrency mapea monedas conocidas', () => {
    expect(localeForCurrency('GTQ')).toBe('es-GT');
    expect(localeForCurrency('COP')).toBe('es-CO');
    expect(localeForCurrency('XYZ')).toBe('es');
  });

  it('symbolForCurrency usa Q para GTQ', () => {
    expect(symbolForCurrency('GTQ')).toBe('Q');
  });

  it('formatMoney muestra Q y no $ para GTQ', () => {
    const formatted = formatMoney(600, 'GTQ');
    expect(formatted).toContain('600');
    expect(formatted.startsWith('Q')).toBe(true);
    expect(formatted).not.toMatch(/^\$/);
  });

  it('formatMoney retorna guion para valores inválidos', () => {
    expect(formatMoney(null, 'GTQ')).toBe('—');
    expect(formatMoney(Number.NaN, 'USD')).toBe('—');
  });
});
