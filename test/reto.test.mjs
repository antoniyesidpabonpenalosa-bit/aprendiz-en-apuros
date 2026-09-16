/* Pruebas del reto diario: semilla, racha con perdón y sesgo de contenido.
   Uso:  node --test test/*.test.mjs                                          */
/* Las pruebas corren en la zona horaria de los jugadores, no en la del
   servidor de CI (que es UTC). Sin esto, un fallo de fecha local vs UTC pasaría
   desapercibido aquí y solo aparecería en el celular de alguien en Colombia.
   node --test usa un proceso por archivo, así que esto no afecta a los demás. */
process.env.TZ = 'America/Bogota';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cargarJuego } from './ayuda.mjs';

/* Los arreglos nacen dentro del contexto de vm: su prototipo no es el Array de
   aquí, así que deepEqual estricto los rechazaría aunque coincida el contenido. */
const arr = x => [...x];

/* Juega el reto de una fecha concreta, como si ese día hubiera llegado. */
const jugar = (v, fecha, pts = 100) => v.RETO.registrar(pts, fecha);

/* ══════════ SEMILLA: todos juegan lo mismo ══════════ */

test('el mismo día da el mismo reto, siempre y en cualquier dispositivo', () => {
  const a = cargarJuego(), b = cargarJuego();
  assert.deepEqual([...a.RETO.retosDe('2026-09-16')], [...b.RETO.retosDe('2026-09-16')]);
  /* y repetirlo en el mismo dispositivo tampoco lo cambia */
  assert.deepEqual([...a.RETO.retosDe('2026-09-16')], [...a.RETO.retosDe('2026-09-16')]);
});

test('días distintos dan retos distintos', () => {
  const v = cargarJuego();
  const dias = ['2026-09-16', '2026-09-17', '2026-09-18', '2026-09-19', '2026-09-20',
                '2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25'];
  const combos = new Set(dias.map(d => v.RETO.retosDe(d).join(',')));
  assert.ok(combos.size >= 7, `10 días deberían dar variedad, salieron ${combos.size} combinaciones`);
});

test('el reto son 3 minijuegos distintos y jugables', () => {
  const v = cargarJuego();
  for (const d of ['2026-01-01', '2026-06-15', '2026-12-31', '2027-02-28']) {
    const r = [...v.RETO.retosDe(d)];
    assert.equal(r.length, 3);
    assert.equal(new Set(r).size, 3, 'no debe repetir minijuego dentro del mismo reto');
    for (const tipo of r) assert.ok(v.RETO.TIPOS.includes(tipo), `tipo desconocido: ${tipo}`);
  }
});

test('el generador con semilla es estable y reparte parejo', () => {
  const v = cargarJuego();
  const serie = s => Array.from({ length: 5 }, v.RETO.rngCon(s));
  assert.deepEqual(serie(123), serie(123), 'misma semilla, misma serie');
  assert.notDeepEqual(serie(123), serie(124));
  const muestra = Array.from({ length: 4000 }, v.RETO.rngCon(99));
  assert.ok(muestra.every(x => x >= 0 && x < 1), 'siempre dentro de [0,1)');
  const media = muestra.reduce((a, b) => a + b) / muestra.length;
  assert.ok(Math.abs(media - 0.5) < 0.03, `media sospechosa: ${media}`);
});

/* ══════════ FECHAS ══════════ */

test('la fecha es la local, no la UTC', () => {
  const v = cargarJuego();
  /* 31 de diciembre a las 22:00 en Colombia ya es 1 de enero en UTC.
     Si usáramos UTC, el reto cambiaría a media tarde. */
  const nocheVieja = new Date(2026, 11, 31, 22, 0);
  assert.equal(v.RETO.fechaDe(nocheVieja), '2026-12-31');
  assert.equal(nocheVieja.toISOString().slice(0, 10), '2027-01-01',
    'en UTC ya es año nuevo: por eso fechaDe no puede usar toISOString');
  assert.equal(v.RETO.fechaDe(new Date(2026, 0, 1, 0, 30)), '2026-01-01');
  assert.equal(v.RETO.fechaDe(new Date(2026, 8, 5, 12)), '2026-09-05', 'con cero delante');
});

test('los días entre fechas cruzan meses y años bien', () => {
  const { diasEntre } = cargarJuego().RETO;
  assert.equal(diasEntre('2026-09-16', '2026-09-17'), 1);
  assert.equal(diasEntre('2026-09-30', '2026-10-01'), 1, 'cambio de mes');
  assert.equal(diasEntre('2026-12-31', '2027-01-01'), 1, 'cambio de año');
  assert.equal(diasEntre('2028-02-28', '2028-02-29'), 1, 'año bisiesto');
  assert.equal(diasEntre('2026-09-16', '2026-09-16'), 0);
  assert.equal(diasEntre('2026-09-17', '2026-09-16'), -1, 'hacia atrás');
});

