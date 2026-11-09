/* Convierte los retratos dibujados (arte/retratos/*.png, 1024×1024 con fondo
   transparente, hechos con IA a partir de la hoja de personaje) a los WebP
   ligeros que usa el juego (img/retratos/*.webp, 384×384).
   Uso:  node scripts/build-retratos.mjs
   Usa el Chromium de Playwright para reescalar y codificar: así no hace falta
   ninguna librería de imágenes. 384 px cubren el retrato más grande del juego
   (120 px en pantalla) en móviles de densidad 3. */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGEN = join(RAIZ, 'arte/retratos'), DESTINO = join(RAIZ, 'img/retratos');
const LADO = 384, CALIDAD = 0.86;

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { ({ chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright')); }

mkdirSync(DESTINO, { recursive: true });
const nav = await chromium.launch();
const pg = await nav.newPage();
let total = 0;
for (const f of readdirSync(ORIGEN).filter(n => n.endsWith('.png')).sort()) {
  const png = 'data:image/png;base64,' + readFileSync(join(ORIGEN, f)).toString('base64');
  const webp = await pg.evaluate(async ({ png, LADO, CALIDAD }) => {
    const im = new Image(); im.src = png; await im.decode();
    /* en dos pasos (1024 → 2×LADO → LADO) para que el reescalado no deje dientes */
    const paso = (src, l) => { const c = document.createElement('canvas'); c.width = c.height = l;
      const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(src, 0, 0, l, l); return c; };
    return paso(paso(im, LADO * 2), LADO).toDataURL('image/webp', CALIDAD);
  }, { png, LADO, CALIDAD });
  const buf = Buffer.from(webp.split(',')[1], 'base64');
  writeFileSync(join(DESTINO, f.replace(/\.png$/, '.webp')), buf);
  total += buf.length;
  console.log(f.replace(/\.png$/, '.webp').padEnd(28), (buf.length / 1024).toFixed(1), 'KB');
}
await nav.close();
console.log('total', (total / 1024).toFixed(0), 'KB');
