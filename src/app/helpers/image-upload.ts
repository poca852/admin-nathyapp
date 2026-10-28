function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('No se pudo leer la imagen'));
    image.src = src;
  });
}

export function ensureDataUrl(value: string, format = 'jpeg'): string {
  if (!value) return value;
  if (value.startsWith('data:')) return value;
  const mime = format === 'png' ? 'png' : 'jpeg';
  return `data:image/${mime};base64,${value}`;
}

async function leerImagen(dataUrl: string): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function' && typeof fetch === 'function') {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return createImageBitmap(blob);
  }
  return loadImage(dataUrl);
}

export async function compressImageDataUrl(
  dataUrl: string,
  maxEdge = 1280,
  quality = 0.7,
): Promise<string> {
  if (!dataUrl?.startsWith('data:image') || typeof document === 'undefined') {
    return dataUrl;
  }

  let image: ImageBitmap | HTMLImageElement | undefined;
  try {
    image = await leerImagen(dataUrl);
    const largest = Math.max(image.width, image.height);
    if (!largest) return dataUrl;
    if (largest <= maxEdge && dataUrl.length < 400_000) return dataUrl;

    const scale = Math.min(1, maxEdge / largest);
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return dataUrl;

    context.drawImage(image, 0, 0, width, height);
    const compressed = canvas.toDataURL('image/jpeg', quality);
    if (compressed.length < dataUrl.length) return compressed;

    const masLigero = canvas.toDataURL('image/jpeg', Math.min(quality, 0.5));
    return masLigero.length < dataUrl.length ? masLigero : dataUrl;
  } catch {
    return dataUrl;
  } finally {
    if (image && 'close' in image) image.close();
  }
}

export type CarpetaFoto = 'documentos' | 'business' | 'house';

const CARPETA_POR_CAMPO: Record<string, CarpetaFoto> = {
  document_image: 'documentos',
  business_image: 'business',
  house_image: 'house',
};

export function carpetaDeFoto(campo: string): CarpetaFoto {
  return CARPETA_POR_CAMPO[campo] ?? 'documentos';
}

function segmentoSeguro(value: string): string {
  const limpio = value.replace(/[^a-zA-Z0-9_-]/g, '');
  return limpio || 'x';
}

function idUnico(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function uniqueImagePath(carpeta: string, owner: string, extra?: string): string {
  const partes = ['clientes', segmentoSeguro(carpeta), segmentoSeguro(owner)];
  if (extra) partes.push(segmentoSeguro(extra));
  partes.push(`${idUnico()}.jpg`);
  return partes.join('/');
}
