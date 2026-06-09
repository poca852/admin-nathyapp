/**
 * Ganancia total del crédito (interés cobrado en dinero).
 */
export function calcularGananciaCredito(totalPagar: number, valorCredito: number): number {
  return Math.max(0, (totalPagar ?? 0) - (valorCredito ?? 0));
}

/**
 * Porción de la ganancia ya cobrada según los abonos realizados.
 */
export function calcularGananciaCobrada(ganancia: number, abonos: number, totalPagar: number): number {
  if (!totalPagar) {
    return 0;
  }

  return ganancia * (abonos / totalPagar);
}

/**
 * Ganancia que aún no se ha cobrado.
 */
export function calcularGananciaPendiente(ganancia: number, gananciaCobrada: number): number {
  return Math.max(0, ganancia - gananciaCobrada);
}

/**
 * Cuotas pagadas según los abonos acumulados.
 */
export function calcularCuotasPagadas(abonos: number, valorCuota: number, totalCuotas: number): number {
  if (!valorCuota) {
    return 0;
  }

  return Math.min(Math.floor(abonos / valorCuota), totalCuotas);
}

/**
 * Normaliza el interés a porcentaje legible (ej. 20).
 * Acepta valores guardados como porcentaje (20) o como fracción decimal (0.20).
 */
export function normalizeInteresPercent(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(value)) {
    return null;
  }

  const abs = Math.abs(value);
  if (abs === 0) {
    return 0;
  }

  // Fracción decimal: 0.20 → 20
  if (abs < 1) {
    return abs * 100;
  }

  // Ya viene como porcentaje: 20 → 20
  return abs;
}
