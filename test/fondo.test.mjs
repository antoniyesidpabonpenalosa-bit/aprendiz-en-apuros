/* El fondo de la portada (js/fondo.js + el CSS de .ciudad): que los recursos sean los
   que el CSS espera, que el encuadre y los cuadros de la animación cuadren con la hoja,
   que el JS active la ciudad solo en 'titulo' y solo si todo está listo, y que esté en
   la caché sin conexión. Lo que hay que VER (cover, animación, legibilidad, pestaña
   oculta, movimiento reducido, fallo de carga) lo prueban los casos "fondo del menú" de
   scripts/regresiones.mjs en un navegador real. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = f => readFileSync(join(RAIZ, f), 'utf8');
const cabecera = ruta => { const b = readFileSync(join(RAIZ, ruta)); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; };

/* un entorno mínimo: un <div id="app"> con classList, Image que carga (o falla) a voluntad */
function entorno({ cargar = true, cq = true, pantalla = 'titulo' } = {}) {
  const clases = new Set(), imagenes = [];
  const app = { classList: { toggle: (c, on) => { on ? clases.add(c) : clases.delete(c); }, contains: c => clases.has(c) } };
  const ctx = createContext({
    console, pantallaId: pantalla,
    document: { getElementById: id => id === 'app' ? app : null, documentElement: { classList: { toggle() {} } }, hidden: false, addEventListener() {} },
    Image: class { set src(v) { this._src = v; imagenes.push(this); queueMicrotask(() => (cargar ? this.onload : this.onerror)?.()); } },
    CSS: { supports: () => cq },
  });
  runInContext(leer('js/fondo.js'), ctx, { filename: 'js/fondo.js' });
  return { ctx, clases, imagenes, activar: id => runInContext(`fondoPantalla(${JSON.stringify(id)})`, ctx) };
}
const esperar = () => new Promise(r => setTimeout(r, 5));

test('los recursos son los del paquete: hoja de 1647×932 (3×2 cuadros de 549×466) y una imagen estática de 549×466', () => {
  assert.deepEqual(cabecera('img/fondo/ciudad-atlas.png'), { w: 3 * 549, h: 2 * 466 });
  assert.deepEqual(cabecera('img/fondo/ciudad-estatica.png'), { w: 549, h: 466 });
});

test('el CSS apunta a archivos que existen (las rutas del CSS van desde css/)', () => {
  const css = leer('css/estilos.css');
  const urls = [...css.matchAll(/url\((\.\.\/img\/fondo\/[^)]+)\)/g)].map(m => m[1]);
  assert.ok(urls.length >= 2, 'faltan las dos imágenes en el CSS');
  assert.ok(!/^\.ciudad\{[^}]*url\(/m.test(css), 'la regla base de .ciudad no debe llevar imagen: pediría la hoja aunque se use la estática');
  for (const u of urls) assert.ok(existsSync(resolve(RAIZ, 'css', u)), `${u} no existe (relativa a css/)`);
});

test('el encuadre cover usa la relación del cuadro (549:466) y el CSS no estira la imagen', () => {
  const css = leer('css/estilos.css');
  assert.ok(css.includes('calc(100cqh*549/466)') && css.includes('calc(100cqw*466/549)'));
  assert.ok(css.includes('300% 200%'), 'la hoja se reparte en 3 columnas × 2 filas');
  assert.ok(/\.ciudad\{[^}]*image-rendering:pixelated/.test(css), 'píxeles definidos');
});

test('la animación recorre los 6 cuadros en el orden de lectura, sin interpolar (steps)', () => {
  const css = leer('css/estilos.css');
  const k = css.slice(css.indexOf('@keyframes ciudadCuadros'));
  const pos = [...k.slice(0, k.indexOf('}}') + 2).matchAll(/([\d.]+)%\{background-position:(\d+)% (\d+)%\}/g)].map(m => [+m[1], +m[2], +m[3]]);
  const esperados = [[0, 0, 0], [16.667, 50, 0], [33.333, 100, 0], [50, 0, 100], [66.667, 50, 100], [83.333, 100, 100]];
  assert.deepEqual(pos.slice(0, 6), esperados);
  assert.ok(/animation:ciudadCuadros calc\(6\*var\(--ciudad-ms\)\) steps\(1,end\) infinite/.test(css));
});

