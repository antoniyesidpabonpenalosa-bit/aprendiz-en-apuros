/* Los nueve accesorios sobre los retratos (16, 32 y 48), dibujados en la rejilla de cada tamaño.
   Usan los MISMOS colores que el cuerpo (ACC_ARTE en js/sprite.js); test/retratos-protagonistas.test.mjs
   comprueba que no se separen. Devuelven dos capas: `detras` (va bajo la cara) y `encima`.
   Las coordenadas están en «espacio 48» y se rasterizan a la resolución de cada tamaño; lo pequeño
   (gafas, gato, taza) se dibuja a mano en cada tamaño. */
import { Lienzo } from './lib-pixel.mjs';
import { datos as datosGato, PALETA as PALETA_GATO } from './build-gato.mjs';

export const COL = {
  oscuro: '#101326', oro: '#ffcf3f', luz: '#fff0a1', sombra: '#ad6a22', azul: '#4678c2', azulOsc: '#27477e', azulLuz: '#78a7e2', azulLogo: '#91c9f4',
  acero: '#a9c4e7', cian: '#6fd2f0', rojo: '#b91d46', rojoLuz: '#ff5468', rojoOsc: '#842037', capa: '#9c183e', capaLuz: '#ed4763', capaOsc: '#641736',
  taza: '#d9a66d', tazaLuz: '#ffead0', tazaSombra: '#9c623d', cafe: '#5a2e1c', vapor: '#cfe6f2', gema: '#e43f72', gemaLuz: '#ff9cb5', lente: '#d6f8ff', cinta: '#486291',
  /* la gorra del cuerpo (v40.8): costuras, cara superior de la visera y su cara de abajo */
  azulCosido: '#3a67a8', azulVisera: '#5f93dc', azulBajo: '#1b3563', azulBrillo: '#b4d6f4',
  /* el mantón y la corbata del cuerpo (v40.9, v40.8) */
  rojoClaro: '#ff8c99', rojoSombra: '#7a1236', cinta2: '#e05a76', cinta3: '#507bdf',
  /* el gato: pelaje naranja atigrado, hocico crema, contorno marrón oscuro */
  gContorno: '#2a150d', gNaranja: '#e99443', gSombra: '#c06a26', gLuz: '#f7b765', gCrema: '#ffe5bd', gNariz: '#e97a8b', gOjo: '#101326',
};
const K = { 48: 1, 32: 2 / 3, 16: 1 / 3 };
class Esc {
  constructor(P, k, dy = 0) { this.P = P; this.k = k; this.dy = dy; }
  poli(pts, c) { this.P.poli(pts.map(([x, y]) => [x * this.k, (y + this.dy) * this.k]), c); }
  rect(x, y, w, h, c) { this.poli([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], c); }
  elipse(cx, cy, rx, ry, c) { this.P.elipse(cx * this.k, (cy + this.dy) * this.k, rx * this.k, ry * this.k, c); }
  linea(pts, c) { for (let i = 0; i + 1 < pts.length; i++) this.P.linea(pts[i][0] * this.k, (pts[i][1] + this.dy) * this.k, pts[i + 1][0] * this.k, (pts[i + 1][1] + this.dy) * this.k, c); }
}

/* El gato (v40.12): el MISMO gato del acompañante (scripts/build-gato.mjs, reposo de frente), recortado a su silueta. A 48 va entero; a 32 se
   reduce por votación de color (el contorno manda); a 16 es una cabecita con orejas, ojos y hocico dibujada a mano, para que se reconozca. */
