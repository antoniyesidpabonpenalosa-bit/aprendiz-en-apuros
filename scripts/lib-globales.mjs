/* Vigilante de nombres globales (v40.18). Sin dependencias.

   El juego no usa módulos: los scripts de index.html comparten un mismo espacio de nombres. Dos cosas pasan cuando se repite uno:
     · const / let / class repetidos entre archivos: el segundo archivo falla al cargar («Identifier ... has already been declared»)
       y TODO ese archivo se queda sin ejecutar;
     · function / var repetidos: el segundo SOBRESCRIBE al primero sin avisar. Es el caso peligroso: nada se rompe a la vista.
   Además, un nombre que coincide con uno del navegador (name, status, open, top, event...) puede fallar o comportarse raro.

   Aquí solo se listan las declaraciones del nivel superior de un script: se quitan comentarios, textos, plantillas y expresiones
   regulares (sin tocar los saltos de línea), se cuentan los paréntesis, corchetes y llaves, y lo que queda a profundidad 0 y al
   comienzo de una sentencia se lee. No es un analizador completo de JavaScript: no ve nombres creados dinámicamente (window.x = ...)
   ni los de dentro de funciones, que son locales. La prueba test/globales.test.mjs fija sus límites. */

/** nombres que el navegador ya trae como globales y que un script del juego no debería declarar */
export const NOMBRES_DEL_NAVEGADOR = new Set([
  'name', 'status', 'length', 'top', 'parent', 'self', 'event', 'history', 'location', 'screen', 'origin', 'close', 'open', 'stop',
  'focus', 'blur', 'print', 'find', 'scroll', 'alert', 'confirm', 'prompt', 'external', 'frames', 'opener', 'closed', 'menubar',
  'toolbar', 'navigator', 'document', 'window', 'performance', 'crypto', 'caches', 'fetch', 'Image', 'Audio', 'Option',
  'Notification', 'Event', 'Node', 'Element', 'Text', 'Range', 'Selection', 'Request', 'Response', 'Headers', 'URL', 'Blob', 'File',
  'localStorage', 'sessionStorage', 'indexedDB', 'console', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
  'requestAnimationFrame', 'cancelAnimationFrame', 'matchMedia', 'getComputedStyle', 'innerWidth', 'innerHeight', 'scrollX',
  'scrollY', 'isSecureContext', 'onload', 'onerror', 'chrome',
]);

const PREV_CONTINUA = '=,([{:?+-*/%&|^!~<>.';          // si lo último fue uno de estos, la expresión sigue en la línea de abajo
const PREV_REGEX = '(,=:[!&|?{};+-*%<>~^';              // tras estos, una «/» abre una expresión regular
const PALABRAS_REGEX = new Set(['return', 'typeof', 'case', 'in', 'of', 'delete', 'void', 'throw', 'new', 'else', 'do', 'yield', 'await']);
const esId = c => c !== undefined && /[A-Za-z0-9_$]/.test(c);

/** el mismo texto con comentarios, textos, plantillas y expresiones regulares en blanco (los saltos de línea se conservan) */
export function limpia(src) {
  const o = src.split('');
  const n = src.length;
  const blanco = (a, b) => { for (let k = a; k < b; k++) if (o[k] !== '\n') o[k] = ' '; };
  let i = 0, prev = '', prevPal = '';
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { const f = src.indexOf('\n', i); const e = f < 0 ? n : f; blanco(i, e); i = e; continue; }
    if (c === '/' && d === '*') { const f = src.indexOf('*/', i + 2); const e = f < 0 ? n : f + 2; blanco(i, e); i = e; continue; }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && src[j] !== c && src[j] !== '\n') j += src[j] === '\\' ? 2 : 1;
      blanco(i + 1, Math.min(j, n)); prev = c; prevPal = ''; i = j + 1; continue;
    }
    if (c === '`') {
      let j = i + 1, prof = 0;
      while (j < n) {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === '`' && prof === 0) break;
        if (src[j] === '$' && src[j + 1] === '{') { prof++; j += 2; continue; }
        if (src[j] === '}' && prof > 0) { prof--; j++; continue; }
        if (src[j] === '`' && prof > 0) { // plantilla dentro de una expresión ${ }: se salta entera
          let k = j + 1; while (k < n && src[k] !== '`') k += src[k] === '\\' ? 2 : 1; j = k + 1; continue;
        }
        j++;
      }
      blanco(i + 1, Math.min(j, n)); prev = '`'; prevPal = ''; i = j + 1; continue;
    }
    if (c === '/') {
      const aRegex = prev === '' || PREV_REGEX.includes(prev) || PALABRAS_REGEX.has(prevPal);
      if (aRegex) {
        let j = i + 1, clase = false;
        while (j < n && src[j] !== '\n') {
          if (src[j] === '\\') { j += 2; continue; }
          if (src[j] === '[') clase = true; else if (src[j] === ']') clase = false;
          else if (src[j] === '/' && !clase) break;
          j++;
        }
        if (src[j] === '/') { blanco(i + 1, j); j++; while (esId(src[j])) j++; prev = '/'; prevPal = ''; i = j; continue; }
      }
      prev = c; prevPal = ''; i++; continue;
    }
    if (/\s/.test(c)) { i++; continue; }
    if (esId(c)) { let j = i; while (esId(src[j])) j++; prevPal = src.slice(i, j); prev = src[j - 1]; i = j; continue; }
    prev = c; prevPal = ''; i++;
  }
  return o.join('');
}

