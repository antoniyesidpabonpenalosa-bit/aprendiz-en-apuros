/* El fondo de la portada (js/fondo.js + el CSS de .campus-hd): el campus nocturno HD (v36),
   que sustituye a la ciudad de la v27. Que los recursos sean los que el CSS espera (las seis
   capas de 1600×900), que todas compartan encuadre, que el JS active el campus solo en
   'titulo' y solo con el escenario cargado, que respete "reducir movimiento" y la pestaña
   oculta, que no quede nada de la ciudad anterior y que esté en la caché sin conexión. Lo que
   hay que VER (encuadre, animación, legibilidad, fallo de carga, sin conexión) lo prueban los
   casos "fondo del menú" de scripts/regresiones.mjs en un navegador real. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = f => readFileSync(join(RAIZ, f), 'utf8');
const CAPAS = ['img/portada/estrellas-1.png', 'img/portada/estrellas-2.png', 'img/portada/nubes-cercanas.png', 'img/portada/nubes-lejanas.png', 'img/portada/ventanas.png'];
const BASE = 'img/portada/campus-noche.webp';
const png = ruta => { const b = readFileSync(join(RAIZ, ruta)); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), rgba: b[25] === 6 }; };
/* WebP con perfil VP8 (con pérdida): el ancho y el alto van en 14 bits a partir del byte 26 */
const webp = ruta => { const b = readFileSync(join(RAIZ, ruta)); return { riff: b.toString('ascii', 0, 4) + b.toString('ascii', 8, 12), vp8: b.toString('ascii', 12, 16), w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff }; };

/* un entorno mínimo: un <div id="app"> con classList, Image que carga (o falla) a voluntad */
function entorno({ cargar = true, pantalla = 'titulo' } = {}) {
  const clases = new Set(), imagenes = [];
  const app = { classList: { toggle: (c, on) => { on ? clases.add(c) : clases.delete(c); }, contains: c => clases.has(c) } };
  const ctx = createContext({
    console, pantallaId: pantalla,
    document: { getElementById: id => id === 'app' ? app : null, documentElement: { classList: { toggle() {} } }, hidden: false, addEventListener() {} },
    Image: class { set src(v) { this._src = v; imagenes.push(this); queueMicrotask(() => (cargar ? this.onload : this.onerror)?.()); } },
  });
  runInContext(leer('js/fondo.js'), ctx, { filename: 'js/fondo.js' });
  return { ctx, clases, imagenes, activar: id => runInContext(`fondoPantalla(${JSON.stringify(id)})`, ctx) };
}
const esperar = () => new Promise(r => setTimeout(r, 5));
const css = leer('css/estilos.css');
const bloque = css.slice(css.indexOf('FONDO DEL MENÚ PRINCIPAL · campus nocturno HD'), css.indexOf('/* el contenido va por encima del fondo */'));

test('los recursos son los del paquete: escenario WebP y 5 capas PNG RGBA, todos de 1600×900', () => {
  const b = webp(BASE);
  assert.deepEqual(b, { riff: 'RIFFWEBP', vp8: 'VP8 ', w: 1600, h: 900 });
  for (const c of CAPAS) assert.deepEqual(png(c), { w: 1600, h: 900, rgba: true }, c);
});

