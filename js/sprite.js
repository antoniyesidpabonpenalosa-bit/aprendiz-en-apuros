'use strict';
/* ── SPRITE DEL APRENDIZ (cuerpo entero) ──
   Un atlas (img/aprendiz-caminar.png) con el aprendiz en pixel art: una FILA
   por dirección (las 8 de DIRS, en ese orden) y 4 COLUMNAS de caminata
   (0 reposo, 1 paso izquierdo, 2 transición, 3 paso derecho). Si el PNG no
   carga (sin conexión la primera vez, o bloqueado) todo lo que usa el sprite
   cae a su dibujo de respaldo y el juego funciona igual.

   La columna 0 es, píxel a píxel, el atlas de reposo que genera
   scripts/build-sprite.py desde arte/aprendiz/idle/; la caminata (fuente en
   arte/aprendiz/caminar/) se hizo encima, con la misma paleta de 23 colores,
   así que el recoloreo de piel y camisa sirve para todos los cuadros.

   Recoloreado: el sprite viene con una piel y una camisa fijas; aquí se
   remapean a las que eligió el jugador (SKINS[S.skin]/CAMISAS[S.camisa]), para
   no perder la personalización que ya tienen el runner y el jefe. Se cachea por
   combinación (solo hay 4×4), calculando cada una una sola vez.

   v33 · ARTE NUEVO DEL PROTAGONISTA: img/aprendiz-caminar-hd.png (mismo contrato:
   8 filas × 4 columnas de 44×74, pies en la base) y img/aprendiz-portada-hd.png
   (1 fila: 0 reposo, 1 parpadeo, 2-3 saludo, para la portada). Se usa para el JUGADOR
   (piel y camisa por índice); los personajes del pasillo (colores "#rrggbb") siguen con
   el atlas clásico, que además es el respaldo si el nuevo no carga. Fuentes y notas en
   arte/aprendiz-hd/. */

