/* Carga el juego en un contexto aislado para poder probarlo fuera del navegador.

   El juego usa <script> clásicos, no módulos: las funciones viven en el ámbito
   global de la página. Aquí se recrea ese ámbito con node:vm y unos pocos
   sustitutos del navegador, para NO tener que convertir el juego a módulos —
   sigue abriéndose con doble clic, que es la gracia del proyecto. */
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

/* Sustituto de localStorage: un objeto en memoria, uno por partida. */
function almacen(inicial = {}) {
  const datos = { ...inicial };
  return {
    getItem: k => (k in datos ? datos[k] : null),
    setItem: (k, v) => { datos[k] = String(v); },
    removeItem: k => { delete datos[k]; },
    _datos: datos,
  };
}

/* Devuelve el ámbito global del juego ya cargado.
   guardado: lo que hubiera en localStorage antes de arrancar. */
export function cargarJuego({ guardado = null } = {}) {
  const localStorage = almacen(guardado ? { pa3: JSON.stringify(guardado) } : {});
  const clases = new Set();
  const ctx = createContext({
    localStorage,
    /* aplicarModo() toca el <html>; basta con registrar el cambio */
    document: { documentElement: { classList: {
      toggle: (c, on) => { on ? clases.add(c) : clases.delete(c); },
      contains: c => clases.has(c),
    } } },
    btoa, atob, escape, unescape,
    setTimeout, clearTimeout, setInterval, clearInterval,
    cancelAnimationFrame: () => {},
    console,
    fetch: async () => { throw new Error('las pruebas no deben salir a la red'); },
    AbortController,
  });
  for (const f of ['js/datos.js', 'js/estado.js', 'js/ranking.js'])
    runInContext(readFileSync(join(RAIZ, f), 'utf8'), ctx, { filename: f });

  /* Los `let`/`const` de nivel superior de un script viven en el ámbito léxico
     global, no como propiedades del objeto global (igual que entre <script> en
     el navegador). Por eso no basta con leer ctx.S: hay que asomarse desde
     dentro. Se usan captadores para que S siga vivo tras un importarCodigo,
     que la reasigna. */
  const api = runInContext(`({
    get S(){ return S }, set S(v){ S = v },
    get TOT_DIAS(){ return TOT_DIAS },
    get DEF(){ return DEF },
    RANGOS, DIFS, NIVELES, TXT, RANKING,
    exportarCodigo, importarCodigo, sumaCod,
    rangoDe, rangoNom, maxVidas, facTiempo, facPts, facJefe,
    progreso, totalStars, esc, guardar,
  })`, ctx);

  /* fetch sí es propiedad del objeto global, así que las pruebas pueden
     sustituirlo con  v.fetch = ...  para no salir a la red. */
  Object.defineProperty(api, 'fetch', {
    get: () => ctx.fetch,
    set: f => { ctx.fetch = f; },
  });
  api._clases = clases;
  api._localStorage = localStorage;
  return api;
}
