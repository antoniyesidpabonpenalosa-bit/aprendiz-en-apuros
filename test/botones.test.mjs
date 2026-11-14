/* Los botones de la portada (v30, css/estilos.css + js/menus.js): lo que se puede comprobar
   sin navegador. Que el CSS nuevo esté acotado a la portada (no toca las demás pantallas ni
   la tarjeta Mi Avatar), que no meta recursos nuevos y que rTitulo() marque la dificultad con
   aria-pressed y devuelva el foco al repintar. Cómo se VE (escritorio, móvil, HD, legible,
   movimiento reducido, teclado) lo prueban los casos "botones de la portada" de
   scripts/regresiones.mjs en un navegador real. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = f => readFileSync(join(RAIZ, f), 'utf8');
const css = leer('css/estilos.css');
const marca = '/* ── PORTADA · botones arcade (paso 4)';
/* el bloque va desde su marca hasta la del paso siguiente (o el final del archivo) */
const fin = css.indexOf('/* Paso 5 · ficha RPG', css.indexOf(marca));
const bloque = css.slice(css.indexOf(marca), fin < 0 ? undefined : fin);

/* las reglas del bloque, con sus selectores (entra en @media y aplana) */
function selectores(txt) {
  const sin = txt.replace(/\/\*[\s\S]*?\*\//g, '');
  const sel = []; let prof = 0, ini = 0;
  for (let i = 0; i < sin.length; i++) {
    const c = sin[i];
    if (c === '{') { const cab = sin.slice(ini, i).trim(); if (cab && !cab.startsWith('@')) sel.push(cab); prof++; ini = i + 1; }
    else if (c === '}') { prof--; ini = i + 1; }
    else if (c === ';' && prof >= 0) { /* declaración: no es cabecera */ if (!sin.slice(ini, i).includes('{')) ini = i + 1; }
  }
  return sel.flatMap(s => s.split(',').map(x => x.trim()));
}

test('el bloque de botones está UNA sola vez en el CSS', () => {
  assert.ok(css.indexOf(marca) > 0);
  assert.equal(css.split(marca).length, 2);
});

test('todos los selectores del bloque están acotados a .portada', () => {
  const sels = selectores(bloque);
  assert.ok(sels.length > 30, `salieron ${sels.length} selectores`);
  const sueltos = sels.filter(s => !/(^|\s)\.portada(\s|$|[.:#\[])/.test(s));
  assert.deepEqual(sueltos, []);
});

test('el bloque no trae imágenes, fuentes ni @import nuevos', () => {
  assert.ok(!/url\(|@import|@font-face/.test(bloque));
});

test('los iconos de las tarjetas se escalan a 36 px (24 en pantallas pequeñas) y siguen siendo pixel art', () => {
  assert.match(bloque, /\.portada \.menu-fila \.m-ico \.pxi\{width:36px;height:36px;image-rendering:pixelated\}/);
  assert.match(bloque, /@media\(max-width:560px\)\{[\s\S]*\.m-ico \.pxi\{width:24px;height:24px\}/);
});

test('en movimiento reducido no hay desplazamiento al pulsar', () => {
  assert.match(bloque, /@media\(prefers-reduced-motion:reduce\)\{[^}]*transform:none/);
});

test('rTitulo() marca la dificultad con aria-pressed y devuelve el foco con el teclado', () => {
  const js = leer('js/menus.js');
  assert.match(js, /class="dif-op [^"]*" data-dif="\$\{d\.id\}" type="button" aria-pressed="\$\{S\.dif===d\.id\}"/);
  assert.match(js, /matches\(':focus-visible'\)/);
  assert.match(js, /\.focus\(\{preventScroll:true\}\)/);
});

test('sigue usando los iconos de js/iconos.js (pxi), sin emojis sueltos en las tarjetas', () => {
  const js = leer('js/menus.js');
  assert.match(js, /const fila=\(id,ico,txt,cls\)=>`<button[\s\S]{0,200}pxi\(ico\)/);
  assert.match(js, /<span class="dif-ico">\$\{pxi\(d\.ico\)\}<\/span>/);
});