/* ══════════ RACHA ══════════ */

test('jugar días seguidos sube la racha', () => {
  const v = cargarJuego();
  assert.equal(jugar(v, '2026-09-16').racha, 1, 'el primero siempre es 1');
  assert.equal(jugar(v, '2026-09-17').racha, 2);
  assert.equal(jugar(v, '2026-09-18').racha, 3);
  assert.equal(v.RETO.datos().mejorRacha, 3);
});

test('el reto solo cuenta una vez al día', () => {
  const v = cargarJuego();
  const primero = jugar(v, '2026-09-16', 200);
  assert.ok(primero, 'el primer intento cuenta');
  const puntosTras = v.S.pts;

  assert.equal(jugar(v, '2026-09-16', 5000), null, 'el segundo intento no cuenta');
  assert.equal(v.S.pts, puntosTras, 'y no da ni un punto más');
  assert.equal(v.RETO.datos().racha, 1, 'ni infla la racha');
  assert.equal(v.RETO.datos().pts, 200, 'se conserva el puntaje del primer intento');
});

test('saltarse un día gasta el perdón y la racha sigue viva', () => {
  const v = cargarJuego();
  jugar(v, '2026-09-16');
  jugar(v, '2026-09-17');
  const r = jugar(v, '2026-09-19');                     // se saltó el 18
  assert.equal(r.racha, 3, 'la racha continúa');
  assert.equal(r.perdonUsado, true);
  assert.equal(v.RETO.datos().perdon, '2026-09', 'queda marcado el mes');
});

test('el perdón es uno al mes: el segundo salto sí rompe la racha', () => {
  const v = cargarJuego();
  jugar(v, '2026-09-01');
  assert.equal(jugar(v, '2026-09-03').racha, 2, 'primer salto, perdonado');
  const r = jugar(v, '2026-09-05');                      // segundo salto del mismo mes
  assert.equal(r.racha, 1, 'sin perdón disponible, vuelve a empezar');
  assert.equal(r.perdonUsado, false);
});

test('el perdón se renueva al cambiar de mes', () => {
  const v = cargarJuego();
  jugar(v, '2026-09-20');
  assert.equal(jugar(v, '2026-09-22').racha, 2, 'perdón de septiembre');
  jugar(v, '2026-09-23');
  jugar(v, '2026-09-24');
  const r = jugar(v, '2026-09-26');                      // saltó el 25, ya con perdón gastado
  assert.equal(r.racha, 1, 'en septiembre ya no queda perdón');
  jugar(v, '2026-09-27');
  const oct = jugar(v, '2026-09-29');                    // saltó el 28, pero sigue siendo septiembre
  assert.equal(oct.racha, 1, 'el perdón es por mes, no por salto');
});

test('el perdón vuelve a estar disponible en el mes siguiente', () => {
  const v = cargarJuego();
  jugar(v, '2026-09-10');
  assert.equal(jugar(v, '2026-09-12').racha, 2, 'perdón de septiembre gastado');
  jugar(v, '2026-09-13');
  jugar(v, '2026-09-14');
  /* ... y en octubre, un salto nuevo vuelve a perdonarse */
  jugar(v, '2026-10-05');                                 // racha rota, vuelve a 1
  jugar(v, '2026-10-06');
  const r = jugar(v, '2026-10-08');                        // saltó el 7
  assert.equal(r.racha, 3, 'octubre trae perdón nuevo');
  assert.equal(r.perdonUsado, true);
  assert.equal(v.RETO.datos().perdon, '2026-10');
});

test('saltarse dos días o más rompe la racha aunque quede perdón', () => {
  const v = cargarJuego();
  jugar(v, '2026-09-10');
  jugar(v, '2026-09-11');
  const r = jugar(v, '2026-09-15');                      // cuatro días de ausencia
  assert.equal(r.racha, 1);
  assert.equal(r.perdonUsado, false, 'el perdón no se gasta en vano');
  assert.equal(v.RETO.datos().perdon, '', 'sigue disponible para más adelante');
});

