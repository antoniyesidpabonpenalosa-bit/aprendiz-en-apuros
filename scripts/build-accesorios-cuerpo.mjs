/* Genera js/accesorios-cuerpo-arte.js: la GORRA a medida de cada cuadro de los atlas de 44×74 (v40.8).
   La gorra no es una pieza suelta que se coloca encima: la copa se calcula a partir de la silueta real de la cabeza de cada
   celda (cada dirección, cada cuadro de marcha y cada pose de portada de las dos apariencias), así abraza el pelo y no flota.
   La visera, la banda trasera y las costuras salen de una descripción por dirección: de frente, 3/4, perfil y espalda,
   cada una con su propia forma (sin voltear arte). Cero dependencias. Uso: node scripts/build-accesorios-cuerpo.mjs  */
import { readFileSync, writeFileSync } from 'node:fs';
import { decodificarPNG } from './lib-pixel.mjs';

const RAIZ = new URL('../', import.meta.url);
const atlas = f => decodificarPNG(readFileSync(new URL('img/' + f, RAIZ)));
const ATLAS = {
  masculina: { caminar: atlas('aprendiz-masculino-premium-caminar.png'), portada: atlas('aprendiz-masculino-premium-portada.png') },
  femenina: { caminar: atlas('aprendiz-femenina-caminar.png'), portada: atlas('aprendiz-femenina-portada.png') },
};
/* paleta de la gorra (la misma gama que el dibujo anterior y que la gorra de los retratos) */
export const PALETA = { O: '#101326', B: '#4678c2', D: '#27477e', L: '#78a7e2', H: '#b4d6f4', U: '#1b3563', T: '#5f93dc', S: '#3a67a8', Z: 'rgba(16,19,38,0.38)' };
const FW = 44;

/* por dirección (S, SE, E, NE, N, NO, O, SO): s = lado hacia el que mira (+1 derecha), visera visible o solo la punta, caída
   de la banda trasera respecto al borde delantero */
const DIR = [
  { s: 0, vis: 'frente', caida: 0 }, { s: 1, vis: 'tres', caida: 1 }, { s: 1, vis: 'perfil', caida: 3 }, { s: 1, vis: 'punta', caida: 2 },
  { s: 0, vis: 'espalda', caida: 2 }, { s: -1, vis: 'punta', caida: 2 }, { s: -1, vis: 'perfil', caida: 3 }, { s: -1, vis: 'tres', caida: 1 },
];
/* fila del borde inferior de la copa respecto a lo más alto de la cabeza: 8 filas bajo la coronilla en él, 9 en ella (la visera ocupa las tres siguientes y deja libres las cejas) */
const BAJO = { masculina: 8, femenina: 9 };

