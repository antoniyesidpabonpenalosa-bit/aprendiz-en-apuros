/* Validación sin dependencias para CI y uso local.
   1) Comprueba la sintaxis de cada archivo .js con node --check.
   2) Verifica que todo archivo local referenciado por index.html exista.
   3) Revisa el anidamiento y los id de cada .html (juego y design system).
   4) Comprueba que sw.js precargue todo lo que index.html necesita.
   Uso:  node scripts/validar.mjs   (se ejecuta desde la raíz del repo) */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
let errores = 0;
const fallo = m => { console.error('✗ ' + m); errores++; };
const ok = m => console.log('✓ ' + m);

/* 1 · sintaxis de todos los .js del proyecto (js/ y sw.js) */
const jsFiles = [
  ...readdirSync(join(raiz, 'js')).filter(f => f.endsWith('.js')).map(f => join('js', f)),
  'sw.js',
];
for (const rel of jsFiles) {
  const abs = join(raiz, rel);
  if (!existsSync(abs)) { fallo(`falta el archivo ${rel}`); continue; }
  try {
    execFileSync(process.execPath, ['--check', abs], { stdio: 'pipe' });
    ok(`sintaxis OK · ${rel}`);
  } catch (e) {
    fallo(`error de sintaxis en ${rel}\n${e.stderr?.toString() || e.message}`);
  }
}

/* 2 · referencias locales de index.html */
const html = readFileSync(join(raiz, 'index.html'), 'utf8');
const refs = [...html.matchAll(/(?:src|href)\s*=\s*"([^"]+)"/g)]
  .map(m => m[1])
  .filter(u => !/^https?:|^data:|^#|^\/\//.test(u));
for (const ref of refs) {
  const clean = ref.replace(/^\.?\//, '').split(/[?#]/)[0];
  if (existsSync(join(raiz, clean))) ok(`referencia OK · ${ref}`);
  else fallo(`index.html referencia un archivo inexistente: ${ref}`);
}

/* 3 · anidamiento e id de todo el HTML del repo
   El juego y las tarjetas del UI kit se escriben a mano, así que una etiqueta
   sin cerrar o un id repetido (la galería concatena fragmentos en una sola
   página) solo se notaría al abrirlo en el navegador. Se revisa aquí. */
const VOID = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
const CRUDA = new Set(['script','style','textarea','title']);   // su interior no es HTML
const CIERRE_OPCIONAL = new Set(['li','dt','dd','p','option','thead','tbody','tfoot','tr','td','th']);

function revisarHtml(html) {
  const problemas = [];
  const pila = [];
  const ids = new Map();
  /* comentario | etiqueta: captura barra de cierre, nombre, atributos y "/>"  */
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g;
  const lineaDe = i => html.slice(0, i).split('\n').length;
  let m;
  while ((m = re.exec(html))) {
    if (m[0].startsWith('<!--')) continue;
    const [, cierre, crudo, attrs, autocierre] = m;
    const tag = crudo.toLowerCase();
    const linea = lineaDe(m.index);

    if (!cierre) for (const a of attrs.matchAll(/\bid\s*=\s*"([^"]*)"/g)) {
      if (ids.has(a[1])) problemas.push(`id duplicado "${a[1]}" (líneas ${ids.get(a[1])} y ${linea})`);
      else ids.set(a[1], linea);
    }

    if (VOID.has(tag)) {
      if (cierre) problemas.push(`línea ${linea}: </${tag}> sobra, es una etiqueta vacía`);
      continue;
    }
    if (autocierre) continue;

    if (!cierre) {
      pila.push({ tag, linea });
      if (CRUDA.has(tag)) {   // saltar el contenido: un "<" ahí dentro no es una etiqueta
        const fin = html.toLowerCase().indexOf(`</${tag}`, re.lastIndex);
        if (fin === -1) { problemas.push(`línea ${linea}: <${tag}> nunca se cierra`); break; }
        re.lastIndex = fin;
      }
      continue;
    }

    const abre = pila.map(x => x.tag).lastIndexOf(tag);
    if (abre === -1) { problemas.push(`línea ${linea}: </${tag}> sin apertura`); continue; }
    for (let j = pila.length - 1; j > abre; j--)
      if (!CIERRE_OPCIONAL.has(pila[j].tag))
        problemas.push(`<${pila[j].tag}> de la línea ${pila[j].linea} queda sin cerrar dentro de <${tag}> (</${tag}> en la línea ${linea})`);
    pila.length = abre;
  }
  for (const h of pila)
    if (!CIERRE_OPCIONAL.has(h.tag)) problemas.push(`<${h.tag}> de la línea ${h.linea} nunca se cierra`);
  return problemas;
}

function htmlsDe(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const abs = join(dir, e.name);
    return e.isDirectory() ? htmlsDe(abs) : (e.name.endsWith('.html') ? [abs] : []);
  });
}

