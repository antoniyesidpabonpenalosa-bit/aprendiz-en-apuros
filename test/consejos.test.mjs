/* Los personajes y consejos del pasillo (js/consejos.js): quién habla cada día,
   qué dice cada uno según lo que pasa, y que los textos estén completos en los
   dos idiomas. Las cuentas son puras, así que se prueban sin navegador. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cargarJuego } from './ayuda.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = f => readFileSync(join(RAIZ, f), 'utf8');

/* consejos.js usa DIALOGOS/NIVELES (datos.js) e idDe() (graficos.js): se cargan
   los tres en un mismo ámbito, como los <script> del navegador. */
function entorno() {
  const ctx = createContext({ console });
  for (const f of ['js/datos.js', 'js/graficos.js', 'js/consejos.js']) runInContext(leer(f), ctx, { filename: f });
  return runInContext(`({ PERSONAJES, PASILLO_GENTE, TEMA_DE, CONSEJOS, GESTO_CONSEJO, DIALOGOS, NIVELES, DIBUJADOS,
    etiquetaDe, hablanteDe, consejoDe, tieneNovedad, charla, idDe, dibujoDe, quienCara })`, ctx);
}
const E = entorno();
const arr = x => [...x];

test('consejos · cada día tiene su consejo de puerta, en los dos idiomas y sin huecos', () => {
  assert.equal(E.CONSEJOS.puerta.length, E.NIVELES.length);
  E.CONSEJOS.puerta.forEach((c, i) => {
    assert.ok(c.es.trim() && c.en.trim(), `día ${i + 1} sin texto`);
    assert.notEqual(c.es, c.en);
  });
});

test('consejos · quien habla cada día es quien dice su diálogo, en los dos idiomas', () => {
  for (let i = 0; i < E.NIVELES.length; i++)
    assert.equal(E.idDe(E.DIALOGOS.en[i][0]), E.hablanteDe(i), `el día ${i + 1} lo dicen distintos en es y en`);
  /* el reparto que se escribió en el plan: instructor 1,2,4,5,9,10,14 · compañera 3,6,7,8,12 · líder 11,13,15 */
  const por = id => arr(E.NIVELES.keys()).filter(i => E.hablanteDe(i) === id).map(i => i + 1);
  assert.deepEqual(por('instructor'), [1, 2, 4, 5, 9, 10, 14]);
  assert.deepEqual(por('companera'), [3, 6, 7, 8, 12]);
  assert.deepEqual(por('lider'), [11, 13, 15]);
});

test('consejos · las etiquetas de los diálogos son "NOMBRE · ROL" y las reconoce el retrato', () => {
  for (const lang of ['es', 'en'])
    for (let i = 0; i < E.NIVELES.length; i++) {
      const et = E.DIALOGOS[lang][i][0], id = E.hablanteDe(i);
      assert.equal(et, E.etiquetaDe(id, lang), `día ${i + 1} (${lang}): "${et}"`);
    }
  assert.equal(E.etiquetaDe('instructor', 'es'), 'GUSTAVO · INSTRUCTOR');
  assert.equal(E.etiquetaDe('lider', 'en'), 'ANDRÉS · TECH LEAD');
  /* los tres con dibujo lo siguen teniendo con su nombre nuevo; el vigilante aún no */
  assert.deepEqual(arr(E.DIBUJADOS), ['instructor', 'lider', 'companera']);
  for (const [id, dib] of [['instructor', 'instructor'], ['companera', 'companera'], ['lider', 'lider'], ['vigilante', '']])
    for (const lang of ['es', 'en']) assert.equal(E.dibujoDe(E.etiquetaDe(id, lang)), dib, `${id} ${lang}`);
  assert.equal(E.idDe('VALENTINA · COWORKER'), 'companera');
  assert.equal(E.idDe('DON JAIRO · GUARD'), 'vigilante');
});

test('consejos · los textos de tema, generales y del vigilante están completos', () => {
  const v = cargarJuego();
  /* cada tema del Repaso tiene personaje y texto: un tema nuevo sin consejo se vería como un hueco */
  const pools = ['quiz', 'review', 'sql', 'regex', 'merge', 'palabras', 'git', 'parejas', 'terminal', 'orden'];
  assert.deepEqual(Object.keys(E.TEMA_DE).sort(), [...pools].sort());
  assert.deepEqual(Object.keys(E.CONSEJOS.tema).sort(), [...pools].sort());
  for (const pool of pools) {
    assert.ok(E.PERSONAJES[E.TEMA_DE[pool]], `${pool}: personaje desconocido`);
    assert.ok(E.CONSEJOS.tema[pool].es && E.CONSEJOS.tema[pool].en);
  }
  for (const id of ['instructor', 'companera', 'lider']) {
    assert.equal(E.CONSEJOS.general[id].length, 3, id);
    for (const c of E.CONSEJOS.general[id]) assert.ok(c.es.trim() && c.en.trim());
  }
  assert.equal(E.CONSEJOS.vigilante.length, 6);
  for (const c of E.CONSEJOS.vigilante) assert.ok(c.es.trim() && c.en.trim());
  /* los temas que el juego puede dar como flojos son exactamente estos (js/modos.js, POOL_A_TIPO) */
  const modos = leer('js/modos.js').match(/POOL_A_TIPO = \{([^}]*)\}/)[1];
  assert.deepEqual([...modos.matchAll(/(\w+):/g)].map(m => m[1]).sort(), [...pools].sort());
  assert.ok(v.TXT.es.pas_hablar && v.TXT.en.pas_hablar);
});

