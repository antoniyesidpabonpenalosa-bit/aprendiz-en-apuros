/* Los efectos de pixel art (pixelfx): que cada uno se dibuje y TERMINE, que sus
   textos salgan enteros en la fuente de pixeles (que solo tiene A-Z y 0-9), y
   que js/pxefectos.js respete "reducir movimiento" y el tope de efectos a la vez.
   Todo sin navegador: node:vm con un lienzo de mentira. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cargarJuego } from './ayuda.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = f => readFileSync(join(RAIZ, f), 'utf8');

/* Un "navegador" mínimo: lo justo para que pxefectos.js suelte efectos. */
function entorno({ quieto = false } = {}) {
  const lienzos = [];
  const ctx2d = () => new Proxy({}, { get: (o, k) => (k in o ? o[k] : () => {}), set: (o, k, v) => { o[k] = v; return true; } });
  const el = () => { const e = { style: {}, setAttribute() {}, getContext: () => ctx2d(), width: 0, height: 0 }; lienzos.push(e); return e; };
  const caja = {
    document: { body: { appendChild() {} }, createElement: el, getElementById: () => null },
    ImageData: class { constructor(w, h) { this.data = new Uint8ClampedArray(w * h * 4); } },
    innerWidth: 400, innerHeight: 800, devicePixelRatio: 2,
    addEventListener() {}, performance: { now: () => 0 },
    requestAnimationFrame() {}, console,
    /* "esperar a que el navegador esté libre": aquí se corre al instante, así la preparación se ejecuta de verdad */
    setTimeout(f) { f(); },
  };
  caja.window = caja;
  const ctx = createContext(caja);
  runInContext(`const quieto=()=>${quieto}; const escPantalla=1;`, ctx);
  runInContext(leer('js/pixelfx.js'), ctx, { filename: 'js/pixelfx.js' });
  runInContext(leer('js/pxefectos.js'), ctx, { filename: 'js/pxefectos.js' });
  const api = runInContext('({PXFX, PX})', ctx);
  return { ...api, lienzos };
}

test('pixelfx · los tres efectos se dibujan, avanzan y terminan', () => {
  const { PXFX } = entorno();
  assert.deepEqual(Object.keys(PXFX.efectos).sort(), ['corazonPerdido', 'nivel', 'racha']);
  for (const [nombre, mod] of Object.entries(PXFX.efectos)) {
    const [w, h] = mod.meta.size, [ox, oy] = mod.meta.origin;
    const frame = PXFX.createFrame(w, h);
    const fx = PXFX.createFx(mod, { x: ox, y: oy });
    const rgba = new Uint8ClampedArray(w * h * 4);
    /* js/pxefectos.js deja de dibujar en cuanto done() es true, así que lo que
       importa es que done() llegue: si no, el efecto se queda vivo para siempre */
    let pintoAlgo = false, pasos = 0;
    while (!fx.done() && pasos++ < 600) {
      fx.update(1 / 30);
      PXFX.clearFrame(frame);
      fx.draw(frame, 'back'); fx.draw(frame, 'front');
      PXFX.composite(frame, rgba, null);
      if (rgba.some((v, i) => i % 4 === 3 && v > 0)) pintoAlgo = true;
    }
    assert.ok(pintoAlgo, `${nombre} no pintó nada`);
    assert.ok(fx.done(), `${nombre} no termina (en ${pasos} pasos)`);
  }
});

test('pixelfx · los textos del juego salen enteros en la fuente de pixeles', () => {
  const { PX } = entorno();
  const v = cargarJuego();
  for (const lang of ['es', 'en'])
    for (const k of ['rango_fx', 'combo']) {
      const txt = v.TXT[lang][k];
      assert.ok(txt, `falta ${lang}.${k}`);
      assert.equal(PX.limpia(txt), txt, `${lang}.${k} ("${txt}") tiene letras que la fuente no tiene`);
    }
  /* y lo que no tiene se arregla sin dejar huecos */
  assert.equal(PX.limpia('¡Perfecto!'), 'PERFECTO!');
  assert.equal(PX.limpia('Ñandú  rápido'), 'NANDU  RAPIDO');
});

test('pxefectos · con "reducir movimiento" no suelta nada y avisa para usar lo de siempre', () => {
  const { PX, lienzos } = entorno({ quieto: true });
  assert.equal(PX.corazon(3), false);
  assert.equal(PX.nivel('NUEVO RANGO!', null), false);
  assert.equal(PX.racha(5, 'RACHA', {}), false);
  assert.equal(PX._vivas(), 0);
  assert.equal(lienzos.length, 0, 'ni siquiera crea el lienzo');
});

test('pxefectos · hay un tope de efectos a la vez y devuelve false al pasarse', () => {
  const { PX } = entorno();
  const canvas = { getBoundingClientRect: () => ({ left: 20, top: 100, width: 360, height: 200 }) };
  assert.equal(PX.racha(3, 'RACHA', canvas), true);
  assert.equal(PX.racha(5, 'RACHA', canvas), true);
  assert.equal(PX.racha(8, 'RACHA', canvas), true);
  assert.equal(PX._vivas(), 3);
  assert.equal(PX.racha(10, 'RACHA', canvas), false, 'el cuarto debe rechazarse para que salga el texto de siempre');
  PX._vaciar();
  assert.equal(PX.racha(10, 'RACHA', canvas), true);
});

test('pxefectos · sin el motor cargado el juego sigue: todo devuelve false', () => {
  const ctx = createContext({ document: { body: {} }, console });
  runInContext('const quieto=()=>false;', ctx);
  runInContext(leer('js/pxefectos.js'), ctx);
  const PX = runInContext('PX', ctx);
  assert.equal(PX.corazon(3), false);
  assert.equal(PX.nivel('X', null), false);
  assert.equal(PX.racha(3, 'X', {}), false);
});

test('pxefectos · preparar los efectos a escondidas no crea lienzo ni deja efectos vivos', () => {
  const { PX, lienzos } = entorno();
  /* sin requestIdleCallback cae en setTimeout (aquí, inmediato) */
  PX.calentar();
  assert.equal(PX._vivas(), 0);
  assert.equal(lienzos.length, 0, 'solo dibuja en cuadrículas sueltas, nunca en pantalla');
  /* con "reducir movimiento" no prepara nada */
  const q = entorno({ quieto: true });
  q.PX.calentar();
  assert.equal(q.lienzos.length, 0);
});