const LEY = { ...PALETA_GATO };
function recorta(filas) {
  const f = Array.isArray(filas) ? filas : filas.split('/'); let x0 = 99, x1 = -1, y0 = 99, y1 = -1;
  f.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } }));
  return f.slice(y0, y1 + 1).map(r => r.padEnd(x1 + 1, '.').slice(x0, x1 + 1));
}
function reduce(m, w2, h2) {
  const h = m.length, w = m[0].length, out = [];
  for (let j = 0; j < h2; j++) { let fila = '';
    for (let i = 0; i < w2; i++) {
      const cuenta = {}; let tot = 0, op = 0;
      for (let y = Math.floor(j * h / h2); y < Math.ceil((j + 1) * h / h2); y++) for (let x = Math.floor(i * w / w2); x < Math.ceil((i + 1) * w / w2); x++) { tot++; const ch = m[y][x]; if (ch !== '.') { op++; cuenta[ch] = (cuenta[ch] || 0) + (ch === 'K' ? 1.4 : ch === 'E' ? 2.2 : ch === 'N' ? 1.6 : 1); } }
      if (op / tot < 0.45) { fila += '.'; continue; }
      fila += Object.entries(cuenta).sort((a, b) => b[1] - a[1])[0][0];
    }
    out.push(fila); }
  return out;
}
const GATO_FRENTE = recorta(datosGato().reposo[0][0]);
export const GATO_RETRATO = {
  48: GATO_FRENTE,
  32: reduce(GATO_FRENTE, 9, 11),
  16: ['KK..KK', 'KNKKNK', 'KEOOEK', 'KOWWOK', '.KOOK.', '..KK..'],
};
/* Taza de café (la del cuerpo, v40.10): S vapor, K contorno, b café, h luz, c barro, d sombra. Asa a la izquierda: la sujeta la mano. */
const LEYT = { S: COL.vapor, K: COL.oscuro, b: COL.cafe, h: COL.tazaLuz, c: COL.taza, d: COL.tazaSombra };
export const TAZA_RETRATO = {
  48: ['...S..S....', '...S.......', '...KKKKKKKK', '...KbbbbbbK', '...KhccccdK', '.KKKhccccdK', '.K.KhccccdK', '.K.KhccccdK', '.KKKhccccdK', '...KccccddK', '....KKKKKK.'],
  32: ['..S.S....', '..KKKKKK.', '..KbbbbK.', '.KKhcccdK', '.K.hcccdK', '.KKhcccdK', '..KcccddK', '...KKKKK.'],
  16: ['.KKKK.', 'KbbbbK', 'KhccdK', 'KhcddK', '.KKKK.'],
};
const POS_OBJ = { // dónde van el gato y la taza (esquina inferior derecha del busto)
  gato: { 48: [34, 31], 32: [22, 20], 16: [10, 10] },
  cafe: { 48: [35, 36], 32: [23, 23], 16: [10, 10] },
};

