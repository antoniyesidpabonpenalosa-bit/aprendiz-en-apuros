/* El pasillo HD (v37, css/estilos.css + js/pasillo.js): lo que se puede comprobar sin
   navegador. Que los 8 recursos sean los del paquete y estén en la caché sin conexión, que el
   CSS apunte a archivos que existen y quede acotado al pasillo, y que cada puerta lleve su hoja
   (lo que gira al abrirse) dentro del botón de siempre. Lo que hay que VER lo prueban los casos
   "pasillo HD" de scripts/regresiones.mjs en un navegador real. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = f => readFileSync(join(RAIZ, f), 'utf8');
const css = leer('css/estilos.css');
const bloque = css.slice(css.indexOf('/* ── PASILLO HD'));
const webp = r => { const b = readFileSync(join(RAIZ, r)); return { tipo: b.toString('ascii', 8, 12) + b.toString('ascii', 12, 16), w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff }; };
const png = r => { const b = readFileSync(join(RAIZ, r)); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; };
const AMB = ['formacion', 'empresa'];

test('8 recursos: techo, muro y suelo WebP de 1774 de ancho y hoja de puerta PNG de 48×84, por ambiente', () => {
  for (const a of AMB) {
    assert.deepEqual(webp(`img/pasillo-hd/${a}-techo.webp`), { tipo: 'WEBPVP8 ', w: 1774, h: 91 });
    assert.deepEqual(webp(`img/pasillo-hd/${a}-muro.webp`), { tipo: 'WEBPVP8 ', w: 1774, h: 255 });
    assert.deepEqual(webp(`img/pasillo-hd/${a}-suelo.webp`), { tipo: 'WEBPVP8 ', w: 1774, h: 97 });
    assert.deepEqual(png(`img/pasillo-hd/${a}-puerta.png`), { w: 48, h: 84 });
  }
});

test('el CSS apunta a archivos que existen y cada ambiente usa los suyos', () => {
  const rutas = [...bloque.matchAll(/url\('([^']+)'\)/g)].map(m => m[1]);
  assert.equal(rutas.length, 8);
  for (const r of rutas) assert.ok(existsSync(resolve(RAIZ, 'css', r)), r);
  assert.match(bloque, /\.pasillo-escena\.pasillo-hd\{[^}]*formacion-techo[^}]*formacion-puerta/);
  assert.match(bloque, /\.pasillo-escena\.pasillo-hd\.pasillo-empresa\{[^}]*empresa-techo[^}]*empresa-puerta/);
});

test('el CSS nuevo está acotado al pasillo (no toca otras pantallas)', () => {
  const sin = bloque.replace(/\/\*[\s\S]*?\*\//g, '');
  const sels = []; let ini = 0;
  for (let i = 0; i < sin.length; i++) {
    if (sin[i] === '{') { const c = sin.slice(ini, i).trim(); if (c && !c.startsWith('@')) sels.push(...c.split(',').map(x => x.trim())); ini = i + 1; }
    else if (sin[i] === '}' || sin[i] === ';') ini = i + 1;
  }
  assert.ok(sels.length > 20);
  assert.deepEqual(sels.filter(s => !/\.pasillo-(hd|vista|escena)/.test(s)), []);
});

test('la puerta: el botón y su marco quedan quietos, gira la hoja; con reducir movimiento, sin transición', () => {
  const js = leer('js/pasillo.js');
  assert.match(js, /<span class="pasillo-marco"><span class="pasillo-hoja" aria-hidden="true"><span class="pasillo-cristal"><\/span><span class="pasillo-manija"><\/span><\/span><\/span>/);
  assert.match(js, /class="pasillo-escena pasillo-hd \$\{bloque\.tipo==='empresa'\?'pasillo-empresa':'pasillo-formacion'\}"/);
  assert.match(bloque, /\.pasillo-hd \.pasillo-puerta\.abriendo \.pasillo-marco\{transform:none\}/);
  assert.match(bloque, /\.pasillo-hd \.pasillo-puerta\.abriendo \.pasillo-hoja\{transform:rotateY\(-68deg\)\}/);
  assert.match(bloque, /@media\(prefers-reduced-motion:reduce\)\{\.pasillo-hd \.pasillo-hoja\{transition:none\}\}/);
});

test('los 8 recursos están en la caché sin conexión', () => {
  const sw = leer('sw.js');
  for (const a of AMB) for (const p of ['techo.webp', 'muro.webp', 'suelo.webp', 'puerta.png']) assert.ok(sw.includes(`'./img/pasillo-hd/${a}-${p}'`), a + p);
});
