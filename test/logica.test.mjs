/* Pruebas de la lógica del juego, sin dependencias (node:test viene con Node).
   Uso:  node --test test/                                                    */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cargarJuego } from './ayuda.mjs';

/* Los arreglos del juego nacen en otro contexto de vm, así que su prototipo no
   es el mismo Array de aquí y deepEqual estricto los rechazaría aunque el
   contenido coincida. Se copian al realm de las pruebas antes de comparar. */
const arr = x => [...x];

/* ══════════ CÓDIGO DE GUARDADO ══════════
   Lo más delicado del juego: si esto se rompe, alguien pierde su partida al
   cambiar de dispositivo y no nos enteramos hasta que ya pasó. */

test('el código de guardado sobrevive la ida y vuelta', () => {
  const a = cargarJuego();
  Object.assign(a.S, {
    pts: 4820, xp: 3100, nombre: 'ANTONI', dif: 2, hd: true,
    dias: [3, 2, 3, 1, 3, 2, 2, 3, 3, 1, 2, 3, 1, 2, 3],
    logros: ['primer', 'perfecto'], mejoras: ['doble', 'vida'], acc: 'capa',
  });
  a.S.stats.bugs = 77;
  const codigo = a.exportarCodigo();

  const b = cargarJuego();                       // otro "dispositivo", vacío
  assert.equal(b.S.pts, 0, 'la partida nueva empieza vacía');
  assert.equal(b.importarCodigo(codigo), true);

  assert.equal(b.S.pts, 4820);
  assert.equal(b.S.xp, 3100);
  assert.equal(b.S.nombre, 'ANTONI');
  assert.equal(b.S.dif, 2);
  assert.deepEqual(arr(b.S.dias), arr(a.S.dias));
  assert.deepEqual(arr(b.S.logros), ['primer', 'perfecto']);
  assert.deepEqual(arr(b.S.mejoras), ['doble', 'vida']);
  assert.equal(b.S.stats.bugs, 77);
  assert.equal(b.S.acc, 'capa');
});

test('el código importado queda guardado en el navegador', () => {
  const a = cargarJuego();
  a.S.pts = 999;
  const b = cargarJuego();
  b.importarCodigo(a.exportarCodigo());
  assert.equal(JSON.parse(b._localStorage.getItem('pa3')).pts, 999,
    'importar sin guardar perdería la partida al recargar');
});

test('el código soporta tildes y emoji en el nombre', () => {
  const a = cargarJuego();
  a.S.nombre = 'ÑOÑO✨';
  const b = cargarJuego();
  assert.equal(b.importarCodigo(a.exportarCodigo()), true);
  assert.equal(b.S.nombre, 'ÑOÑO✨');
});

test('un código manipulado o corrupto se rechaza', () => {
  const a = cargarJuego();
  a.S.pts = 500;
  const bueno = a.exportarCodigo();
  const [, suma, carga] = bueno.split('.');

  const malos = {
    'vacío': '',
    'nulo': null,
    'sin partes': 'PA4',
    'prefijo ajeno': 'XX.' + suma + '.' + carga,
    'suma cambiada': 'PA4.ZZZZ.' + carga,
    'carga alterada': 'PA4.' + suma + '.' + carga.slice(0, -4) + 'AAAA',
    'carga recortada': 'PA4.' + suma + '.' + carga.slice(0, 10),
    'basura': 'esto no es un código',
    'json que no es objeto': (() => {
      const b64 = Buffer.from('[1,2,3]').toString('base64');
      return 'PA4.' + a.sumaCod(b64) + '.' + b64;
    })(),
    'objeto sin días': (() => {
      const b64 = Buffer.from('{"pts":99}').toString('base64');
      return 'PA4.' + a.sumaCod(b64) + '.' + b64;
    })(),
  };

  for (const [nombre, cod] of Object.entries(malos)) {
    const v = cargarJuego();
    assert.equal(v.importarCodigo(cod), false, `debería rechazar: ${nombre}`);
    assert.equal(v.S.pts, 0, `un código inválido (${nombre}) no debe tocar la partida`);
  }
});

test('una partida vieja de 10 días se extiende a 15 al importarla', () => {
  const v = cargarJuego();
  const viejo = { pts: 700, xp: 700, dias: [3, 3, 2, 1, 3, 2, 3, 3, 1, 2] };
  const b64 = Buffer.from(JSON.stringify(viejo)).toString('base64');
  assert.equal(v.importarCodigo('PA4.' + v.sumaCod(b64) + '.' + b64), true);
  assert.equal(v.S.dias.length, v.TOT_DIAS, 'debe rellenar hasta los 15 días');
  assert.deepEqual(arr(v.S.dias).slice(0, 10), viejo.dias, 'sin perder lo ya jugado');
  assert.deepEqual(arr(v.S.dias).slice(10), [-1, -1, -1, -1, -1], 'los días nuevos, sin jugar');
});

test('una dificultad inválida en el código cae a Normal', () => {
  for (const dif of [7, -3, 'difícil', null]) {
    const v = cargarJuego();
    const b64 = Buffer.from(JSON.stringify({ dias: Array(15).fill(-1), dif })).toString('base64');
    v.importarCodigo('PA4.' + v.sumaCod(b64) + '.' + b64);
    assert.equal(v.S.dif, 1, `dif=${JSON.stringify(dif)} debería caer a 1`);
  }
});

/* ══════════ RANGOS Y VIDAS ══════════ */

