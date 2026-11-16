/* Los nueve accesorios sobre los retratos (16, 32 y 48), dibujados en la rejilla de cada tamaño.
   Usan los MISMOS colores que el cuerpo (ACC_ARTE en js/sprite.js); test/retratos-protagonistas.test.mjs
   comprueba que no se separen. Devuelven dos capas: `detras` (va bajo la cara) y `encima`.
   Las coordenadas están en «espacio 48» y se rasterizan a la resolución de cada tamaño; lo pequeño
   (gafas, gato, taza) se dibuja a mano en cada tamaño. */
import { Lienzo } from './lib-pixel.mjs';

export const COL = {
  oscuro: '#101326', oro: '#ffcf3f', luz: '#fff0a1', sombra: '#ad6a22', azul: '#4678c2', azulOsc: '#27477e', azulLuz: '#78a7e2', azulLogo: '#91c9f4',
  acero: '#a9c4e7', cian: '#6fd2f0', rojo: '#b91d46', rojoLuz: '#ff5468', rojoOsc: '#842037', capa: '#9c183e', capaLuz: '#ed4763', capaOsc: '#641736',
  taza: '#f4f4f8', tazaSombra: '#b0b7ce', cafe: '#6b4226', vapor: '#cfd6f0', gema: '#e43f72', lente: '#d6f8ff', cinta: '#486291',
  /* el gato: pelaje naranja atigrado, hocico crema, contorno marrón oscuro */
  gContorno: '#2a150d', gNaranja: '#e99443', gSombra: '#c06a26', gLuz: '#f7b765', gCrema: '#ffe5bd', gNariz: '#e97a8b', gOjo: '#101326',
};
const K = { 48: 1, 32: 2 / 3, 16: 1 / 3 };
class Esc {
  constructor(P, k) { this.P = P; this.k = k; }
  poli(pts, c) { this.P.poli(pts.map(([x, y]) => [x * this.k, y * this.k]), c); }
  rect(x, y, w, h, c) { this.poli([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], c); }
  elipse(cx, cy, rx, ry, c) { this.P.elipse(cx * this.k, cy * this.k, rx * this.k, ry * this.k, c); }
  linea(pts, c) { for (let i = 0; i + 1 < pts.length; i++) this.P.linea(pts[i][0] * this.k, pts[i][1] * this.k, pts[i + 1][0] * this.k, pts[i + 1][1] * this.k, c); }
}

/* El gato (mapas a mano): O naranja, o sombra, L luz, W crema, K contorno, E ojo, e brillo, N nariz */
const LEY = { K: COL.gContorno, O: COL.gNaranja, o: COL.gSombra, L: COL.gLuz, W: COL.gCrema, E: COL.gOjo, e: '#ffffff', N: COL.gNariz };
export const GATO_RETRATO = {
  48: ['.KK........KK.', 'KOOK......KOOK', 'KOLOKKKKKKOLOK', 'KOOOOOOOOOOOOK', 'KOoOOOOOOOOoOK', 'KOOEeOOOOEeOOK', 'KOOOOOWWOOOOOK', '.KOOOWNNWOOOK.', '.KKOOWWWWOOKK.', '..KOOOWWOOOK..', '.KOOWWWWWWOOK.', '.KKKKKKKKKKKK.'],
  32: ['.KK....KK.', 'KOOKKKKOOK', 'KOOOOOOOOK', 'KOEOOOOEOK', 'KOOOWWOOOK', '.KOWNNWOK.', '.KOWWWWOK.', '.KKKKKKKK.'],
  16: ['KK..KK', 'KOKKOK', 'KEOOEK', 'KOWWOK', '.KOOK.', '..KK..'],
};
/* Taza de café (mapas a mano): S vapor, K contorno, C café, W taza, w sombra de la taza */
const LEYT = { S: COL.vapor, K: COL.oscuro, C: COL.cafe, W: COL.taza, w: COL.tazaSombra, H: '#d5ac81' };
export const TAZA_RETRATO = {
  48: ['..S...S....', '...S...S...', '.KKKKKKKK..', 'KCCCCCCCCKK', 'KWWWWWWWWKHK', 'KWWWWWWWWKHK', 'KWWWWWWWWKHK', 'KWWWWWWWWKKK', '.KwwwwwwK..', '..KKKKKK...'],
  32: ['.S..S....', '.KKKKKK..', 'KCCCCCKK.', 'KWWWWWKHK', 'KWWWWWKHK', 'KWWWWWKK.', '.KwwwwK..', '..KKKK...'],
  16: ['.KKKK.', 'KCCCCK', 'KWWWWK', 'KWWWWK', '.KKKK.'],
};
const POS_OBJ = { // dónde van el gato y la taza (esquina inferior derecha del busto)
  gato: { 48: [33, 36], 32: [22, 23], 16: [10, 10] },
  cafe: { 48: [36, 37], 32: [23, 23], 16: [10, 10] },
};