test('la mejor racha no se pierde al romper la actual', () => {
  const v = cargarJuego();
  for (const d of ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05']) jugar(v, d);
  assert.equal(v.RETO.datos().mejorRacha, 5);
  jugar(v, '2026-09-20');                                // abandono largo
  assert.equal(v.RETO.datos().racha, 1, 'la actual se reinicia');
  assert.equal(v.RETO.datos().mejorRacha, 5, 'la mejor se conserva');
});

test('rachaViva dice la verdad antes de jugar', () => {
  const v = cargarJuego();
  jugar(v, '2026-09-16');
  assert.equal(v.RETO.rachaViva('2026-09-16'), 1, 'hoy ya jugado');
  assert.equal(v.RETO.rachaViva('2026-09-17'), 1, 'ayer jugado: sigue viva');
  assert.equal(v.RETO.rachaViva('2026-09-18'), 1, 'un día saltado: la salva el perdón');
  assert.equal(v.RETO.rachaViva('2026-09-19'), 0, 'dos días: ya está rota');
  assert.equal(cargarJuego().RETO.rachaViva('2026-09-16'), 0, 'sin historial, cero');
});

test('jugadoHoy distingue el día de hoy del de ayer', () => {
  const v = cargarJuego();
  assert.equal(v.RETO.jugadoHoy('2026-09-16'), false);
  jugar(v, '2026-09-16');
  assert.equal(v.RETO.jugadoHoy('2026-09-16'), true);
  assert.equal(v.RETO.jugadoHoy('2026-09-17'), false, 'mañana vuelve a estar disponible');
});

/* ══════════ PUNTOS Y PREMIOS ══════════ */

test('el multiplicador va de ×1 a ×2 y ahí se queda', () => {
  const { multiplicador } = cargarJuego().RETO;
  assert.equal(multiplicador(1), 1);
  assert.equal(multiplicador(7), 2, 'al séptimo día, el doble');
  assert.equal(multiplicador(50), 2, 'no sigue creciendo');
  assert.ok(multiplicador(4) > 1 && multiplicador(4) < 2, 'crece de forma gradual');
  assert.equal(multiplicador(0), 1, 'nunca por debajo de ×1');
});

test('los puntos del reto entran a la cartera ya multiplicados', () => {
  const v = cargarJuego();
  v.S.pts = 1000; v.S.xp = 1000;
  const r = jugar(v, '2026-09-16', 200);
  assert.equal(r.ganado, 200, 'primer día, sin multiplicador');
  assert.equal(v.S.pts, 1200);
  assert.equal(v.S.xp, 1200, 'la XP sube igual, para el rango');

  const w = cargarJuego();
  for (const d of ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05', '2026-09-06']) jugar(w, d, 0);
  const septimo = jugar(w, '2026-09-07', 200);
  assert.equal(septimo.racha, 7);
  assert.equal(septimo.ganado, 400, 'con racha de 7, el doble');
});

test('un reto nunca resta puntos', () => {
  const v = cargarJuego();
  v.S.pts = 500;
  jugar(v, '2026-09-16', -300);
  assert.equal(v.S.pts, 500, 'un puntaje negativo no debe robar puntos');
});

test('los premios se ganan por racha y no se pierden', () => {
  const v = cargarJuego();
  assert.deepEqual([...v.RETO.premiosGanados()], [], 'al empezar, ninguno');
  assert.equal(v.RETO.proximoPremio().dias, 3);

  const dias = Array.from({ length: 7 }, (_, i) => `2026-09-${String(i + 1).padStart(2, '0')}`);
  for (const d of dias) jugar(v, d);
  assert.deepEqual(arr(v.RETO.premiosGanados()).map(p => p.ico), ['🔥', '⭐']);
  assert.equal(v.RETO.proximoPremio().dias, 14);

  jugar(v, '2026-10-20');                                 // rompe la racha del todo
  assert.equal(v.RETO.datos().racha, 1);
  assert.deepEqual(arr(v.RETO.premiosGanados()).map(p => p.ico), ['🔥', '⭐'],
    'lo ganado con esfuerzo no se quita');
});

/* ══════════ SESGO HACIA LO QUE FALLAS ══════════ */

test('sin historial, el sorteo es limpio y sin repeticiones', () => {
  const v = cargarJuego();
  const sel = v.RETO.elegir('quiz', 24, 6);
  assert.equal(sel.length, 6);
  assert.equal(new Set(sel).size, 6, 'no debe repetir preguntas');
  assert.ok(sel.every(i => i >= 0 && i < 24), 'todos los índices dentro del pool');
});

test('pedir más ítems de los que hay devuelve todos, sin repetir', () => {
  const v = cargarJuego();
  const sel = v.RETO.elegir('sql', 5, 50);
  assert.equal(sel.length, 5);
  assert.equal(new Set(sel).size, 5);
});

test('lo que fallas vuelve mucho más a menudo', () => {
  const v = cargarJuego();
  for (let i = 0; i < 3; i++) v.RETO.marcar('quiz', 7, false);   // fallada tres veces

  let conLaFallada = 0;
  for (let i = 0; i < 2000; i++) if (v.RETO.elegir('quiz', 24, 3).includes(7)) conLaFallada++;

  /* Sin sesgo saldría ~12,5 % de las veces (3 de 24). Con peso 4 debería
     rondar el 40 %. Se exige claramente más del doble para que la prueba
     no dependa de la suerte. */
  assert.ok(conLaFallada / 2000 > 0.28,
    `la fallada debería salir mucho más; salió el ${(conLaFallada / 20).toFixed(1)} %`);
});

test('acertar la aleja otra vez: el sesgo se corrige solo', () => {
  const v = cargarJuego();
  for (let i = 0; i < 3; i++) v.RETO.marcar('quiz', 7, false);
  assert.equal(v.S.pesos['quiz:7'], 3, 'el peso se acumula');

  for (let i = 0; i < 3; i++) v.RETO.marcar('quiz', 7, true);
  assert.equal(v.S.pesos['quiz:7'], undefined, 'al dominarla, deja de ocupar sitio');

  v.RETO.marcar('quiz', 7, true);
  assert.equal(v.S.pesos['quiz:7'], undefined, 'y no baja de cero');
});

test('el peso de un ítem tiene tope', () => {
  const v = cargarJuego();
  for (let i = 0; i < 20; i++) v.RETO.marcar('sql', 2, false);
  assert.equal(v.S.pesos['sql:2'], 3, 'fallarla veinte veces no la vuelve obligatoria');
});

test('cada pool lleva su propia cuenta', () => {
  const v = cargarJuego();
  v.RETO.marcar('quiz', 3, false);
  assert.equal(v.S.pesos['quiz:3'], 1);
  assert.equal(v.S.pesos['sql:3'], undefined, 'el índice 3 de SQL es otra cosa');
});

test('con la semilla del día el sorteo sesgado también es idéntico para todos', () => {
  const a = cargarJuego(), b = cargarJuego();
  a.RETO.marcar('quiz', 5, false);
  b.RETO.marcar('quiz', 5, false);
  const sel = v => v.RETO.elegir('quiz', 24, 6, v.RETO.rngDelDia(':1', '2026-09-16'));
  assert.deepEqual(arr(sel(a)), arr(sel(b)));
});

/* ══════════ PANEL "EN QUÉ FLOJEAS" ══════════ */

test('sin fallos, no hay nada que repasar', () => {
  const v = cargarJuego();
  const r = arr(v.RETO.repaso([{ pool: 'sql', total: 14, etiqueta: 'SQL' }]));
  assert.equal(r[0].pendientes, 0);
  assert.equal(r[0].deuda, 0);
  assert.equal(r[0].pc, 0);
});

test('el repaso cuenta ítems pendientes y ordena por deuda', () => {
  const v = cargarJuego();
  for (let i = 0; i < 4; i++) v.RETO.marcar('sql', i, false);
  v.RETO.marcar('sql', 0, false);                    // una fallada dos veces
  v.RETO.marcar('quiz', 0, false);
  v.RETO.marcar('quiz', 1, false);

  const r = arr(v.RETO.repaso([
    { pool: 'quiz', total: 24, etiqueta: 'QUIZ' },
    { pool: 'sql', total: 14, etiqueta: 'SQL' },
  ]));
  assert.equal(r[0].etiqueta, 'SQL', 'el tema con más deuda va primero');
  assert.equal(r[0].pendientes, 4, 'cuatro consultas distintas pendientes');
  assert.equal(r[0].deuda, 5, 'una de ellas pesa doble');
  assert.equal(r[1].etiqueta, 'QUIZ');
  assert.equal(r[1].pendientes, 2);
});

test('acertar un ítem lo saca del repaso', () => {
  const v = cargarJuego();
  v.RETO.marcar('regex', 3, false);
  assert.equal(arr(v.RETO.repaso([{ pool: 'regex', total: 12, etiqueta: 'REGEX' }]))[0].pendientes, 1);
  v.RETO.marcar('regex', 3, true);
  assert.equal(arr(v.RETO.repaso([{ pool: 'regex', total: 12, etiqueta: 'REGEX' }]))[0].pendientes, 0,
    'dominado: deja de aparecer');
});

test('el porcentaje de repaso se mide sobre el tamaño del pool', () => {
  const v = cargarJuego();
  for (let i = 0; i < 7; i++) v.RETO.marcar('quiz', i, false);
  const r = arr(v.RETO.repaso([{ pool: 'quiz', total: 28, etiqueta: 'QUIZ' }]))[0];
  assert.equal(r.pc, 25, '7 de 28 es el 25 %');
});
