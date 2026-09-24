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
