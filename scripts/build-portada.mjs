/* Genera portada.png (1200×630): la imagen que sale al compartir el enlace
   del juego (Open Graph / Twitter Card, ver index.html).
   Uso:  node scripts/build-portada.mjs
   Se dibuja como una página HTML con las fuentes y las imágenes del propio
   juego y se fotografía con el Chromium de Playwright. */
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const url = f => pathToFileURL(join(RAIZ, f)).href;
let chromium;
try { ({ chromium } = await import('playwright')); }
catch { ({ chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright')); }

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:P;src:url(${url('fuentes/press-start-2p.woff2')})}
@font-face{font-family:V;src:url(${url('fuentes/vt323.woff2')})}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;position:relative;color:#e9ecff;
  background:linear-gradient(rgba(42,49,102,.25) 1px,transparent 1px) 0 0/30px 30px,
             linear-gradient(90deg,rgba(42,49,102,.25) 1px,transparent 1px) 0 0/30px 30px,
             radial-gradient(ellipse at 50% 35%,#16205a,#0b0e22 70%)}
.chip{position:absolute;top:58px;left:50%;transform:translateX(-50%);font:14px P;letter-spacing:2px;
  color:#54c41a;border:3px solid #39a900;padding:12px 18px;background:#0b0e22}
h1{position:absolute;top:128px;width:100%;text-align:center;font:64px/1.35 P;letter-spacing:2px}
h1 .a{color:#ffcf3f;text-shadow:5px 5px 0 #7a3b00,7px 8px 0 #050716}
h1 .b{color:#8aff4f;text-shadow:5px 5px 0 #1f5a00,7px 8px 0 #050716}
.sub{position:absolute;top:332px;width:100%;text-align:center;font:34px V;letter-spacing:3px;color:#9aa3d6}
.btn{position:absolute;top:404px;left:50%;transform:translateX(-50%);font:18px P;color:#08200a;
  background:#54c41a;padding:20px 34px;box-shadow:inset 0 -6px 0 #2f7a0c,0 6px 0 #050716,0 0 30px rgba(84,196,26,.35)}
.yo{position:absolute;left:70px;bottom:40px;width:132px;height:222px;image-rendering:pixelated;
  background:url(${url('img/aprendiz-caminar.png')}) 0 0/528px 1776px no-repeat}
.caras{position:absolute;right:56px;bottom:42px;display:flex;gap:14px}
.caras div{width:118px;height:118px;border:4px solid #2a3166;overflow:hidden;
  background:radial-gradient(circle at 50% 40%,#2a3166,#0b0e22 75%)}
.caras img{width:100%;height:100%;object-fit:cover;transform:scale(1.5);transform-origin:50% 6%}
.caras img.c{transform-origin:60% 6%}
.estrellas{position:absolute;left:84px;top:66px;font:26px P;color:#ffcf3f;letter-spacing:6px}
</style>
<div class="estrellas">★★★</div>
<div class="chip">SENA · 32-BIT / 4K OLED</div>
<h1><span class="a">APRENDIZ</span><br><span class="b">EN APUROS</span></h1>
<p class="sub">LA AVENTURA DEL APRENDIZ</p>
<div class="btn">▶ JUGAR GRATIS</div>
<div class="yo"></div>
<div class="caras">
  <div><img src="${url('img/retratos/instructor-feliz.webp')}"></div>
  <div><img class="c" src="${url('img/retratos/companera-feliz.webp')}"></div>
  <div><img src="${url('img/retratos/lider-normal.webp')}"></div>
</div>`;

const dir = mkdtempSync(join(tmpdir(), 'portada-'));
writeFileSync(join(dir, 'p.html'), html);
const nav = await chromium.launch();
const pg = await nav.newPage({ viewport: { width: 1200, height: 630 } });
await pg.goto(pathToFileURL(join(dir, 'p.html')).href);
await pg.evaluate(() => document.fonts.ready);
await pg.waitForTimeout(300);
await pg.screenshot({ path: join(RAIZ, 'portada.png') });
await nav.close();
console.log('portada.png lista (1200×630)');
