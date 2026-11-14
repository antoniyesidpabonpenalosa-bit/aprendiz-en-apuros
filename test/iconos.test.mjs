/* Los iconos pixel (js/iconos.js): que las rejillas estén bien hechas, que usen
   SOLO colores de la paleta del juego (los de :root en css/estilos.css), que
   cada emoji que el juego pone en una pantalla tenga su dibujo, y que lo que
   no tenga dibujo siga saliendo como emoji. Son funciones puras: sin navegador. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = f => readFileSync(join(RAIZ, f), 'utf8');

const ctx = createContext({ console, encodeURIComponent });
for (const f of ['js/datos.js', 'js/iconos.js']) runInContext(leer(f), ctx, { filename: f });
const E = runInContext('({ PXI, PXI_PAL, pxi, pxiSvg, pxiRuns, pxiTam, pxiTexto, NIVELES, DIFS, ICO_TIPO })', ctx);

test('cada dibujo es una rejilla cuadrada de 12×12 (el jefe, 16×16) y solo usa letras de la paleta', () => {
  for (const [clave, filas] of Object.entries(E.PXI)) {
    const lado = clave.startsWith('jefe') ? 16 : 12;
    assert.equal(filas.length, lado, `${clave}: alto ${filas.length}, debería ser ${lado}`);
    filas.forEach((f, i) => {
      assert.equal(f.length, lado, `${clave}, fila ${i}: mide ${f.length}, debería medir ${lado}`);
      for (const ch of f) if (ch !== '.') assert.ok(E.PXI_PAL[ch], `${clave}, fila ${i}: la letra "${ch}" no está en la paleta`);
    });
  }
});

test('la paleta es la de la interfaz: cada letra vale lo que su variable de css/estilos.css', () => {
  const css = leer('css/estilos.css');
  const raiz = css.slice(css.indexOf(':root{'), css.indexOf('}', css.indexOf(':root{')));
  const v = nombre => {
    const m = raiz.match(new RegExp('--' + nombre + ':\\s*(#[0-9a-fA-F]{6})'));
    assert.ok(m, `no encuentro --${nombre} en :root`);
    return m[1].toLowerCase();
  };
  const de = {
    k: 'bd', w: 'tx4', l: 'tx3', m: 'tx2', d: 'bl',
    G: 'g4', g: 'g3', h: 'g2', i: 'g1', A: 'y4', a: 'y3', y: 'y2', z: 'y1',
    V: 'v4', v: 'v3', u: 'v2', t: 'v1', O: 'o4', o: 'o3', p: 'o2', q: 'o1',
    B: 'b4', b: 'b3', c: 'b2', e: 'b1', R: 'r4', r: 'r3', s: 'r2', n: 'r1',
  };
  assert.deepEqual(Object.keys(E.PXI_PAL).sort(), Object.keys(de).sort(), 'letras de la paleta y de la prueba distintas');
  for (const [letra, nombre] of Object.entries(de))
    assert.equal(E.PXI_PAL[letra].toLowerCase(), v(nombre), `la letra ${letra} debería ser --${nombre}`);
});

test('todo emoji de las pantallas tiene su dibujo: los 15 días, las dificultades, los minijuegos y el resto', () => {
  const faltan = [];
  const pide = (que, clave) => { if (!E.PXI[clave]) faltan.push(`${que} ${clave}`); };
  [...E.NIVELES].forEach((n, i) => pide(`día ${i + 1}`, n.ico));
  [...E.DIFS].forEach(d => pide('dificultad', d.ico));
  Object.entries(E.ICO_TIPO).forEach(([tipo, ico]) => pide(`minijuego ${tipo}`, ico));
  for (const k of ['🔒', '❌', '📄', '🔊', '🔉', '🔇', 'jefe1', 'jefe2', 'jefe3', '🎓', '🗓', '🔥'])
    pide('suelto', k);
  assert.deepEqual(faltan, []);
});

test('pxi() da la imagen si hay dibujo, y el emoji tal cual si no lo hay', () => {
  assert.match(E.pxi('☕'), /^<img class="pxi " src="data:image\/svg\+xml,/);
  assert.match(E.pxi('☕'), /aria-hidden="true"/);
  assert.equal(E.pxi('🦄'), '🦄', 'sin dibujo, el emoji');
  assert.equal(E.pxi('★'), '★');
});

test('pxiSvg() es un SVG nítido con un rectángulo por tira de color', () => {
  const url = E.pxiSvg('🔒');
  assert.ok(url.startsWith('data:image/svg+xml,'));
  const svg = decodeURIComponent(url.slice('data:image/svg+xml,'.length));
  assert.match(svg, /viewBox="0 0 12 12"/);
  assert.match(svg, /shape-rendering="crispEdges"/);
  assert.equal((svg.match(/<rect /g) || []).length, E.pxiRuns('🔒').length);
  assert.equal(E.pxiSvg('🦄'), '');
  assert.equal(E.pxiRuns('🦄'), null);
});

test('pxiRuns() agrupa los píxeles iguales de una fila y no deja ninguno fuera', () => {
  for (const clave of Object.keys(E.PXI)) {
    const contados = E.pxiRuns(clave).reduce((s, r) => s + r[3], 0);
    const reales = E.PXI[clave].join('').replaceAll('.', '').length;
    assert.equal(contados, reales, `${clave}: las tiras no suman los píxeles del dibujo`);
  }
});

test('pxiTexto() cambia los emojis con dibujo dentro de un texto y deja el resto', () => {
  const s = E.pxiTexto('📚 ETAPA LECTIVA 🦄');
  assert.equal((s.match(/<img /g) || []).length, 1);
  assert.ok(s.includes('ETAPA LECTIVA 🦄'));
  assert.equal(E.pxiTexto('sin emojis'), 'sin emojis');
  assert.ok(!E.pxiTexto('jefe1 es solo el nombre').includes('<img'), 'los dibujos del jefe no se piden por texto');
});

test('los archivos nuevos están en index.html y en la caché del service worker', () => {
  assert.ok(leer('index.html').includes('<script src="js/iconos.js"></script>'));
  assert.ok(leer('sw.js').includes("'./js/iconos.js'"));
});
