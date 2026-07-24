/** Deriva la URL del socket desde la API si no hay variable explícita. */
export function resolveSocketUrl(
  explicitUrl: string | undefined,
  apiUrl: string | undefined,
): string {
  const explicit = (explicitUrl ?? '').trim();
  if (explicit) {
    return explicit;
  }

  const api = (apiUrl ?? '').trim();
  if (!api) {
    return '';
  }

  return api.replace(/\/api\/?$/, '');
}