/**
 * Las declaraciones del nivel superior de un script: [{nombre, tipo: 'function'|'class'|'const'|'let'|'var', linea}].
 * @param {string} src
 */
export function declaraciones(src) {
  const t = limpia(src), n = t.length, res = [];
  const linea = pos => { let l = 1; for (let k = 0; k < pos; k++) if (t[k] === '\n') l++; return l; };
  let prof = 0, i = 0;
  let ultimo = '', hayNl = false;               // último carácter significativo y si hubo un salto de línea desde entonces
  const inicioDeSentencia = () => ultimo === '' || ultimo === ';' || ultimo === '}' || (hayNl && !PREV_CONTINUA.includes(ultimo));
  while (i < n) {
    const c = t[i];
    if (c === '\n') { hayNl = true; i++; continue; }
    if (/\s/.test(c)) { i++; continue; }
    if (esId(c)) {
      let j = i; while (esId(t[j])) j++;
      const pal = t.slice(i, j);
      if (prof === 0 && inicioDeSentencia()) {
        if (pal === 'async' || pal === 'function' || pal === 'class') {
          let k = j; while (/\s/.test(t[k] || '')) k++;
          let tipo = pal;
          if (pal === 'async') { const m = /^function\b\s*\*?\s*/.exec(t.slice(k)); if (m) { tipo = 'function'; k += m[0].length; } else tipo = ''; }
          else if (pal === 'function') { if (t[k] === '*') { k++; while (/\s/.test(t[k] || '')) k++; } }
          if (tipo) { let e = k; while (esId(t[e])) e++; if (e > k) res.push({ nombre: t.slice(k, e), tipo, linea: linea(k) }); }
        } else if (pal === 'const' || pal === 'let' || pal === 'var') {
          let k = j;
          for (;;) {                             // una lista de declaradores: a = 1, b, c = 3
            while (/\s/.test(t[k] || '')) k++;
            let e = k; while (esId(t[e])) e++;
            if (e === k) break;                  // desestructuración u otra cosa: no se lee
            res.push({ nombre: t.slice(k, e), tipo: pal, linea: linea(k) });
            k = e;
            let p = 0, u = '';                   // se salta el inicializador hasta la «,» o el «;» de profundidad 0
            while (k < n) {
              const ch = t[k];
              if ('([{'.includes(ch)) p++;
              else if (')]}'.includes(ch)) { if (p === 0) break; p--; }
              else if (p === 0 && (ch === ',' || ch === ';')) break;
              else if (p === 0 && ch === '\n') {
                let q = k + 1; while (q < n && /\s/.test(t[q])) q++;
                if (!PREV_CONTINUA.includes(u) && u !== '' && !'.?:([=+-*/%&|,'.includes(t[q] || ';')) break;
              }
              if (!/\s/.test(ch)) u = ch;
              k++;
            }
            if (t[k] === ',') { k++; continue; }
            break;
          }
        }
      }
      ultimo = pal[pal.length - 1]; hayNl = false; i = j; continue;
    }
    if ('([{'.includes(c)) prof++;
    else if (')]}'.includes(c)) prof = Math.max(0, prof - 1);
    ultimo = c; hayNl = false; i++;
  }
  return res;
}

/**
 * Cruza los scripts: nombres repetidos entre archivos y nombres que son del navegador.
 * @param {{archivo:string, src:string}[]} scripts  en el orden en que los carga index.html
 * @param {{permitidos?: string[]}} [opciones]  nombres repetidos a propósito (cada uno con su porqué en quien llama)
 */
export function analiza(scripts, opciones = {}) {
  const permitidos = new Set(opciones.permitidos || []);
  const porNombre = new Map(), repetidos = [], delNavegador = [];
  for (const { archivo, src } of scripts) {
    for (const d of declaraciones(src)) {
      const lista = porNombre.get(d.nombre) || porNombre.set(d.nombre, []).get(d.nombre);
      lista.push({ archivo, linea: d.linea, tipo: d.tipo });
      if (NOMBRES_DEL_NAVEGADOR.has(d.nombre) && !permitidos.has(d.nombre)) delNavegador.push({ nombre: d.nombre, archivo, linea: d.linea, tipo: d.tipo });
    }
  }
  for (const [nombre, sitios] of porNombre) {
    if (sitios.length < 2 || permitidos.has(nombre)) continue;
    /* la gravedad: cualquier const/let/class repetida deja un archivo sin cargar; si solo son function/var, el segundo pisa al primero */
    const rompe = sitios.some(s => s.tipo === 'const' || s.tipo === 'let' || s.tipo === 'class');
    repetidos.push({ nombre, sitios, efecto: rompe ? 'un archivo no carga' : 'el segundo pisa al primero sin avisar' });
  }
  return { total: [...porNombre.values()].reduce((a, v) => a + v.length, 0), nombres: porNombre.size, repetidos, delNavegador };
}
