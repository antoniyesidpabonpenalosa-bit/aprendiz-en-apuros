/* Las transiciones de la portada (v32, js/efectos.js + js/menus.js + css/estilos.css): lo que
   se puede comprobar sin navegador. Que reutilicen el motor FX (sin lienzo ni bucle nuevos),
   que en la portada salga un efecto por activación y no se dupliquen con el de pointerdown,
   que no se intercepte el clic, que la entrada solo se marque al llegar y que el CSS respete
   "reducir movimiento" y no salga de la portada. Lo que hay que VER lo prueban los casos
   "transiciones de la portada" de scripts/regresiones.mjs en un navegador real. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = f => readFileSync(join(RAIZ, f), 'utf8');
const fx = leer('js/efectos.js');
const js = leer('js/menus.js');
const css = leer('css/estilos.css');
const marca = '/* Paso 6 · microinteracciones de portada.';
/* hasta el bloque siguiente (iconos de la portada, v34), no hasta el final del archivo */
const fin = css.indexOf('/* Iconos premium de la portada', css.indexOf(marca));
const bloque = css.slice(css.indexOf(marca), fin < 0 ? undefined : fin);

test('un solo lienzo de efectos y un solo bucle: no se añadió otro', () => {
  assert.equal((fx.match(/createElement\('canvas'\)/g) || []).length, 1);
  assert.ok(!/setInterval|new Audio|AudioContext/.test(fx.slice(fx.indexOf('/* Portada: un efecto'))), 'el bloque de la portada no trae temporizadores ni audio');
});

test('en la portada el efecto genérico de pointerdown se salta y sale uno solo en click', () => {
  assert.match(fx, /!b\.closest\('\.cv-wrap'\)&&!b\.closest\('#screen \.portada'\)\)\s*chispas/);
  assert.equal((fx.match(/addEventListener\('click'/g) || []).length, 1);
  assert.match(fx, /closest\('#screen \.portada button'\)/);
});

test('el efecto de la portada no intercepta ni retrasa el clic y respeta reducir movimiento', () => {
  const b = fx.slice(fx.indexOf("addEventListener('click'"), fx.indexOf('},true);', fx.indexOf("addEventListener('click'")));
  assert.ok(!/preventDefault|stopPropagation|stopImmediatePropagation|setTimeout|tvez/.test(b));
  assert.match(b, /quieto\(\)\)return/);
  assert.match(b, /n:jugar\?10:6/);
  assert.match(b, /if\(jugar\)onda\(/);
});

test('la entrada se marca solo al llegar a la portada, y la dificultad confirma sin perder el foco', () => {
  assert.match(js, /const entradaPortada=pantallaId!=='titulo'\|\|!\$\('#screen \.portada'\);/);
  assert.ok(js.indexOf('const entradaPortada') < js.indexOf("pantalla('titulo'"), 'se calcula ANTES de pintar');
  assert.match(js, /class="centro portada\$\{entradaPortada\?' portada-entrada':''\}"/);
  assert.match(js, /elegida\?\.classList\.add\('portada-confirmada'\)/);
  assert.match(js, /if\(teclado\)elegida\?\.focus\(\{preventScroll:true\}\)/);
});

test('el bloque CSS está una vez, acotado a la portada y sin recursos', () => {
  assert.equal(css.split(marca).length, 2);
  const sin = bloque.replace(/\/\*[\s\S]*?\*\//g, '');
  const sels = []; let ini = 0;
  for (let i = 0; i < sin.length; i++) {
    if (sin[i] === '{') { const c = sin.slice(ini, i).trim(); if (c && !c.startsWith('@') && !/^(from|to|\d)/.test(c)) sels.push(...c.split(',').map(x => x.trim())); ini = i + 1; }
    else if (sin[i] === '}' || sin[i] === ';') ini = i + 1;
  }
  assert.ok(sels.length > 15);
  assert.deepEqual(sels.filter(s => !/\.portada/.test(s)), []);
  assert.ok(!/url\(|@import|@font-face/.test(bloque));
});

test('con reducir movimiento se anulan entrada, destello, transiciones y desplazamientos', () => {
  const m = bloque.slice(bloque.indexOf('@media(prefers-reduced-motion:reduce)'));
  assert.match(m, /\.portada-entrada[^{]*\.portada-confirmada\{animation:none!important\}/);
  assert.match(m, /transition:none!important;transform:none!important/);
});
