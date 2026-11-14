'use strict';
/* Sprites exclusivos de los cuatro NPC del pasillo. Un atlas, sin recoloreo
   del jugador y sin bucles de animación. El retrato de diálogo no cambia. */
const NPC_PASILLO = (() => {
  const FW = 44, FH = 74;
  const columnas = Object.freeze({instructor:0, companera:1, lider:2, vigilante:3});
  let listo = false;
  const img = new Image();
  const cargado = new Promise(resolve => {
    img.onload = () => { listo = img.naturalWidth === 4*FW && img.naturalHeight === FH; resolve(listo); };
    img.onerror = () => resolve(false);
    img.src = 'img/npc/pasillo.png';
  });
  function dibujar(ctx, id, x, yPie, alto = FH) {
    if (!listo || !Object.prototype.hasOwnProperty.call(columnas,id) || !Number.isFinite(alto) || alto<=0) return false;
    const ancho = Math.round(alto * FW / FH);
    const antes = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    try {
      ctx.drawImage(img, columnas[id]*FW, 0, FW, FH, Math.round(x-ancho/2), Math.round(yPie-alto), ancho, alto);
    } finally { ctx.imageSmoothingEnabled = antes; }
    return true;
  }
  return { dibujar, cargado, get listo(){ return listo; } };
})();