function celda(ap, tipo, fila, col, dir) {
  const { w, rgba } = ATLAS[ap][tipo];
  return celdaSil((x, y) => x >= 0 && x < FW && y >= 0 && y < 74 && rgba[((fila * 74 + y) * w + col * FW + x) * 4 + 3] > 0, ap, dir);
}
/* la copa a partir de una silueta (función x,y → ¿hay cabeza?); también sirve para el icono con una cabeza elíptica */
function celdaSil(sil, ap, dir) {
  let cima = 99; for (let y = 0; y < 30 && cima === 99; y++) for (let x = 0; x < FW; x++) if (sil(x, y)) { cima = y; break; }
  const yb0 = cima + BAJO[ap], d = DIR[dir];
  let x0 = 99, x1 = -1; for (let y = yb0 - 3; y <= yb0; y++) for (let x = 0; x < FW; x++) if (sil(x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
  const xc = (x0 + x1) / 2;
  /* borde delantero de la cabeza (para la visera): el extremo hacia el que mira, en la franja de la frente */
  let xf = d.s > 0 ? x1 : d.s < 0 ? x0 : Math.round(xc);
  /* borde inferior de la copa: horizontal de frente; en 3/4, perfil y espalda baja hacia la nuca */
  const delante = d.s >= 0 ? x1 : x0, atras = d.s >= 0 ? x0 : x1;
  const yb = x => {
    if (!d.s) return yb0 + d.caida;
    const t = Math.max(0, Math.min(1, (x - delante) / ((atras - delante) || 1)));
    return yb0 + (d.vis === 'punta' ? 1 : 0) + Math.round(t * (d.caida - (d.vis === 'punta' ? 1 : 0)));
  };
  const M = new Set(), key = (x, y) => y * 100 + x, tiene = (x, y) => M.has(key(x, y));
  const base = new Set();
  for (let y = 0; y < FW; y++) for (let x = 0; x < FW; x++) if (sil(x, y) && y <= yb(x)) base.add(key(x, y));
  for (const k of base) { const x = k % 100, y = (k - x) / 100; for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx >= 0 && nx < FW && ny >= 0 && ny <= yb(nx)) M.add(key(nx, ny)); } }

  /* la gorra tiene grosor: la copa sube sobre el pelo en una curva suave (media elipse; hasta 2 filas, sin salirse de la celda) */
  { const ancho = x1 - x0 + 1, sube = ap === 'femenina' ? 2.4 : 1.4, tops = new Map();
    for (let x = 0; x < FW; x++) for (let y = 0; y < 74; y++) if (M.has(key(x, y))) { tops.set(x, y); break; }
    for (const [x, t] of tops) { const u = (x - xc) / (0.5 * ancho), h = Math.round(sube * Math.sqrt(Math.max(0, 1 - u * u)));
      for (let k = 1; k <= h && t - k >= 0; k++) M.add(key(x, t - k)); } }

  /* visera: filas a continuación del borde delantero de la copa */
  const brim = new Set(), r = (y, a, b) => { for (let x = Math.round(a); x <= Math.round(b); x++) if (x >= 0 && x < FW && y >= 0 && y < 74) brim.add(key(x, y)); };
  const y1 = yb0 + 1;
  const marca = { T: new Set(), U: new Set() };
  const fila3 = (a1, b1, a2, b2, a3, b3) => { r(y1, a1, b1); r(y1 + 1, a2, b2); r(y1 + 2, a3, b3); for (let x = Math.round(a1); x <= Math.round(b1); x++) marca.T.add(key(x, y1)); for (let x = Math.round(a3); x <= Math.round(b3); x++) marca.U.add(key(x, y1 + 2)); };
  if (d.vis === 'frente') fila3(xc - 9, xc + 9, xc - 8, xc + 8, xc - 6, xc + 6);
  else if (d.vis === 'tres') { const s = d.s, c = xc + s * 3; fila3(...(s > 0 ? [c - 7, c + 10, c - 6, c + 9, c - 3, c + 6] : [c - 10, c + 7, c - 9, c + 6, c - 6, c + 3])); }
  else if (d.vis === 'perfil') { const s = d.s; fila3(...(s > 0 ? [xf - 9, xf + 6, xf - 9, xf + 5, xf - 7, xf + 3] : [xf - 6, xf + 9, xf - 5, xf + 9, xf - 3, xf + 7])); }
  else if (d.vis === 'punta') { const s = d.s; if (s > 0) { r(y1, xf - 1, xf + 2); r(y1 + 1, xf - 1, xf + 2); marca.T.add(key(xf, y1)); marca.U.add(key(xf + 1, y1 + 1)); } else { r(y1, xf - 2, xf + 1); r(y1 + 1, xf - 2, xf + 1); marca.T.add(key(xf, y1)); marca.U.add(key(xf - 1, y1 + 1)); } }
  /* sombra que la visera proyecta sobre la frente (translúcida; no forma parte del contorno) */
  const sombra = new Set(), sr = (a, b) => { for (let x = Math.round(a); x <= Math.round(b); x++) sombra.add(key(x, y1 + 3)); };
  if (d.vis === 'frente') sr(xc - 6, xc + 6);
  else if (d.vis === 'tres') { const c = xc + d.s * 3; sr(c - 5, c + 6); }
  else if (d.vis === 'perfil') { if (d.s > 0) sr(xf - 4, xf + 2); else sr(xf - 2, xf + 4); }
  /* correa de ajuste en la espalda: asoma bajo la banda, al centro */
  const correa = new Set();
  if (d.vis === 'espalda') for (let x = Math.round(xc) - 3; x <= Math.round(xc) + 3; x++) correa.add(key(x, yb(x) + 1));
  const U = new Set([...M, ...brim, ...correa]);
  const dentro = (x, y) => U.has(key(x, y));

  /* trazado: contorno oscuro, relleno con luz arriba a la izquierda, costura central, botón, banda trasera */
  let ya = 99, yz = -1, xa = 99, xz = -1;
  for (const k of M) { const x = k % 100, y = (k - x) / 100; ya = Math.min(ya, y); yz = Math.max(yz, y); xa = Math.min(xa, x); xz = Math.max(xz, x); }
  const hw = (xz - xa) / 2 || 1, hh = (yz - ya) || 1, cx = (xa + xz) / 2;
  const salida = new Map();
  for (const k of U) {
    const x = k % 100, y = (k - x) / 100;
    const borde = ![[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => dentro(x + dx, y + dy));
    let c;
    if (borde) c = 'O';
    else if (brim.has(k) && !M.has(k)) c = marca.T.has(k) ? 'T' : marca.U.has(k) ? 'U' : 'B';
    else if (correa.has(k)) c = 'L';
    else {
      const nx = (x - cx) / hw, t = (y - ya) / hh;
      let arriba = 0; for (let yy = y - 1; yy >= 0 && M.has(key(x, yy)); yy--) arriba++;      // filas de copa por encima
      let izq = 0; for (let xx = x - 1; xx >= 0 && M.has(key(xx, y)); xx--) izq++;             // y a la izquierda
      c = (arriba <= 1 && nx < 0.55) || (izq <= 1 && t < 0.75) ? 'L' : (nx > 0.5 && t > 0.2) || (nx > 0.2 && t > 0.62) ? 'D' : 'B';
    }
    salida.set(k, c);
  }
  /* banda trasera / borde inferior: una fila más oscura sobre el borde inferior donde no hay visera */
  const banda = (x, y) => y >= yb(x) - 1 && !brim.has(key(x, y + 1)) && !brim.has(key(x, y)) && salida.get(key(x, y)) && salida.get(key(x, y)) !== 'O';
  for (const k of M) { const x = k % 100, y = (k - x) / 100; if (banda(x, y)) salida.set(k, d.vis === 'espalda' || d.vis === 'punta' ? 'S' : 'D'); }
  /* costuras de los paneles (arcos que se abren hacia abajo, según la perspectiva de cada dirección) y botón */
  const xs = Math.round(xc + d.s * (d.vis === 'perfil' ? 2 : d.vis === 'tres' || d.vis === 'punta' ? 3 : 0));
  const pon = (x, y, c) => { const k = key(x, y); if (M.has(k) && salida.get(k) && salida.get(k) !== 'O' && !brim.has(k)) salida.set(k, c); };
  for (let y = ya + 3; y < yb(xs) - 1; y++) {
    const o = Math.round(hw * 0.5 * Math.sqrt((y - ya) / hh));
    pon(xs, y, 'S');
    if (d.vis === 'perfil') pon(xs - d.s * o, y, 'S');
    else if (d.vis !== 'espalda' || true) { const f = d.s === 0 ? 1 : 0.55; if (d.s <= 0) pon(xs - Math.round(o * (d.s < 0 ? 1 : 1)), y, 'S'); if (d.s >= 0) pon(xs + Math.round(o * (d.s > 0 ? 1 : 1)), y, 'S'); if (d.s > 0) pon(xs - Math.round(o * f), y, 'S'); if (d.s < 0) pon(xs + Math.round(o * f), y, 'S'); }
  }
  const bx = xs;
  for (let y = ya + 1; y < ya + 3; y++) if (salida.get(key(bx, y)) && salida.get(key(bx, y)) !== 'O') { salida.set(key(bx, y), 'H'); if (salida.get(key(bx + 1, y)) && salida.get(key(bx + 1, y)) !== 'O') salida.set(key(bx + 1, y), 'L'); if (salida.get(key(bx, y + 1)) === 'B') salida.set(key(bx, y + 1), 'L'); break; }
  for (const k of sombra) if (!salida.has(k) && sil((k % 100), (k - (k % 100)) / 100)) salida.set(k, 'Z');
  /* serializa: filas [y, x0, texto] */
  let miny = 99, maxy = -1; for (const k of salida.keys()) { const y = (k - (k % 100)) / 100; miny = Math.min(miny, y); maxy = Math.max(maxy, y); }
  const filas = [];
  for (let y = miny; y <= maxy; y++) {
    let a = 99, b = -1; for (let x = 0; x < FW; x++) if (salida.has(key(x, y))) { a = Math.min(a, x); b = Math.max(b, x); }
    if (b < 0) continue;
    let t = ''; for (let x = a; x <= b; x++) t += salida.get(key(x, y)) || '.';
    filas.push([y, a, t]);
  }
  return filas;
}

/* icono de 32×32 de la tienda: la misma gorra de perfil sobre una cabeza elíptica pequeña (así coincide con la del cuerpo) */
function iconoGorra() {
  const sil = (x, y) => { const u = (x - 14) / 11.5, v = (y - 16.5) / 15.5; return u * u + v * v <= 1; };
  return celdaSil(sil, 'masculina', 2);
}
export function datos() {
  const out = { version: 1, paleta: PALETA, icono: { gorra: iconoGorra() }, gorra: { masculina: { caminar: {}, portada: {} }, femenina: { caminar: {}, portada: {} } } };
  for (const ap of ['masculina', 'femenina']) {
    const cuadros = ap === 'masculina' ? [0] : [1, 2, 3];       // la cabeza masculina es idéntica en los 4 cuadros; el cuadro 0 femenino es el 2
    for (let dir = 0; dir < 8; dir++) for (const c of cuadros) (out.gorra[ap].caminar[dir] ||= {})[c] = celda(ap, 'caminar', dir, c, dir);
    for (let p = 0; p < 4; p++) out.gorra[ap].portada[p] = celda(ap, 'portada', 0, p, 0);
  }
  return out;
}
export function generaJS() {
  const d = datos();
  const filasJS = f => '[' + f.map(([y, x, t]) => `[${y},${x},'${t}']`).join(',') + ']';
  const cuerpo = Object.entries(d.gorra).map(([ap, g]) => {
    const cam = Object.entries(g.caminar).map(([dir, cs]) => `${dir}:{${Object.entries(cs).map(([c, f]) => `${c}:${filasJS(f)}`).join(',')}}`).join(',\n    ');
    const por = Object.entries(g.portada).map(([p, f]) => `${p}:${filasJS(f)}`).join(',\n    ');
    return `  ${ap}:{caminar:{\n    ${cam}},\n   portada:{\n    ${por}}}`;
  }).join(',\n');
  return '/* GENERADO por scripts/build-accesorios-cuerpo.mjs: no editar a mano. Gorra a medida de cada celda de los atlas (v40.8). */\n' +
    "const ARTE_ACC_CUERPO={version:1,paleta:" + JSON.stringify(d.paleta) + ",\n icono:{gorra:" + filasJS(d.icono.gorra) + "},\n gorra:{\n" + cuerpo + "}};\n";
}
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const js = generaJS(); writeFileSync(new URL('js/accesorios-cuerpo-arte.js', RAIZ), js);
  console.log('js/accesorios-cuerpo-arte.js', (js.length / 1024).toFixed(1), 'KB');
}
