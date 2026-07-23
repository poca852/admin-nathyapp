/** Locale BCP 47 por código ISO 4217. */
const CURRENCY_LOCALE: Record<string, string> = {
  GTQ: 'es-GT',
  COP: 'es-CO',
  MXN: 'es-MX',
  BRL: 'pt-BR',
  ARS: 'es-AR',
  PEN: 'es-PE',
  USD: 'en-US',
};

/**
 * Símbolos explícitos: `Intl` con `narrowSymbol` a menudo muestra `$`
 * para varias monedas LATAM (incluido GTQ en algunos navegadores).
 */
const CURRENCY_SYMBOL: Record<string, string> = {
  GTQ: 'Q',
  COP: '$',
  MXN: '$',
  BRL: 'R$',
  ARS: '$',
  PEN: 'S/',
  USD: '$',
};

/** Decimales habituales por moneda. */
const CURRENCY_FRACTION_DIGITS: Record<string, number> = {
  GTQ: 2,
  COP: 0,
  MXN: 2,
  BRL: 2,
  ARS: 2,
  PEN: 2,
  USD: 2,
};

/** País de la ruta → moneda ISO (fallback si `currency` viene vacío). */
const COUNTRY_CURRENCY: Record<string, string> = {
  Guatemala: 'GTQ',
  Colombia: 'COP',
  Brasil: 'BRL',
  Brazil: 'BRL',
  México: 'MXN',
  Mexico: 'MXN',
  Argentina: 'ARS',
  Peru: 'PEN',
  Perú: 'PEN',
  'United States': 'USD',
  USA: 'USD',
};

const DEFAULT_CURRENCY = 'USD';
const EMPTY_MONEY = '—';

export type FormatMoneyOptions = {
  /** Si se omite, se usan los decimales estándar de la moneda. */
  fractionDigits?: number;
};

export type CurrencySource = {
  currency?: string | null;
  /** País de la ruta (no de la empresa). */
  pais?: string | null;
};

export function currencyFromCountry(country?: string | null): string | null {
  if (!country?.trim()) return null;
  const key = country.trim();
  return (
    COUNTRY_CURRENCY[key] ||
    COUNTRY_CURRENCY[
      Object.keys(COUNTRY_CURRENCY).find((k) => k.toLowerCase() === key.toLowerCase()) || ''
    ] ||
    null
  );
}

export function resolveCurrencyCode(
  currency?: string | null,
  fallbackCountry?: string | null,
): string {
  const code = currency?.trim().toUpperCase();
  if (code) return code;
  return currencyFromCountry(fallbackCountry) || DEFAULT_CURRENCY;
}

/**
 * Resuelve moneda desde la ruta:
 * 1) `currency` de la ruta
 * 2) si falta, inferida del `pais` de la ruta
 * 3) USD como último recurso
 *
 * No usar el país de la empresa: una empresa puede operar rutas en varios países.
 */
export function resolveRutaCurrency(source?: CurrencySource | null): string {
  if (!source) return DEFAULT_CURRENCY;
  return resolveCurrencyCode(source.currency, source.pais);
}

export function localeForCurrency(currency?: string | null): string {
  const code = resolveCurrencyCode(currency);
  return CURRENCY_LOCALE[code] ?? 'es';
}

export function symbolForCurrency(currency?: string | null): string {
  const code = resolveCurrencyCode(currency);
  return CURRENCY_SYMBOL[code] ?? code;
}

/**
 * Formato monetario estándar por moneda (ej. GTQ → "Q 500.00").
 * Usa símbolo explícito para evitar el `$` incorrecto de Intl en quetzales.
 */
export function formatMoney(
  value: number | null | undefined,
  currency?: string | null,
  options: FormatMoneyOptions = {},
): string {
  if (value == null || !Number.isFinite(Number(value))) {
    return EMPTY_MONEY;
  }

  const amount = Number(value);
  const code = resolveCurrencyCode(currency);
  const locale = localeForCurrency(code);
  const symbol = symbolForCurrency(code);
  const digits =
    options.fractionDigits ?? CURRENCY_FRACTION_DIGITS[code] ?? 2;

  try {
    const formattedNumber = new Intl.NumberFormat(locale, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(amount);

    return `${symbol}\u00A0${formattedNumber}`;
  } catch {
    return `${symbol}\u00A0${amount.toLocaleString(locale)}`;
  }
}
