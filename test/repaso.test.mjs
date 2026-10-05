/* El modo Repaso (reto.js · repasoSolo): el sorteo se queda SOLO con lo fallado.
   Uso:  node --test test/repaso.test.mjs                                     */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cargarJuego } from './ayuda.mjs';

const fallar = (v, pool, idxs) => idxs.forEach(i => { v.RETO.marcar(pool, i, false); });
const nums = a => [...a].map(Number);

test('sin repaso, el sorteo sigue siendo normal (sesga pero no se limita)', () => {
  const v = cargarJuego();
  fallar(v, 'quiz', [3, 7]);
  const visto = new Set();
  for (let k = 0; k < 200; k++) nums(v.RETO.elegir('quiz', 30, 6)).forEach(i => visto.add(i));
  assert.ok(visto.size > 20, 'salen ítems de todo el banco: ' + visto.size);
});

test('con repaso, y suficientes débiles, SOLO salen los débiles', () => {
  const v = cargarJuego();
  fallar(v, 'quiz', [2, 5, 9, 11, 14, 20, 25]);
  v.RETO.repasoSolo(true);
  for (let k = 0; k < 50; k++) {
    const sal = nums(v.RETO.elegir('quiz', 30, 6));
    assert.equal(sal.length, 6);
    assert.equal(new Set(sal).size, 6, 'sin repetir');
    for (const i of sal) assert.ok([2, 5, 9, 11, 14, 20, 25].includes(i), `salió ${i}, que no era débil`);
  }
});

test('con menos débiles que rondas: entran todos y el resto se completa', () => {
  const v = cargarJuego();
  fallar(v, 'quiz', [4, 8]);
  v.RETO.repasoSolo(true);
  for (let k = 0; k < 50; k++) {
    const sal = nums(v.RETO.elegir('quiz', 30, 6));
    assert.equal(sal.length, 6, 'la ronda nunca se queda corta');
    assert.equal(new Set(sal).size, 6);
    assert.ok(sal.includes(4) && sal.includes(8), 'los dos débiles entran siempre');
  }
});

test('con repaso pero sin ningún débil, se comporta como un sorteo normal', () => {
  const v = cargarJuego();
  v.RETO.repasoSolo(true);
  assert.equal(v.RETO.elegir('quiz', 30, 6).length, 6);
});

test('el repaso también filtra elegirDe (los comandos del simon)', () => {
  const v = cargarJuego();
  fallar(v, 'git', [1, 3]);
  v.RETO.repasoSolo(true);
  for (let k = 0; k < 40; k++) {
    const sal = nums(v.RETO.elegirDe('git', [0, 1, 2, 3, 4, 5], 4));
    assert.equal(sal.length, 4);
    assert.ok(sal.includes(1) && sal.includes(3), 'los débiles van siempre en el tablero');
  }
});

test('repasoSolo(false) suelta el modo', () => {
  const v = cargarJuego();
  fallar(v, 'quiz', [1, 2, 3, 4, 5, 6, 7]);
  v.RETO.repasoSolo(true); v.RETO.repasoSolo(false);
  const visto = new Set();
  for (let k = 0; k < 150; k++) nums(v.RETO.elegir('quiz', 30, 6)).forEach(i => visto.add(i));
  assert.ok(visto.size > 15, 'vuelven a salir los no débiles');
});

test('acertar un ítem lo saca del repaso', () => {
  const v = cargarJuego();
  fallar(v, 'quiz', [6]);
  assert.equal(v.RETO.repaso([{ pool: 'quiz', total: 30, etiqueta: 'q' }])[0].pendientes, 1);
  v.RETO.marcar('quiz', 6, true);
  assert.equal(v.RETO.repaso([{ pool: 'quiz', total: 30, etiqueta: 'q' }])[0].pendientes, 0);
});
