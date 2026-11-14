/* El jefe evolutivo (js/jefe-sprites.js): las cuentas de las fases y de la
   animación, que los recursos sean los que el código espera y que estén en la
   caché sin conexión. Lo que hay que VER (la transformación en el combate, la
   pausa, la salida y el emoji de respaldo) lo prueban los casos "jefe ·" de
   scripts/regresiones.mjs en un navegador real. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = f => readFileSync(join(RAIZ, f), 'utf8');

const ctx = createContext({ console });
runInContext(leer('js/jefe-sprites.js'), ctx, { filename: 'js/jefe-sprites.js' });
const J = runInContext('({ JEFE_SPR, jefeFaseDe, jefeCuadro, jefeTransFin, jefeTransDuracion, jefeFilaDe, jefeEsquina })', ctx);

test('las fases salen de la vida con los umbrales de siempre: más de 66, más de 33, el resto', () => {
  const casos = [[100, 1], [67, 1], [66, 2], [50, 2], [34, 2], [33, 3], [10, 3], [0, 3]];
  for (const [hp, fase] of casos) assert.equal(J.jefeFaseDe(hp), fase, `${hp} HP`);
});

test('jefe.js decide la fase con jefeFaseDe y no la calcula por su cuenta', () => {
  const js = leer('js/jefe.js');
  assert.ok(js.includes('jefeFaseDe(jefe.hp)'));
  /* (el color de la barra de vida sí mira hp>33, como siempre: es de la barra, no de la fase) */
  assert.ok(!/hp\s*>\s*66/.test(js), 'umbral de fase suelto en jefe.js');
});

test('la transformación dura 12 cuadros de 85 ms (1,02 s) y no pasa del último cuadro', () => {
  assert.equal(J.jefeTransDuracion(), 1020);
  const casos = [[-5, 0], [0, 0], [84, 0], [85, 1], [169, 1], [170, 2], [935, 11], [1019, 11], [1020, 11], [5000, 11]];
  for (const [ms, q] of casos) assert.equal(J.jefeCuadro(ms), q, `${ms} ms`);
  assert.equal(J.jefeTransFin(1019), false);
  assert.equal(J.jefeTransFin(1020), true);
});

test('con pasos de 50 ms (el tope del bucle) ningún cuadro se salta', () => {
  const vistos = new Set();
  for (let ms = 0; !J.jefeTransFin(ms); ms += 50) vistos.add(J.jefeCuadro(ms));
  assert.equal(vistos.size, 12);
});

test('cada transformación usa su fila: 1→2 la fila 0 y 2→3 la fila 1', () => {
  assert.equal(J.jefeFilaDe(1), 0);
  assert.equal(J.jefeFilaDe(2), 1);
});

test('el ancla del arte (centro x=64, suelo y=113) cae en el punto pedido', () => {
  const e = J.jefeEsquina(160, 77);
  const s = J.JEFE_SPR.ESC;
  assert.ok(Math.abs(e.x - (160 - 64 * s)) < 1e-9);
  assert.ok(Math.abs(e.y - (77 - 113 * s)) < 1e-9);
  assert.ok(Math.abs(e.t - 128 * s) < 1e-9, 'la celda sale cuadrada: sin deformar');
});

/* El tamaño de un PNG está en su cabecera (IHDR): ancho y alto en los bytes 16-23, tipo de color en el 25 */
const cabecera = ruta => { const b = readFileSync(join(RAIZ, ruta)); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), color: b[25] }; };

test('los recursos son los del paquete: 3 poses de 128×128 y un atlas de 1536×256, todos con transparencia (RGBA)', () => {
  const r = J.JEFE_SPR.RUTAS;
  for (const k of ['1', '2', '3']) assert.deepEqual(cabecera(r[k]), { w: 128, h: 128, color: 6 }, r[k]);
  assert.deepEqual(cabecera(r.atlas), { w: 1536, h: 256, color: 6 });
  assert.equal(J.JEFE_SPR.CUADROS * J.JEFE_SPR.CELDA, 1536, '12 columnas de 128 px');
});

test('las rutas son relativas (valen en Vercel y en GitHub Pages) y existen', () => {
  for (const ruta of Object.values(J.JEFE_SPR.RUTAS)) {
    assert.ok(!ruta.startsWith('/') && !/^https?:/.test(ruta), `${ruta} no es relativa`);
    assert.ok(existsSync(join(RAIZ, ruta)), `${ruta} no existe`);
  }
});

test('el service worker precarga los dibujos y el módulo; index.html carga el módulo antes que jefe.js', () => {
  const sw = leer('sw.js');
  for (const ruta of Object.values(J.JEFE_SPR.RUTAS)) assert.ok(sw.includes(`'./${ruta}'`), `${ruta} falta en la caché de sw.js`);
  assert.ok(sw.includes("'./js/jefe-sprites.js'"));
  const html = leer('index.html');
  const a = html.indexOf('js/jefe-sprites.js'), b = html.indexOf('js/jefe.js');
  assert.ok(a > 0 && a < b, 'jefe-sprites.js debe cargarse antes de jefe.js');
});