test('cada cuadro dura entre 600 y 1000 ms (ambiente tranquilo)', () => {
  const m = leer('css/estilos.css').match(/--ciudad-ms:(\d+)ms/);
  assert.ok(m, 'no encuentro --ciudad-ms');
  assert.ok(+m[1] >= 600 && +m[1] <= 1000, `${m[1]} ms`);
});

test('con movimiento reducido el CSS usa la imagen estática y no anima; con la pestaña oculta, pausa', () => {
  const css = leer('css/estilos.css');
  const bloque = css.slice(css.indexOf('@media(prefers-reduced-motion:reduce){\n  #app.fondo-ciudad .ciudad'));
  assert.ok(bloque.includes('animation:none') && bloque.includes('ciudad-estatica.png') && bloque.includes('background-size:100% 100%'));
  assert.ok(css.includes('html.pestana-oculta #app.fondo-ciudad .ciudad{animation-play-state:paused}'));
});

test('la ciudad solo se pinta con #app.fondo-ciudad y esa clase solo la pone fondoPantalla()', () => {
  const css = leer('css/estilos.css');
  assert.ok(/\.ciudad\{display:none/.test(css), 'sin la clase, la capa no existe');
  assert.ok(css.includes('#app.fondo-ciudad .mte,#app.fondo-ciudad .niebla{display:none}'), 'las montañas se esconden mientras la ciudad se ve');
  assert.ok(leer('js/nucleo.js').includes('fondoPantalla(id)'), 'pantalla() debe llamar a fondoPantalla');
});

test('fondoPantalla: la clase está en el menú principal, ya cargada la imagen, y se va en cualquier otra pantalla', async () => {
  const e = entorno();
  await esperar();
  e.activar('titulo');   assert.ok(e.clases.has('fondo-ciudad'));
  e.activar('pasillo');  assert.ok(!e.clases.has('fondo-ciudad'));
  e.activar('nivel');    assert.ok(!e.clases.has('fondo-ciudad'));
  e.activar('titulo');   assert.ok(e.clases.has('fondo-ciudad'), 'al volver al menú, otra vez');
});

test('fondoPantalla: no se activa antes de que cargue la imagen, ni si falla, ni sin unidades de contenedor', async () => {
  const antes = entorno();
  antes.activar('titulo'); assert.ok(!antes.clases.has('fondo-ciudad'), 'antes de cargar: montañas');
  const falla = entorno({ cargar: false });
  await esperar();
  falla.activar('titulo'); assert.ok(!falla.clases.has('fondo-ciudad'), 'imagen que falla: montañas');
  const sinCq = entorno({ cq: false });
  await esperar();
  sinCq.activar('titulo'); assert.ok(!sinCq.clases.has('fondo-ciudad'), 'sin cqw/cqh: montañas');
});

test('al terminar de cargar, si ya se está en el menú, la ciudad aparece sola', async () => {
  const e = entorno({ pantalla: 'titulo' });
  assert.ok(!e.clases.has('fondo-ciudad'));
  await esperar();
  assert.ok(e.clases.has('fondo-ciudad'));
});

test('se pide UNA sola imagen: la hoja animada (la estática solo si hay "reducir movimiento")', async () => {
  const e = entorno(); await esperar();
  assert.equal(e.imagenes.length, 1);
  assert.equal(e.imagenes[0]._src, 'img/fondo/ciudad-atlas.png');
});

test('la caché sin conexión tiene las imágenes y el módulo; index.html tiene la capa y carga fondo.js después de graficos.js', () => {
  const sw = leer('sw.js');
  for (const r of ['./img/fondo/ciudad-atlas.png', './img/fondo/ciudad-estatica.png', './js/fondo.js']) assert.ok(sw.includes(`'${r}'`), r);
  const html = leer('index.html');
  assert.ok(/<div id="fondo"[\s\S]*<div class="ciudad"><\/div>[\s\S]*<div id="hud">/.test(html), 'la capa .ciudad debe estar dentro de #fondo');
  assert.ok(html.indexOf('<script src="js/graficos.js">') < html.indexOf('<script src="js/fondo.js">'), 'fondo.js usa quieto() de graficos.js');
});