test('cada rango empieza exactamente en su XP', () => {
  const { rangoDe, RANGOS } = cargarJuego();
  for (const r of RANGOS) {
    assert.equal(rangoDe(r.xp).es, r.es, `${r.xp} XP debería ser ${r.es}`);
    if (r.xp > 0) assert.notEqual(rangoDe(r.xp - 1).es, r.es, `${r.xp - 1} XP aún no es ${r.es}`);
  }
  assert.equal(rangoDe(0).es, 'ASPIRANTE');
  assert.equal(rangoDe(999999).es, RANGOS[RANGOS.length - 1].es, 'por encima del tope, el rango máximo');
  assert.equal(rangoDe(-50).es, 'ASPIRANTE', 'XP negativo no debe romper');
});

test('las vidas dependen de la dificultad y de la mejora', () => {
  const v = cargarJuego();
  const vidasCon = (dif, mejoras = []) => { v.S.dif = dif; v.S.mejoras = mejoras; return v.maxVidas(); };
  assert.equal(vidasCon(0), 4, 'Práctica da una vida de más');
  assert.equal(vidasCon(1), 3, 'Normal, tres');
  assert.equal(vidasCon(2), 2, 'Pesadilla, una menos');
  assert.equal(vidasCon(2, ['vida']), 3, 'la mejora suma una');

  /* Con las tres dificultades de hoy lo peor son 2 vidas, así que el suelo de
     maxVidas() nunca se alcanza y comprobarlo con ellas no probaría nada. Se
     añade una dificultad brutal para verificar lo que ese suelo protege: si
     mañana alguien mete una más dura, el juego no debe arrancar con 0 vidas
     (sería imposible de jugar). */
  v.DIFS.push({ id: 3, ico: '☠️', es: 'IMPOSIBLE', en: 'IMPOSSIBLE', vida: -9, tiempo: .5, jefe: 2 });
  assert.equal(vidasCon(3), 1, 'nunca menos de una vida, por dura que sea la dificultad');
  v.DIFS.pop();
});

test('el progreso se corta en el primer día sin superar', () => {
  const v = cargarJuego();
  v.S.dias = [3, 2, 1, -1, 3, 3, ...Array(9).fill(-1)];
  assert.equal(v.progreso(), 3, 'el día 5 no cuenta si el 4 está sin jugar');
  assert.equal(v.totalStars(), 3 + 2 + 1 + 3 + 3, 'las estrellas sí suman todas');
  v.S.dias = Array(15).fill(-1);
  assert.equal(v.progreso(), 0);
  assert.equal(v.totalStars(), 0);
});

/* ══════════ ESCAPE DE TEXTO AJENO ══════════ */

test('esc() neutraliza el HTML de los nombres del marcador', () => {
  const { esc } = cargarJuego();
  assert.equal(esc('<b>PWN</b>'), '&lt;b&gt;PWN&lt;/b&gt;');
  assert.equal(esc(`<img src="x" onerror='y'>`),
    '&lt;img src=&quot;x&quot; onerror=&#39;y&#39;&gt;');
  assert.equal(esc('a & b'), 'a &amp; b');
  assert.equal(esc('normal'), 'normal', 'el texto limpio no cambia');
  assert.equal(esc(null), 'null', 'no debe lanzar con valores raros');
});

/* ══════════ MARCADOR GLOBAL ══════════ */

test('no se publica un puntaje imposible: se descarta, no se recorta', async () => {
  const v = cargarJuego();
  let intentos = 0;
  v.fetch = async () => { intentos++; return { ok: true, json: async () => [] }; };

  for (const malo of [{ puntos: 99999999, xp: 10 }, { puntos: -5, xp: 10 },
                      { puntos: 'muchos', xp: 10 }, { puntos: 100, xp: 500000 },
                      { puntos: NaN, xp: 10 }, { puntos: Infinity, xp: 10 }])
    assert.equal(await v.RANKING.publicar({ nombre: 'X', ...malo }), false,
      `debería descartar ${JSON.stringify(malo)}`);

  assert.equal(intentos, 0, 'un puntaje imposible ni siquiera debe llegar a la red');
  assert.equal(await v.RANKING.publicar({ nombre: 'REAL', puntos: 6400, xp: 2900 }), true);
  assert.equal(intentos, 1, 'la partida real sí se envía');
});

test('la consulta del marcador solo filtra por dificultades que existen', async () => {
  const v = cargarJuego();
  const urls = [];
  v.fetch = async url => { urls.push(url); return { ok: true, json: async () => [] }; };

  await v.RANKING.top(8, 2);
  assert.match(urls.at(-1), /dificultad=eq\.2/, 'la dificultad válida se pide al servidor');
  for (const raro of [null, undefined, 9, -1, '1']) {
    await v.RANKING.top(8, raro);
    assert.doesNotMatch(urls.at(-1), /dificultad=/, `${JSON.stringify(raro)} no debe filtrar`);
  }
});

test('el marcador devuelve null cuando la red falla, nunca lanza', async () => {
  const v = cargarJuego();
  v.fetch = async () => { throw new Error('sin red'); };
  assert.equal(await v.RANKING.top(8), null);
  assert.equal(await v.RANKING.publicar({ nombre: 'X', puntos: 10, xp: 10 }), false);

  v.fetch = async () => ({ ok: false, status: 500, json: async () => ({}) });
  assert.equal(await v.RANKING.top(8), null, 'un 500 tampoco debe romper la pantalla');
});