export function accesorio(id, sexo, n) {
  const k = K[n], D = new Lienzo(n, n), P = new Lienzo(n, n), E = new Esc(P, k), ED = new Esc(D, k);
  const fem = sexo === 'femenina';
  switch (id) {
    case 'gafas': {
      const f = COL.oscuro, lente = COL.lente;
      if (n === 48) for (const x of [14, 25]) { P.rect(x + 1, 16, 7, 1, f); P.rect(x + 1, 24, 7, 1, f); P.rect(x, 17, 1, 7, f); P.rect(x + 8, 17, 1, 7, f); P.p(x + 1, 17, lente); P.p(x + 2, 17, lente); P.p(x + 1, 18, lente); }
      if (n === 48) { P.rect(23, 19, 2, 1, f); P.rect(12, 19, 2, 1, f); P.rect(34, 19, 2, 1, f); }
      if (n === 32) for (const x of [9, 17]) { P.rect(x + 1, 11, 4, 1, f); P.rect(x + 1, 15, 4, 1, f); P.rect(x, 12, 1, 3, f); P.rect(x + 5, 12, 1, 3, f); P.p(x + 1, 12, lente); }
      if (n === 32) { P.rect(15, 13, 2, 1, f); P.rect(7, 13, 2, 1, f); P.rect(23, 13, 2, 1, f); }
      if (n === 16) { const m = '#7fd8f0'; P.rect(4, 5, 8, 1, m); P.rect(4, 8, 8, 1, m); P.rect(4, 6, 1, 2, m); P.rect(7, 6, 2, 1, m); P.rect(11, 6, 1, 2, m); }   // a 16 el marco es claro para no fundirse con los ojos
      break;
    }
    case 'gorra':
      E.poli([[8.5, 14], [10, 8], [14, 4], [19, 2], [24, 1.5], [29, 2], [34, 4], [38, 8], [39.5, 14], [34, 11.5], [24, 10.5], [14, 11.5]], COL.azulOsc);
      E.poli([[9.5, 13], [11, 8.5], [15, 4.8], [20, 2.8], [24, 2.5], [28, 2.8], [33, 4.8], [37, 8.5], [38.5, 13], [33, 10.8], [24, 10], [15, 10.8]], COL.azul);
      E.poli([[12, 8], [15, 5.5], [20, 3.6], [24, 3.4], [20, 5.2], [16, 7.6]], COL.azulLuz);
      E.rect(21, 5, 6, 4, COL.azulLogo); E.rect(22, 6, 4, 2, COL.azul);
      E.poli([[6.5, 15.5], [9, 12.5], [15, 11], [24, 10.5], [33, 11], [39, 12.5], [41.5, 15.5], [36, 17.5], [24, 18.5], [12, 17.5]], COL.oscuro);
      E.poli([[8, 15], [10, 13], [16, 11.8], [24, 11.4], [32, 11.8], [38, 13], [40, 15], [35, 16.6], [24, 17.4], [13, 16.6]], COL.azul);
      E.poli([[10, 14.5], [14, 13], [24, 12.4], [18, 14.2]], COL.azulLuz);
      break;
    case 'corona':
      E.poli([[11, 12], [11, 4], [15, 8], [19, 2], [22, 7], [24, 0.5], [26, 7], [29, 2], [33, 8], [37, 4], [37, 12]], COL.oscuro);
      E.poli([[12.2, 11], [12.2, 6], [15.2, 9], [19, 4], [22.4, 8.6], [24, 3], [25.6, 8.6], [29, 4], [32.8, 9], [35.8, 6], [35.8, 11]], COL.oro);
      E.rect(12, 8.5, 24, 3, COL.oro); E.rect(12, 8.5, 24, 1, COL.luz); E.rect(12, 11, 24, 1, COL.sombra);
      E.rect(23, 9, 2, 2, COL.gema); E.rect(16.5, 9, 2, 2, COL.cian); E.rect(29.5, 9, 2, 2, COL.cian);
      break;
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
      E.poli([[17.5, 37], [21.5, 37], [25, 42], [22.5, 43]], '#e05a76'); E.poli([[30.5, 37], [26.5, 37], [23, 42], [25.5, 43]], '#507bdf');
      E.elipse(24, 45.4, 4.2, 4.2, COL.oscuro); E.elipse(24, 45.4, 3.2, 3.2, COL.oro); E.elipse(23.2, 44.4, 1.3, 1.3, COL.luz); E.rect(22, 47.6, 4, 1, COL.sombra);
      break;
    case 'capa': {
      ED.poli([[0, 48], [0, 38], [5, 33], [13, 34], [14, 48]], COL.capaOsc);
      ED.poli([[48, 48], [48, 38], [43, 33], [35, 34], [34, 48]], COL.capaOsc);
      E.poli([[0, 48], [0, 40], [4, 36.5], [10, 37.5], [14, 40], [12, 48]], COL.capa); E.poli([[48, 48], [48, 40], [44, 36.5], [38, 37.5], [34, 40], [36, 48]], COL.capa);
      E.poli([[0, 44], [0, 40], [4, 36.5], [7, 37], [3, 41]], COL.capaLuz); E.poli([[48, 44], [48, 40], [44, 36.5], [41, 37], [45, 41]], COL.capaOsc);
      E.poli([[12, 37.5], [36, 37.5], [34, 40], [14, 40]], COL.capa); E.rect(14, 37.5, 20, 1, COL.capaLuz);
      E.rect(12.5, 37, 3, 3.4, COL.oro); E.rect(32.5, 37, 3, 3.4, COL.oro); E.rect(13, 37.4, 1.4, 1.4, COL.luz); E.rect(33, 37.4, 1.4, 1.4, COL.luz);
      E.linea([[15, 40], [20, 41.5], [24, 42], [28, 41.5], [33, 40]], COL.oro);
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
