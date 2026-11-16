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

/* Accesorios pixel art: un solo catálogo de arte para las tarjetas y el cuerpo.
   Coordenadas nativas 44×74; no modifican ancla ni caja de colisión. */
const ACC_ARTE = (()=>{
  const oscuro='#101326', oro='#ffcf3f', luz='#fff0a1', sombra='#ad6a22', azul='#4678c2', acero='#a9c4e7';
  const ids=['cafe','gafas','corbata','gorra','audifonos','medalla','capa','gato','corona'];
  /* el gato: sentado de frente (o de espaldas) con la cola en «J». Mismo dibujo, mismos colores y misma cara que en los
     retratos (scripts/lib-accesorios-retrato.mjs): K contorno, O naranja, o rayas, L luz, W crema, E ojo, e brillo, N nariz */
  const GATO_COL={K:'#2a150d',O:'#e99443',o:'#c06a26',L:'#f7b765',W:'#ffe5bd',E:'#101326',e:'#ffffff',N:'#e97a8b'};
  const GATO_COLA=['....','....','....','....','....','.KK.','.KOK','.KOK','.KOK','KOOK','KOK.','KK..','....'];
  const GATO_F=['.KK........KK.','KOOK......KOOK','KOLOKKKKKKOLOK','KOOOOOOOOOOOOK','KOoOOOOOOOOoOK','KOOEeOOOOEeOOK','KOOOOOWWOOOOOK','.KOOOWNNWOOOK.','.KKOOWWWWOOKK.','..KOOOWWOOOK..','.KOOWWWWWWOOK.','.KWWWWWWWWWWK.','.KKKKKKKKKKKK.'];
  const GATO_E=['.KK........KK.','KOOK......KOOK','KOOOKKKKKKOOOK','KOoOOOOOOOOoOK','KOOOOoOOoOOOOK','KOoOOOOOOOOoOK','KOOOOoOOoOOOOK','.KOoOOOOOOoOK.','.KOOOOoOOOOOK.','..KOOOOOOOOK..','.KOOoOOOOoOOK.','.KOOOOOOOOOOK.','.KKKKKKKKKKKK.'];
  function pieza(ctx,id,x,y,lado=0){
    const r=(a,b,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x+a,y+b,w,h)};
    switch(id){
      case 'cafe':
        r(2,0,1,3,'#b8d9ed');r(5,1,1,2,'#b8d9ed');r(0,4,9,9,oscuro);r(8,6,4,5,oscuro);r(9,7,2,3,'#d5ac81');r(1,5,7,7,'#d9a66d');r(1,5,7,2,'#74422c');r(2,7,2,4,'#ffead0');r(2,12,6,1,'#9c623d');break;
      case 'gafas': {
        /* marco fino con el cristal TRANSPARENTE (se ven los ojos). lado: 0 frente de él, 3 frente de ella, ±1 perfil (der/izq),
           4 tres cuartos, 2 icono (con el cristal teñido) */
        const lente='#d6f8ff',tinte=lado===2?'#31728b':null;
        const aro=(a,b,w,h)=>{r(a+1,b,w-2,1,oscuro);r(a+1,b+h-1,w-2,1,oscuro);r(a,b+1,1,h-2,oscuro);r(a+w-1,b+1,1,h-2,oscuro);if(tinte)r(a+1,b+1,w-2,h-2,tinte);r(a+1,b+1,2,1,lente)};
        if(lado===1||lado===-1){aro(0,0,7,6);r(lado>0?-6:7,2,6,1,oscuro)}
        else if(lado===4){aro(0,0,7,6);aro(7,0,7,6);r(-1,2,1,1,oscuro);r(14,2,1,1,oscuro)}
        else if(lado===3){aro(0,0,8,7);aro(15,0,8,7);r(8,2,7,1,oscuro);r(-1,2,1,1,oscuro);r(23,2,1,1,oscuro)}
        else{aro(0,0,8,6);aro(11,0,8,6);r(8,2,3,1,oscuro);r(-1,2,1,1,oscuro);r(19,2,1,1,oscuro)}
        break;
      }
      case 'corbata':
        r(3,0,5,4,oscuro);r(4,1,3,2,'#ff7381');r(3,4,5,9,oscuro);r(2,12,7,3,oscuro);r(3,5,4,8,'#b91d46');r(4,5,2,8,'#ff5468');r(4,15,3,2,oscuro);r(5,14,1,2,'#ff5468');break;
      case 'gorra':
        r(4,0,13,2,oscuro);r(2,2,17,3,oscuro);r(0,5,21,6,oscuro);r(3,2,15,3,azul);r(1,5,19,4,'#27477e');r(5,3,7,2,'#78a7e2');r(9,5,4,3,'#91c9f4');r(lado<0?-3:lado>0?14:2,10,lado?10:17,3,oscuro);r(lado<0?-2:lado>0?15:3,10,lado?8:15,1,azul);break;
      case 'audifonos':
        r(5,0,16,2,oscuro);r(3,2,20,2,oscuro);r(2,4,3,10,oscuro);r(21,4,3,10,oscuro);r(6,1,14,1,acero);r(4,3,3,1,azul);r(20,3,2,1,azul);for(const a of [0,21]){r(a,10,5,9,oscuro);r(a+1,11,3,7,'#486291');r(a+1,12,1,4,'#6fd2f0')}break;
      case 'medalla':
        r(0,0,3,5,'#e05a76');r(7,0,3,5,'#507bdf');r(2,4,6,3,'#aeb7d8');r(2,7,6,1,oscuro);r(1,8,8,6,oscuro);r(2,9,6,4,oro);r(3,9,2,2,luz);r(4,13,3,1,sombra);break;
      case 'capa':
        r(3,0,20,3,oscuro);r(2,3,22,10,oscuro);r(0,13,26,20,oscuro);r(2,14,22,17,'#9c183e');r(4,3,18,14,'#bb2450');r(5,5,4,25,'#ed4763');r(16,5,5,26,'#741537');r(3,31,20,2,'#54132f');break;
      case 'gato': {
        const filas=(lado===1?GATO_E:GATO_F).map((f,j)=>lado===2?f:f+GATO_COLA[j]);   // lado 1: de espaldas, 2: sin cola (icono)
        filas.forEach((f,j)=>{for(let i=0;i<f.length;i++)if(f[i]!=='.')r(i,j,1,1,GATO_COL[f[i]])});break;
      }
      case 'corona':
        r(0,0,4,4,oscuro);r(8,0,4,4,oscuro);r(16,0,4,4,oscuro);r(0,4,20,7,oscuro);r(1,1,2,4,oro);r(9,1,2,4,luz);r(17,1,2,4,oro);r(2,4,16,5,oro);r(3,5,14,1,luz);r(3,9,14,1,sombra);r(9,6,2,2,'#e43f72');r(4,6,2,2,'#6fd2f0');r(14,6,2,2,'#6fd2f0');break;
    }
  }
  // capa frontal por detrás del cuerpo; en vista posterior queda sobre la espalda.
  function detras(ctx,id,dir,paso){
    if(id!=='capa'||![0,1,2,6,7].includes(dir))return;
    const d=paso===1?1:paso===3?-1:0;
    // Silueta inclinada en perfil: la tela cae detrás, nunca delante del pecho.
    if(dir===2||dir===6){ctx.save();if(dir===6){ctx.translate(44,0);ctx.scale(-1,1)}
      ctx.fillStyle=oscuro;ctx.fillRect(13,33,10,8);ctx.fillRect(10,40,13,9);ctx.fillRect(6+d,49,17-d,13);ctx.fillRect(4+d,60,18-d,3);
      ctx.fillStyle='#ac2149';ctx.fillRect(14,34,8,7);ctx.fillRect(11,41,11,8);ctx.fillRect(7+d,50,15-d,11);
      ctx.fillStyle='#ef4c67';ctx.fillRect(8+d,51,3,9);ctx.restore();return;
    }
    ctx.fillStyle=oscuro;ctx.fillRect(9,33,26,9);ctx.fillRect(6+d,41,32,12);ctx.fillRect(3+d,52,38,11);
    ctx.fillStyle='#9c183e';ctx.fillRect(10,34,24,8);ctx.fillRect(7+d,42,30,10);ctx.fillRect(4+d,53,36,9);
    ctx.fillStyle='#e24863';ctx.fillRect(7+d,48,3,14);ctx.fillStyle='#641736';ctx.fillRect(34+d,48,4,14);
  }
  function encima(ctx,id,dir,paso,apariencia,pose=-1){
    if(!ids.includes(id))return;
    const frente=[0,1,7].includes(dir), perfil=dir===2||dir===6, espalda=[3,4,5].includes(dir), izq=[5,6,7].includes(dir), der=[1,2,3].includes(dir);
    const dx=der?4:izq?-4:0, femenino=apariencia==='femenina', cuello=femenino?31:32;
    // Ajustes pequeños según orientación; el pie siempre queda en 74.
    if(id==='gafas'&&(frente||perfil)){
      /* dónde están los ojos en cada dirección (medidos en los atlas; los de ella van más bajos y más separados) */
      if(perfil)pieza(ctx,id,izq?11:26,femenino?20:16,izq?-1:1);
      else if(dir===0)femenino?pieza(ctx,id,11,20,3):pieza(ctx,id,13,16,0);
      else if(femenino)pieza(ctx,id,der?14:8,20,4);
      else pieza(ctx,id,der?19:11,16,4);
    }
    if(id==='gorra')pieza(ctx,id,11+dx/2,0,izq?-1:der?1:0);
    if(id==='corona')pieza(ctx,id,12+dx/2,0);
    if(id==='audifonos')pieza(ctx,id,9+dx/2,2);
    if(id==='corbata'&&(frente||perfil))pieza(ctx,id,18+dx,cuello);
    if(id==='medalla'&&(frente||perfil))pieza(ctx,id,17+dx,cuello);
    if(id==='capa'&&espalda)pieza(ctx,id,9+(paso===1?1:paso===3?-1:0),cuello);
    if(id==='capa'&&frente){ctx.fillStyle=oro;ctx.fillRect(11+dx,cuello+2,2,2);ctx.fillRect(30+dx,cuello+2,2,2)}
    if(id==='cafe')pieza(ctx,id,perfil?(izq?5:26):(izq||pose>=2)?3:28,44+(paso===1?-2:paso===3?2:0));
    if(id==='gato')pieza(ctx,id,izq?0:26,59+(paso===1||paso===3?-1:0),espalda?1:0);
  }
  function icono(cv,id){
    const ctx=cv.getContext('2d');ctx.clearRect(0,0,cv.width,cv.height);ctx.save();ctx.imageSmoothingEnabled=false;
    // Icono nativo 32×32; capa en miniatura para caber sin recortar.
    if(id==='capa'){ctx.translate(7,4);ctx.scale(.7,.7);pieza(ctx,id,0,0)}
    else if(id===''){ctx.strokeStyle='#ff5468';ctx.lineWidth=3;ctx.beginPath();ctx.arc(16,16,10,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(9,9);ctx.lineTo(23,23);ctx.stroke()}
    else {const dims={cafe:[12,13],gafas:[19,6],corbata:[11,17],gorra:[21,13],audifonos:[26,19],medalla:[10,15],gato:[14,13],corona:[20,11]};const d=dims[id];if(d){const k=Math.min(2,Math.floor(28/Math.max(...d)));ctx.translate(Math.floor((32-d[0]*k)/2),Math.floor((32-d[1]*k)/2));ctx.scale(k,k);pieza(ctx,id,0,0,id==='gafas'||id==='gato'?2:0)}}
    ctx.restore();
  }
  return {ids,detras,encima,icono,colores:{oscuro,oro,luz,sombra,azul,acero,gato:GATO_COL}};
})();

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
  // Lienzo reutilizado: las capas se componen a resolución nativa antes de escalar.
  let compuesto;
  function cuadro(cv, sx, sy, acc, dir, paso, apariencia, pose=-1){
    if(!ACC_ARTE.ids.includes(acc))return null;
    if(!compuesto){compuesto=document.createElement('canvas');compuesto.width=FW;compuesto.height=FH}
    const k=compuesto.getContext('2d');k.clearRect(0,0,FW,FH);k.imageSmoothingEnabled=false;
    ACC_ARTE.detras(k,acc,dir,paso);k.drawImage(cv,sx,sy,FW,FH,0,0,FW,FH);ACC_ARTE.encima(k,acc,dir,paso,apariencia,pose);
    return compuesto;
  }
  function dibujar(ctx, x, yPie, alto, dir, paso = 0, s = S.skin, c = S.camisa, apariencia = S.apariencia, acc = S.acc) {
    const origen = origenDe(s,c,apariencia);
    if (!listaOrigen(origen)) return false;
    const cv = atlasDe(s, c, origen);
    const w = Math.round(alto * FW / FH);
    const antes = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    const sx=(paso % PASOS)*FW,sy=dir*FH, extra=esJugador(s,c)?cuadro(cv,sx,sy,acc,dir,paso,apariencia):null;
    ctx.drawImage(extra||cv,extra?0:sx,extra?0:sy,FW,FH,Math.round(x-w/2),Math.round(yPie-alto),w,alto);
    ctx.imageSmoothingEnabled = antes;
    return true;
  }

  // Poses de portada: 0 reposo, 1 parpadeo, 2 y 3 saludo.
  function dibujarPortada(ctx, x, yPie, alto, pose = 0, s = S.skin, c = S.camisa, apariencia = S.apariencia, acc = S.acc) {
    const origen=esJugador(s,c)&&apariencia==='femenina'?imgPortadaFemenina:esJugador(s,c)&&listoPortadaPremium?imgPortadaPremium:imgPortada;
    if (!listaOrigen(origen)) return dibujar(ctx,x,yPie,alto,idx.south,0,s,c,apariencia,acc);
    const cv = atlasDe(s,c,origen), w = Math.round(alto * FW / FH);
    const antes = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    const sx=(pose%4)*FW, extra=esJugador(s,c)?cuadro(cv,sx,0,acc,0,0,apariencia,pose):null;
    ctx.drawImage(extra||cv,extra?0:sx,0,FW,FH,Math.round(x-w/2),Math.round(yPie-alto),w,alto);
    ctx.imageSmoothingEnabled = antes;
    return true;
  }
  return { DIRS, idx, FW, FH, PASOS, dirDe, pasoDe, dibujar, dibujarPortada, atlasDe, get listo() { return listo || listoHD || listaFemenina || listoPremium; }, get listoHD(){return listoHD}, get listoPremium(){return listoPremium}, get listoPortadaPremium(){return listoPortadaPremium}, get listaFemenina(){return listaFemenina}, get listoPortada() { return S.apariencia==='femenina'?listaPortadaFemenina:(listoPortadaPremium||listoPortada); } };
})();
