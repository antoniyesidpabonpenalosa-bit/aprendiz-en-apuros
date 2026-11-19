/* Seguridad del código de guardado (v40.18): lo que entra por importar un código o por un localStorage editado se revisa campo a
   campo, y una partida real pasa intacta. Antes, stats y mejores de un código ajeno se pintaban con innerHTML sin revisar. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cargarJuego } from './ayuda.mjs';

const codigoDe = (v, d) => { const b64 = Buffer.from(JSON.stringify(d), 'utf8').toString('base64'); return 'PA4.' + v.sumaCod(b64) + '.' + b64; };
const XSS = '<img src=x onerror="window.__xss=1">';

test('un código ajeno con texto donde van números no deja nada que pintar: stats, mejores, pesos y mejorSinFin quedan numéricos', () => {
  const v = cargarJuego();
  const d = { dias: Array(15).fill(-1), stats: { bugs: XSS, cafes: 5, racha: '9', extra: { a: 1 }, __proto__: { x: 1 } },
    mejores: { 'terminal:1': XSS, 'orden:0': 300, 'raro:2': NaN, ['x'.repeat(60)]: 5 }, pesos: { 'quiz:3': 2, 'quiz:4': 1e9, 'y': 1.5, 'z': 0, 'w': XSS },
    mejorSinFin: Infinity };
  assert.equal(v.importarCodigo(codigoDe(v, d)), true);
  const S = v.S;
  for (const [k, x] of Object.entries(S.stats)) assert.ok(Number.isFinite(x), `stats.${k} es un número`);
  assert.equal(S.stats.bugs, 0, 'un texto en un contador vuelve a 0, no queda');
  assert.equal(S.stats.cafes, 5, 'un contador de verdad se conserva');
  assert.deepEqual(Object.keys(S.mejores), ['orden:0'], 'solo la marca numérica y de clave corta');
  assert.deepEqual({ ...S.pesos }, { 'quiz:3': 2, 'quiz:4': v.PESO_MAX }, 'solo pesos enteros de 1 al máximo (uno gigante se topa)');
  assert.equal(S.mejorSinFin, 0);
  assert.ok(!JSON.stringify(S).includes('<img'), 'no queda ningún texto con etiquetas en la partida');
});

test('un código ajeno con ids raros: las listas quedan en ids válidos, sin repetidos y con tope; números enormes y dificultad rara se corrigen', () => {
  const v = cargarJuego();
  const d = { dias: Array(15).fill(3), accs: ['gafas', XSS, 'gafas', 'x'.repeat(30), 7, null, 'capa'], mejoras: ['doble', {}, 'vida', 'vida'],
    logros: ['primer', '<b>', 'primer'], vistos: ['escribir', XSS], pts: 1e308, xp: Infinity, dif: 1.5,
    nombre: '😀'.repeat(40) };
  assert.equal(v.importarCodigo(codigoDe(v, d)), true);
  const S = v.S;
  assert.deepEqual([...S.accs], ['gafas', 'capa']);
  assert.deepEqual([...S.mejoras], ['doble', 'vida']);
  assert.deepEqual([...S.logros], ['primer']);
  assert.deepEqual([...S.vistos], ['escribir']);
  assert.equal(S.pts, v.TOPE_NUM, 'pts 1e308 se topa');
  assert.equal(S.xp, 0, 'xp infinito vuelve a 0');
  assert.equal(S.dif, 1, 'dificultad 1,5 vuelve a NORMAL');
  assert.equal(Array.from(S.nombre).length, 24, 'el nombre se topa sin partir un emoji');
  const muchos = Array.from({ length: 200 }, (_, i) => 'id' + i);
  assert.equal(v.importarCodigo(codigoDe(v, { dias: Array(15).fill(-1), accs: muchos })), true);
  assert.equal(v.S.accs.length, 64, 'una lista no pasa de 64');
});

test('una partida real pasa intacta por exportar e importar: nada de lo que sale de jugar se pierde', () => {
  const a = cargarJuego();
  a.S.nombre = 'ANTONI'; a.S.grupo = 'ABC123'; a.S.pts = 1234; a.S.xp = 5678; a.S.dif = 2; a.S.apariencia = 'femenina';
  a.S.dias = [3, 3, 2, 3, 1, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1];
  a.S.logros = a.LOGROS.map(l => l.id);
  a.S.accs = a.ACCS.map(x => x.id); a.S.mejoras = a.MEJORAS.map(x => x.id); a.S.acc = 'capa';
  a.S.vistos = ['escribir', 'bugs', 'memoria', 'simon', 'quiz', 'review', 'merge', 'runner', 'sql', 'regex', 'terminal', 'orden', 'jefe'];
  a.S.stats = { bugs: 40, cafes: 12, palabras: 30, jefes: 1, perfectos: 4, racha: 7, partidas: 15, retos: 3 };
  a.S.mejores = { 'terminal:1': 420, 'orden:0': 300, 'escribir:2': 910 }; a.S.mejorSinFin = 7;
  a.S.pesos = { 'quiz:3': 2, 'git:1': 1, 'sql:5': 3 };
  a.S.records = [{ n: 'ANTONI', p: 1200, x: 5000, yo: 1 }];
  const antes = JSON.parse(JSON.stringify(a.S));
  const b = cargarJuego();
  assert.equal(b.importarCodigo(a.exportarCodigo()), true);
  assert.deepEqual(JSON.parse(JSON.stringify(b.S)), antes);
});

test('lo que escribe el repaso espaciado (RETO.marcar) lo acepta el saneado, y su tope es el mismo', () => {
  const v = cargarJuego();
  for (let i = 0; i < 6; i++) v.RETO.marcar('quiz', 3, false);   // 6 fallos seguidos: topa en el máximo
  v.RETO.marcar('git', 1, false);
  const antes = { ...v.S.pesos };
  assert.equal(antes['quiz:3'], v.PESO_MAX);
  const w = cargarJuego();
  assert.equal(w.importarCodigo(v.exportarCodigo()), true);
  assert.deepEqual({ ...w.S.pesos }, antes);
  const reto = readFileSync(new URL('../js/reto.js', import.meta.url), 'utf8');
  assert.equal(+/const TOPE = (\d+)/.exec(reto)[1], v.PESO_MAX, 'PESO_MAX de estado.js va a la par con TOPE de reto.js');
});

test('todo id del juego (logros, accesorios, mejoras) pasa el saneado: ninguno se pierde por tener una forma que el filtro no admite', () => {
  const v = cargarJuego();
  v.S.logros = v.LOGROS.map(l => l.id); v.S.accs = v.ACCS.map(x => x.id); v.S.mejoras = v.MEJORAS.map(x => x.id);
  const w = cargarJuego();
  assert.equal(w.importarCodigo(v.exportarCodigo()), true);
  assert.equal(w.S.logros.length, v.LOGROS.length);
  assert.equal(w.S.accs.length, v.ACCS.length);
  assert.equal(w.S.mejoras.length, v.MEJORAS.length);
});

test('leerCodigo comprueba sin cambiar nada: un código bueno da la partida, uno malo da null, y S no se toca', () => {
  const v = cargarJuego();
  v.S.pts = 321;
  const cod = v.exportarCodigo();
  assert.equal(v.leerCodigo(cod).pts, 321);
  assert.equal(v.leerCodigo('PA4.XX.' + cod.split('.')[2]), null, 'suma de control mala');
  assert.equal(v.leerCodigo('basura'), null);
  assert.equal(v.leerCodigo(''), null);
  assert.equal(v.S.pts, 321);
  assert.equal(v.importarCodigo('basura'), false);
  assert.equal(v.S.pts, 321, 'un código malo no toca la partida');
});

test('los textos de la confirmación de importar existen en español y en inglés', () => {
  const v = cargarJuego();
  for (const l of ['es', 'en']) assert.ok(v.TXT[l].imp_seguro && v.TXT[l].impok && v.TXT[l].impmal, l);
});
