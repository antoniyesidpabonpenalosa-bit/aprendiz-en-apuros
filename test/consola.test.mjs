/* Pruebas de la consola de laboratorio (js/consola.js).
   Lo que de verdad importa aquí no es que las órdenes funcionen, sino las dos
   promesas del laboratorio: que NADA se guarda y que un ensayo NO CUENTA.
   Uso:  node --test test/consola.test.mjs                                    */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cargarJuego } from './ayuda.mjs';

/* Corre una orden y devuelve la salida como un solo texto, para poder afirmar
   sobre el mensaje sin depender de cómo se parta en líneas. */
const correr = (v, linea, ctx) => {
  const r = v.LAB.ejecutar(linea, ctx || {});
  return { txt: r.lineas.map(l => l.s).join('\n'), err: r.lineas.some(l => l.c === 'err'),
           accion: r.accion, lineas: r.lineas };
};

/* ══════════ LAS PALANCAS ══════════ */

test('un parámetro puesto manda sobre el del juego', () => {
  const v = cargarJuego();
  assert.equal(v.maxVidas(), 3, 'en NORMAL se empieza con 3');
  assert.equal(correr(v, 'vidas 7').err, false);
  assert.equal(v.maxVidas(), 7);
  assert.equal(correr(v, 'tiempo 2').err, false);
  assert.equal(v.facTiempo(), 2);
  assert.equal(correr(v, 'jefe 0.5').err, false);
  assert.equal(v.facJefe(), 0.5);
});

test('la dificultad de base se puede cambiar por nombre', () => {
  const v = cargarJuego();
  assert.equal(v.difActual().id, 1);
  assert.equal(correr(v, 'dif practica').err, false);
  assert.equal(v.difActual().id, 0);
  /* y sin tocar la dificultad que eligió el jugador, que es suya */
  assert.equal(v.S.dif, 1);
});

test('se acepta la coma decimal, que es como se escribe en español', () => {
  const v = cargarJuego();
  assert.equal(correr(v, 'ritmo 1,5').err, false);
  assert.equal(v.facRitmo(), 1.5);
});

test('los enteros se redondean y los rangos se respetan', () => {
  const v = cargarJuego();
  correr(v, 'errores 3.7');
  assert.equal(v.maxErr(), 4, 'errores es entero');
  const r = correr(v, 'vidas 99');
  assert.equal(r.err, true);
  assert.match(r.txt, /1.*9|9/, 'el error dice el rango');
  assert.equal(v.maxVidas(), 3, 'un valor rechazado no cambia nada');
});

test('un valor que no es número se rechaza diciendo qué se esperaba', () => {
  const v = cargarJuego();
  const r = correr(v, 'vidas muchas');
  assert.equal(r.err, true);
  assert.match(r.txt, /número/);
  assert.equal(v.LAB.ensayo(), false, 'una orden fallida no abre un ensayo');
});

/* ══════════ SOLO EXISTE LO DECLARADO ══════════ */

test('un nombre desconocido sugiere el parecido y no inventa parámetros', () => {
  const v = cargarJuego();
  const r = correr(v, 'vida 5');
  assert.equal(r.err, true);
  assert.match(r.txt, /vidas/, 'sugiere el que se quiso escribir');
  assert.deepEqual(Object.keys(v.LAB.valores()), []);
});

test('las claves heredadas de Object no son parámetros', () => {
  const v = cargarJuego();
  for (const malo of ['constructor 3', 'toString 3', '__proto__ 3', 'hasOwnProperty 3']) {
    assert.equal(correr(v, malo).err, true, malo + ' tiene que fallar');
  }
  assert.deepEqual(Object.keys(v.LAB.valores()), []);
  assert.equal(v.LAB.ensayo(), false);
});