export function accesorio(id, sexo, n) {
  const k = K[n], D = new Lienzo(n, n), P = new Lienzo(n, n), E = new Esc(P, k), ED = new Esc(D, k);
  const fem = sexo === 'femenina';
  switch (id) {
    case 'gafas': {
      /* como las del cuerpo: marco fino con el cristal TRANSPARENTE (se ven los ojos y la expresión), una pizca de brillo, puente y patillas.
         Cada lente rodea el ojo del retrato de su tamaño con un píxel de margen. */
      const f = COL.oscuro, lente = COL.lente;
      const aro = (x, y, w, h, brillo = true, col = f) => { P.rect(x + 1, y, w - 2, 1, col); P.rect(x + 1, y + h - 1, w - 2, 1, col); P.rect(x, y + 1, 1, h - 2, col); P.rect(x + w - 1, y + 1, 1, h - 2, col); if (brillo) P.p(x + 1, y + 1, lente); };
      if (n === 48) { aro(15, 17, 8, 6); aro(25, 17, 8, 6); P.rect(23, 19, 2, 1, f); P.rect(13, 19, 2, 1, f); P.rect(33, 19, 2, 1, f); P.p(12, 20, f); P.p(35, 20, f); }
      if (n === 32) { const m = '#8fd8ee'; aro(9, 11, 6, 6, false, m); aro(17, 11, 6, 6, false, m); P.rect(15, 13, 2, 1, m); P.rect(7, 13, 2, 1, m); P.rect(23, 13, 2, 1, m); }   // a 32 el marco es claro (como a 16) para que los ojos oscuros no se fundan con él
      if (n === 16) { const m = '#7fd8f0'; P.rect(4, 5, 8, 1, m); P.rect(4, 8, 8, 1, m); P.rect(4, 6, 1, 2, m); P.rect(7, 6, 2, 1, m); P.rect(11, 6, 1, 2, m); }   // a 16 el marco es claro para no fundirse con los ojos
      break;
    }
    case 'gorra': {
      /* la del cuerpo: copa con luz arriba a la izquierda, costuras en arco y botón; visera con cara de arriba, cara de abajo y borde. Sube a 32 y 16 para dejar libres las cejas */
      const e = new Esc(P, k, { 48: 0, 32: -2, 16: -3.5 }[n]);
      e.poli([[7.5, 12], [8.5, 7], [12.5, 3.5], [18, 1.2], [24, 0.6], [30, 1.2], [35.5, 3.5], [39.5, 7], [40.5, 12]], COL.oscuro);
      e.poli([[8.8, 11.2], [9.8, 7.2], [13.4, 4.2], [18.6, 2.2], [24, 1.7], [29.4, 2.2], [34.6, 4.2], [38.2, 7.2], [39.2, 11.2]], COL.azul);
      e.poli([[8.8, 11.2], [9.8, 7.2], [13.4, 4.2], [18.6, 2.2], [24, 1.7], [20, 3.4], [15.5, 6], [12.5, 9.5]], COL.azulLuz);
      e.poli([[31, 2.6], [34.6, 4.2], [38.2, 7.2], [39.2, 11.2], [33.5, 11.2], [34.5, 7.4]], COL.azulOsc);
      e.rect(9, 9.8, 30, 1.5, COL.azulOsc);                                                         // banda de abajo, a la sombra de la visera
      e.linea([[24, 2.4], [24, 9.8]], COL.azulCosido); e.linea([[18.2, 2.8], [16.6, 6.5], [16, 9.8]], COL.azulCosido); e.linea([[29.8, 2.8], [31.4, 6.5], [32, 9.8]], COL.azulCosido);
      e.rect(23, 1.2, 2, 1.4, COL.azulBrillo);                                                      // botón
      // visera: borde oscuro, cara de arriba (clara), cara de abajo (oscura)
      e.poli([[5.8, 10], [42.2, 10], [41.2, 12.8], [37.5, 14.4], [24, 15.2], [10.5, 14.4], [6.8, 12.8]], COL.oscuro);
      e.poli([[7, 10.9], [41, 10.9], [40.3, 12.4], [24, 13.2], [7.7, 12.4]], COL.azulVisera);
      e.poli([[8, 12.4], [40, 12.4], [37, 13.7], [24, 14.3], [11, 13.7]], COL.azulBajo);
      break;
    }
    case 'corona': {
      /* la del cuerpo: aro de cuatro filas (luz, oro, oro, sombra) con perlas, cinco puntas triangulares con luz a la izquierda y sombra a la derecha, gema delantera */
      const e = new Esc(P, k, { 48: -2, 32: -2.4, 16: -3 }[n]);
      const punta = (cx, base, h, w) => {
        e.poli([[cx - w / 2 - 0.7, base + 0.5], [cx, base - h - 0.8], [cx + w / 2 + 0.7, base + 0.5]], COL.oscuro);
        e.poli([[cx - w / 2, base + 0.5], [cx, base - h], [cx + w / 2, base + 0.5]], COL.oro);
        e.poli([[cx - w / 2, base + 0.5], [cx, base - h], [cx - w / 2 + 1.3, base + 0.5]], COL.luz);
        e.poli([[cx + w / 2, base + 0.5], [cx, base - h], [cx + w / 2 - 1.3, base + 0.5]], COL.sombra);
        e.rect(cx - 0.5, base - h - 0.4, 1, 1, COL.luz);
      };
      for (const [cx, h] of [[12.8, 5], [18.4, 6], [24, 7.4], [29.6, 6], [35.2, 5]]) punta(cx, 10, h, 5.2);
      e.poli([[9.2, 9], [38.8, 9], [38.8, 15.6], [24, 17.2], [9.2, 15.6]], COL.oscuro);
      e.poli([[10.2, 10], [37.8, 10], [37.8, 14.6], [24, 16.2], [10.2, 14.6]], COL.oro);
      e.poli([[10.2, 10], [37.8, 10], [37.8, 11.3], [24, 12.9], [10.2, 11.3]], COL.luz);
      e.poli([[10.2, 13.4], [37.8, 13.4], [37.8, 14.6], [24, 16.2], [10.2, 14.6]], COL.sombra);
      for (const x of [14.5, 33.5]) e.rect(x, 11.8, 1.2, 1.6, COL.luz);
      e.rect(21.8, 11.4, 4.4, 3.6, COL.oscuro); e.rect(22.6, 12, 2.8, 2.4, COL.gema); e.rect(22.6, 12, 1.2, 1.1, COL.gemaLuz);
      break;
    }
    case 'audifonos':
      for (const [x, lado] of [[8.2, -1], [39.8, 1]]) { E.elipse(x, 25, 3.8, 5.5, COL.oscuro); E.elipse(x + lado * .3, 25, 2.5, 4.2, COL.cinta); E.elipse(x - lado * .6, 23.6, 1, 1.6, COL.cian); }
      E.linea([[8.5, 21], [7.6, 14], [10, 8], [15.5, 3.4], [24, 1.6], [32.5, 3.4], [38, 8], [40.4, 14], [39.5, 21]], COL.oscuro);
      E.linea([[9.5, 20], [8.8, 14], [11, 8.6], [16, 4.4], [24, 2.6], [32, 4.4], [37, 8.6], [39.2, 14], [38.5, 20]], COL.oscuro);
      E.linea([[10.5, 12], [12.5, 8.6], [17, 5], [24, 3.4]], COL.acero);
      break;
    case 'corbata':
      E.poli([[21.5, 37.5], [26.5, 37.5], [26, 41.5], [22, 41.5]], COL.oscuro); E.poli([[22.3, 38.2], [25.7, 38.2], [25.2, 40.8], [22.8, 40.8]], COL.rojoLuz);
      E.poli([[22, 41], [26, 41], [28.2, 47.5], [24, 49], [19.8, 47.5]], COL.oscuro); E.poli([[22.8, 41.6], [25.2, 41.6], [26.8, 46.8], [24, 47.8], [21.2, 46.8]], COL.rojo);
      E.poli([[23.4, 41.8], [24.6, 41.8], [25.2, 46.4], [24, 47], [22.8, 46.4]], COL.rojoLuz);
      break;
    case 'medalla':
      // cinta en V (azul a la izquierda, roja a la derecha) y disco con relieve y emblema, como en el cuerpo
      E.poli([[17, 36.5], [21.2, 36.5], [24.4, 42.6], [22, 43.4]], COL.cinta3); E.poli([[31, 36.5], [26.8, 36.5], [23.6, 42.6], [26, 43.4]], COL.cinta2);
      E.elipse(24, 45.9, 4.6, 4.6, COL.oscuro); E.elipse(24, 45.9, 3.6, 3.6, COL.oro); E.elipse(23, 44.8, 1.5, 1.5, COL.luz); E.rect(22.6, 45.3, 2.8, 2.4, COL.sombra); E.rect(23.4, 46, 1.2, 1, COL.oro);
      E.rect(22.4, 41.8, 3.2, 1.4, COL.oscuro);
      break;
    case 'capa': {
      // el manto cae por detrás (alas a los lados) y el mantón cubre los hombros con un broche dorado en el cuello, como en el cuerpo
      ED.poli([[0, 48], [0, 38], [4, 33], [13, 34], [14, 48]], COL.capaOsc);
      ED.poli([[48, 48], [48, 38], [44, 33], [35, 34], [34, 48]], COL.capaOsc);
      E.poli([[22, 36.3], [14, 36.8], [6, 38.6], [0, 43], [0, 48], [14, 48], [18.5, 41.5], [22, 40]], COL.oscuro);
      E.poli([[26, 36.3], [34, 36.8], [42, 38.6], [48, 43], [48, 48], [34, 48], [29.5, 41.5], [26, 40]], COL.oscuro);
      E.poli([[21.4, 37.2], [14, 37.7], [6.6, 39.4], [1, 43.4], [1, 48], [13.4, 48], [18, 41.5], [21.4, 40.4]], COL.capa);
      E.poli([[26.6, 37.2], [34, 37.7], [41.4, 39.4], [47, 43.4], [47, 48], [34.6, 48], [30, 41.5], [26.6, 40.4]], COL.capaOsc);
      E.poli([[21.4, 37.2], [14, 37.7], [6.6, 39.4], [2.5, 42.4], [8, 40.8], [15, 39.4], [21.4, 38.6]], COL.capaLuz);
      E.poli([[26.6, 37.2], [34, 37.7], [41.4, 39.4], [45.5, 42.4], [40, 40.8], [33, 39.4], [26.6, 38.6]], COL.capa);
      E.rect(21.4, 35.8, 5.2, 4.6, COL.oscuro); E.rect(22.2, 36.6, 3.6, 3, COL.oro); E.rect(22.2, 36.6, 1.6, 1.2, COL.luz); E.rect(24.6, 38.6, 1.2, 1, COL.sombra);
      break;
    }
    case 'gato': {
      const m = GATO_RETRATO[n], [x, y] = POS_OBJ.gato[n]; P.mapa(x, y, m, LEY); break;
    }
    case 'cafe': {
      const m = TAZA_RETRATO[n], [x, y] = POS_OBJ.cafe[n]; P.mapa(x, y, m, LEYT); break;
    }
  }
  return { detras: D, encima: P };
}
export const IDS = ['cafe', 'gafas', 'corbata', 'gorra', 'audifonos', 'medalla', 'capa', 'gato', 'corona'];