for (const abs of [join(raiz, 'index.html'), ...htmlsDe(join(raiz, 'design-system'))]) {
  const rel = relative(raiz, abs).split(sep).join('/');
  const problemas = revisarHtml(readFileSync(abs, 'utf8'));
  if (problemas.length) fallo(`HTML mal formado · ${rel}\n    ` + problemas.join('\n    '));
  else ok(`HTML bien anidado · ${rel}`);
}

/* 4 · la lista de precarga del service worker cubre lo que usa index.html
   Si se añade un .js al juego y no se añade a BASE, el modo offline se rompe
   sin avisar: la página cargada de caché pide un script que no está. */
const sw = readFileSync(join(raiz, 'sw.js'), 'utf8');
const base = sw.match(/const BASE\s*=\s*\[([\s\S]*?)\]/);
if (!base) fallo('sw.js no tiene un arreglo BASE = [ ... ]');
else {
  const precargados = new Set([...base[1].matchAll(/'([^']+)'/g)]
    .map(m => m[1].replace(/^\.\//, '')));
  const necesarios = refs.map(r => r.replace(/^\.?\//, '').split(/[?#]/)[0]);
  const faltan = necesarios.filter(r => !precargados.has(r));
  if (faltan.length) fallo(`sw.js no precarga: ${faltan.join(', ')}\n    ` +
    'Agrégalos al arreglo BASE de sw.js y sube la versión de CACHE.');
  else ok(`sw.js precarga los ${necesarios.length} archivos locales de index.html`);
}

/* 5 · toda pantalla dice cómo volver a pintarse
   pantalla(id, html, rehacer) guarda ese tercer argumento y el botón de idioma
   lo usa (js/nucleo.js). Una pantalla que no lo entregue se queda escrita en el
   idioma con el que entró: así estuvo el diálogo de la campaña, y la lista de
   pantallas a redibujar vivía escrita a mano en principal.js. Esto lo vigila.

   Las excepciones son a propósito: un minijuego en marcha ('nivel') y la cuenta
   atrás de la sala se rehacen desde cero, y eso le costaría la ronda a quien
   está jugando. Esas solo cambian la cabecera. */
const SIN_REPINTADO = new Set(['nivel', 'sala-cuenta']);

/* Encuentra el paréntesis que cierra una llamada, saltándose lo que hay dentro
   de plantillas `...${...}...` y de cadenas. Sin esto, un `)` dentro del HTML
   se confundiría con el final de la llamada. */
function finLlamada(txt, abre) {
  const pila = [];
  let prof = 0;
  for (let j = abre; j < txt.length; j++) {
    const c = txt[j], ultimo = pila[pila.length - 1];
    if (ultimo === '`') {
      if (c === '\\') { j++; continue; }
      if (c === '`') pila.pop();
      else if (c === '$' && txt[j + 1] === '{') { pila.push('{'); j++; }
      continue;
    }
    if (ultimo === '{') {
      if (c === '`') pila.push('`');
      else if (c === '{') pila.push('{');
      else if (c === '}') pila.pop();
      continue;
    }
    if (c === '"' || c === "'") {
      const q = c;
      for (j++; j < txt.length && txt[j] !== q; j++) if (txt[j] === '\\') j++;
      continue;
    }
    if (c === '`') pila.push('`');
    else if (c === '(') prof++;
    else if (c === ')' && --prof === 0) return j;
  }
  return -1;
}

const sinRepintar = [];
let pantallasVistas = 0;
for (const rel of jsFiles.filter(f => f.startsWith('js' + sep))) {
  const txt = readFileSync(join(raiz, rel), 'utf8');
  for (const m of txt.matchAll(/pantalla\('([^']+)'/g)) {
    pantallasVistas++;
    const id = m[1];
    if (SIN_REPINTADO.has(id)) continue;
    const abre = txt.indexOf('(', m.index);
    const cierra = finLlamada(txt, abre);
    const cola = txt.slice(Math.max(abre, cierra - 80), cierra);
    if (!/`\s*,\s*[\w$(]/.test(cola)) sinRepintar.push(`${rel} · pantalla('${id}')`);
  }
}
if (sinRepintar.length) fallo('estas pantallas no dicen cómo volver a pintarse, así que no se ' +
  'traducen al cambiar de idioma:\n    ' + sinRepintar.join('\n    ') +
  "\n    Pásale a pantalla() un tercer argumento que la vuelva a dibujar, o añade su id a SIN_REPINTADO si es a propósito.");
else ok(`las ${pantallasVistas} pantallas dicen cómo volver a pintarse (o son excepción a propósito)`);

if (errores) { console.error(`\n${errores} problema(s) encontrado(s).`); process.exit(1); }
console.log('\nTodo en orden ✅');