test('consejos · en cada zona están quienes hablan en sus días, cada uno una vez y en su sitio', () => {
  E.PASILLO_GENTE.forEach((zona, z) => {
    const ids = zona.map(g => g.p);
    assert.equal(new Set(ids).size, ids.length, `zona ${z + 1}: alguien repetido`);
    const huecos = zona.map(g => g.hueco);
    assert.equal(new Set(huecos).size, huecos.length, `zona ${z + 1}: dos en el mismo hueco`);
    for (const g of zona) assert.ok(g.hueco >= 0 && g.hueco <= 3 && E.PERSONAJES[g.p]);
    for (let d = z * 5; d < z * 5 + 5; d++)
      assert.ok(ids.includes(E.hablanteDe(d)), `el día ${d + 1} lo dice ${E.hablanteDe(d)}, que no está en la zona ${z + 1}`);
  });
  assert.ok(E.PASILLO_GENTE[0].some(g => g.p === 'vigilante'), 'Don Jairo junto a la entrada');
});

test('consejoDe · gana el tema flojo propio, luego la puerta, luego lo de siempre', () => {
  const pend = [{ pool: 'sql', tipo: 'sql', pendientes: 3, pc: 30 }, { pool: 'quiz', tipo: 'quiz', pendientes: 0, pc: 0 }];
  /* andrés se ocupa de SQL: lo nota aunque la puerta sea suya también */
  const a = E.consejoDe('lider', { dia: 10, pendientes: pend });
  assert.equal(a.tipo, 'tema'); assert.equal(a.pool, 'sql'); assert.equal(a.juego, 'sql'); assert.equal(a.clave, 'tema:sql');
  /* el instructor no se ocupa de SQL: no lo nota; la puerta 11 no es suya → general */
  assert.equal(E.consejoDe('instructor', { dia: 10, pendientes: pend }).tipo, 'general');
  /* sin nada pendiente: la puerta, si la dice él */
  const b = E.consejoDe('lider', { dia: 10, pendientes: [] });
  assert.equal(b.tipo, 'puerta'); assert.equal(b.dia, 10); assert.equal(b.txt, E.CONSEJOS.puerta[10]);
  assert.equal(E.consejoDe('companera', { dia: 10, pendientes: [] }).tipo, 'general', 'el día 11 no lo dice ella');
  /* sin puerta (campaña terminada) o con un día que no existe */
  assert.equal(E.consejoDe('lider', { dia: null, pendientes: [] }).tipo, 'general');
  assert.equal(E.consejoDe('lider', { dia: 99, pendientes: [] }).tipo, 'general');
  /* pendientes en 0 no cuentan */
  assert.equal(E.consejoDe('instructor', { dia: 0, pendientes: [{ pool: 'quiz', tipo: 'quiz', pendientes: 0, pc: 0 }] }).tipo, 'puerta');
});

test('consejoDe · con varios temas flojos habla del que más pesa, y los generales rotan', () => {
  const pend = [{ pool: 'palabras', tipo: 'escribir', pendientes: 2, pc: 10 }, { pool: 'git', tipo: 'simon', pendientes: 5, pc: 50 },
    { pool: 'terminal', tipo: 'terminal', pendientes: 5, pc: 20 }];
  const c = E.consejoDe('instructor', { dia: 0, pendientes: pend });
  assert.equal(c.pool, 'git', 'mayor porcentaje pendiente');
  /* misma deuda: el que tiene más preguntas pendientes */
  const d = E.consejoDe('instructor', { dia: 0, pendientes: [{ pool: 'palabras', tipo: 'escribir', pendientes: 2, pc: 20 }, { pool: 'terminal', tipo: 'terminal', pendientes: 5, pc: 20 }] });
  assert.equal(d.pool, 'terminal');
  const vistos = [0, 1, 2, 3].map(v => E.consejoDe('companera', { dia: null, pendientes: [], vuelta: v }).txt);
  assert.deepEqual(vistos.slice(0, 3).map(x => x.es), arr(E.CONSEJOS.general.companera).map(x => x.es));
  assert.equal(vistos[3], vistos[0], 'a la cuarta vuelve a empezar');
  const dj = [0, 5, 6].map(v => E.consejoDe('vigilante', { dia: 0, pendientes: [], vuelta: v }));
  assert.ok(dj.every(x => x.tipo === 'vigilante'), 'Don Jairo no habla de puertas ni de temas');
  assert.equal(dj[0].txt, E.CONSEJOS.vigilante[0]); assert.equal(dj[1].txt, E.CONSEJOS.vigilante[5]); assert.equal(dj[2].txt, E.CONSEJOS.vigilante[0]);
});

test('tieneNovedad · el "!" sale con un consejo de tema o de puerta que aún no se dio, no con los generales', () => {
  const o = { dia: 2, pendientes: [] };
  E.charla.vistos.clear();
  assert.equal(E.tieneNovedad('companera', o), true, 'el día 3 lo dice la compañera');
  assert.equal(E.tieneNovedad('instructor', o), false, 'general: nada nuevo');
  assert.equal(E.tieneNovedad('vigilante', o), false);
  E.charla.vistos.add('puerta:2');
  assert.equal(E.tieneNovedad('companera', o), false, 'ya se lo dijo');
  assert.equal(E.tieneNovedad('lider', { dia: 10, pendientes: [{ pool: 'sql', tipo: 'sql', pendientes: 1, pc: 5 }] }), true, 'tema nuevo');
});

test('consejos · los gestos que pide cada tipo existen entre los cinco retratos', () => {
  const gestos = ['normal', 'feliz', 'enojado', 'sorprendido', 'preocupado'];
  for (const g of Object.values(E.GESTO_CONSEJO)) assert.ok(gestos.includes(g), g);
});