test('las órdenes de desarrollo están cerradas hasta escribir dev', () => {
  const v = cargarJuego();
  assert.equal(correr(v, 'dia 4').err, true);
  assert.equal(correr(v, 'dia 4').accion, null);
  assert.equal(correr(v, 'dev').err, false);
  const r = correr(v, 'dia 4');
  assert.equal(r.err, false);
  /* campo a campo: el objeto nace en el contexto de vm y deepEqual estricto
     rechazaría su prototipo aunque el contenido coincida (ver ayuda.mjs) */
  assert.equal(r.accion.tipo, 'dia');
  assert.equal(r.accion.dia, 3);
  assert.equal(correr(v, 'dia 99').err, true, 'fuera de la campaña no');
});

test('salir y fps devuelven la acción al panel', () => {
  const v = cargarJuego();
  assert.equal(correr(v, 'salir').accion.tipo, 'salir');
  correr(v, 'dev');
  assert.equal(correr(v, 'fps').accion.tipo, 'fps');
});

/* ══════════ NADA SE GUARDA ══════════ */

test('durante un ensayo no se escribe en el almacenamiento', () => {
  const v = cargarJuego();
  v.S.pts = 100; v.guardar();
  const antes = v._localStorage.getItem('pa3');
  assert.match(antes, /"pts":100/);

  correr(v, 'vidas 9');                       // empieza el ensayo
  assert.equal(v.LAB.ensayo(), true);
  v.S.pts = 999999; v.guardar();
  assert.equal(v._localStorage.getItem('pa3'), antes, 'el guardado sigue intacto');
});

test('volver a lo normal restaura la partida y vuelve a contar', () => {
  const v = cargarJuego();
  v.S.pts = 100; v.S.xp = 100; v.guardar();

  correr(v, 'vidas 9');
  v.S.pts = 999999;                            // "ganado" con trucos
  assert.equal(correr(v, 'normal').err, false);

  assert.equal(v.LAB.ensayo(), false);
  assert.equal(v.S.pts, 100, 'lo del ensayo no sobrevive ni en memoria');
  assert.equal(v.maxVidas(), 3, 'las palancas vuelven a las del juego');
  assert.match(v._localStorage.getItem('pa3'), /"pts":100/);
  v.S.pts = 150; v.guardar();
  assert.match(v._localStorage.getItem('pa3'), /"pts":150/, 'ya se vuelve a guardar');
});

test('no se vuelve a lo normal en mitad de una prueba', () => {
  const v = cargarJuego();
  correr(v, 'vidas 9');
  const r = correr(v, 'normal', { enNivel: true });
  assert.equal(r.err, true);
  assert.equal(v.LAB.ensayo(), true, 'sigue el ensayo');
  assert.equal(correr(v, 'normal', { enNivel: false }).err, false);
  assert.equal(v.LAB.ensayo(), false);
});

/* ══════════ UN ENSAYO NO CUENTA ══════════ */

test('un ensayo no sube nada al marcador global', async () => {
  const v = cargarJuego();
  let llamadas = 0;
  v.fetch = async () => { llamadas++; return { ok: true }; };

  assert.equal(await v.RANKING.publicar({ nombre: 'YO', puntos: 10, xp: 10, dificultad: 1, temporada: 1 }), true);
  assert.equal(llamadas, 1, 'sin ensayo sí publica');

  correr(v, 'puntos 5');
  assert.equal(await v.RANKING.publicar({ nombre: 'YO', puntos: 99999, xp: 99999, dificultad: 1, temporada: 1 }), false);
  assert.equal(await v.RANKING.publicarReto({ nombre: 'YO', puntos: 99999, xp: 99999, dificultad: 1, fecha: '2026-01-01' }), false);
  assert.equal(llamadas, 1, 'durante el ensayo no sale ni una petición');
});

test('un ensayo no puntúa en una sala', async () => {
  const v = cargarJuego();
  let llamadas = 0;
  v.fetch = async () => { llamadas++; return { ok: true, json: async () => ({}) }; };
  v.SALA.puntuar('K7M2Q', 0, 500);
  await new Promise(r => setTimeout(r, 10));
  const sinEnsayo = llamadas;

  correr(v, 'vidas 9');
  v.SALA.puntuar('K7M2Q', 1, 9999);
  await new Promise(r => setTimeout(r, 10));
  assert.equal(llamadas, sinEnsayo, 'no se manda nada desde un ensayo');
});

