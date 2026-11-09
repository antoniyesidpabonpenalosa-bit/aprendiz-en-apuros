/* Pruebas del sprite del aprendiz: que la dirección elegida por el movimiento
   sea la correcta y que el orden de las 8 direcciones cuadre con el atlas que
   genera scripts/build-sprite.py (mismo orden en el JSON de metadata).
   Uso:  node --test test/*.test.mjs

   dirDe() son cuentas puras; se extrae de js/sprite.js con node:vm, dándole los
   pocos globales que toca (Image/document los usa solo al construirse, así que
   se les da un doble mínimo). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ctx = createContext({
  Image: class { set src(_) {} },                 // no carga nada en las pruebas
  document: { createElement: () => ({ getContext: () => ({}) }) },
  SKINS: ['#f4c898'], CAMISAS: ['#39a900'],
});
runInContext(readFileSync(join(RAIZ, 'js/sprite.js'), 'utf8'), ctx, { filename: 'js/sprite.js' });
const A = runInContext('APRENDIZ', ctx);

test('el orden de las 8 direcciones coincide con arte/aprendiz/metadata.json', () => {
  const meta = JSON.parse(readFileSync(join(RAIZ, 'arte/aprendiz/metadata.json'), 'utf8'));
  const delZip = Object.keys(meta.states[0].frames.rotations);
  assert.deepEqual([...A.DIRS].sort(), [...delZip].sort(), 'mismas 8 direcciones');
  assert.equal(A.DIRS[0], 'south', 'el cuadro 0 es de frente (sur)');
  assert.equal(A.FW, 44); assert.equal(A.FH, 74);
});

test('quieto o sin movimiento mira de frente (sur)', () => {
  assert.equal(A.dirDe(0, 0), A.idx.south);
});

test('el aprendiz mira hacia donde se mueve', () => {
  // dy hacia abajo, como el canvas
  assert.equal(A.dirDe(1, 0), A.idx.east, 'derecha → este');
  assert.equal(A.dirDe(-1, 0), A.idx.west, 'izquierda → oeste');
  assert.equal(A.dirDe(0, 1), A.idx.south, 'abajo → sur');
  assert.equal(A.dirDe(0, -1), A.idx.north, 'arriba → norte');
  assert.equal(A.dirDe(1, 1), A.idx['south-east'], 'abajo-derecha → sureste');
  assert.equal(A.dirDe(-1, -1), A.idx['north-west'], 'arriba-izquierda → noroeste');
  assert.equal(A.dirDe(1, -1), A.idx['north-east'], 'arriba-derecha → noreste');
  assert.equal(A.dirDe(-1, 1), A.idx['south-west'], 'abajo-izquierda → suroeste');
});

test('el jefe solo se mueve a los lados: izquierda/derecha bien orientadas', () => {
  assert.equal(A.dirDe(3.4, 0), A.idx.east);
  assert.equal(A.dirDe(-3.4, 0), A.idx.west);
});

/* ── La caminata: 4 columnas por dirección ── */
test('quieto se usa el cuadro 0; andando, los 4 pasos en orden cada 135 ms', () => {
  assert.equal(A.PASOS, 4);
  assert.equal(A.pasoDe(false, 999999), 0);
  assert.deepEqual([0, 135, 270, 405, 540].map(ms => A.pasoDe(true, ms)), [0, 1, 2, 3, 0]);
});

test('dibujar toma la columna del paso y la fila de la dirección', async () => {
  let cargar;
  const c2 = createContext({
    Image: class { set src(_) { cargar = () => this.onload(); } },
    document: { createElement: () => ({ getContext: () => ({ drawImage() {}, getImageData() { throw new Error('sin píxeles'); } }) }) },
    SKINS: ['#f4c898'], CAMISAS: ['#39a900'], S: { skin: 0, camisa: 0 },
  });
  runInContext(readFileSync(join(RAIZ, 'js/sprite.js'), 'utf8'), c2, { filename: 'js/sprite.js' });
  const B = runInContext('APRENDIZ', c2);
  const pintado = [];
  const ctx2 = { imageSmoothingEnabled: true, drawImage: (...a) => pintado.push(a.slice(1, 5)) };
  assert.equal(B.dibujar(ctx2, 50, 100, 74, B.idx.east, 2), false, 'sin cargar todavía: false (respaldo)');
  cargar();
  assert.equal(B.dibujar(ctx2, 50, 100, 74, B.idx.east, 2), true);
  assert.deepEqual(pintado[0], [2 * 44, B.idx.east * 74, 44, 74]);
  B.dibujar(ctx2, 50, 100, 74, B.idx.south);
  assert.deepEqual(pintado[1], [0, 0, 44, 74], 'sin paso: reposo de frente');
});
