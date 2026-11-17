/* Genera js/gato-arte.js: los sprites del gato de oficina (acompañante independiente, v40.11).
   El gato no se voltea ni se recorta de otro dibujo: se construye con partes (cuerpo, pecho, cabeza, hocico, orejas, patas, cola) en tres
   dimensiones y se proyecta desde la cámara del juego (vista desde arriba, ~35°) en cada una de las 8 orientaciones (S, SE, E, NE, N,
   NO, O, SO), así cada vista tiene su propia luz (arriba a la izquierda), su cara solo cuando se ve y su cola del lado que toca.
   Estados: reposo (sentado, 4 posiciones de la cola, con y sin parpadeo) y caminata (4 cuadros). Cero dependencias.
   Uso: node scripts/build-gato.mjs */
import { writeFileSync } from 'node:fs';

const RAIZ = new URL('../', import.meta.url);
export const PALETA = { K: '#2a150d', O: '#e99443', o: '#c06a26', L: '#f7b765', W: '#ffe5bd', w: '#dcb987', E: '#101326', e: '#ffffff', N: '#e97a8b', n: '#b9566a' };
const W = 26, H = 22, AX = 13, AY = 20;       // celda, y ancla: el centro de las patas
const PITCH = 35 * Math.PI / 180, ESC = 1.25;  // cámara y tamaño (unidades → píxeles)
const DIRS = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]].map(([x, y]) => { const n = Math.hypot(x, y); return [x / n, y / n]; });
const LUZ = (() => { const v = [-0.5, -0.45, 0.75], n = Math.hypot(...v); return v.map(a => a / n); })();

/* una parte: elipsoide de centro c y radios r (en unidades del gato: X derecha, Y adelante, Z arriba); etiqueta de color */
const el = (c, r, tag, extra = {}) => ({ c, r, tag, ...extra });

function cola(pts, r0, r1, tag = 'tail') {
  const out = [];
  pts.forEach((p, i) => out.push(el(p, [r0 + (r1 - r0) * i / (pts.length - 1), r0 + (r1 - r0) * i / (pts.length - 1), r0 + (r1 - r0) * i / (pts.length - 1)], tag, { i })));
  // rellena entre puntos para que no queden huecos
  const rel = [];
  for (let i = 1; i < pts.length; i++) for (let k = 1; k < 3; k++) { const t = k / 3, q = pts[i - 1].map((v, j) => v + (pts[i][j] - v) * t), rr = r0 + (r1 - r0) * (i - 1 + t) / (pts.length - 1); rel.push(el(q, [rr, rr, rr], tag, { i: i - 1 + t })); }
  return [...out, ...rel];
}