const APRENDIZ = (() => {
  const DIRS = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'];
  const FW = 44, FH = 74;                       // tamaño de cada cuadro en el atlas
  const idx = {}; DIRS.forEach((d, i) => idx[d] = i);

  /* Colores base del sprite (paleta del atlas): la camisa azul y la piel clara.
     El recoloreo toca solo los píxeles cercanos a estos, así el pelo, los
     jeans y el contorno se quedan como están. */
  const SHIRT = [0x17, 0x68, 0x9d], SKIN = [0xf5, 0xcb, 0x9a];
  const TOL2 = 70 * 70;                          // radio² de color para considerar "camisa"/"piel"
  const lum = (r, g, b) => 0.3 * r + 0.59 * g + 0.11 * b;
  const LSHIRT = lum(...SHIRT), LSKIN = lum(...SKIN);
  const dist2 = (r, g, b, c) => { const a = r - c[0], d = g - c[1], e = b - c[2]; return a * a + d * d + e * e; };
  const hexRGB = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

  let listo = false;
  const img = new Image();
  img.onload = () => { listo = true; };
  img.src = 'img/aprendiz-caminar.png';
  // Nuevo arte opcional del protagonista. No sustituye el atlas de los NPC.
  let listoHD = false, listoPortada = false;
  const imgHD = new Image(), imgPortada = new Image();
  imgHD.onload = () => { listoHD = true; };
  imgPortada.onload = () => { listoPortada = true; };
  imgHD.src = 'img/aprendiz-caminar-hd.png';
  imgPortada.src = 'img/aprendiz-portada-hd.png';
  let listaFemenina=false, listaPortadaFemenina=false;
  const imgFemenina=new Image(), imgPortadaFemenina=new Image();
  imgFemenina.onload=()=>{listaFemenina=true};
  imgPortadaFemenina.onload=()=>{listaPortadaFemenina=true};
  imgFemenina.src='img/aprendiz-femenina-caminar.png';
  imgPortadaFemenina.src='img/aprendiz-femenina-portada.png';
  // Masculino premium: atlas independiente. Los HD anteriores siguen como respaldo.
  let listoPremium=false, listoPortadaPremium=false;
  const imgPremium=new Image(), imgPortadaPremium=new Image();
  imgPremium.onload=()=>{listoPremium=true};
  imgPortadaPremium.onload=()=>{listoPortadaPremium=true};
  imgPremium.src='img/aprendiz-masculino-premium-caminar.png';
  imgPortadaPremium.src='img/aprendiz-masculino-premium-portada.png';
  const esJugador=(s,c)=>typeof s!=='string'&&typeof c!=='string';
  const origenDe=(s,c,apariencia=S.apariencia)=>esJugador(s,c) ? (apariencia==='femenina'&&listaFemenina?imgFemenina:listoPremium?imgPremium:listoHD?imgHD:img) : img;
  const listaOrigen=o=>o===img?listo:o===imgHD?listoHD:o===imgPortada?listoPortada:o===imgFemenina?listaFemenina:o===imgPortadaFemenina?listaPortadaFemenina:o===imgPremium?listoPremium:listoPortadaPremium;
  const paletaExacta=o=>o===imgFemenina||o===imgPortadaFemenina||o===imgPremium||o===imgPortadaPremium;
  const claveRGB=(r,g,b)=>(r<<16)|(g<<8)|b;
  const palCamisa=new Set([[16,47,91],[20,67,116],[23,87,143],[32,110,171],[54,137,195],[86,165,217]].map(p=>claveRGB(...p)));
  const palPiel=new Set([[145,82,49],[187,116,72],[217,150,99],[239,182,125],[250,204,153],[255,225,183]].map(p=>claveRGB(...p)));
  const PASOS = 4;                               // columnas de la caminata

  /* Atlas recoloreado a (skin,camisa). Multiplica el color destino por el brillo
     relativo de cada píxel, así conserva el sombreado del sprite. */
  const cache = new Map();
  function atlasDe(s, c, origen = origenDe(s,c)) {
    const clave = (origen===imgPremium?'masculino-premium:':origen===imgPortadaPremium?'masculino-premium-portada:':origen === imgPortadaFemenina?'femenina-portada:':origen===imgFemenina?'femenina:':origen === imgPortada ? 'portada:' : origen === imgHD ? 'hd:' : 'clasico:') + s + ':' + c;
    let cv = cache.get(clave);
    if (cv) return cv;
    cv = document.createElement('canvas');
    cv.width = origen.width; cv.height = origen.height;
    const cx = cv.getContext('2d');
    cx.drawImage(origen, 0, 0);
    /* Al abrir con doble clic (file://) el navegador "contamina" el canvas y
       getImageData lanza SecurityError: no se puede recolorear. En ese caso se
       deja el sprite con sus colores originales, sin romper nada. Sobre http/
       https (que es como se juega de verdad) sí recolorea. */
    try {
      /* c y s son el número de la camisa/piel del jugador, o un color "#rrggbb"
         suelto (los personajes del pasillo, js/consejos.js, usan el suyo) */
      const camisa = hexRGB(typeof c === 'string' ? c : (CAMISAS[c] || CAMISAS[0]));
      const piel = hexRGB(typeof s === 'string' ? s : (SKINS[s] || SKINS[0]));
      const d = cx.getImageData(0, 0, cv.width, cv.height), px = d.data;
      for (let i = 0; i < px.length; i += 4) {
        if (px[i + 3] === 0) continue;
        const r = px[i], g = px[i + 1], b = px[i + 2];
        if (paletaExacta(origen)?palCamisa.has(claveRGB(r,g,b)):dist2(r, g, b, SHIRT) < TOL2) { const k = lum(r, g, b) / (paletaExacta(origen)?lum(32,110,171):LSHIRT);
          px[i] = Math.min(255, camisa[0] * k); px[i + 1] = Math.min(255, camisa[1] * k); px[i + 2] = Math.min(255, camisa[2] * k);
        } else if (paletaExacta(origen)?palPiel.has(claveRGB(r,g,b)):dist2(r, g, b, SKIN) < TOL2) { const k = lum(r, g, b) / (paletaExacta(origen)?lum(250,204,153):LSKIN);
          px[i] = Math.min(255, piel[0] * k); px[i + 1] = Math.min(255, piel[1] * k); px[i + 2] = Math.min(255, piel[2] * k);
        }
      }
      cx.putImageData(d, 0, 0);
    } catch (e) { /* file://: sin recoloreo, el sprite sale con sus colores */ }
    cache.set(clave, cv);
    return cv;
  }

  /* Dirección a la que mira según el movimiento (dx,dy en px; dy hacia abajo,
     como el canvas). Sin movimiento mira de frente (sur). */
  function dirDe(dx, dy) {
    if (!dx && !dy) return idx.south;
    const oct = ((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8;
    // 0=E, 1=SE, 2=S, 3=SW, 4=W, 5=NW, 6=N, 7=NE
    return [idx.east, idx['south-east'], idx.south, idx['south-west'], idx.west, idx['north-west'], idx.north, idx['north-east']][oct];
  }

  /* Cuadro de la caminata para quien se está moviendo: avanza cada `cada` ms
     (135 ms ≈ 7 pasos por segundo, lo que pide el arte). Quieto, el 0. */
  const pasoDe = (mueve, ms = performance.now(), cada = 135) => mueve ? Math.floor(ms / cada) % PASOS : 0;

  /* Pinta el cuadro (dir, paso) centrado en x, con el PIE en yPie y ese alto
     lógico. Devuelve false si el atlas aún no cargó (quien llama pinta su
     respaldo). */
  function dibujar(ctx, x, yPie, alto, dir, paso = 0, s = S.skin, c = S.camisa, apariencia = S.apariencia) {
    const origen = origenDe(s,c,apariencia);
    if (!listaOrigen(origen)) return false;
    const cv = atlasDe(s, c, origen);
    const w = Math.round(alto * FW / FH);
    const antes = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(cv, (paso % PASOS) * FW, dir * FH, FW, FH, Math.round(x - w / 2), Math.round(yPie - alto), w, alto);
    ctx.imageSmoothingEnabled = antes;
    return true;
  }

  // Poses de portada: 0 reposo, 1 parpadeo, 2 y 3 saludo.
  function dibujarPortada(ctx, x, yPie, alto, pose = 0, s = S.skin, c = S.camisa, apariencia = S.apariencia) {
    const origen=esJugador(s,c)&&apariencia==='femenina'?imgPortadaFemenina:esJugador(s,c)&&listoPortadaPremium?imgPortadaPremium:imgPortada;
    if (!listaOrigen(origen)) return dibujar(ctx,x,yPie,alto,idx.south,0,s,c,apariencia);
    const cv = atlasDe(s,c,origen), w = Math.round(alto * FW / FH);
    const antes = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(cv, (pose % 4) * FW, 0, FW, FH, Math.round(x - w / 2), Math.round(yPie - alto), w, alto);
    ctx.imageSmoothingEnabled = antes;
    return true;
  }
  return { DIRS, idx, FW, FH, PASOS, dirDe, pasoDe, dibujar, dibujarPortada, atlasDe, get listo() { return listo || listoHD || listaFemenina || listoPremium; }, get listoHD(){return listoHD}, get listoPremium(){return listoPremium}, get listoPortadaPremium(){return listoPortadaPremium}, get listaFemenina(){return listaFemenina}, get listoPortada() { return S.apariencia==='femenina'?listaPortadaFemenina:(listoPortadaPremium||listoPortada); } };
})();
