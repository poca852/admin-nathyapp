import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'src/assets/icons/pwa');
const src = path.join(root, 'src/assets/logo/logo.png');
const BG = { r: 122, g: 31, b: 43, alpha: 1 }; // #7A1F2B

async function contentBox(file) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a > 20 && (r < 245 || g < 245 || b < 245)) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

async function arrowsOnly(file) {
  const box = await contentBox(file);
  // Keep upper ~70% (arrows), drop "PAY FLOW" text.
  return {
    left: box.left,
    top: box.top,
    width: box.width,
    height: Math.max(1, Math.floor(box.height * 0.7)),
  };
}

async function toLightMark(buf) {
  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 10) continue;
    const lum = (r + g + b) / 3;
    if (lum > 240) {
      data[i + 3] = 0;
    } else {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = Math.min(255, Math.round((255 - lum) * 1.2));
    }
  }
  return sharp(Buffer.from(data), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

async function makeIcon(size, fillRatio, outName) {
  const crop = await arrowsOnly(src);
  const cropped = await sharp(src).extract(crop).png().toBuffer();
  const mark = await toLightMark(cropped);
  const meta = await sharp(mark).metadata();
  const maxSide = Math.floor(size * fillRatio);
  const scale = Math.min(maxSide / meta.width, maxSide / meta.height);
  const tw = Math.max(1, Math.round(meta.width * scale));
  const th = Math.max(1, Math.round(meta.height * scale));
  const resized = await sharp(mark).resize(tw, th).png().toBuffer();
  const left = Math.floor((size - tw) / 2);
  const top = Math.floor((size - th) / 2);

  await sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: resized, left, top }])
    .png()
    .toFile(path.join(outDir, outName));

  console.log('wrote', outName);
}

await makeIcon(192, 0.7, 'icon-192-v2.png');
await makeIcon(512, 0.7, 'icon-512-v2.png');
await makeIcon(512, 0.56, 'icon-512-maskable-v2.png');
await makeIcon(180, 0.7, 'apple-touch-icon-v2.png');
console.log('ok');
