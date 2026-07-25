# Iconos PWA — cómo actualizarlos

Reemplaza estos archivos **manteniendo los mismos nombres y tamaños**. No hace falta tocar el `manifest.webmanifest` ni el `index.html`.

| Archivo | Tamaño | Uso |
|---------|--------|-----|
| `icon-192.png` | 192×192 | Manifest (`purpose: any`) |
| `icon-512.png` | 512×512 | Manifest (`purpose: any`) |
| `icon-512-maskable.png` | 512×512 | Manifest (`purpose: maskable`); deja ~10% de safe zone |
| `apple-touch-icon.png` | 180×180 | iOS home screen |
| `favicon.png` | 48×48 | Favicon del navegador |

## Pasos

1. Exporta tus iconos de marca en PNG (sin transparencia agresiva en maskable).
2. Sobrescribe los archivos de esta carpeta.
3. Rebuild y deploy (`ng build` / pipeline de producción).

Los placeholders actuales son solo marca temporal (`#3880ff` + “P” de PayFlow).
