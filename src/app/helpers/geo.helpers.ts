import { LngLat } from 'mapbox-gl';

export type LngLatInput = LngLat | [number, number] | number[] | { lng: number; lat: number };

export interface NormalizedLngLat {
  lng: number;
  lat: number;
  /** true si se detectó e invirtió orden [lat, lng] → [lng, lat] */
  swapped: boolean;
}

/**
 * Normaliza coordenadas a [lng, lat] para Mapbox.
 * Si vienen invertidas ([lat, lng]) y el segundo valor no es latitud válida, intenta el swap.
 */
export function normalizeLngLat(input: LngLatInput | null | undefined): NormalizedLngLat | null {
  if (input == null) return null;

  let a: number;
  let b: number;

  if (Array.isArray(input)) {
    if (input.length < 2) return null;
    a = Number(input[0]);
    b = Number(input[1]);
  } else if (typeof input === 'object' && 'lng' in input && 'lat' in input) {
    a = Number((input as { lng: number }).lng);
    b = Number((input as { lat: number }).lat);
  } else {
    return null;
  }

  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;

  const isValidLat = (v: number) => Math.abs(v) <= 90;
  const isValidLng = (v: number) => Math.abs(v) <= 180;

  // Convención esperada: [lng, lat]
  if (isValidLng(a) && isValidLat(b)) {
    return { lng: a, lat: b, swapped: false };
  }

  // Posible [lat, lng] invertido
  if (isValidLat(a) && isValidLng(b)) {
    return { lng: b, lat: a, swapped: true };
  }

  return null;
}

export function toMapboxLngLat(input: LngLatInput | null | undefined): LngLat | null {
  const normalized = normalizeLngLat(input);
  if (!normalized) return null;
  return new LngLat(normalized.lng, normalized.lat);
}
