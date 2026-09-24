/* Pruebas de las salas de clase: la lógica que no depende de la pantalla.
   Uso:  node --test test/*.test.mjs
   El servidor se sustituye por un fetch de mentira: aquí no se sale a la red. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cargarJuego } from './ayuda.mjs';

const arr = x => [...x];
const jug = (id, puntos, ronda = 0, extra = {}) =>
  ({ id, nombre: id, skin: 0, camisa: 0, acc: '', av32: false, ronda, puntos, host: false, ...extra });

/* Un fetch que responde lo que diga `respuesta(nombre, args)` y apunta cada llamada. */
function servidor(v, respuesta) {
  const llamadas = [];
  v.fetch = async (url, opts) => {
    const nombre = String(url).split('/rpc/')[1];
    const args = JSON.parse(opts.body);
    llamadas.push({ nombre, args });
    const { status = 200, cuerpo = null } = (await respuesta(nombre, args, llamadas.length)) || {};
    return { ok: status < 300, status, text: async () => (cuerpo === null ? '' : JSON.stringify(cuerpo)) };
  };
  return llamadas;
}
const espera = ms => new Promise(r => setTimeout(r, ms));

test('el código se limpia como se escribe en clase: minúsculas, espacios, guiones', () => {
  const { SALA } = cargarJuego();
  assert.equal(SALA.limpiaCodigo(' k7m-2q '), 'K7M2Q');
  assert.equal(SALA.limpiaCodigo('abcdefgh'), 'ABCDE', 'nunca más de 5');
  assert.ok(SALA.CODIGO_OK.test('K7M2Q'));
  assert.ok(!SALA.CODIGO_OK.test('K0M2Q'), 'el 0 no existe en el alfabeto');
  assert.ok(!SALA.CODIGO_OK.test('KIM2Q'), 'la I tampoco');
});

test('la tabla se ordena por puntos, luego rondas, luego llegada, sin tocar la lista', () => {
  const { SALA } = cargarJuego();
  const js = [jug('ANA', 500, 1), jug('BETO', 900, 2), jug('CATA', 500, 2), jug('DANI', 500, 1)];
  const copia = JSON.stringify(js);
  assert.deepEqual(arr(SALA.ordenar(js)).map(j => j.id), ['BETO', 'CATA', 'ANA', 'DANI']);
  assert.equal(JSON.stringify(js), copia, 'ordenar no muta lo recibido del servidor');
});

test('los empates comparten puesto (1, 2, 2, 4)', () => {
  const { SALA } = cargarJuego();
  const o = SALA.ordenar([jug('A', 900, 2), jug('B', 500, 1), jug('C', 500, 1), jug('D', 100, 1)]);
  assert.deepEqual(arr(SALA.puestos(o)), [1, 2, 2, 4]);
});

test('todos terminaron solo cuando cada uno jugó todas las rondas', () => {
  const { SALA } = cargarJuego();
  const e = (js) => ({ codigo: 'K7M2Q', dificultad: 1, juegos: ['quiz', 'bugs'], estado: 'jugando', jugadores: js });
  assert.equal(SALA.todosTerminaron(e([])), false, 'una sala vacía no ha terminado');
  assert.equal(SALA.todosTerminaron(e([jug('A', 1, 2), jug('B', 1, 1)])), false);
  assert.equal(SALA.todosTerminaron(e([jug('A', 1, 2), jug('B', 1, 2)])), true);
});

test('el personaje de otro jugador se dibuja con sus datos, y lo raro se ignora', () => {
  const { SALA, SKINS, CAMISAS } = cargarJuego();
  const o = SALA.caraDe(jug('A', 0, 0, { skin: 2, camisa: 3, acc: 'gafas', av32: true }));
  assert.equal(o.skin, SKINS[2]);
  assert.equal(o.camisa, CAMISAS[3]);
  assert.equal(o.gafas, true);
  assert.equal(o.av32, true, 'cada uno con el detalle que eligió');
  const raro = SALA.caraDe(jug('B', 0, 0, { skin: 15, camisa: 9, acc: 'constructor' }));
  assert.equal(raro.skin, SKINS[0], 'una piel que no existe cae a la primera');
  assert.equal(raro.camisa, CAMISAS[0]);
  assert.equal(Object.hasOwn(raro, 'constructor'), false, 'un accesorio desconocido no se cuela como campo');
});

