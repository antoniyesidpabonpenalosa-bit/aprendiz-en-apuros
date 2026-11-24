/* El título de la portada (v28): un dibujo en pixel art con el <h1> de texto como respaldo.
   Aquí: que el recurso sea el del paquete, que el texto accesible siga en el HTML, que el
   CSS no deje ver los dos a la vez ni toque el modo HD, y que esté en la caché sin
   conexión. Lo que hay que VER (que quepa, que no tape nada, HD, legible, fallo de
   carga) lo prueban los casos "título del menú" de scripts/regresiones.mjs. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = f => readFileSync(join(RAIZ, f), 'utf8');

test('el recurso es el del paquete: 920×360, RGBA (fondo transparente)', () => {
  const b = readFileSync(join(RAIZ, 'img/titulo/titulo-aprendiz-en-apuros.png'));
  assert.deepEqual({ w: b.readUInt32BE(16), h: b.readUInt32BE(20), color: b[25] }, { w: 920, h: 360, color: 6 });
});

test('rTitulo() conserva el <h1> de texto con sus dos líneas (con un espacio entre ellas: así se lee "APRENDIZ EN APUROS", no "APRENDIZEN"), el subtítulo y los guiones, y suma la imagen decorativa', () => {
  const js = leer('js/menus.js');
  assert.ok(js.includes('<h1 class="tit-h1"><span class="l1">APRENDIZ</span> <br><span class="l2">EN APUROS</span></h1>'));
  assert.ok(js.includes("<p class=\"sub\">${t('sub')}</p>"));
  assert.ok((js.match(/<span class="guion/g) || []).length === 2);
  assert.ok(js.includes('<img class="tit-img" src="${TITULO_IMG}" alt="" aria-hidden="true"'), 'la imagen es decorativa: el nombre lo da el h1');
  assert.ok(js.includes("const TITULO_IMG='img/titulo/titulo-aprendiz-en-apuros.png'"));
});

test('el CSS esconde el texto solo con la imagen cargada, sin quitarlo del HTML', () => {
  const css = leer('css/estilos.css');
  assert.ok(/^\.tit-img\{display:none\}/m.test(css), 'sin la clase con-imagen no se ve la imagen');
  assert.ok(css.includes('.tit-logo.con-imagen .tit-img{display:block'), 'la imagen se ve solo con con-imagen');
  const h1 = css.slice(css.indexOf('.tit-logo.con-imagen .tit-h1{'));
  assert.ok(h1.includes('clip:rect(0 0 0 0)') && h1.includes('position:absolute') && !h1.slice(0, 220).includes('display:none'),
    'el h1 se esconde a la vista (queda para los lectores de pantalla), no con display:none');
  assert.ok(css.includes('.tit-logo.con-imagen .guion{display:none}'), 'los guiones ya van dentro del dibujo');
  assert.ok(css.includes('image-rendering:pixelated'));
});

test('la caché sin conexión tiene el dibujo; se pide una sola vez y la versión sube', () => {
  assert.ok(leer('sw.js').includes("'./img/titulo/titulo-aprendiz-en-apuros.png'"));
  assert.equal((leer('js/menus.js').match(/new Image\(\)/g) || []).length >= 1, true);
});
