/* La ficha de jugador de la portada (v31, js/menus.js + css/estilos.css): lo que se puede
   comprobar sin navegador. Que lea los datos reales (nombre escapado, rango, XP, estrellas,
   campaña), que siga siendo UN botón que abre la personalización con el retrato de siempre y
   que su CSS no salga de la portada. Cómo se VE y que los números cuadren con la partida lo
   prueban los casos "ficha de la portada" de scripts/regresiones.mjs en un navegador real. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = f => readFileSync(join(RAIZ, f), 'utf8');
const js = leer('js/menus.js');
const css = leer('css/estilos.css');
const marca = '/* Paso 5 · ficha RPG del avatar.';
const fin = css.indexOf('/* Paso 6 · microinteracciones', css.indexOf(marca));
const bloque = css.slice(css.indexOf(marca), fin < 0 ? undefined : fin);
const ficha = js.slice(js.indexOf('<button class="tit-avatar"'), js.indexOf('</button>', js.indexOf('<button class="tit-avatar"')) + 9);

function selectores(txt) {
  const sin = txt.replace(/\/\*[\s\S]*?\*\//g, '');
  const sel = []; let ini = 0;
  for (let i = 0; i < sin.length; i++) {
    if (sin[i] === '{') { const cab = sin.slice(ini, i).trim(); if (cab && !cab.startsWith('@')) sel.push(cab); ini = i + 1; }
    else if (sin[i] === '}' || sin[i] === ';') ini = i + 1;
  }
  return sel.flatMap(s => s.split(',').map(x => x.trim()));
}

test('el bloque de la ficha está UNA vez en el CSS y la ficha UNA vez en rTitulo()', () => {
  assert.equal(css.split(marca).length, 2);
  assert.equal(js.split('class="tit-avatar"').length, 2);
});

test('todos los selectores del bloque están acotados a .portada', () => {
  const sels = selectores(bloque);
  assert.ok(sels.length > 25, `salieron ${sels.length} selectores`);
  assert.deepEqual(sels.filter(s => !/(^|\s)\.portada(\s|$|[.:#\[])/.test(s)), []);
});

test('sin imágenes, fuentes ni @import nuevos', () => {
  assert.ok(!/url\(|@import|@font-face/.test(bloque));
});

test('es un solo botón (#t-perso) sin botones ni bloques anidados', () => {
  assert.match(ficha, /^<button class="tit-avatar" id="t-perso" type="button">/);
  assert.equal((ficha.match(/<button/g) || []).length, 1);
  assert.ok(!/<div/.test(ficha), 'dentro de un <button> solo va contenido en línea (span)');
});

test('lee los datos reales del jugador', () => {
  assert.match(ficha, /esc\(tieneNombre\(\)\?S\.nombre:t\('tu'\)\)/);
  assert.match(ficha, /\$\{rangoNom\(\)\}/);
  assert.match(ficha, /\$\{S\.xp\}\$\{sig\?` \/ \$\{sig\.xp\}`:''\}/);
  assert.match(ficha, /\$\{totalStars\(\)\} \/ \$\{TOT_DIAS\*3\}/);
  assert.match(ficha, /\$\{diasCampana\}\/\$\{TOT_DIAS\}/);
  assert.match(js, /const diasCampana=progreso\(\);\s*const pcCampana=Math\.round\(diasCampana\/TOT_DIAS\*100\);/);
});

test('el retrato sigue siendo el de siempre, a su resolución nativa', () => {
  assert.match(ficha, /<canvas id="t-av" width="\$\{S\.av32\?32:16\}" height="\$\{S\.av32\?32:16\}"><\/canvas>/);
  assert.match(js, /const av=\$\('#t-av'\); if\(av\)retratoVivo\(av,CARAS\.yo\(true\)\);/);
  assert.match(js, /\$\('#t-perso'\)\.onclick=\(\)=>\{SFX\.click\(\);rPerso\(\)\};/);
});

test('el lienzo y la flecha son decorativos para los lectores de pantalla', () => {
  assert.match(ficha, /class="tit-av-portrait" aria-hidden="true"/);
  assert.match(ficha, /class="m-chev" aria-hidden="true"/);
});

test('en movimiento reducido la ficha no se hunde al pulsarla', () => {
  assert.match(bloque, /@media\(prefers-reduced-motion:reduce\)\{\.portada \.tit-avatar:active\{transform:none\}\}/);
});
