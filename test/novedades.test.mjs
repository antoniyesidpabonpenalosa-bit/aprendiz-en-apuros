/* Pruebas del aviso de novedades (js/estado.js · novedadesPendientes).
   Lo que se vigila: que a quien estrena el juego no se le cuenten cambios que
   no ha visto nunca, que a quien vuelve se le cuente TODO lo que se perdió, y
   que no se le repita.
   Uso:  node --test test/novedades.test.mjs                                  */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cargarJuego } from './ayuda.mjs';

/* [...l] copia al realm de las pruebas: los arreglos nacen en el contexto de
   vm y deepEqual estricto rechazaría su prototipo (ver test/ayuda.mjs). */
const ids = l => [...l].map(n => n.v);

test('a quien estrena el juego no se le cuenta nada', () => {
  const v = cargarJuego();
  assert.deepEqual(ids(v.novedadesPendientes()), [], 'partida recién nacida');
  v.marcarVersionVista();
  assert.equal(v.S.version, v.VERSION, 'pero sí se apunta la versión');
});

test('a quien ya jugó y viene de una versión anterior se le cuentan los cambios', () => {
  const v = cargarJuego();
  v.S.intro = true;                       // ya había jugado
  v.S.version = 'v0';                     // una versión que ya no está en la lista
  const l = v.novedadesPendientes();
  assert.ok(l.length >= 1, 'hay algo que contar');
  assert.equal(l[0].v, v.VERSION, 'lo primero es lo más nuevo');
  assert.ok(l.length <= 3, 'sin abrumar con toda la historia');
});

test('a quien ya jugó y no tenía versión apuntada se le enseña lo último', () => {
  const v = cargarJuego();
  v.S.pts = 500;                          // partida de antes de que esto existiera
  v.S.version = '';
  const l = v.novedadesPendientes();
  assert.equal(l.length >= 1, true);
  assert.equal(l[0].v, v.VERSION);
});

test('no se repite: una vez visto, ya no sale', () => {
  const v = cargarJuego();
  v.S.intro = true; v.S.version = 'v0';
  assert.ok(v.novedadesPendientes().length > 0);
  v.marcarVersionVista();
  assert.deepEqual(ids(v.novedadesPendientes()), [], 'y no vuelve a salir');
  assert.match(v._localStorage.getItem('pa3'), new RegExp(`"version":"${v.VERSION}"`), 'queda guardado');
});

test('quien ya está en la versión de ahora no ve nada', () => {
  const v = cargarJuego();
  v.S.intro = true;
  v.S.version = v.VERSION;
  assert.deepEqual(ids(v.novedadesPendientes()), []);
});

test('se cuenta TODO lo salido desde la versión del jugador, no solo lo último', () => {
  const v = cargarJuego();
  /* Se simulan tres versiones para no depender de cuántas haya de verdad */
  v.NOVEDADES.length = 0;
  v.NOVEDADES.push({ v: v.VERSION, es: ['c'], en: ['c'] },
                   { v: 'vB', es: ['b'], en: ['b'] },
                   { v: 'vA', es: ['a'], en: ['a'] });
  v.S.intro = true; v.S.version = 'vA';
  assert.deepEqual(ids(v.novedadesPendientes()), [v.VERSION, 'vB'], 'las dos que se perdió');
  v.S.version = 'vB';
  assert.deepEqual(ids(v.novedadesPendientes()), [v.VERSION], 'solo la última');
});

test('cada novedad viene en los dos idiomas y no llega vacía', () => {
  const v = cargarJuego();
  for (const n of v.NOVEDADES) {
    assert.ok(Array.isArray(n.es) && n.es.length, `${n.v} sin texto en español`);
    assert.ok(Array.isArray(n.en) && n.en.length, `${n.v} sin texto en inglés`);
    assert.equal(n.es.length, n.en.length, `${n.v}: los dos idiomas no dicen lo mismo`);
  }
});

test('la versión sobrevive al código de guardado', () => {
  const a = cargarJuego();
  a.S.intro = true; a.marcarVersionVista();
  const b = cargarJuego();
  assert.equal(b.importarCodigo(a.exportarCodigo()), true);
  assert.equal(b.S.version, b.VERSION, 'al cambiar de aparato no se repiten las novedades');
});

test('una partida borrada no pierde el campo de versión', () => {
  const v = cargarJuego();
  v.S = Object.assign({}, v.DEF);          // como al borrar la partida
  assert.equal(typeof v.S.version, 'string');
});
