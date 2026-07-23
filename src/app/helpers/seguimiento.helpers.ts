export type SeguimientoCobradorRef = {
  cobradorId: string;
  nombre?: string;
  rutaId?: string;
};

export type SeguimientoPagoRef = {
  rutaId?: string;
};

export type SeguimientoRutaRef = {
  id?: string;
  _id?: string;
  nombre?: string;
};

export type RutaMeta = {
  color: string;
  rutaNombre?: string;
  cobradorNombre?: string;
};

/** Color HSL estable por id (cobrador / ruta); no cambia al refrescar. */
export function colorForKey(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  const sat = 62 + (Math.abs(hash >> 8) % 20);
  const light = 42 + (Math.abs(hash >> 16) % 12);
  return `hsl(${hue} ${sat}% ${light}%)`;
}

export function colorForCobrador(cobradorId: string): string {
  return colorForKey(cobradorId);
}

/** Ruta del cobrador seleccionado, o null si no hay seleccion. */
export function resolveSelectedRutaId(
  selectedCobradorId: string | null | undefined,
  cobradores: SeguimientoCobradorRef[],
): string | null {
  if (!selectedCobradorId) return null;
  const cob = cobradores.find((c) => c.cobradorId === selectedCobradorId);
  return cob?.rutaId ? String(cob.rutaId) : null;
}

/** Filtra pagos a una ruta; sin rutaId devuelve todos. */
export function filterPagosByRutaId<T extends SeguimientoPagoRef>(
  pagos: T[],
  rutaId: string | null | undefined,
): T[] {
  if (!rutaId) return pagos;
  return pagos.filter((p) => p.rutaId && String(p.rutaId) === String(rutaId));
}

/** Toggle: segundo clic sobre el mismo cobrador limpia la seleccion. */
export function toggleSelectedCobradorId(
  currentSelectedId: string | null | undefined,
  clickedCobradorId: string,
): string | null {
  return currentSelectedId === clickedCobradorId ? null : clickedCobradorId;
}

/** Empareja ruta → cobrador (si esta en lista) o color por rutaId. */
export function resolveRutaMeta(
  rutaId: string | undefined,
  cobradores: SeguimientoCobradorRef[],
  rutas: SeguimientoRutaRef[],
): RutaMeta {
  if (!rutaId) {
    return { color: colorForKey('sin-ruta') };
  }

  const cob = cobradores.find(
    (c) => c.rutaId && String(c.rutaId) === String(rutaId),
  );
  const ruta = rutas.find(
    (r) => String(r.id || r._id) === String(rutaId),
  );

  return {
    color: cob
      ? colorForCobrador(cob.cobradorId)
      : colorForKey(rutaId),
    rutaNombre: ruta?.nombre || undefined,
    cobradorNombre: cob?.nombre || undefined,
  };
}
