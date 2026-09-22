/* Pruebas del encaje en pantalla: cuánto mide el marco y cuánto zoom lleva.
   Uso:  node --test test/*.test.mjs

   encajeDe() son cuentas puras, así que se carga graficos.js solo, sin DOM:
   sus funciones solo tocan el documento cuando se llaman, no al cargarse. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ctx = createContext({});
runInContext(readFileSync(join(RAIZ, 'js/graficos.js'), 'utf8'), ctx, { filename: 'js/graficos.js' });
const encajeDe = runInContext('encajeDe', ctx);

/* El sitio útil es la pantalla menos los 6 px de margen por lado del body. */
const en = (w, h) => encajeDe(w - 12, h - 12);

test('en el móvil de pie todo mide lo mismo que siempre: sin zoom', () => {
  for (const [w, h] of [[320, 568], [360, 740], [390, 844], [412, 915], [430, 932]]) {
    const e = en(w, h);
    assert.equal(e.apaisado, false, `${w}×${h}`);
    assert.equal(e.esc, 1, `${w}×${h}`);
    assert.equal(e.w, w - 12, `${w}×${h}: el marco ocupa el ancho entero, como antes`);
  }
});

test('el móvil tumbado pasa a dos columnas, también sin zoom', () => {
  for (const [w, h] of [[740, 360], [844, 390], [915, 412]]) {
    const e = en(w, h);
    assert.equal(e.apaisado, true, `${w}×${h}`);
    assert.equal(e.esc, 1, `${w}×${h}`);
  }
});

test('la tablet de pie sigue en vertical, y crece con zoom', () => {
  const e = en(768, 1024);
  assert.equal(e.apaisado, false);
  assert.ok(e.esc > 1, 'le sobra sitio: la consola crece entera');
  assert.equal(e.w, 600, 'por dentro sigue siendo la consola de 600');
});

test('un monitor usa la pantalla: Full HD con zoom 1,5', () => {
  const e = en(1920, 1080);
  assert.equal(e.apaisado, true);
  assert.equal(e.esc, 1.5);
  assert.ok(e.w * e.esc > 1600, 'antes eran 600 px de 1920');
});

test('la ventana a media pantalla ya no obliga a hacer scroll en la portada', () => {
  assert.equal(en(960, 1040).apaisado, true);
  assert.equal(en(900, 900).apaisado, true);
});

test('en ninguna pantalla el marco se sale, ni el zoom baja de 1', () => {
  for (let w = 240; w <= 3840; w += 37) {
    for (let h = 240; h <= 2160; h += 41) {
      const aw = w - 12, ah = h - 12, e = encajeDe(aw, ah);
      const donde = `${w}×${h}`;
      assert.ok(e.esc >= 1 && e.esc <= 2.5, `${donde}: zoom ${e.esc}`);
      assert.equal(e.esc * 16, Math.round(e.esc * 16), `${donde}: el zoom va en escalones de 1/16`);
      /* Con zoom 1 una pantalla diminuta puede quedarse corta, pero entonces
         el marco se encoge a lo que hay: nunca pide más que la pantalla. */
      assert.ok(e.w * e.esc <= aw + 1e-9, `${donde}: ancho ${e.w}·${e.esc} > ${aw}`);
      assert.ok(e.h * e.esc <= ah + 1e-9, `${donde}: alto ${e.h}·${e.esc} > ${ah}`);
    }
  }
});
