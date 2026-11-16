/* Herramientas de pixel art para los generadores de arte (sin dependencias: solo Node).
   - PNG: codificar y decodificar RGBA de 8 bits.
   - Lienzo: un «pincel» de píxeles con primitivas, mapas ASCII y contorno automático.
   Los píxeles son cadenas '#rrggbb' o null (transparente). */
import { deflateSync, inflateSync } from 'node:zlib';

const crcTabla = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc = b => { let c = 0xffffffff; for (const x of b) c = crcTabla[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const trozo = (tipo, datos) => { const l = Buffer.alloc(4); l.writeUInt32BE(datos.length); const t = Buffer.from(tipo), cuerpo = Buffer.concat([t, datos]), c = Buffer.alloc(4); c.writeUInt32BE(crc(cuerpo)); return Buffer.concat([l, cuerpo, c]); };

/** rgba: Uint8Array w*h*4 → Buffer PNG */
export function codificarPNG(w, h, rgba) {
  const cab = Buffer.alloc(13); cab.writeUInt32BE(w, 0); cab.writeUInt32BE(h, 4); cab[8] = 8; cab[9] = 6;
  const crudo = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { crudo[y * (w * 4 + 1)] = 0; Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(crudo, y * (w * 4 + 1) + 1); }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), trozo('IHDR', cab), trozo('IDAT', deflateSync(crudo, { level: 9 })), trozo('IEND', Buffer.alloc(0))]);
}

/** Buffer PNG (RGBA 8 bits, sin entrelazar) → {w,h,rgba} */
export function decodificarPNG(buf) {
  let p = 8, w = 0, h = 0, idat = [];
  while (p < buf.length) { const l = buf.readUInt32BE(p), t = buf.toString('latin1', p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + l); p += 12 + l;
    if (t === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); if (d[8] !== 8 || d[9] !== 6 || d[12] !== 0) throw new Error('solo RGBA de 8 bits sin entrelazar'); }
    if (t === 'IDAT') idat.push(d); }
  const crudo = inflateSync(Buffer.concat(idat)), out = new Uint8Array(w * h * 4), fila = w * 4;
  for (let y = 0; y < h; y++) { const f = crudo[y * (fila + 1)], o = y * fila, s = y * (fila + 1) + 1;
    for (let i = 0; i < fila; i++) { const a = i >= 4 ? out[o + i - 4] : 0, b = y ? out[o - fila + i] : 0, c = i >= 4 && y ? out[o - fila + i - 4] : 0; let v = crudo[s + i];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1; else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      out[o + i] = v & 255; } }
  return { w, h, rgba: out };
}

export const hex = (r, g, b) => '#' + [r, g, b].map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
export const rgbDe = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

export class Lienzo {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Array(w * h).fill(null); }
  dentro(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  get(x, y) { return this.dentro(x, y) ? this.d[y * this.w + x] : null; }
  p(x, y, c) { if (this.dentro(x, y)) this.d[y * this.w + x] = c; return this; }
  /** pinta solo si lo que hay cumple el filtro (por ejemplo, solo sobre la piel) */
  sobre(x, y, c, ok) { if (this.dentro(x, y) && ok(this.d[y * this.w + x])) this.d[y * this.w + x] = c; return this; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.p(x + i, y + j, c); return this; }
  /** relleno de polígono por filas (par-impar), con los píxeles cuyo centro cae dentro */
  poli(pts, c) {
    const ys = pts.map(q => q[1]), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
    for (let y = y0; y <= y1; y++) { const yc = y + .5, xs = [];
      for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + (yc - ay) / (by - ay) * (bx - ax)); }
      xs.sort((a, b) => a - b); for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.ceil(xs[k] - .5); x <= Math.floor(xs[k + 1] - .5); x++) this.p(x, y, c); }
    return this;
  }
  elipse(cx, cy, rx, ry, c) { for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) if (((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2 <= 1) this.p(x, y, c); return this; }
  linea(x0, y0, x1, y1, c) { x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy; for (;;) { this.p(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } return this; }
  /** mapa ASCII: '.' o ' ' = no tocar; cada letra se busca en la leyenda. espejo=true lo vuelca de izquierda a derecha */
  mapa(x, y, filas, leyenda, espejo = false) {
    const ancho = Math.max(...filas.map(f => f.length));
    filas.forEach((f, j) => { for (let i = 0; i < f.length; i++) { const ch = f[i]; if (ch === '.' || ch === ' ') continue; const c = leyenda[ch]; if (c === undefined) throw new Error(`letra «${ch}» sin color`); this.p(x + (espejo ? ancho - 1 - i : i), y + j, c); } });
    return this;
  }
  /** contorno exterior de 1 px alrededor de lo opaco; el color puede depender del vecino opaco que lo toca */
  contorno(colorDe) {
    const nuevo = this.d.slice();
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { if (this.d[y * this.w + x]) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const v = this.get(x + dx, y + dy); if (v) { const c = colorDe(v, x, y); if (c) nuevo[y * this.w + x] = c; break; } } }
    this.d = nuevo; return this;
  }
  copia() { const l = new Lienzo(this.w, this.h); l.d = this.d.slice(); return l; }
  /** pega otro lienzo (lo opaco manda) en x,y */
  pega(o, x = 0, y = 0) { for (let j = 0; j < o.h; j++) for (let i = 0; i < o.w; i++) { const c = o.d[j * o.w + i]; if (c) this.p(x + i, y + j, c); } return this; }
  aRGBA(esc = 1, fondo = null) {
    const W = this.w * esc, H = this.h * esc, out = new Uint8Array(W * H * 4), f = fondo ? rgbDe(fondo) : null;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = this.d[Math.floor(y / esc) * this.w + Math.floor(x / esc)], o = (y * W + x) * 4;
      if (c) { const [r, g, b] = rgbDe(c); out[o] = r; out[o + 1] = g; out[o + 2] = b; out[o + 3] = 255; } else if (f) { out[o] = f[0]; out[o + 1] = f[1]; out[o + 2] = f[2]; out[o + 3] = 255; } }
    return { w: W, h: H, rgba: out };
  }
}

/** Hoja de contacto: lienzos en cuadrícula, ampliados sin suavizar, sobre fondo oscuro. */
export function hoja(lienzos, { cols = 5, esc = 6, margen = 6, fondo = '#0b0e22' } = {}) {
  const cw = Math.max(...lienzos.map(l => l.w)) * esc + margen, ch = Math.max(...lienzos.map(l => l.h)) * esc + margen;
  const filas = Math.ceil(lienzos.length / cols), W = cols * cw + margen, H = filas * ch + margen, out = new Uint8Array(W * H * 4), f = rgbDe(fondo);
  for (let i = 0; i < W * H; i++) { out[i * 4] = f[0]; out[i * 4 + 1] = f[1]; out[i * 4 + 2] = f[2]; out[i * 4 + 3] = 255; }
  lienzos.forEach((l, k) => { const ox = margen + (k % cols) * cw, oy = margen + Math.floor(k / cols) * ch, r = l.aRGBA(esc);
    for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) { const s = (y * r.w + x) * 4; if (r.rgba[s + 3]) { const o = ((oy + y) * W + ox + x) * 4; out[o] = r.rgba[s]; out[o + 1] = r.rgba[s + 1]; out[o + 2] = r.rgba[s + 2]; } } });
  return { w: W, h: H, rgba: out };
}
