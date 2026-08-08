# Iconos PWA — cómo actualizarlos

Reemplaza estos archivos **manteniendo los mismos nombres**. No hace falta tocar el `manifest.webmanifest` ni el `index.html` (salvo favicons extra).

| Archivo | Tamaño | Uso |
|---------|--------|-----|
| `icon-192.png` | 192×192 | Manifest (`purpose: any`) |
| `icon-512.png` | 512×512 | Manifest (`purpose: any`) |
| `icon-512-maskable.png` | 512×512 | Manifest (`purpose: maskable`); deja ~10% de safe zone |
| `apple-touch-icon.png` | 180×180 | iOS home screen |
| `favicon.png` / `favicon-32x32.png` | 32×32 | Favicon del navegador |
| `favicon-16x16.png` | 16×16 | Favicon pequeño |
| `og.png` | — | Open Graph / share preview |

El logo de marca completo vive en `src/assets/logo/logo.png`.
Los iconos de instalación (`icon-192`, `icon-512`, maskable, apple-touch) deben ser
el **símbolo** a buen tamaño sobre fondo sólido; el wordmark completo casi no se ve
en la pantalla de inicio.

Para regenerarlos desde el logo:

```bash
node scripts/make-pwa-icons.mjs
```

(requiere `sharp`; el script usa `src/assets/logo/logo.png` como fuente).