/* el gato de pie (caminata): fase 0..3 */
function caminando(fase, ojos = true) {
  const f = fase * Math.PI / 2, a = Math.sin(f), b = Math.sin(f + Math.PI);                        // las patas en diagonal van en oposición
  const bob = Math.abs(Math.cos(f)) * 0.5, P = [];
  P.push(el([0, 0, 5.4 + bob], [2.6, 4.6, 2.5], 'cuerpo'));
  P.push(el([0, 3.0, 4.4 + bob], [1.7, 1.7, 1.9], 'pecho'));
  const h = 8.2 + bob;
  P.push(el([0, 5.1, h], [2.7, 2.4, 2.4], 'cabeza'));
  P.push(el([0, 7.0, h - 0.6], [1.3, 1.1, 1.0], 'hocico'));
  P.push(el([-1.7, 4.6, h + 2.1], [0.95, 0.6, 1.35], 'oreja'), el([1.7, 4.6, h + 2.1], [0.95, 0.6, 1.35], 'oreja'));
  P.push(el([-1.7, 4.9, h + 1.9], [0.45, 0.3, 0.8], 'oreja-i'), el([1.7, 4.9, h + 1.9], [0.45, 0.3, 0.8], 'oreja-i'));
  // patas: delantera izq. + trasera dcha. juntas (a), delantera dcha. + trasera izq. (b)
  const pata = (x, y, fase2) => { const l = Math.max(0, fase2) * 1.2; return [el([x, y + fase2 * 1.7, 2.6 + l], [0.95, 0.95, 2.6 - l * 0.4], 'pata'), el([x, y + fase2 * 1.7 + 0.1, 0.9 + l], [1.0, 1.1, 0.9], 'pie')]; };
  P.push(...pata(-1.5, 2.9, a), ...pata(1.5, 2.9, b), ...pata(-1.6, -2.9, b), ...pata(1.6, -2.9, a));
  const s = 2.4 * Math.sin(f + 0.6) + 1.2;
  P.push(...cola([[0, -4.4, 6.0 + bob], [0, -5.7, 7.2 + bob], [s * 0.4, -6.2, 9.0 + bob], [s * 0.9, -5.9, 10.8 + bob], [s * 1.4, -5.2, 12.0 + bob]], 0.95, 0.75));
  return { P, h, ojos, cara: { y: 5.1, h, ry: 2.4 } };
}
/* el gato sentado (reposo): cola con 4 posiciones */
function sentado(fase, ojos = true) {
  const P = [], lev = [0, 0.5, 1.1, 0.5][fase], bal = [0, 0.7, 1.2, 0.7][fase];
  P.push(el([0, -1.6, 2.7], [3.0, 3.2, 2.7], 'cuerpo'));                       // ancas
  P.push(el([0, 0.4, 5.8], [2.4, 2.3, 3.5], 'cuerpo'));                        // torso erguido
  P.push(el([0, 1.8, 4.2], [1.6, 1.4, 2.4], 'pecho'));
  const h = 10.4;
  P.push(el([0, 1.9, h], [2.8, 2.5, 2.5], 'cabeza'));
  P.push(el([0, 3.9, h - 0.6], [1.3, 1.1, 1.0], 'hocico'));
  P.push(el([-1.8, 1.5, h + 2.2], [0.95, 0.6, 1.35], 'oreja'), el([1.8, 1.5, h + 2.2], [0.95, 0.6, 1.35], 'oreja'));
  P.push(el([-1.8, 1.8, h + 2.0], [0.45, 0.3, 0.8], 'oreja-i'), el([1.8, 1.8, h + 2.0], [0.45, 0.3, 0.8], 'oreja-i'));
  P.push(el([-1.3, 2.6, 2.4], [0.9, 0.9, 2.4], 'pata'), el([1.3, 2.6, 2.4], [0.9, 0.9, 2.4], 'pata'));
  P.push(el([-1.3, 2.9, 0.9], [1.0, 1.2, 0.9], 'pie'), el([1.3, 2.9, 0.9], [1.0, 1.2, 0.9], 'pie'));
  P.push(el([-3.2, -1.2, 1.2], [0.9, 2.0, 1.0], 'pata'), el([3.2, -1.2, 1.2], [0.9, 2.0, 1.0], 'pata'));   // patas traseras dobladas a los lados
  P.push(...cola([[-1.6, -4.4, 1.2], [-3.6, -3.4, 1.0], [-4.3, -0.8, 0.9], [-3.5, 1.8, 0.9], [-2.0, 3.4 + bal * 0.3, 0.9 + lev * 0.4], [-0.6, 3.9, 1.0 + lev]], 0.95, 0.75));
  return { P, h, ojos, cara: { y: 1.9, h, ry: 2.5 } };
}

