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

test('av32 es independiente de hd: los dos se combinan, no se excluyen', () => {
  const a = cargarJuego();
  assert.equal(a.S.av32, false, 'por defecto el retrato sigue siendo el de 16 de toda la vida');
  assert.equal(a.S.hd, false);

  /* Combinación 32 + retro CRT: hd se queda apagado a propósito. */
  a.S.av32 = true;
  assert.equal(a.S.hd, false, 'activar el detalle del retrato no enciende la piel OLED');

  /* Combinación 16 + OLED: la inversa, tampoco se arrastran entre sí. */
  const b = cargarJuego();
  b.S.hd = true;
  assert.equal(b.S.av32, false, 'activar la piel OLED no enciende el retrato de 32 por su cuenta');

  /* Un valor roto en el guardado (partida escrita a mano, versión vieja)
     cae al mismo default seguro que el resto de banderas de S. */
  const c = cargarJuego({ guardado: { av32: 'sí', hd: 1 } });
  assert.equal(c.S.av32, false);
});

test('av32 sobrevive el código de guardado entre dispositivos', () => {
  const a = cargarJuego();
  a.S.av32 = true;
  const codigo = a.exportarCodigo();

  const b = cargarJuego();                       // otro "dispositivo"
  assert.equal(b.S.av32, false);
  b.importarCodigo(codigo);
  assert.equal(b.S.av32, true);

  /* Un código exportado ANTES de que existiera av32 no debe romper la
     importación ni encenderlo por accidente: cae al default. */
  const vieja = a.exportarCodigo().split('.');
  const datosSinAv32 = JSON.parse(decodeURIComponent(escape(atob(vieja[2]))));
  delete datosSinAv32.av32;
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(datosSinAv32))));
  const codigoViejo = 'PA4.' + a.sumaCod(b64) + '.' + b64;
  const c = cargarJuego();
  assert.equal(c.importarCodigo(codigoViejo), true);
  assert.equal(c.S.av32, false);
});

test('un código de antes del modo libre importa completo y bien saneado', () => {
  /* Un código exportado antes de que existieran las marcas del modo libre y
     del sin fin, y con un grupo escrito a mano. Antes importarCodigo() no
     creaba S.mejores y el modo libre se rompía hasta recargar la página. */
  const a = cargarJuego();
  const datos = JSON.parse(decodeURIComponent(escape(atob(a.exportarCodigo().split('.')[2]))));
  delete datos.mejores; delete datos.mejorSinFin; delete datos.vistos;
  datos.grupo = 'adso-26!';
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(datos))));
  const b = cargarJuego();
  assert.equal(b.importarCodigo('PA4.' + a.sumaCod(b64) + '.' + b64), true);
  assert.equal(typeof b.S.mejores, 'object');
  assert.equal(b.S.mejorSinFin, 0);
  assert.ok(Array.isArray(b.S.vistos));
  assert.equal(b.S.grupo, 'ADSO26');
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
                      { puntos: NaN, xp: 10 }, { puntos: Infinity, xp: 10 },
                      /* más puntos que XP: imposible en una partida real, porque
                         los dos suben juntos y solo los puntos bajan al gastar */
                      { puntos: 2901, xp: 2900 }])
    assert.equal(await v.RANKING.publicar({ nombre: 'X', ...malo }), false,
      `debería descartar ${JSON.stringify(malo)}`);

  assert.equal(intentos, 0, 'un puntaje imposible ni siquiera debe llegar a la red');
  /* Partida creíble: 2.900 de XP ganada y 1.750 de puntos porque el resto ya
     se gastó en la tienda. La XP no baja nunca; los puntos sí. */
  assert.equal(await v.RANKING.publicar({ nombre: 'REAL', puntos: 1750, xp: 2900 }), true);
  assert.equal(intentos, 1, 'la partida real sí se envía');
});

test('el hito del día 5 se publica como temporada 0, no como titulado', async () => {
  const v = cargarJuego();
  const cuerpos = [];
  v.fetch = async (url, o) => { cuerpos.push(JSON.parse(o.body)); return { ok: true, json: async () => [] }; };

  await v.RANKING.publicar({ nombre: 'A', puntos: 500, xp: 900, dificultad: 1, temporada: 0 });
  await v.RANKING.publicar({ nombre: 'B', puntos: 500, xp: 900, dificultad: 1, temporada: 2 });
  /* Una temporada que no existe cae al día 10, no se cuela tal cual en la base */
  await v.RANKING.publicar({ nombre: 'C', puntos: 500, xp: 900, dificultad: 1, temporada: 7 });

  assert.deepEqual(cuerpos.map(c => c.temporada), [0, 2, 1]);
});

test('el sin fin publica con su propio hito y no se confunde con la campaña', async () => {
  const v = cargarJuego();
  const cuerpos = [];
  v.fetch = async (url, o) => { cuerpos.push(JSON.parse(o.body)); return { ok: true, json: async () => [] }; };

  assert.equal(v.RANKING.HITO_SIN_FIN, 3, 'el hito del sin fin es el 3');
  await v.RANKING.publicar({ nombre: 'A', puntos: 120, xp: 3000, dificultad: 2,
                             temporada: v.RANKING.HITO_SIN_FIN });
  /* Un hito que no existe sigue cayendo al día 10: ampliar el rango a 3 no
     puede abrir la puerta a cualquier número. */
  await v.RANKING.publicar({ nombre: 'B', puntos: 120, xp: 3000, dificultad: 2, temporada: 4 });

  assert.deepEqual(cuerpos.map(c => c.temporada), [3, 1]);
});