test('el CSS apunta a archivos que existen (las rutas del CSS van desde css/) y todas las capas comparten encuadre', () => {
  const rutas = [...bloque.matchAll(/url\((?:'|")?([^)'"]+)/g)].map(m => m[1]);
  assert.equal(rutas.length, 6);
  for (const r of rutas) assert.ok(existsSync(resolve(RAIZ, 'css', r)), r);
  assert.match(bloque, /#fondo \.campus-hd>div\{position:absolute;inset:0;background-position:center bottom;background-size:cover;background-repeat:no-repeat;pointer-events:none\}/);
});

test('animaciones lentas y suaves: nubes 82 y 56 s, estrellas 11 y 17 s, ventanas 13 s; deriva de ±2,5 %', () => {
  for (const [capa, s] of [['nubes-lejos', 82], ['nubes-cerca', 56], ['estrellas-a', 11], ['estrellas-b', 17], ['ventanas', 13]])
    assert.match(bloque, new RegExp(`\\.campus-${capa}\\{[^}]*animation:campus-\\w+ ${s}s ease-in-out infinite`), capa);
  assert.match(bloque, /@keyframes campus-deriva\{from\{transform:translateX\(-2\.5%\)\}to\{transform:translateX\(2\.5%\)\}\}/);
  assert.ok(!/steps\(/.test(bloque), 'sin saltos de cuadro: todo es suave');
});

test('con movimiento reducido no se anima nada; con la pestaña oculta, pausa; el velo oscuro está', () => {
  assert.match(bloque, /@media\(prefers-reduced-motion:reduce\)\{\s*#app\.fondo-campus \.campus-hd>div\{animation:none!important;transform:none!important\}/);
  assert.ok(bloque.includes('html.pestana-oculta #app.fondo-campus .campus-hd>div{animation-play-state:paused}'));
  assert.match(bloque, /\.campus-velo\{background:linear-gradient/);
});

test('el campus solo se pinta con #app.fondo-campus y esa clase solo la pone fondoPantalla()', () => {
  assert.match(bloque, /#fondo \.campus-hd\{display:none;/, 'sin la clase, la capa no existe');
  assert.ok(bloque.includes('#app.fondo-campus .mte,#app.fondo-campus .niebla{display:none}'), 'las montañas se esconden mientras el campus se ve');
  assert.ok(leer('js/nucleo.js').includes('fondoPantalla(id)'), 'pantalla() debe llamar a fondoPantalla');
});

test('de la ciudad de la v27 no queda nada: ni capa, ni CSS, ni imágenes, ni caché', () => {
  assert.ok(!/class="ciudad"/.test(leer('index.html')));
  assert.ok(!/\.ciudad\b|fondo-ciudad|img\/fondo\//.test(css));
  assert.ok(!/img\/fondo\//.test(leer('sw.js')));
  assert.ok(!existsSync(join(RAIZ, 'img/fondo/ciudad-atlas.png')) && !existsSync(join(RAIZ, 'img/fondo/ciudad-estatica.png')));
  assert.ok(!/fondo-ciudad|ciudad-atlas/.test(leer('js/fondo.js')));
});

test('fondoPantalla: la clase está en el menú principal, ya cargado el escenario, y se va en cualquier otra pantalla', async () => {
  const e = entorno();
  await esperar();
  e.activar('titulo');   assert.ok(e.clases.has('fondo-campus'));
  e.activar('pasillo');  assert.ok(!e.clases.has('fondo-campus'));
  e.activar('nivel');    assert.ok(!e.clases.has('fondo-campus'));
  e.activar('titulo');   assert.ok(e.clases.has('fondo-campus'), 'al volver al menú, otra vez');
});

test('fondoPantalla: no se activa antes de que cargue el escenario, ni si falla', async () => {
  const antes = entorno();
  antes.activar('titulo'); assert.ok(!antes.clases.has('fondo-campus'), 'antes de cargar: montañas');
  const falla = entorno({ cargar: false });
  await esperar();
  falla.activar('titulo'); assert.ok(!falla.clases.has('fondo-campus'), 'escenario que falla: montañas');
});

test('al terminar de cargar, si ya se está en el menú, el campus aparece solo', async () => {
  const e = entorno({ pantalla: 'titulo' });
  assert.ok(!e.clases.has('fondo-campus'));
  await esperar();
  assert.ok(e.clases.has('fondo-campus'));
});

test('el JS solo pide el escenario (las capas las pide el CSS cuando la capa se ve)', async () => {
  const e = entorno(); await esperar();
  assert.equal(e.imagenes.length, 1);
  assert.equal(e.imagenes[0]._src, BASE);
});

test('la caché sin conexión tiene las 6 imágenes y el módulo; index.html tiene las capas y carga fondo.js después de graficos.js', () => {
  const sw = leer('sw.js');
  for (const r of [BASE, ...CAPAS, 'js/fondo.js']) assert.ok(sw.includes(`'./${r}'`), r);
  const html = leer('index.html');
  assert.match(html, /<div id="fondo"[\s\S]*<div class="campus-hd" aria-hidden="true">[\s\S]*<div class="campus-velo"><\/div>[\s\S]*<div id="hud">/);
  for (const c of ['campus-base', 'campus-estrellas-a', 'campus-estrellas-b', 'campus-nubes-lejos', 'campus-nubes-cerca', 'campus-ventanas', 'campus-velo'])
    assert.equal(html.split(`class="${c}"`).length, 2, c);
  assert.ok(html.indexOf('<script src="js/graficos.js">') < html.indexOf('<script src="js/fondo.js">'));
});
