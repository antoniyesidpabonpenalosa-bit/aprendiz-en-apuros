/* Alza (v40.16): el balanceo al caminar y la respiración parado. El tronco sube 1 px y los pies se quedan; se comprueba con los
   atlas reales y con los hechos de js/sprite.js (alzaDe, CORTE_ALZA, pintaCelda). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { decodificarPNG } from '../scripts/lib-pixel.mjs';
import { calcula } from '../scripts/calcula-corte-alza.mjs';
const RAIZ = new URL('../', import.meta.url);
const ctx = createContext({ Image: class { set src(_) {} }, document: { createElement: () => ({ getContext: () => ({}) }) }, SKINS: ['#f4c898'], CAMISAS: ['#39a900'] });
runInContext(readFileSync(new URL('js/sprite.js', RAIZ), 'utf8'), ctx, { filename: 'js/sprite.js' });
const A = runInContext('APRENDIZ', ctx);
const FW = 44, FH = 74;
const atlas = f => decodificarPNG(readFileSync(new URL('img/' + f, RAIZ)));
const ATLAS = { masculina: ['aprendiz-masculino-premium-caminar.png', 'aprendiz-masculino-premium-portada.png'], femenina: ['aprendiz-femenina-caminar.png', 'aprendiz-femenina-portada.png'] };

/* un «lienzo» de mentira con un drawImage por vecino más cercano sobre píxeles, para ver el resultado real */
function lienzo(a, w, h) {
  const out = new Uint32Array(w * h), llamadas = [];
  return { out, llamadas, drawImage(_f, sx, sy, sw, sh, dx, dy, dw, dh) {
    llamadas.push([sx, sy, sw, sh, dx, dy, dw, dh]);
    for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
      const px = dx + x, py = dy + y; if (px < 0 || px >= w || py < 0 || py >= h) continue;
      const u = sx + Math.floor(x * sw / dw), v = sy + Math.floor(y * sh / dh), i = (v * a.w + u) * 4;
      out[py * w + px] = a.rgba[i + 3] ? ((a.rgba[i] << 24) | (a.rgba[i + 1] << 16) | (a.rgba[i + 2] << 8) | 255) >>> 0 : 0;
    }
  } };
}

test('alza: la tabla de cortes del juego es la que sale de los atlas (node scripts/calcula-corte-alza.mjs)', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(A.CORTE_ALZA)), calcula());
});

test('alza: caminando sube en los cuadros 1 y 3 (el pie levantado); parado respira, 1,2 s arriba y 1,2 s abajo; quieto() la apaga', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(p => A.alzaDe(true, p, 0)), [0, 1, 0, 1, 0, 1]);
  assert.deepEqual([0, 600, 1199, 1200, 1800, 2399, 2400, 3600].map(ms => A.alzaDe(false, 0, ms)), [0, 0, 0, 1, 1, 1, 0, 1]);
  const mudo = createContext({ ...ctx, quieto: () => true });
  runInContext(readFileSync(new URL('js/sprite.js', RAIZ), 'utf8'), mudo, { filename: 'js/sprite.js' });
  assert.equal(runInContext('APRENDIZ.alzaDe(true,1,0)+APRENDIZ.alzaDe(false,0,1300)', mudo), 0, 'con prefers-reduced-motion no hay alza');
});

test('alza: sin alza se pinta con un solo drawImage, igual que antes de v40.16', () => {
  const a = atlas(ATLAS.masculina[0]), l = lienzo(a, 60, 90);
  A.pintaCelda(l, null, 0, 0, 30, 80, 74, 44, 0, 43);
  assert.deepEqual(l.llamadas, [[0, 0, FW, FH, 8, 6, 44, 74]]);
});

for (const ap of ['masculina', 'femenina']) {
  test(`alza ${ap}: con 1 px el tronco y la cabeza suben 1, de la fila de corte hacia abajo no cambia nada y no se pierde ni un píxel`, () => {
    const [nc, np] = ATLAS[ap], cam = atlas(nc), por = atlas(np);
    const celdas = [];
    for (let d = 0; d < 8; d++) for (let c = 0; c < 4; c++) celdas.push([cam, d, c, A.CORTE_ALZA[ap].caminar[d], 'caminar']);
    for (let c = 0; c < 4; c++) celdas.push([por, 0, c, A.CORTE_ALZA[ap].portada, 'portada']);
    for (const [a, fila, col, corte, que] of celdas) {
      const quieta = lienzo(a, FW, FH), alzada = lienzo(a, FW, FH);
      A.pintaCelda(quieta, null, col * FW, fila * FH, 22, FH, FH, FW, 0, corte);
      A.pintaCelda(alzada, null, col * FW, fila * FH, 22, FH, FH, FW, 1, corte);
      const f = y => alzada.out.subarray(y * FW, (y + 1) * FW), q = y => quieta.out.subarray(y * FW, (y + 1) * FW);
      const nombre = `${que} fila ${fila} cuadro ${col}`;
      for (let y = corte; y < FH; y++) assert.deepEqual([...f(y)], [...q(y)], `${nombre}: la fila ${y} (cadera, piernas, pies, manos) no se mueve`);
      for (let y = 0; y <= corte - 2; y++) assert.deepEqual([...f(y)], [...q(y + 1)], `${nombre}: la fila ${y} es la ${y + 1} de la celda quieta (todo sube 1 px)`);
      assert.deepEqual([...f(corte - 1)], [...q(corte - 1)], `${nombre}: la fila de corte se repite, sin hueco`);
      assert.ok([...q(0)].every(v => v === 0), `${nombre}: la fila 0 de la celda está vacía, así que subir no recorta nada`);
    }
  });
}

test('alza: con cualquier alto no queda ni un hueco entre los dos trozos y el de abajo llega al mismo pie', () => {
  const a = atlas(ATLAS.femenina[0]);
  for (const alto of [30, 71, 74, 100, 111, 148, 222]) for (const corte of [41, 43, 45]) {
    const l = lienzo(a, 300, 300);
    A.pintaCelda(l, null, 0, 0, 100, 250, alto, Math.round(alto * FW / FH), 1, corte);
    if (l.llamadas.length === 1) { assert.ok(alto < 74 * 0.7, `alto ${alto}: sin alza solo si el sprite es muy pequeño`); continue; }
    const [abajo, arriba] = l.llamadas;
    assert.ok(arriba[5] + arriba[7] >= abajo[5], `alto ${alto}: el de arriba llega hasta donde empieza el de abajo (sin hueco)`);
    assert.equal(abajo[5] + abajo[7], Math.round(250 - alto) + Math.round(alto * (FH - 0) / FH), `alto ${alto}: el de abajo termina en el pie`);
  }
});