test('los dos marcadores se consultan por separado, nunca mezclados', async () => {
  const v = cargarJuego();
  const urls = [];
  v.fetch = async url => { urls.push(url); return { ok: true, json: async () => [] }; };

  /* Por defecto se mira la campaña, y las rachas del sin fin quedan fuera: sus
     puntajes son de otra escala y colarlos hundiría a la campaña o al revés. */
  await v.RANKING.top(8);
  assert.match(urls.at(-1), /temporada=neq\.3/);

  await v.RANKING.top(8, null, '', 'sinfin');
  assert.match(urls.at(-1), /temporada=eq\.3/);
  assert.doesNotMatch(urls.at(-1), /temporada=neq/);

  /* El código de aula sigue valiendo dentro del sin fin. */
  await v.RANKING.top(8, 2, 'SENA24', 'sinfin');
  assert.match(urls.at(-1), /temporada=eq\.3/);
  assert.match(urls.at(-1), /grupo=eq\.SENA24/);
  assert.match(urls.at(-1), /dificultad=eq\.2/);
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

/* ══════════ NOMBRE DEL JUGADOR ══════════
   Es obligatorio: antes un campo vacío se guardaba como "TÚ" y el juego lo
   daba por bueno (certificado, marcador y proyector con "TÚ"). */

test('el nombre vacío, solo espacios o solo símbolos no vale', () => {
  const { nombreValido } = cargarJuego();
  for (const v of ['', '   ', '...', '-_-', '🙂', null, undefined])
    assert.equal(nombreValido(v), false, JSON.stringify(v));
});

test('"TÚ" o "YOU" (lo que se guardaba al dejarlo vacío) no cuenta como nombre', () => {
  const { nombreValido } = cargarJuego();
  for (const v of ['TÚ', 'tú', 'TU', ' you '])
    assert.equal(nombreValido(v), false, v);
});

test('un nombre real vale, y se guarda limpio', () => {
  const { nombreValido, limpiaNombre } = cargarJuego();
  for (const v of ['Ana', 'maría josé', 'ÑOÑO', 'dev42', '7'])
    assert.equal(nombreValido(v), true, v);
  assert.equal(limpiaNombre('  maría   josé  '), 'MARÍA JOSÉ');
  assert.equal(limpiaNombre('abcdefghij klm'), 'ABCDEFGHIJ', 'nunca más de 10');
  assert.equal(limpiaNombre('abcdefghi jk'), 'ABCDEFGHI', 'sin espacio colgando al cortar');
});

test('una partida guardada con "TÚ" vuelve a pedir el nombre', () => {
  assert.equal(cargarJuego({ guardado: { nombre: 'TÚ' } }).tieneNombre(), false);
  assert.equal(cargarJuego({ guardado: { nombre: '' } }).tieneNombre(), false);
  assert.equal(cargarJuego({ guardado: { nombre: 'ANTONI' } }).tieneNombre(), true);
});

/* ══════════ LAS DOS ETAPAS DE LA FORMACIÓN ══════════
   El juego sigue el camino real: etapa lectiva (días 1-10, se aprende) y
   etapa productiva (días 11-15, se trabaja), y el final es titularse. */

test('hay un diálogo por día en los dos idiomas', () => {
  const v = cargarJuego();
  assert.equal(v.DIALOGOS.es.length, v.NIVELES.length);
  assert.equal(v.DIALOGOS.en.length, v.NIVELES.length);
});

test('el mapa nombra la lectiva antes que la productiva', () => {
  const v = cargarJuego();
  assert.match(v.TXT.es.t1sec, /LECTIVA/);
  assert.match(v.TXT.es.t2sec, /PRODUCTIVA/);
  assert.match(v.TXT.en.t1sec, /TRAINING/);
  assert.match(v.TXT.en.t2sec, /WORKPLACE/);
});

test('el día 1 no arranca ya en una empresa', () => {
  const v = cargarJuego();
  assert.match(v.DIALOGOS.es[0][1], /lectiva/i);
  assert.doesNotMatch(v.DIALOGOS.es[0][1], /etapa productiva/i);
});

/* Los id de los logros viven dentro de las partidas guardadas (S.logros): si
   se renombran, quien ya los tenía los pierde. Cambian el nombre y el icono,
   nunca el id. */
test('los logros de fin de etapa conservan su id', () => {
  const v = cargarJuego();
  const ids = v.LOGROS.map(l => l.id);
  assert.ok(ids.includes('titulado'), 'el del día 10');
  assert.ok(ids.includes('contrato'), 'el del día 15');
  const dia15 = v.LOGROS.find(l => l.id === 'contrato');
  assert.match(dia15.es, /TÉCNICO/, 'el día 15 es el que titula');
});

test('una partida vieja no pierde los logros al cambiar los nombres', () => {
  const a = cargarJuego();
  Object.assign(a.S, { logros: ['titulado', 'contrato'], dias: Array(15).fill(3) });
  const codigo = a.exportarCodigo();
  const b = cargarJuego();
  assert.equal(b.importarCodigo(codigo), true);
  assert.deepEqual([...b.S.logros], ['titulado', 'contrato']);
});