/* ══════════ AZAR REPETIBLE ══════════ */

test('la misma semilla da exactamente la misma secuencia', () => {
  const v = cargarJuego();
  /* v.azar es el Math.random del juego, que es el que la semilla sustituye */
  const tira = n => { v.LAB.semilla(n); const f = v.azar; return [f(), f(), f(), f()]; };
  const a = tira(7), b = tira(7), c = tira(8);
  assert.deepEqual(a, b, 'con la misma semilla, la misma partida');
  assert.notDeepEqual(a, c, 'con otra semilla, otra partida');
  for (const x of a) assert.ok(x >= 0 && x < 1, 'sigue siendo un azar de 0 a 1');

  v.LAB.semilla(0);
  const suelto = [v.azar(), v.azar(), v.azar(), v.azar()];
  assert.notDeepEqual(suelto, a, 'con 0 vuelve el azar de verdad');
});

test('fijar el azar también marca la sesión como ensayo', () => {
  const v = cargarJuego();
  correr(v, 'dev');
  assert.equal(correr(v, 'semilla 42').err, false);
  assert.equal(v.LAB.ensayo(), true);
  assert.match(v.LAB.resumen(), /semilla 42/);
  assert.equal(correr(v, 'semilla 0').err, false);
  correr(v, 'normal');
  assert.equal(v.LAB.ensayo(), false);
  assert.equal(v.LAB.resumen(), '');
});

/* ══════════ AYUDA E IDIOMA ══════════ */

test('ayuda lista las órdenes y esconde las de desarrollo', () => {
  const v = cargarJuego();
  const a = correr(v, 'ayuda');
  assert.match(a.txt, /listar/);
  assert.match(a.txt, /normal/);
  assert.doesNotMatch(a.txt, /semilla/, 'las de desarrollo no salen aún');
  correr(v, 'dev');
  assert.match(correr(v, 'ayuda').txt, /semilla/);
});

test('ayuda de un parámetro dice su rango y un ejemplo', () => {
  const v = cargarJuego();
  const r = correr(v, 'ayuda vidas');
  assert.match(r.txt, /1/);
  assert.match(r.txt, /9/);
  assert.match(r.txt, /vidas/);
});

test('un parámetro solo dice cuánto vale ahora', () => {
  const v = cargarJuego();
  assert.match(correr(v, 'tiempo').txt, /tiempo/);
  assert.equal(v.LAB.ensayo(), false, 'consultar no abre un ensayo');
  correr(v, 'tiempo 2');
  assert.match(correr(v, 'tiempo').txt, /tiempo = 2/);
});

test('en inglés se escriben las órdenes en inglés', () => {
  const v = cargarJuego();
  v.S.lang = 'en';
  assert.equal(correr(v, 'lives 6').err, false);
  assert.equal(v.maxVidas(), 6);
  assert.match(correr(v, 'help').txt, /reset/);
  assert.equal(correr(v, 'reset').err, false);
  assert.equal(v.LAB.ensayo(), false);
});

test('listar muestra todos los parámetros y marca los tocados', () => {
  const v = cargarJuego();
  const a = correr(v, 'listar');
  for (const p of v.LAB.PARAMS) assert.match(a.txt, new RegExp(p.id));
  correr(v, 'ojeada 8');
  const b = v.LAB.ejecutar('listar', {});
  const fila = b.lineas.find(l => l.s.startsWith('ojeada'));
  assert.equal(fila.c, 'ok', 'el tocado se marca distinto');
  assert.match(fila.s, /8/);
});

test('el resumen para la cabecera nombra lo que está tocado', () => {
  const v = cargarJuego();
  assert.equal(v.LAB.resumen(), '');
  correr(v, 'vidas 9');
  correr(v, 'tiempo 2');
  assert.equal(v.LAB.resumen(), 'vidas 9 · tiempo 2');
});

test('una línea vacía no hace nada', () => {
  const v = cargarJuego();
  const r = correr(v, '   ');
  assert.equal(r.lineas.length, 0);
  assert.equal(r.accion, null);
});
