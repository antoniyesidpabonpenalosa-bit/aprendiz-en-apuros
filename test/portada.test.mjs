/* El aprendiz de la portada (v29, js/menus.js): las cuentas de qué hace en cada instante
   (respirar, parpadear, saludar) y que el HTML/CSS lo dejen decorativo y sin tocar JUGAR.
   Lo que hay que VER (que respire, que salude al pasar el puntero, la piel y la camisa, el
   encaje en móvil y escritorio, el movimiento reducido) lo prueban los casos "aprendiz de
   la portada" de scripts/regresiones.mjs en un navegador real. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = f => readFileSync(join(RAIZ, f), 'utf8');

const ctx = createContext({ console });
runInContext(leer('js/menus.js'), ctx, { filename: 'js/menus.js' });
const P = runInContext('({ PORTADA, portadaEstado })', ctx);
const e = (t, hasta = 0, reduce = false, ahora = t) => ({ ...P.portadaEstado(t, hasta, reduce, ahora) });

test('en reposo respira: la mitad de arriba sube cada 650 ms, alternando', () => {
  const vistos = [0, 650, 1300, 1950, 2600].map(t => e(t).respira);
  assert.deepEqual(vistos, [false, true, false, true, false]);
});

test('parpadea cada 4,1 s durante 140 ms, y no antes ni después', () => {
  assert.equal(e(3699).parpadeo, false);
  assert.equal(e(3700).parpadeo, true);
  assert.equal(e(3839).parpadeo, true);
  assert.equal(e(3840).parpadeo, false);
  assert.equal(e(4100 + 3700).parpadeo, true, 'y se repite');
});

test('saluda cada 12 s durante ~1 s (de 6,5 s a 7,55 s) y, mientras saluda, no respira ni parpadea', () => {
  assert.equal(e(6499).saludo, false);
  assert.equal(e(6500).saludo, true);
  assert.equal(e(7549).saludo, true);
  assert.equal(e(7550).saludo, false);
  assert.equal(e(12000 + 6600).saludo, true, 'se repite');
  const s = e(6700);
  assert.deepEqual([s.saludo, s.parpadeo, s.respira], [true, false, false]);
});

test('el saludo a petición (puntero, foco, toque) dura 1,05 s desde que se pide, sea cuando sea', () => {
  const pide = 2000;
  assert.equal(e(2000, pide + 1050, false, 2000).saludo, true);
  assert.equal(e(3000, pide + 1050, false, 3000).saludo, true);
  assert.equal(e(3051, pide + 1050, false, 3051).saludo, false);
});

test('el brazo alterna de pose cada 170 ms mientras saluda', () => {
  assert.deepEqual([6500, 6670, 6840, 7010].map(t => e(t).brazo), [e(6500).brazo, 1 - e(6500).brazo, e(6500).brazo, 1 - e(6500).brazo]);
});

test('con movimiento reducido nada se mueve: ni respira, ni parpadea, ni saluda (aunque lo pidan)', () => {
  for (const t of [0, 650, 3700, 6700]) assert.deepEqual(e(t, t + 1000, true), { saludo: false, parpadeo: false, respira: false, brazo: 0 });
});

test('rTitulo() pone el lienzo decorativo junto a JUGAR y no toca el botón ni su controlador', () => {
  const js = leer('js/menus.js');
  assert.ok(js.includes('<canvas id="t-aprendiz" class="tit-aprendiz" width="56" height="80" aria-hidden="true"></canvas>'));
  assert.ok(/<div class="tit-jugar-fila">\s*<canvas id="t-aprendiz"[^>]*><\/canvas>\s*<div class="jugar-marco">[\s\S]*?<button class="btn btn-jugar" id="t-jugar" type="button">\$\{t\('jugar'\)\}<\/button>/.test(js));
  assert.ok(js.includes("aprendizPortada($('#t-aprendiz'),$('#t-jugar'))"));
  assert.ok(js.includes("$('#t-jugar').onclick") || /t-jugar/.test(leer('js/principal.js')) || /t-jugar/.test(leer('js/menus.js')), 'el controlador de JUGAR sigue');
});

test('reutiliza el atlas del aprendiz (APRENDIZ.dibujar) y los bucles se limpian con tcada()/limpiarT()', () => {
  const js = leer('js/menus.js');
  const f = js.slice(js.indexOf('function aprendizPortada'), js.indexOf('function rTitulo'));
  assert.ok(f.includes('APRENDIZ.dibujar('));
  assert.ok(f.includes('tcada(pinta,100)'), 'a 10 cuadros por segundo con el temporizador del juego');
  assert.ok(!/requestAnimationFrame|setInterval\(/.test(f), 'ningún bucle propio que pantalla() no pueda limpiar');
  assert.ok(f.includes('document.hidden') && f.includes('pausado') && f.includes("pantallaId!=='titulo'"), 'quieto con la pestaña oculta, en pausa o fuera de la portada');
});

test('el CSS deja el lienzo decorativo (sin toques) y lo coloca junto a JUGAR sin tocar las demás pantallas', () => {
  const css = leer('css/estilos.css');
  assert.ok(/\.tit-aprendiz\{[^}]*pointer-events:none/.test(css));
  assert.ok(css.includes('.tit-jugar-fila{display:flex'));
  assert.ok(!/\.tit-aprendiz[^{]*\{[^}]*cqh/.test(css), 'sin unidades de contenedor fuera de un contenedor');
});