test('crear guarda el token del instructor; unirse lo reenvía para salir con corona', async () => {
  const v = cargarJuego();
  v.S.nombre = 'PROFE'; v.S.skin = 1; v.S.acc = 'gafas';
  const llamadas = servidor(v, n => n === 'sala_crear'
    ? { cuerpo: { codigo: 'K7M2Q', token: 'secreto-host' } }
    : { cuerpo: { id: 'id-profe', token: 'secreto-jugador' } });
  const r = await v.SALA.crear(1, ['quiz', 'bugs']);
  assert.equal(r.ok, true);
  assert.deepEqual(arr(llamadas[0].args.p_juegos), ['quiz', 'bugs']);
  assert.equal(v.SALA.soyHost('K7M2Q'), true);

  await v.SALA.unirse('K7M2Q');
  const u = llamadas[1].args;
  assert.equal(u.p_host, 'secreto-host', 'el instructor se une con su token');
  assert.equal(u.p_nombre, 'PROFE');
  assert.equal(u.p_acc, 'gafas');
  const s = v.SALA.sesion();
  assert.equal(s.host, 'secreto-host', 'unirse no le quita el mando');
  assert.equal(s.id, 'id-profe');
  assert.equal(v.SALA.miId('K7M2Q'), 'id-profe');
});

test('un alumno que se une a otra sala no arrastra el token de la anterior', async () => {
  const v = cargarJuego();
  v.SALA.guardarSesion({ codigo: 'AAAAA', host: 'secreto-viejo' });
  const llamadas = servidor(v, () => ({ cuerpo: { id: 'id-ana', token: 't' } }));
  await v.SALA.unirse('K7M2Q');
  assert.equal(llamadas[0].args.p_host, null);
  assert.equal(v.SALA.soyHost('K7M2Q'), false);
});

test('los errores del servidor llegan con su mensaje; sin red, marcados como red', async () => {
  const v = cargarJuego();
  servidor(v, () => ({ status: 400, cuerpo: { message: 'sala no existe' } }));
  assert.deepEqual({ ...(await v.SALA.unirse('ZZZZZ')) }, { ok: false, error: 'sala no existe' });
  assert.equal(v.SALA.sesion(), null, 'un intento fallido no deja sesión');
  v.fetch = async () => { throw new Error('sin wifi'); };
  assert.equal((await v.SALA.estado('K7M2Q')).red, true);
});

test('una sesión guardada rota no rompe nada', () => {
  const v = cargarJuego();
  v._localStorage.setItem('pa4-sala', '{no es json');
  assert.equal(v.SALA.sesion(), null);
  v._localStorage.setItem('pa4-sala', JSON.stringify({ codigo: '<script>' }));
  assert.equal(v.SALA.sesion(), null, 'un código con otro formato se ignora');
});

test('puntuar manda el total y reintenta si la wifi falla', async () => {
  const v = cargarJuego();
  v.SALA.guardarSesion({ codigo: 'K7M2Q', id: 'id-ana', token: 'tok' });
  const llamadas = servidor(v, (n, a, vez) => (vez === 1 ? { status: 503 } : { cuerpo: true }));
  v.SALA.puntuar('K7M2Q', 2, 900);
  await espera(2300);
  assert.equal(llamadas.length, 2, 'un reintento tras el fallo');
  assert.deepEqual({ ...llamadas[1].args }, { p_id: 'id-ana', p_token: 'tok', p_ronda: 2, p_puntos: 900 });
});

test('si llega una puntuación nueva, la vieja ya no se reintenta', async () => {
  const v = cargarJuego();
  v.SALA.guardarSesion({ codigo: 'K7M2Q', id: 'id-ana', token: 'tok' });
  const llamadas = servidor(v, (n, a) => (a.p_ronda === 1 ? { status: 503 } : { cuerpo: true }));
  v.SALA.puntuar('K7M2Q', 1, 500);
  await espera(10);
  v.SALA.puntuar('K7M2Q', 2, 900);
  await espera(2300);
  assert.deepEqual(llamadas.map(l => l.args.p_ronda), [1, 2], 'la ronda 1 no se reenvía detrás de la 2');
});

test('en sala el sorteo es parejo: lo que falló cada uno no cambia sus preguntas', () => {
  const a = cargarJuego(), b = cargarJuego();
  for (let i = 0; i < 12; i++) a.RETO.marcar('quiz', i, false);   // A ha fallado mucho
  const saca = v => {
    v.RETO.entrar('sala-K7M2Q', true);
    const r = arr(v.RETO.elegir('quiz', 40, 5, v.RETO.rngPara(':quiz')));
    v.RETO.salir();
    return r;
  };
  assert.deepEqual(saca(a), saca(b), 'mismas preguntas para los dos');
  /* Y fuera de la sala el sesgo sigue funcionando como siempre. */
  a.RETO.entrar('2026-09-23'); b.RETO.entrar('2026-09-23');
  const conSesgo = [a, b].map(v => arr(v.RETO.elegir('quiz', 40, 5, v.RETO.rngPara(':quiz'))));
  assert.notDeepEqual(conSesgo[0], conSesgo[1], 'el reto diario sigue inclinado por los fallos');
});