/* proyección y relleno */
function dibuja(modelo, dir) {
  const [fx, fy] = DIRS[dir], rx = fy, ry = -fx;                                // «derecha» del gato en el mundo (x este, y norte)
  const cp = Math.cos(PITCH), sp = Math.sin(PITCH);
  const aMundo = ([x, y, z]) => [x * rx + y * fx, x * ry + y * fy, z];
  const buf = new Map();                                                      // píxel → {cerca, tag, n}
  const poner = (px, py, cerca, tag, n, extra) => { const k = py * 100 + px; const b = buf.get(k); if (!b || cerca > b.cerca) buf.set(k, { cerca, tag, n, ...extra }); };
  for (const p of modelo.P) {
    const [cx, cy, cz] = p.c, [ax, ay, az] = p.r, paso = 0.4;
    for (let x = -ax; x <= ax; x += paso) for (let y = -ay; y <= ay; y += paso) for (let z = -az; z <= az; z += paso) {
      const u = x / ax, v = y / ay, w = z / az, d2 = u * u + v * v + w * w;
      if (d2 > 1) continue;
      const loc = [cx + x, cy + y, cz + z], [wx, wy, wz] = aMundo(loc);
      const px = Math.round(AX + wx * ESC), py = Math.round(AY - (wz * cp + wy * sp) * ESC);
      const cerca = -wy * cp + wz * sp + (d2 > 0.8 ? 0.05 : 0);
      const nl = aMundo([u / ax, v / ay, w / az]), nn = Math.hypot(...nl) || 1;
      const lam = (nl[0] * LUZ[0] + nl[1] * LUZ[1] + nl[2] * LUZ[2]) / nn;
      poner(px, py, cerca, p.tag, lam, { loc, p });
    }
  }
  // cara: solo donde la cabeza mira al espectador
  const cara = modelo.cara, hc = [0, cara.y, cara.h];
  const mundoDe = l => aMundo(l);
  const carita = (loc, tag, tam) => {
    const [wx, wy, wz] = mundoDe(loc), px = Math.round(AX + wx * ESC), py = Math.round(AY - (wz * cp + wy * sp) * ESC), cerca = -wy * cp + wz * sp + 0.2;
    const b = buf.get(py * 100 + px);
    // visible si el frente de la cabeza mira hacia la cámara (la normal del punto en el mundo apunta a -y)
    const n = aMundo([loc[0] - hc[0], loc[1] - hc[1], loc[2] - hc[2]]);
    if (n[1] < -0.35 || (n[1] < 0.05 && Math.abs(n[0]) > 1.4 && n[0] * 0 === 0 && n[1] < -0.05)) { poner(px, py, cerca + (tag === 'ojo' ? 1.5 : 1), tag, 0.5, {}); return true; }
    return false;
  };
  if (modelo.ojos) {
    // el brillo primero y la pupila encima: si en una vista de 3/4 caen en el mismo píxel gana la pupila oscura
    for (const sx of [-1, 1]) carita([sx * 1.25, cara.y + 2.3, cara.h + 1.35], 'brillo', 1);
    for (const sx of [-1, 1]) carita([sx * 1.25, cara.y + 2.3, cara.h + 0.6], 'ojo', 1);
  } else for (const sx of [-1, 1]) { carita([sx * 1.55, cara.y + 2.25, cara.h + 0.55], 'ojo', 1); carita([sx * 1.0, cara.y + 2.35, cara.h + 0.55], 'ojo', 1); }
  carita([0, cara.y + 3.4, cara.h - 0.7], 'nariz', 1);
  // salida
  const filas = [];
  for (let y = 0; y < H; y++) { let t = ''; for (let x = 0; x < W; x++) t += '.'; filas.push([...t]); }
  const col = (b) => {
    const t = b.tag, l = b.n;
    const sombra = l < 0.05, luz = l > 0.62;
    switch (t) {
      case 'ojo': return 'E'; case 'brillo': return 'e'; case 'nariz': return 'N';
      case 'pecho': case 'hocico': case 'pie': return sombra ? 'w' : 'W';
      case 'oreja-i': return l < -0.25 ? 'n' : 'N';
      default: {
        // rayas de tigre: bandas oscuras a lo largo del lomo y de la cola
        let raya = false;
        if (t === 'cuerpo') raya = Math.floor((b.loc[1] + 20) / 1.7) % 2 === 0 && b.loc[2] > 4.6;
        if (t === 'cola' || t === 'tail') raya = (Math.floor(b.p.i ?? 0) % 2) === 1;
        if (t === 'cabeza') raya = b.loc[2] > b.p.c[2] + 1.45 && Math.abs(b.loc[0]) < 1.5 && Math.floor((b.loc[0] + 5) / 0.9) % 2 === 0;
        if (t === 'pata') raya = Math.floor((b.loc[2]) / 1.3) % 2 === 1 && b.loc[2] > 1.2;
        return raya ? 'o' : sombra ? 'o' : luz ? 'L' : 'O';
      }
    }
  };
  for (const [k, b] of buf) { const py = Math.floor(k / 100), px = k % 100; if (px >= 0 && px < W && py >= 0 && py < H) filas[py][px] = col(b); }
  // contorno
  const lleno = (x, y) => x >= 0 && x < W && y >= 0 && y < H && filas[y][x] !== '.';
  const sal = filas.map(f => [...f]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (filas[y][x] === '.' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => lleno(x + dx, y + dy))) sal[y][x] = 'K';
  return sal.map(f => f.join(''));
}

export function datos() {
  const out = { version: 1, w: W, h: H, ax: AX, ay: AY, paleta: PALETA, reposo: [], reposoParpadeo: [], camina: [] };
  for (let d = 0; d < 8; d++) {
    out.reposo.push([0, 1, 2, 3].map(f => dibuja(sentado(f, true), d)));
    out.reposoParpadeo.push([0, 1, 2, 3].map(f => dibuja(sentado(f, false), d)));
    out.camina.push([0, 1, 2, 3].map(f => dibuja(caminando(f, true), d)));
  }
  return out;
}
export function generaJS() {
  const d = datos(), rle = f => f.map(r => r.replace(/\.+$/, '')).join('/');       // filas separadas por «/», sin los puntos finales
  const lista = a => '[' + a.map(dir => '[' + dir.map(f => JSON.stringify(rle(f))).join(',') + ']').join(',\n  ') + ']';
  return '/* GENERADO por scripts/build-gato.mjs: no editar a mano. Sprites del gato de oficina (acompañante independiente, v40.11). */\n' +
    `const ARTE_GATO={version:1,w:${d.w},h:${d.h},ax:${d.ax},ay:${d.ay},paleta:${JSON.stringify(d.paleta)},\n reposo:${lista(d.reposo)},\n reposoParpadeo:${lista(d.reposoParpadeo)},\n camina:${lista(d.camina)}};\n`;
}
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const js = generaJS(); writeFileSync(new URL('js/gato-arte.js', RAIZ), js); console.log('js/gato-arte.js', (js.length / 1024).toFixed(1), 'KB');
}
