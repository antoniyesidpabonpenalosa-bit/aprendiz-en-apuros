/* Lógica pura de la ronda en vivo (js/sala.js). Uso: node --test test/salavivo.test.mjs */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cargarJuego } from './ayuda.mjs';

test('preguntasVivo: n preguntas distintas, dentro del banco', () => {
  const v = cargarJuego();
  for (let k = 0; k < 100; k++) {
    const q = [...v.SALA.preguntasVivo(8, 48)];
    assert.equal(q.length, 8);
    assert.equal(new Set(q).size, 8, 'sin repetir');
    assert.ok(q.every(i => Number.isInteger(i) && i >= 0 && i < 48));
  }
});

test('preguntasVivo: no pide más de las que hay y reparte de verdad', () => {
  const v = cargarJuego();
  assert.equal(v.SALA.preguntasVivo(10, 4).length, 4);
  assert.equal(v.SALA.preguntasVivo(0, 48).length, 0);
  const visto = new Set();
  for (let k = 0; k < 200; k++) [...v.SALA.preguntasVivo(5, 48)].forEach(i => visto.add(i));
  assert.ok(visto.size > 40, 'salen casi todas las del banco: ' + visto.size);
});

test('preguntasVivo es determinista con un generador fijo', () => {
  const v = cargarJuego();
  const gen = () => { let a = 7; return () => (a = (a * 16807) % 2147483647) / 2147483647; };
  assert.deepEqual([...v.SALA.preguntasVivo(6, 48, gen())], [...v.SALA.preguntasVivo(6, 48, gen())]);
});

test('puntosPorRapidez: de 1000 al instante a 300 al límite, 0 si se falla', () => {
  const v = cargarJuego();
  const p = v.SALA.puntosPorRapidez;
  assert.equal(p(0, 20), 1000);
  assert.equal(p(10000, 20), 650);
  assert.equal(p(20000, 20), 300);
  assert.equal(p(99999, 20), 300, 'pasado el límite no baja de 300');
  assert.equal(p(0, 20, false), 0);
  assert.ok(p(3000, 20) > p(8000, 20), 'contestar antes vale más');
});

test('restanteMs suma lo transcurrido en este dispositivo y no baja de 0', () => {
  const v = cargarJuego();
  const est = { ms: 5000, limite: 20 };
  assert.equal(v.SALA.restanteMs(est, 1000, 1000), 15000);
  assert.equal(v.SALA.restanteMs(est, 1000, 4000), 12000, 'pasaron 3 s aquí');
  assert.equal(v.SALA.restanteMs(est, 1000, 999999), 0);
  assert.equal(v.SALA.restanteMs({ ms: null, limite: 20 }, 0, 0), 0, 'sin pregunta en curso');
  assert.equal(v.SALA.restanteMs(null, 0, 0), 0);
});

test('esVivo distingue las dos formas de sala', () => {
  const v = cargarJuego();
  assert.equal(v.SALA.esVivo({ modo: 'vivo' }), true);
  assert.equal(v.SALA.esVivo({ modo: 'ritmo' }), false);
  assert.equal(v.SALA.esVivo({}), false, 'una sala de antes de esta función');
  assert.equal(v.SALA.esVivo(null), false);
});

test('la config de la ronda en vivo vive en la sesión del instructor y no la ve otro código', () => {
  const v = cargarJuego();
  v.SALA.guardarSesion({ codigo: 'K7M2Q', host: 'tok' });
  v.SALA.fijarVivo('K7M2Q', { n: 8, limite: 20 });
  const c = v.SALA.configVivo('K7M2Q');
  assert.equal(c.n, 8); assert.equal(c.limite, 20);
  assert.equal(v.SALA.configVivo('ZZZZZ'), null);
  v.SALA.fijarVivo('ZZZZZ', { n: 1, limite: 5 });            // otro código: no toca nada
  assert.equal(v.SALA.configVivo('K7M2Q').n, 8);
  assert.equal(v.SALA.soyHost('K7M2Q'), true, 'sigue siendo el instructor');
});

test('el panel y los reportes no salen en un ensayo de la consola', async () => {
  const v = cargarJuego();
  let llamadas = 0;
  v.fetch = async () => { llamadas++; return { ok: true, json: async () => true }; };
  v.SALA.guardarSesion({ codigo: 'K7M2Q', id: 'abc', token: 'tt' });
  v.LAB.ejecutar('vidas 9', {});
  v.SALA.reportar('K7M2Q', 1, [['quiz', 3, false]]);
  await new Promise(r => setTimeout(r, 20));
  assert.equal(llamadas, 0);
});

test('RETO.escuchar recibe cada ítem jugado y un oyente roto no rompe el juego', () => {
  const v = cargarJuego();
  const vistos = [];
  v.RETO.escuchar((p, i, ok) => vistos.push([p, i, ok]));
  v.RETO.marcar('quiz', 4, true);
  v.RETO.marcar('git', 2, false);
  assert.equal(JSON.stringify(vistos), JSON.stringify([['quiz', 4, true], ['git', 2, false]]));
  v.RETO.escuchar(() => { throw new Error('roto'); });
  assert.doesNotThrow(() => v.RETO.marcar('quiz', 5, false));
  assert.equal(v.RETO.pesos()['quiz:5'], 1, 'y el peso se guardó igual');
});
