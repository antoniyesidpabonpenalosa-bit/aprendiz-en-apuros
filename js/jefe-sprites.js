'use strict';
/* ── EL JEFE EVOLUTIVO (v26) ──
   El jefe es UN solo enemigo que evoluciona durante el combate (El Bug →
   El Caos → El Error Fatal), no tres enemigos distintos. Aquí viven sus
   dibujos y las cuentas de la animación; js/jefe.js solo decide CUÁNDO.

   Recursos (img/jefe/, ver arte/jefe/LEEME.md):
     jefe-fase-1.png · jefe-fase-2.png · jefe-fase-3.png   las tres poses, 128×128
     jefe-transformaciones-atlas.png   1536×256: 12 columnas × 2 filas de 128×128
        fila 0 = fase 1 → 2 · fila 1 = fase 2 → 3 · 12 cuadros de 85 ms (1,02 s)
   Cada cuadro tiene el mismo ancla: centro x=64 y suelo y=113. Los cuadros
   0 y 11 de cada fila son idénticos a las poses (se comprobó), así que al
   empezar y al acabar la transformación no hay salto.

   Nada de esto toca la mecánica: vida, golpes, velocidad, ataques, zona de
   golpe y umbrales (más de 66 → fase 1, más de 33 → fase 2, el resto → 3)
   son los de siempre. Si un dibujo no carga, jefe.js pinta el emoji de antes. */

const JEFE_SPR={
  /* píxeles de la pantalla lógica (320×180) por píxel del dibujo: 128 × 0,7 =
     90 px de celda. La fase 3 mide 72×58 y cabe bajo la barra de vida; la 1,
     36×34, ronda el ancho de la zona de golpe (48 px) como el emoji de antes. */
  ESC:.7,
  CELDA:128, ANCLA_X:64, ANCLA_Y:113,
  CUADROS:12, MS:85,
  /* rutas relativas: valen igual en Vercel y en GitHub Pages (subcarpeta) */
  RUTAS:{1:'img/jefe/jefe-fase-1.png',2:'img/jefe/jefe-fase-2.png',3:'img/jefe/jefe-fase-3.png',
         atlas:'img/jefe/jefe-transformaciones-atlas.png'},
};

/* ── cuentas puras (se prueban en test/jefe-sprites.test.mjs) ── */
const jefeFaseDe=hp=>hp>66?1:hp>33?2:3;
const jefeTransDuracion=()=>JEFE_SPR.CUADROS*JEFE_SPR.MS;
/* qué cuadro toca a los `ms` milisegundos de empezar; nunca pasa del último */
const jefeCuadro=ms=>Math.max(0,Math.min(JEFE_SPR.CUADROS-1,Math.floor(ms/JEFE_SPR.MS)));
const jefeTransFin=ms=>ms>=jefeTransDuracion();
/* la fila del atlas: de la fase 1 a la 2 es la 0, de la 2 a la 3 es la 1 */
const jefeFilaDe=de=>de-1;
/* dónde cae la esquina de arriba a la izquierda de la celda para que el ancla
   (centro, suelo) quede en (x, suelo) */
const jefeEsquina=(x,suelo)=>({x:x-JEFE_SPR.ANCLA_X*JEFE_SPR.ESC,y:suelo-JEFE_SPR.ANCLA_Y*JEFE_SPR.ESC,t:JEFE_SPR.CELDA*JEFE_SPR.ESC});

/* ── carga ──
   Se piden una vez (al abrir el juego, cuando está ocioso, y otra vez al entrar
   al combate por si acaso) y el service worker los guarda para jugar sin
   conexión. complete && naturalWidth>0 es "ya cargó"; si falla, naturalWidth
   se queda en 0 y el combate usa el emoji. */
const JEFE_IMG={};
function jefePrecargar(){
  if(typeof Image==='undefined')return;
  for(const k of Object.keys(JEFE_SPR.RUTAS)){
    if(JEFE_IMG[k])continue;
    const im=new Image();
    im.src=JEFE_SPR.RUTAS[k];
    JEFE_IMG[k]=im;
  }
}
const jefeListo=k=>{const im=JEFE_IMG[k];return !!im&&im.complete&&im.naturalWidth>0};
/* ¿ya pasó el trámite de cada imagen? (cargó o falló: de las dos formas ya se sabe) */
const jefeTodoResuelto=()=>typeof Image==='undefined'||Object.keys(JEFE_SPR.RUTAS).every(k=>JEFE_IMG[k]&&JEFE_IMG[k].complete);
/* Espera a que las imágenes terminen de cargar (o fallen) antes de empezar el
   combate, con tope de un segundo y medio: pasado ese tiempo se empieza igual y
   lo que no cargó se ve con el emoji. Así el primer fotograma ya sale con el dibujo. */
function jefeEsperar(alTerminar,tope=1500){
  jefePrecargar();
  if(jefeTodoResuelto())return alTerminar();
  let hecho=false;
  const ya=()=>{if(hecho)return;hecho=true;alTerminar()};
  Object.keys(JEFE_SPR.RUTAS).forEach(k=>{const im=JEFE_IMG[k];im.addEventListener('load',()=>{if(jefeTodoResuelto())ya()});im.addEventListener('error',()=>{if(jefeTodoResuelto())ya()})});
  setTimeout(ya,tope);
}
if(typeof setTimeout!=='undefined')setTimeout(jefePrecargar,1500);

/* La pose de la fase `fase` con el ancla en (x, suelo). false si no hay dibujo. */
function jefeDibujar(c,x,suelo,fase){
  if(!jefeListo(fase))return false;
  const e=jefeEsquina(x,suelo);
  c.save();
  c.imageSmoothingEnabled=false;
  c.drawImage(JEFE_IMG[fase],e.x,e.y,e.t,e.t);
  c.restore();
  return true;
}
/* El cuadro `cuadro` de la transformación que sale de la fase `de`. */
function jefeDibujarTrans(c,x,suelo,de,cuadro){
  if(!jefeListo('atlas'))return false;
  const e=jefeEsquina(x,suelo),L=JEFE_SPR.CELDA;
  c.save();
  c.imageSmoothingEnabled=false;
  c.drawImage(JEFE_IMG.atlas,cuadro*L,jefeFilaDe(de)*L,L,L,e.x,e.y,e.t,e.t);
  c.restore();
  return true;
}
