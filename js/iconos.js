'use strict';
/* ── ICONOS PIXEL (v25) ──
   Los iconos del juego eran emojis del sistema: no son pixel art y cambian de
   aspecto según el celular. Aquí están dibujados a mano, en rejillas de 12×12
   (el jefe, 16×16), con la MISMA paleta del juego: cada letra es una de las
   variables de color de css/estilos.css (:root), así que nada se sale de la
   familia de colores de la interfaz.

   Se piden por la clave del emoji que reemplazan:
     pxi('☕')            → <img> pixel para meter en una plantilla HTML
     pxiDibujar(c,'🐛',x,y,esc)  → lo pinta en un canvas
   Si no hay icono para esa clave, pxi() devuelve el emoji tal cual: se puede
   ir cambiando de a poco y nada se rompe. Sin DOM ni canvas para probarlo
   (test/iconos.test.mjs): pxiSvg() y pxiRuns() son funciones puras. */

/* Letra → color. Los nombres son los de :root en css/estilos.css; hay una
   prueba que comprueba que siguen iguales. '.' es transparente. */
const PXI_PAL={
  k:'#07080f',                                  /* --bd: contorno */
  w:'#f2f5ff', l:'#cdd8f6', m:'#9fb0d8', d:'#39426e',   /* --tx4 --tx3 --tx2 --bl */
  G:'#8aff4f', g:'#54c41a', h:'#39a900', i:'#2e7a10',   /* --g4 --g3 --g2 --g1 */
  A:'#fff3c4', a:'#ffe27a', y:'#ffcf3f', z:'#b88a00',   /* --y4 --y3 --y2 --y1 */
  V:'#d9c2ff', v:'#a86bff', u:'#8c3df0', t:'#5a1bb0',   /* --v4 --v3 --v2 --v1 */
  O:'#ffbf94', o:'#ff8c44', p:'#e06020', q:'#a04000',   /* --o4 --o3 --o2 --o1 */
  B:'#6fd2f0', b:'#1ea0c8', c:'#13648c', e:'#0c3550',   /* --b4 --b3 --b2 --b1 */
  R:'#ff9aa6', r:'#ff5468', s:'#c22e44', n:'#6e1224',   /* --r4 --r3 --r2 --r1 */
};

const PXI={
  '☕':[
    '..m..m......',
    '...m..m.....',
    '............',
    '.kkkkkkkkk..',
    '.kwwwwwwwkkk',
    '.kwqqqqqwkwk',
    '.kwwwwwwwkwk',
    '.kmwwwwwmkkk',
    '..kmwwwmk...',
    '...kkkkk....',
    '.kkkkkkkkk..',
    '............'],
  '🐛':[
    '..k......k..',
    '...k....k...',
    '....kkkk....',
    '..kkhhhhkk..',
    '.khhhkkhhhk.',
    'kkhGhkkhGhkk',
    '.khhhkkhhhk.',
    'kkhhhkkhhhkk',
    '.khhhkkhhhk.',
    '..kkhhhhkk..',
    '....kkkk....',
    '............'],
  '🧠':[
    '............',
    '...kkkkkk...',
    '..kRRrRRRk..',
    '.kRrRRrRRrk.',
    '.kRRrRkRRRk.',
    '.kRrRRkRrRk.',
    '.kRRrRkRRRk.',
    '..kRRrRRrk..',
    '...kRRRRk...',
    '....kssk....',
    '.....kk.....',
    '............'],
  '🔀':[
    '............',
    '.kkk....kkk.',
    'kyyyk..kbbbk',
    'kyyyk..kbbbk',
    '.kkk....kkk.',
    '..w......w..',
    '...w....w...',
    '....w..w....',
    '.....ww.....',
    '....kkkk....',
    '...kGGGGk...',
    '....kkkk....'],
  '📋':[
    '....kkkk....',
    '...kmmmmk...',
    '.kkkkkkkkkk.',
    '.kwwwwwwwwk.',
    '.kwGwddddwk.',
    '.kwwwwwwwwk.',
    '.kwGwddddwk.',
    '.kwwwwwwwwk.',
    '.kwGwddddwk.',
    '.kwwwwwwwwk.',
    '.kkkkkkkkkk.',
    '............'],
  '🔍':[
    '...kkkk.....',
    '..kBBBBk....',
    '.kBwwBBBk...',
    '.kBwBBBBk...',
    '.kBBBBBBk...',
    '.kBBBBBBk...',
    '..kBBBBkk...',
    '...kkkkkk...',
    '......kook..',
    '.......kook.',
    '........kok.',
    '.........kk.'],
  '🔥':[
    '.....kk.....',
    '....kyyk....',
    '...kkyyk.k..',
    '..kooyyokok.',
    '..kooyAyook.',
    '.kpooyAyoopk',
    '.kpoyyAyyopk',
    '.kpoyAAAyopk',
    '.kppoyAyoppk',
    '..kppooopkk.',
    '...kkppkk...',
    '.....kk.....'],
  '🧬':[
    '............',
    '.kk......kk.',
    '.kGk....kBk.',
    '..kGk..kBk..',
    '...kGkkBk...',
    '....kkwk....',
    '....kBGk....',
    '...kBkkGk...',
    '..kBk..kGk..',
    '.kBk....kGk.',
    '.kBk....kGk.',
    '.kk......kk.'],
  '🚀':[
    '.....kk.....',
    '....kwwk....',
    '...kwwBwk...',
    '...kwBBwk...',
    '...kwwwwk...',
    '...kwwwwk...',
    '..kkwwwwkk..',
    '.kRkwwwwkRk.',
    '.kRkksskkRk.',
    '..k.kyyk.k..',
    '.....kyk....',
    '.....kk.....'],
  '🎓':[
    '............',
    '............',
    '.....kk.....',
    '...kkuukk...',
    '.kkuuvvuukk.',
    'kuuuuuuuuuuk',
    '.kkuuuuuukky',
    '...kttttk..y',
    '...kttttk..y',
    '....kkkk..yy',
    '............',
    '............'],
  '🗄':[
    '............',
    '...kkkkkk...',
    '..kBBBBBBk..',
    '.kbbbbbbbbk.',
    '.kcccGcccck.',
    '.kkbbbbbbkk.',
    '..kkkkkkkk..',
    '.kbbbbbbbbk.',
    '.kcccGcccck.',
    '.kkbbbbbbkk.',
    '..kkkkkkkk..',
    '............'],
  '🧩':[
    '....kkk.....',
    '...kVVVk....',
    '...kVvvk....',
    '.kkkkvvkkk..',
    '.kvvvvvvvk..',
    '.kvvvvvvvkk.',
    '.kvvvvvvvvvk',
    '.kvvvvvvvvvk',
    '.kvvvvvvvkk.',
    '.kvvvvvvvk..',
    '.kkkkkkkkk..',
    '............'],
  '💣':[
    '.........yo.',
    '........ok..',
    '.......k....',
    '...kkkkkk...',
    '..kmddddddk.',
    '.kmwddddddk.',
    '.kmddddddddk',
    '.kddddddddk.',
    '.kddddddddk.',
    '..kddddddk..',
    '...kkkkkk...',
    '............'],
  '🌊':[
    '............',
    '............',
    '...kk.......',
    '..kBBk..kk..',
    '.kBwBBkkBBk.',
    'kBBwBBBBBBBk',
    'kbBBBbbBBBbk',
    'kbbbbbbbbbbk',
    'kcbbbcbbbbck',
    '.kcccccccck.',
    '..kkkkkkkk..',
    '............'],
  '🌙':[
    '............',
    '...kkkkk....',
    '..kayyyyk...',
    '.kayyykkk...',
    '.kayyk......',
    '.kyyyk......',
    '.kyyyk......',
    '.kyyyyk.....',
    '.kzyyyykkk..',
    '..kzzyyyyk..',
    '...kkzzzk...',
    '......kkk...'],
  '🔒':[
    '....kkkk....',
    '...kmmmmk...',
    '...km..mk...',
    '...km..mk...',
    '..kkkkkkkk..',
    '.kyyyyyyyyk.',
    '.kyyyykkyyk.',
    '.kyyyykkyyk.',
    '.kyyyyykyyk.',
    '.kzzzzzzzzk.',
    '.kkkkkkkkkk.',
    '............'],
  '❌':[
    '............',
    '.kk......kk.',
    'krrk....krrk',
    'krrrk..krrrk',
    '.krrrkkrrrk.',
    '..krrRRrrk..',
    '..krrrrrrk..',
    '.krrrkkrrrk.',
    'krrrk..krrrk',
    'krrk....krrk',
    '.kk......kk.',
    '............'],
  '📄':[
    '............',
    '..kkkkkkkk..',
    '..kwwwwwwk..',
    '..kwmmmmwk..',
    '..kwwwwwwk..',
    '..kwmmmmwk..',
    '..kwwwwwwk..',
    '..kwmmmmwk..',
    '..kwwwwwwk..',
    '..kwmmwwwk..',
    '..kkkkkkkk..',
    '............'],
  '🔊':[
    '............',
    '....k.......',
    '...kwk..l...',
    '.kkkwk...l..',
    '.kwwwk.l.l..',
    '.kwwwk..l.l.',
    '.kwwwk..l.l.',
    '.kwwwk.l.l..',
    '.kkkwk...l..',
    '...kwk..l...',
    '....k.......',
    '............'],
  '🔉':[
    '............',
    '....k.......',
    '...kwk......',
    '.kkkwk..l...',
    '.kwwwk...l..',
    '.kwwwk...l..',
    '.kwwwk...l..',
    '.kwwwk...l..',
    '.kkkwk..l...',
    '...kwk......',
    '....k.......',
    '............'],
  '🔇':[
    '............',
    '....k.......',
    '...kwk......',
    '.kkkwk.r..r.',
    '.kwwwk..rr..',
    '.kwwwk..rr..',
    '.kwwwk.r..r.',
    '.kwwwk......',
    '.kkkwk......',
    '...kwk......',
    '....k.......',
    '............'],
  '🌱':[
    '............',
    '............',
    '..kkk..kkk..',
    '.kGGGkkGGGk.',
    '.kGgGGkGgGk.',
    '..kkkgkkkk..',
    '....kgk.....',
    '....kgk.....',
    '....kgk.....',
    '...kkkkkk...',
    '..kppppppk..',
    '..kkkkkkkk..'],
  '⚔️':[
    'kk........kk',
    'kwk......kwk',
    '.kwk....kwk.',
    '..kwk..kwk..',
    '...kwkkwk...',
    '....kwwk....',
    '...kykkyk...',
    '..kyk..kyk..',
    '.kyk....kyk.',
    '.kok....kok.',
    '..k......k..',
    '............'],
  '💀':[
    '............',
    '...kkkkkk...',
    '..kwwwwwwk..',
    '.kwwwwwwwwk.',
    '.kwkkwwkkwk.',
    '.kwkkwwkkwk.',
    '.kwwwkkwwwk.',
    '..kwwwwwwk..',
    '...kwkwkwk..',
    '...kwkwkwk..',
    '....kkkkk...',
    '............'],

  '🎮':[
    '............',
    '............',
    '.kkkkkkkkkk.',
    'kddddddddddk',
    'kddwdddddydk',
    'kdwwwdddrdgk',
    'kddwdddddbdk',
    '.kddddddddk.',
    '.kddkkkkddk.',
    '.kkk....kkk.',
    '............',
    '............'],
  '♾️':[
    '............',
    '............',
    '............',
    '.VVVV..VVVV.',
    'vv..vvvv..vv',
    'v....vv....v',
    'vv..vvvv..vv',
    '.vvvv..vvvv.',
    '............',
    '............',
    '............',
    '............'],
  '🏫':[
    '............',
    '....kkkk....',
    '...kppppk...',
    '..kppppppk..',
    '.kkkkkkkkkk.',
    '.kwwwwwwwwk.',
    '.kwbwwwwbwk.',
    '.kwwwwwwwwk.',
    '.kwbwkkwbwk.',
    '.kwwwkkwwwk.',
    '.kkkkkkkkkk.',
    '............'],
  '📚':[
    '............',
    '.kkkkkkkkk..',
    '.kRRrRRRsk..',
    '.kkkkkkkkk..',
    'kkkkkkkkkkk.',
    'kyyAyyyyyyk.',
    'kkkkkkkkkkk.',
    '.kkkkkkkkkk.',
    '.kBBbBBBBBk.',
    '.kkkkkkkkkk.',
    '............',
    '............'],
  '🗓':[
    '............',
    '..k......k..',
    '.kkkkkkkkkk.',
    '.krrrrrrrrk.',
    '.krrrrrrrrk.',
    '.kwwwwwwwwk.',
    '.kwdwdwdwwk.',
    '.kwwwwwwwwk.',
    '.kwdwdwdwwk.',
    '.kwwwwwwwwk.',
    '.kkkkkkkkkk.',
    '............'],
  '💼':[
    '............',
    '....kkkk....',
    '....k..k....',
    '.kkkkkkkkkk.',
    '.kppppppppk.',
    '.kppppppppk.',
    '.kkkkyykkkk.',
    '.kooooooook.',
    '.kooooooook.',
    '.kkkkkkkkkk.',
    '............',
    '............'],

  '🛒':[
    '............',
    'kk..........',
    '.kkkkkkkkkk.',
    '..kmmmmmmmk.',
    '..kmwmwmwmk.',
    '...kmmmmmk..',
    '...kkkkkkk..',
    '....k...k...',
    '...kyk.kyk..',
    '....k...k...',
    '............',
    '............'],
  '🏆':[
    '............',
    '.kkkkkkkkkk.',
    'kkyyyyyyyykk',
    'k.kyyyyyyk.k',
    'k.kyyyyyyk.k',
    '.kkyyyyyykk.',
    '...kyyyyk...',
    '....kyyk....',
    '.....kzk....',
    '....kzzzk...',
    '...kzzzzzk..',
    '...kkkkkkk..'],
  '📊':[
    '............',
    '............',
    '............',
    '.......kkk..',
    '......kRRRk.',
    '....kkkrrrk.',
    '...kAAArrrk.',
    '.kkkyyyrrrk.',
    'kBBByyyrrrk.',
    'kbbbyyyrrrk.',
    'kbbbyyyrrrk.',
    '.kkkkkkkkk..'],
  '📈':[
    '............',
    '.l..........',
    '.l......GGG.',
    '.l.......GG.',
    '.l......G...',
    '.l.....G....',
    '.l..G.G.....',
    '.l.G.G......',
    '.lG.........',
    '.l..........',
    '.llllllllll.',
    '............'],
  '🕹':[
    '....kkkk....',
    '...kRRrrk...',
    '...krrrrk...',
    '...krrrrk...',
    '....kllk....',
    '....kllk....',
    '....kllk....',
    '.kkkkllkkkk.',
    'kmmmmmmmmmmk',
    'kdrddddddydk',
    'kddddddddddk',
    '.kkkkkkkkkk.'],
  '✨':[
    '........kak.',
    '.....kkkaaak',
    '....kyykkak.',
    '....kyyk.k..',
    '..kkyyyykk..',
    '.kyyyAAyyyk.',
    '.kyyyAAyyyk.',
    '.kkkyyyykk..',
    'kak.kyyk....',
    'aaakkyyk....',
    'kak..kk.....',
    '.k..........'],
  '🔤':[
    '............',
    '.kkkkkkkkkk.',
    'kwwwwwwwwwwk',
    'kwwcwwccwwwk',
    'kwcwcwcwcwwk',
    'kwcccwccwwwk',
    'kwcwcwcwcwwk',
    'kwcwcwccwwwk',
    'kwwwwwwwwwwk',
    'kwwwwwwwwwwk',
    '.kkkkkkkkkk.',
    '............'],

  '⌨️':[
    '............',
    '............',
    '............',
    'kkkkkkkkkkkk',
    'kmwmwmwmwmwk',
    'kwmwmwmwmwmk',
    'kmwmwmwmwmwk',
    'kwmmmmmmmwmk',
    'kkkkkkkkkkkk',
    '............',
    '............',
    '............'],
  '🧮':[
    '............',
    '............',
    '............',
    'kkkkkkkkkkkk',
    'krrrr...bbbk',
    'kyyy...ggggk',
    'krr....rrrrk',
    'kbbbb....yyk',
    'kkkkkkkkkkkk',
    '............',
    '............',
    '............'],
  '🎯':[
    '...kkkkkk...',
    '..kwwwwwwk..',
    '.kwwrrrrwwk.',
    'kwwrrwwrrwwk',
    'kwrrwwwwrrwk',
    'kwrwwrrwwrwk',
    'kwrwwrrwwrwk',
    'kwrrwwwwrrwk',
    'kwwrrwwrrwwk',
    '.kwwrrrrwwk.',
    '..kwwwwwwk..',
    '...kkkkkk...'],

  /* El jefe de la fase 1, 2 y 3 (16×16). Mismo cuerpo, cada vez más furioso. */
  'jefe1':[
    '................',
    '..k..........k..',
    '...kkkkkkkkkk...',
    '..kvvvvvvvvvvk..',
    '.kvVVVvvvvvvvvk.',
    'kvvvvvvvvvvvvvvk',
    'kvvwkkvvvvwkkvvk',
    'kvvkkkvvvvkkkvvk',
    'kvvkkkvvvvkkkvvk',
    'kvvvvvvvvvvvvvvk',
    'kvvvkkkkkkkkvvvk',
    'kvvvkwkwkwkwvvvk',
    'kuuuuuuuuuuuuuuk',
    '.kkuukkkkkkuukk.',
    '.kuuk......kuuk.',
    '..kk........kk..'],
  'jefe2':[
    '...k........k...',
    '..kpk......kpk..',
    '..kppkkkkkkppk..',
    '..kooooooooook..',
    '.koOOOooooooook.',
    'kookooooooookook',
    'koookkooookkoook',
    'kooykyooooykyook',
    'kooykyooooykyook',
    'kooooooooooooook',
    'koookwkwkwkwoook',
    'koookooooookoook',
    'kppppppppppppppk',
    '.kkppkkkkkkppkk.',
    '.kppk......kppk.',
    '..kk........kk..'],
  'jefe3':[
    '.ksk...kk...ksk.',
    '.kssk.kssk.kssk.',
    '..kskkksskkksk..',
    '..krrrrrrrrrrk..',
    '.krRRRrrrrrrrrk.',
    'krrkrrrrrrrrkrrk',
    'ksrkkkrrrrkkkrsk',
    'krryAyrrrryAyrrk',
    'krryAyrrrryAyrrk',
    'krrrrrrrrrrrrrrk',
    'krrkwkwkwkwkkrrk',
    'krrkkwkwkwkwkrrk',
    'kssssssssssssssk',
    '.kksskkkkkksskk.',
    '.kssk......kssk.',
    '..kk........kk..'],
};

/* Las filas de una clave como tiras de un mismo color: [letra, x, y, ancho].
   Función pura (sin DOM): la usan el SVG y el canvas, y las pruebas. */
function pxiRuns(clave){
  const f=PXI[clave];
  if(!f)return null;
  const runs=[];
  f.forEach((fila,y)=>{
    let x=0;
    while(x<fila.length){
      const ch=fila[x];
      if(ch==='.'){x++;continue}
      let n=1;
      while(x+n<fila.length&&fila[x+n]===ch)n++;
      runs.push([ch,x,y,n]);
      x+=n;
    }
  });
  return runs;
}
const pxiTam=clave=>PXI[clave]?{w:PXI[clave][0].length,h:PXI[clave].length}:null;

/* El icono como imagen vectorial en una URL de datos: nítida a cualquier
   tamaño (crispEdges) y sin canvas, para poder usarla en cualquier plantilla. */
const _pxiSvg={};
function pxiSvg(clave){
  if(_pxiSvg[clave])return _pxiSvg[clave];
  const runs=pxiRuns(clave),tam=pxiTam(clave);
  if(!runs)return '';
  const rects=runs.map(([ch,x,y,n])=>`<rect x="${x}" y="${y}" width="${n}" height="1" fill="${PXI_PAL[ch]}"/>`).join('');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${tam.w} ${tam.h}" shape-rendering="crispEdges">${rects}</svg>`;
  return (_pxiSvg[clave]='data:image/svg+xml,'+encodeURIComponent(svg));
}

/* Para las plantillas: la imagen pixel, o el emoji si no hay dibujo. El
   tamaño sale del texto de alrededor (1.15em en el CSS, clase .pxi). */
function pxi(clave,extra=''){
  const src=pxiSvg(clave);
  return src?`<img class="pxi ${extra}" src="${src}" alt="" aria-hidden="true" draggable="false">`:clave;
}

/* Un texto con emojis (los de TXT, que traen "📚 ETAPA LECTIVA") con los que
   tengan dibujo cambiados por su icono. Solo para textos del juego, nunca para
   lo que escribe el jugador: no escapa nada. */
function pxiTexto(s){
  const claves=Object.keys(PXI).filter(k=>!k.startsWith('jefe'));
  return claves.reduce((acc,k)=>acc.split(k).join(pxi(k)),s);
}

/* Para los canvas: cada icono se pinta UNA vez en un canvas pequeño y de ahí
   se copia sin suavizar. dataset.pxi dice cuál es (lo usan las pruebas del
   jefe para saber dónde se dibujó). esc: píxeles de pantalla por pixel del
   dibujo; mejor entero (2, 3...) para que todos salgan del mismo tamaño. */
const _pxiCv={};
function pxiCanvas(clave){
  if(_pxiCv[clave])return _pxiCv[clave];
  const runs=pxiRuns(clave),tam=pxiTam(clave);
  if(!runs||typeof document==='undefined')return null;
  const cv=document.createElement('canvas');
  cv.width=tam.w;cv.height=tam.h;cv.dataset.pxi=clave;
  const g=cv.getContext('2d');
  runs.forEach(([ch,x,y,n])=>{g.fillStyle=PXI_PAL[ch];g.fillRect(x,y,n,1)});
  return (_pxiCv[clave]=cv);
}
/* Dibuja el icono con su esquina de arriba a la izquierda en (x,y). Devuelve
   false si no hay dibujo para esa clave (quien llama puede pintar el emoji). */
function pxiDibujar(c,clave,x,y,esc=1){
  const cv=pxiCanvas(clave);
  if(!cv)return false;
  const suave=c.imageSmoothingEnabled;
  c.imageSmoothingEnabled=false;
  c.drawImage(cv,x,y,cv.width*esc,cv.height*esc);
  c.imageSmoothingEnabled=suave;
  return true;
}

/* ── PORTADA · iconos premium (32×32) ──
   PNG incrustados para no añadir peticiones ni dependencias a la caché.
   Solo rTitulo los solicita; pxi(), PXI y pxiDibujar mantienen su contrato. */
const PXI_PORTADA = {
  "🎮": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAEfklEQVR42u2W228UZRjGf9/soTvbsnTdBcu21TZtgVAsVuQgiQqJBEMgRFAaiMQLkxovvOCGf8N7Ey6IBgMajInR4E2RQIIY2FjbWptiYdlD091xt9vdne10Zz4vZnfapQch3mmfZJKZ+eZ73+d93sM3sI51/N8hVl1xtUoAISUAUggwE+KpjCoRKYVASInEAuFada9YzYDw+Nn2xjm2iDIp6SM2OULp0W2klVybhKtV+sI9dPYdwpX+E4Cx328jF0or7hUrGRBS0nv6E3a3uAC4N20CMPXzfZvEGnI2bNpK96Ejde9NzeCPm59jVfRlSognnStulR3vfMjuFhd3R3XKhr3k84Ir5MXUjKfKbVrLoWfjAHTue4WZiSQzv16rMlokodTtkiYv7j8HwN1RndjkCKnxIVLjQ6S1HMVUvXNXyFt3AZQN0LQMs1O3ePfEHja0u5kcuk4oFCa0/W2Q9fopS6P3bGyncYsd5Uwyxr6ebgbOHGXgzFEKiShzcznSWg6Avb0qpmZgaoaTqrSWY24uRz7xG2c/eI+/3lLZc+EAz8sCscmRquZiFQJS0tZ3DIDY5Aj55DDtO4KcHxzg/OAARi6Ono0j5/OUDVshTcugaRnujuoUUwYKFQqJKEYuzvX70TpHRu6hncpwD0KJyOU14GqVm3edxJwvcezwNgDODw44y59+dgWAK19+T2O4i3IpjxpsQ6FCMTuNzx+gmHnAwJmjAFy+9BURz6LcB8+e5sblqzyezWEtFMCaFnUEhBKRHa9/RGp8iDtDl1YtrhMHT6G3vUZ26g6+LX1Yeh4j9xBvcwcb2t3suXDA7pgvCox9cxGAcx8POvtvXL7KIy3lFKLitJ7Hj89bH+1aCHbuR/X5aQy20P3qMRQ1ULeeSQ7j8gdx+YM8HssC8HgsSyyTdAJeVKAq/+atEWYmkmRGf3CY19Lw8ksHUNwqaqSfF7p3srdX5WZUx+fFuU+ND9nm/JswS2kOXzzlKNG+sdkm1tiJWUpTTk+AlRTuJweGhZvneo9TSETr8u8JRAhE+hANAdJajms/xvAKyAPXEqD6/DS19qNn4xi5h2w7ctKeAe83MT1xnOTULbzNHWx+YSf5TMwmANQRKC9pc0+oi6+//YV7N0aZS47i8jYhGgIoVADbYQ2q01IV1GAbZildNzP0bBxvcwdqsK1uAsoaASGXD9cGX4B5YGo2jxLeRZMvwHw5j6Xn16wNRQ3QGO4iPvwdmQt2kZqlNE2t/St+717LWIMvAFXHejaOnoxiLZTWJuDxQ9ebTocAKzqX1YHkrj2Y8yXYsLJRS8/bzis6/MNpaFVaZfHBT6iRfhQ1YAfxBMql/HIFipkHGNLOrVV9XZPccf40/wNmQlgyIvVkFDXSz3xNSUDO58mU7blROxNsg0pEIgS+cA+eUNfyyI0CyGnxTL86SkQqHr+jhBN9apiFfNIJZtGoaJEI8G3avmR+x+vG5jOjSsLbbFe/aRRZmE3YB9IyAktILFYKzx75CiTAWjz3pPXvba5jHf8p/A0fyBTuDVZQbgAAAABJRU5ErkJggg==",
  "♾️": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAEf0lEQVR42u2WT2xUVRTGf/e+N3+agVCYpsUO1LaGlqDQIEQNFY0umkKIWkk1RAgJG0IgJO6IYEEQw85VFyxZYEWwBiVI3Jjwb6FFUxpKW7DAlGlpOy0z0je8mbnzrovXee04BZdu+q3eu+9+55x7vnPOfTCPeczjf4aYa9EUy7UjcnMSHGdYPM+glJW6YEErECaGCJLNDYr/DECKci2lj0PNh4uM//r7Ha6Mn0ISQOkhURQ0ado2fzlnYEcvHkJKHyoXK+QVvBgRXSpr2de0g5aG7UVGWhrgh+4VHL90AqkrdT4bPqNWA7Q1fz4nL4/jl05gGhE9O4iZB7FMh80aOj7+kfKqAAC3L8sCA+HqpwBce3yWoz8fwRBB79vB5gO0NGxnLJpm4n6Jt57NaJbW2QD8dqeXr/84wKTqx9FjwsuAlJVaCs2+ph2UVwU8I2NJm1Er7hlbmYng8wsaq1tp2+SmFWHStukILQ3buXvDIfU4SF/8ocepCJXBQBCfX/DailW8fO8Nrk/EkE5AKz0kTACtJY1l2wqMPH5q0zXcQ3eqc1YO9lIbjpAdCNJY10rb5rw0eZ5BXzzGhZF2j/H60nd4hbcI6QC+cR976o7BAFwZP1VYA/Whjdy+LLHSAstO0zXcQ0diJzlte5XMCGxhLyvLIkzcL6GxuhWAuzccEpMGgxOu85v22Wl9M/RGz7Ot9BRv164nMWmglDOtuQka5FzFMmrF6UjsRDkZHGdYOHpMGCLITfssF0ba6YvHyGY0jwbcGshapue82z6DIIPWD0Ve547ETgYnYu6JzcLGcyXAjcpKz7SwclwjXjHlBoVpRPQt+xylUyawm6pFlUT7g4Dm6tRJbtnnkCivwPI8Kcp10Sm1ctveTZWbCKW0Vzhhs8Zrr5mWCbCrup39aw8zlBwhmhzGstMopdlTd4xd1e0YckHRXFli1lMRKkMpjWWnZyRglgT91hWiyWEAFpcE+PTVE6zyv48plmvTiGifUasPNh+gtXEjiUmD9ZWrGUqOeF2StBzejTSxIbwVn1HrcZaY9bSt/InFJQFP3sQTVSiBEA7XJ76nPrSRKlUJpuAl/zo+WgO/3JuZVY2LW4n2B1FKM2rF6U518sAweZPdVITKSFp+9q89DH/OZKCp5gMipSbxMU1aZRjXvfRmznsSiNmpWh38hC0v7KUiVEbA9GOaglBA4Au5m+NjkrTKMGrFuTp1kmvj3yKkjw3hrbyYe4/GqnUALArJgkGUyrrO823dbZ8B7U5Rw6sJrC/Gcg+PJG0Lxw4DsNC/kJwG+6lk6onwjPSobzzn2snyIHUDrX1kUqUABOUC0llNOqvJOhBNDtMX/4vuVCc99mm0fiTmvAuEcOixTxNTXWzmq6LCHUqO0J3q5FbmO0B6t5spluvezPnpXR/Oybv492dMqn4kgemee8ZtKMQyDRA2a4iY6wu+xVQXCXUfh3RBq+Ul1PhZE2wtCiCmuphQ9xBkinjiefe61pLZc8J19Ox/AikrtaPdPbO5/54N85jHPOYxG/8AlfIpb4JyMmsAAAAASUVORK5CYII=",
  "🏫": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAEHElEQVR42u2WX0hbVxzHPyc3zlBM3TLt9IIQHcYgbOsKMw1dsavQh8qknZONDDrX9amgDkeHdCXbZBuyQaHmdWOhrMJWHMX9eRAcdaVEpXsYo0Ej1rSOKDUom6UYbO7ZQ7xHb5OsVdvupb+X+zt/ft/f9/z+nHvgsfzPIjZraLOVSFM3jOSmcexbYb+nygXA5WtITRispBfEIyXg5RbHfdvA9yQA7aMlcmQ6uSEi9q3mcPvUInq1JDEpCJdADw5Al+Hp5fsisqUaeLfqCTXuKkkBoFdnSsPbr3H99rx4aBHQhME4RdxILJJIpRlMaBzQC+gi9Wi6QHOUyY791SzFpjDDXaC5pF6oAZBIpe8rBfbNOr/SXITXdhX8AA7C0y65kl4Q128/5C4o0FxyrLkIr22B9ogDgF7/soXEAyFQoLnk+nFa2tCEwdibLuW8/JOvMu330TELiVx4+YjZ8znfXVnCS55n1Fz/xXEuHF5zfjB4GoenFt0puBY8TXt3pyIxmFiheZ9X2WbqJHd0siZs9nK5x+2k12fgtS1kThhxcNy3je1Ti7Qmn6Yz2A1A97kfAAi+9RoAv3R30lWSoidZuC41KIyv4xLjzqzIG4ECzSV3u50M+pNZUWkftQEZ51V1flo7TvDqkdYMkbNhhr7LpKO1O8iNxCIH9AKLfb46yUpBr8/ItNGkuOuSSfF6cQP1TQct+0Pj87hX9ao6PwC/Pm8AKQuGiTOY0FjfKRYCaVFI+6gNL47clVm8pobPfElrxwne0WZ5+8y3AFSUPQWgUnC3jFNEIpXMX4TGnVlxOY48GYmgOwWJJWtBXzn1AQCjkwvoTsHnn36B7hRqzlft4tazOyk/0op/tUABhdPo94OwkrPlYmo6DwwME4lFCQwMW9YDA8P0/35VfU3dFL+nlsDAMIklyb5zF4nEoorMfxbhRsTvqQWiatzmLVV6JBbd+kWkOwV9TfXoToHfI9UJAKbePwyAr/rlvOT8HivGhgmYKehrqldfUxreOJa1/xVtllN9P6sIhMbnlW2bt3Q1Yjl+69a/zA4p7JJdO30qjLnCGZ+IEa9rzOh1jcTrGvkmupS1b71toOUQwi4tb0lLBDRHmXzvt0yP94dmCH14EoDP5ub46dJITvYmiVwpeDE9wtFVjBBw9PtdCnvm/J8yvTwn1ghoO2TH/moF4GyopLmtQhkEWg7Rd/4CADNzi/csrEgsSijYo5yul+a2CvqBeJ8hSd8UwiTgDryAs6GSpaFpRWJpaBpnQyV/fTymANw1HuITMdw1nqy0mGsAxXtLaW6rYDCaOaOJq/b3/cEagdUUVLQ8l/NEf1+ax13jUXf/veTHs2HiEzGK95bmxPpnbg4zBWJ9AeZ9gAptU3eFIdP5F9M3N/0cfCwPVP4FMKC5NAo80VkAAAAASUVORK5CYII=",
  "🌱": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAD7klEQVR42u2Xz2tjVRTHP/flvaa1b9JUTToVlBamjdRSkRYrKLSIg25GUEEozGbW/gkyKzeD4NKlK4WBURTGxTgbZzZCp3Q6tJRApgPZiLHttE3TZ5v0/Tgu7kvy3jRp0zrqQs8myb3nnu/nnnPPfS/wXzcFoKysIAIYoETPiETcDEgIUttQHQc2MxIfUJGYBkiA+JvK1GIKe7rG1JzfMtjSss/eV92QzMpJECqZFYDzzwa8/Gm1pc/i9QTOfBcAZn1was5n+tIBI332kQXTlw6492qCxesBzmJ7CGVmhLTH7NVDXnlvn9eeP3fE58HjPeAZ7s4TB1ha9jFzCkYdABxXp8u2FCN9NiOX4cW3HH74BJz5jIi/qeLiA3I+43Px1i4zQzZwjrXdeCyAQtFgadkHZcQBgnwXK6suk6N6QcVRlEINZ3gP21K80A8ffOnw9bt9qO2siLvRPEOGcPHWDjNDNmu7Do4rFIpaZDADKVtDrKxqLSSonwaAAGcxSTVvNWhTtpAb1k7f/mhw/6HCcYWULbzzTUWf17DeiGL2i31mhmwePN7jtx29BiA3HDTEC0VDaywmGxkwAMTTW63c7GlQ1y03HDAxrskLRYOKE2Y+7UUOnQZd23UoFA1u31FMjMPkaDP1FUexsqo1tOa6ipUgjMHCDQs+dhnMSINcZ8JgZRVW0MEB8HXrpq7sYeZc7j/UIhPjeo3jNsVLm4pq3oKyGa6L3AOxFkp7pN4/4PUIRH3XpU0tULeNaynYNsl+vt0YmxiHwUyzjIWiBq/mLb37shm7T8wogNQ2lCpnpXKzhwWge8yFyI7r4vvf9TI157N/wcd5pEUXblh0j7naZ1zHv31HfzbEtxKIF2/hNv08IAD2dBVj7DA2F+S7cO51k7pSoXvMpZrXwhvXUtgX/Nb+4aXzZOu2BThyPYctUz+5ADznMntVi939rAu2rBZRAhDAVG2vcbMdQL3H2wJuDUjerejvmxZwSBDstF7jt49jPI0nmhhd7cVPsL8EUM2Haa+X6B8FCEUbEGc0s+Pnu9F8vis8EC86iWH0C4Bggmp94s8MoMwB+egln18O6iMJamVw87q9+i2fZFqPJdOa8/f1jEhwMoR5snhGIGBytpfJdk45yPxaa/z86ZHH93jIU8lA+CoVFTjOyn/onpMOq9uZV6B39cbg8RmdL+k9N0vV4UtpR2UIoD8pJNPwZk9z7kmx9XUfwaST+ncMAGAY/fLhUOLYLMyXhJ9LsFNTHQN03Ia6pkK6N3Fs7f+2i0jhta1tVLxcOx3IqUoAkE4meHswPlcHO239TwUQhZDw/4yK3IaCicI780Ppf/vX7E9Gk8/CqAYnyAAAAABJRU5ErkJggg==",
  "⚔️": "data:image/png;base64,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",
  "💀": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAFgUlEQVR42uWXT2hc1xXGf+e+N88jT6pGxlKIXLWVkjjgYkQiVFt1Y+NVMPaiEDfVIriJQYSYxMLFYJqNV8HkDw2KA1k4tFl6k53jkJVrR4pHVRIhTARNkCG4kpGsjGVHmhm9P/d08WbezPOM5D9klwuP4d257373fOc7370Xfu5N7jbAuI+qauMwEUXEoGpT/fG7U3mL0GheHngBxutWDZfZ+cyeB4ouPzaOEUsUzMr9U+N2qfG6dWDPQV24uazl8up9Pd/P39KBPQd14y8eU3E69Z6Bjdet4napk9miR19/754Bl34spZ4bSyv63bWCHn39PRXTruI8osbr1nVTIM4jKs5GshsMn0+M8auOh/jlxgwA5SDOdRBZMo5pWHgQ2YY+VeXa/DLTV2/w8l/+RHnVojZEw2sJbnomtewY6OPUBx/xu9+2JeC3SwFBZBOQILL4YZQ8QWRR1SZCFTa3tbCtp51TH3zEjoE+UD/NeJV243VrS66V/l27efng75MBP5ZDRCQBUNUGsGbg9a0157G1p5PBoWFQi5h2Ne6jmqRA3C41Yjl38RID2zvJZgzloBZxPeV+GFGPJwKq8a+INKSn6IesFAPyV2YBKBSW+PsrL1IqltBoTmIGxKJqebyrLZXT+siyGUM2YxCRO6JvjLg6NpsxBGEcxOaHNzZlxwWwahDigatBlERepd4PI1aDqCHqZqKraiVOVdx/e8VvAh3VFhAzUIvcqGCt8vFnU8xMTzIxdin57MiJk+zcvoVcRaBOhZFbyz75K7NMjF5Ixvfv2s1j255ia08nHZtyLC4V6xbg1DFglTuY5ePPpjh7ZoT86OcgXhy5cekfvQDsZW//bzBGEkaq4O+/dQpVAXHIj37Bzj/+gf5du/nroeeb+06zTmuVs2dGGL/8VQIeV2nI6bfeZmL0Qo1IVfzQxuDvvIvigjhVYyE/Ns6Hp0dozXlNdWDWKx+1YZPOOHeeaxL6EybUX3Muz4sXtWnTw40irO1iENmausS4a+mW0DaqUMVrSCVA79NPkXFNUoZrMlBVa8Y1HDlxMnauemdTn1ePH2Pfgf2JAB2JBbvvwH5ePX6sAXzHQB+DQ8NJOdYYqK8CI9jIslBYoTUX53x3368pDA0DI6kJ9x3Yz/Yn2gF4451/AvDaKy+w/Yl2Og49n6oYgMGhYZ57tpdSOWRxqVjHgEPKCcW47Bjo48iJk2zraac159GSddmQcVLudqvo4xihVA7p3dZPqeRz/tK/6X2yI2EliCzGxK5YXA3x/Yj8lVkKhSXOnhnhP19cxlpFo7laxpzMFrWRz85n9jA4NMzWns4E9PGutqTubSX3fz54mPHLX6E2pKXFY2p6gpasizHCSjHg9orPQmElqf2qP+THxhFCbHhdUiKMglkRp1PzY+PASLxxVFrHphwt2ZogI6tMfT2J2hAxLqvlclIN1moC/u3VueSbibFLsafgYKPrsuaRzMlsUVULJpsI7x//Ostzz/amxs3/UEztdq05j6hip1P/XeDbq3McO3yooaTrzwIpBurLUdVCVIwPnZWFVKOLrOL7EZvbWnCMpKL2PIdsxqmzjGJFbJV9pM7U1jQiG14XjeZFo3nBZBNzqZbR4s0S5y9+w/TMIsbEZVgqh0lfuW7TQjxElOp8d0Z/dyeMitjIT4AzjmH0y+84dvgQn577hJViwP8Wljl/8Rv+9tIgn577pME1FXfdw8r6/4qHMZaZ6cmUhWq4vOY2u3izxOJSkZnpyZR1P9gCbBkrhtNvvsFrAOxlZnoScR8CSMosAQOmr96gUFjiw9Mjtdz/FDcjcTaQ3WDik21FoCImtYNWN6X697tdSu7pxlK9WIisf/isLiiuJEGjufu/Ef3s2v8BgakwOck9F+8AAAAASUVORK5CYII=",
  "🛒": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAD4klEQVR42u2XUWhbVRjHf/cmMdm6dr25RFqMzFm1bLXQlrSIgmNUxIoTGSv0aTqEURBhoqw+jIk6UNE9iTD6ouiL0DGGFe1L3cQKZY6mEmnNtsxFU9IZcjMcaZsm9x4f2nvMTdIklRV92P8p/++753zf+c73P+cE7uI/hiJ/uAICAGECoKoKliVQVQWzkFa2NAGXWxeebRoTxz0O52eRR/ji3BTAliWhAlhCZWigo8z5UucVJt+6dy1T1S+2LAGESeTXxRq1cm19D3i375SO/HJGrr7/nVsI3CgUyiYQuOsIUnB8K6wCwkwqwD+jhZlScllT2Kv1btfkBI8/ue+OrXgp9Ruz879jERDCTClK5WoHxJGR03w0MnjHS34zk+boy28wdfF7hJlUKtZPUX0AfHnhBgCZtOHwa7rfYavFbVvLthTzCRfp1SZpr5iAsApEZsKE+nrJpA0+eP9j6Wtva6Wzp5uzY98AsMNr8szzByQHODT4LJGZMNFYUtpG3nwV9ADnx0aJTo+jqmCatgqqQNP9BFua2OE1CbY00dnTTaivV/rvCwZ5bt8DBFuaZEKhvl46e7odSR/s3wXAQiKBwI2ZL2nCUiwkEmTSBpruB6BZ0xx+OyDA4nKgzFbM7WQuX/oJIx5GWIVyGZbC5WkVPf1DfH7mdS7M3mZ/V6P0zUevs6f9QclL/aXctp06cZLk/EWEmVKq9kCxZuej17l86QafngnL1YT6enlv+LT89oXBQxweHpX8yPBRPhz9jshMWPJM2sCIh8tCVu0BXz4pyxuNJR1NtZBISK7pfsmz2SwA0z9MOb6PxWLrCttEArZc2traZIPZaNY0x57bPdLQ0OCYw97/ia/GWV3JYeX/UCoexWWXhOd+0dL+GK+8dsyha033s7+rkXOT8TJ929gTNCW3x7577EVyS1l5BNfuAauAEQ8Ti8UI6X6pBruhivnicgBNp4gjeSZtcH7sLKsrORTVbT83aleguAqlEtwMbmUyLEanHRdQ3QkU35KdTxzAl0/WHTh208SIh8ktZVFUd9ne19yC4nvBv6t7vZmcp+BGsMu+Jjs2DF4zAZenVXh8Xp7eu8rPX3/C7Nw1Ik8drplA5MdxhgY6sHbrzM5lwNMq7KO37i2wSz9x3EPjwCluf3tCPk4sq0rfqDB5stlh63/7TyxLICxD2VQFOnbrwF8y+Jo8VlHVe6i0IsUVEB7fzn/xJtwAs3PXyl7JllCrVMBNfiVbccxGb8qqKnC5dQHQtfchAGZ+ubp+RhhKtTGWJeh59OG6xtSUoT2h/Welnv8HLk+rsMzcegRvRf3fxf8GfwPeC7Q7HgT64gAAAABJRU5ErkJggg==",
  "🏆": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAElklEQVR42u2XXWgUVxTHf3dmdpPONlsTN8SK2m6In6ktQn1QqCClok/SPkQoLdI3rdQKUoS2IPZN2jwWfWxpFCQQ0D7YFFpBqLHUF7PFWHdNKNGYbdZN3M3GuLt3Th8mM7uzm6RJEfpQDwzM/Zh7zv2f//kYeCb/sajFFg2zWWrnRByUMkCcyhy4cxCYRxmIOIjzaEE91mIGiDh8/vG6f3Wz8N0/APjyxwYKpahonVOLImCaURHMug2TV2JEVrcubORUYv6Fwgy5ISF+LMJ0yQqgo5TgGRRA4LOjawI36BkIUcqMwpwBMpWAwoy/504iDMCGrcU6/bkhITcOLzY57G/P0bBzCwBPrt2i+0Yk6ALDbJZPj67h5JEmCmMT2DLMo4ch8ulZ1F+CTCVQK7YGFHjKAe5dEdbsriAsGZc6uUlhf/ssB98P07Y6SSi2Ft5uh0+G+epGszh6UgUQKIxNcODDMaARgJG0ycGygzWzisiKCqz3hoRRXWbvse3IVIL+b8rk+spY6xtpWy1EqSBycbiRwbPeaIzvv56lqc303WFVQ27bDYykIZV1ueCIAorY9jjQSn+vQXyTRedH2+is8v8bXS+7SAze4/rPmj27q5B6aJHKuoh0tGgfHeaixqglzoO8QSTkksQPrTmJb7IoJ2eR+78GyGfb49gyTDk5y1qzXMcHrXMqEqpEdD6tK6EeYHRG2NnhVIWIDhy0YWuRaLOiv9cIkBHgVp/DqLbYvKs+2kwzKoWSIt42T67xXnoGQiQfNHDp1GN2djiYZlRcFwTFJ1vEdo3wHmDHK7o+zkUhouho0fR8oRm6Kpy9aQcNcPSkSmVN3jllcD8B3Yccjr9eQAHffldE/iz4kN9JhIlvsqAwQ3+vQX+vgWQEa30jA7+73MlPQG4czl03QAl7tpTpO+mQHyzSdd5mumTh6ElVl4pNMyodLZofjjxmJtbAyO0yV39zOPGB0NQKKqbIDYmvyPP3qLb88eZdivsJNwTPXTfYtd3wudN13iaZDfvK560FnhHdB4p0xjRnLrtbPCO8GwJ1Yz8vDAmXRkLk05rD+4TcpNB13iaVNalNyfPmZ9OMisfaQkkRCQmHXpvh8D4huqqiuFo82L2bn73pQv18qOyfM189WLBKKeMFUR4JDYVC89Zmzek3Z4g213+Wm3QNPvGTzbWUwXTJciunKBw3j6tll+NaVBxRbFhZJt4Gr0ZmA+uDhUaupQzyRQOjqtj8k1hLNcA7MJWNCmhOv1vJF6Pa4uIFmF6m8mUZUCtewslPAENl4m1hUtnlKa9PxctppV6KoGKKplYCnDDNqDy1lqyWA4LJ+pYi+9vnKlpNXr843EgyG0ahl4yEWqryjhZN30mHjXu3+aW7lBkN7EuPKUZulzl+IUzyoYWzSC+4ZA4YZrN0tBTpPlBk497tvnLbHoeVpcDeqAh2Bt7bUaJnAJKZFeIsEH7LImG8DTpj2m/LnpsoMJ+jvYy4bZ3wyzAkswr0U4iCkTScuaxoeJQnfPfJop/l05rBQpiR9FMiof9vUN3vz9cdVx0mVYcvhQfP5P8tfwNEfy5kV67MDgAAAABJRU5ErkJggg==",
  "📊": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAB4ElEQVR42u1WPU8CQRB9s7cHiSQmFoIkVhY2xJqCxERbEjv/g5WFDfoHiKWtlf/BxBYbSjtqE0iIHxCVWEgO7nYsjgM8doEjnBYyySW3O5uZN/NmZhdYyX8XisOoEGkO7zHz2H+bYgMgRJp3hIWjrbRWf/X0DABQqkUAIJft3BYubi6Otfp8tYHblxYePXe4J+PiNl9tTOx13rt+2okQMCKW6ZRFiFGn739T6kH8SqlrQCxOgUgzhKXPgPLMIRlARAMgs7xxuAenVJ5QdesS9mkRcNxoJiNns1RGb213UrHdQ6qQw1flIVpCowLo1g2Ym82pHRAtAzLLBAV2X4lkhgGADVi9zx6s9cRMztlTswEEzgAVWusd6/61TpkBoukASGbYTkqc1d60B69P9vFRqS0wHPwYyBKjwHSDiBQjVcgZ7RQv7xe87gggmk3BuLrZ8SYO3p0fAKhFj55ouV2wlJE9Nopl3Eh87nV5DvlVsXinqS34swgFxZPugXMTCDG6SHhuo6a+1xYh83xFGGRA1wELRe7OZ4fCE89OSvQHN5qd9Gs0WAfjOJHUl2zfcUGKYQvzjdhXctgFzG2/Sog2mYmGWWDFxppgxQjeAwQFhgAFE24GjRyiY/x1vJKV/Jl8A2LiwzgR6hNJAAAAAElFTkSuQmCC",
  "📈": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADsElEQVR42u2Xz2sbRxTHPzO7K2klE8utUplaSeilEDAppTmYUMgldqAGh+bSkOCLiy6G0n8ix1LIJRcHXwKOcyhpXdpQ2h4KpaQ5G9xDS2hjYxxEascotrSanR5WGu1PyYWGXvxg2N2ZN+/73pvvzLyFY/mfRQAgK8GHyOvwoDYKUQn3Z+kM09O6JfAb2MYTWdBvvn2eC9MXeXBniVzxBG5hFG1bXQUf4ekogCNAy8iYdkRCLyx7z5+iDvfMt92L3B2rcWH6Iov1Bb5ZuU+p/AY5R1KqWEa52VAAlCoWzYYyTwAK/X4K2SnXzmn+/msdQV5rECYDYyfHI4qtVhvI0d72E0ba2z7K1xxsKSwpUL7GkiLo73RA+MzWx6lONgHYWS9RnWyys15ibfkPrPwJkwXjQNuLAqlOC+U4AFgyWD3lJ1Mb7lOdjnmvTjYpnvsSgLfO0X8uT0Xmy6xUWXY+ApIGbnS7WUBaQdOS2wtPWZ2fy16KYQ78GzHO+coQtnZ2gmt314bOlWnp6y3BQOmBRawFhK3UShHwJys3hjvQmwwgHDcbBEB7aF8H473W1a9M5BLg924+5talqZQDKOxACEx7BwmneuLmLWbr45w8U0R0VGjdPSqn3FTw/GiVTtPms/PvoVulCAf6B1FHDSSYUgqcfT5++Chg9HVYnZ+jsdkE4aSm/d7NxxRfP43tOEGA7khg5yi7IE6wkWKOT394FBm7dneNSq2Umfb8aBXbkiilUN2QtR/d7vawbRiPPC5xpkfAc64BNrYySRiPvNMy4PHIb12aSt3jT1Zu8MXnv5EfrZJ3R460hY0D5tIJSwa4t+uxubEVcaIXuXDcIHKljuSAHWZkXNLAO00b2w2YHHZic6Mf+VHBB3Lg6idngJ+T4DkXqTW+ENhumc2NrcCQW0bIgHBhognZX+U4Ac0SxAsK4bj8+nA/kfYeMX0hjHHbLRtw7fsJkCxnEhmwbDtyEO1sP2N1fo6d7Wd4ux62W04YFVIao2nRDYo8SkIhIneBcFy8XY+t358z88FVamcnUo3NXJlm5sp0JsDlDy/z1bf3B94xMqjPdOQk7B3F2jtgsb7AO+++39+aoRbZsiktbTx+FwRPa0IXXzvF7PWPWKwvvNIq+PbSMg/uLKEO99BqS3RrQkH75Qt+/Pq7V16G//L9T6jWi2RZLmRBA7hjtUR9+F/Jy2aL/cafQfTdsjz6XyALGt09lkRGtR8eT3uPz9Upx5wQaP9Q4DeO/8yOhX8ATGjqjpXKuJ0AAAAASUVORK5CYII=",
  "✨": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAEhUlEQVR42uVXUUhbVxj+zjk3N4neLB6TTYW9FK1NoAXXgHWFIZT4sD2MDrbCZulbKwjdUPowxiaDUtfRh9HSl7KNhjI2Bj7soc5BhwwUxE62SfvgRIgPxWGqjUoazc0999/Dba5Rkxh168N2nnJz/nu//57//77vv8B/fXERJi7CVHb/3wT36CH64NQ63mvLwqdLeu4JKKXQ3R3A0ZMB5JX9fE/Ao4eovZWhrVMiHmM4/JINjx6if6SenEuqBOzRQ9QRlWQlo2Rlx8lKRml6QFCkKUBCBKk4EV49eB21tyoM9gq0NlgQ2s63EVqIYs02LvdoGP+xEWj40t078lY9vvmsFld6fYg12yg0plZtAkIInI5ruNRfjx9+NoHHpeNefdlEPOaFejQPrJ+B8Aeh1lfBFp4gSgSPZHhY48V98mJPCdjK2hLOOaC2N521zK6P1tGN0XW8f4qju9vGseZ5YM3EzCRwbdiH7/7wgAsNtr3M9tRQHVFJU4lGspJR6uuqJWlIKkctaUjiXNLZWA09vc1pekBQR1RW1INdjj9IU4lGUqkLZCWjlBsWdPViQ8UH+nRJQgvR9IATK0SwZOyuJZCGpHVz258v6AAAXShsqNL3bZhpJrQQJSZ8ADIA8+3vzaWxefRWdpxU6gJt/P4i5cb8ND0gSGghkkZ5WnIuK9KWV+L7u2153LvpRVundClFxjlodWGQYSByAvjtoxX3nlLUtO00s+102YZjxRwmYtCFwqc9zhHHY2wLuLsWz0Otr4JyebCFJ/jipzAAIDGUxeyiBsZsEBhstbJrp7PCMbUfAU7HHeBL/fWbAbWvgYxzm9eZO6CnYw7tCklkMgCAmXsmRtJOMp/csmDbDjV3T0DU0WCvF31n1twNMgwnwOuB8Ae3JGQt3d0CjLXNLrVSThVCPUHkbV5tAmEK+hUaAhbq6jTcemcNLYecB2ktjmIhJJ1S+YOwVpYc8DUTVoowl2RoOUT4+Fs/Rh46bTWb8oIxqi4BtwdsG2AC7a0KLTU5HD0ZwOtyCZETDvXIMMC8HmA5vQX82rCT5NADr2u7Sq1WpXRasYwWft//U9KvzIPDC1ng7TBaUo+hwQRDBgQDrAg8MeHD0AMdeWWDCw6l0mwvVK8YzLmkYA3wS79TkkI5rLmcC3591O8IkrkTmIswMeTBhYa8WboUFe24wN/jVwzMJRmsuZzbcCPpMG6MarDVEisF7tFDNNgrMPm1/5mR7XMmTGfSDGyrYs8lGRZnMiDiZc3L0G3EYwyvvPHmwaehgiRfvdhAuWFBZ2M15NNLu6FHD23K9zPpnko0UqQpQAWD2vNMqNQqy5jc5flc1usazvap6XKPhr/GNLR1SrDMHVhLd3GseRXTX2Ux+eHa3t2weCBZnNkAjjvXphIlp6bPb5tIDFn4/vwsIl3zbtP23PRhakEcYCDlkjqizpAhDVnSeIpLFmkK0PSAcEu2fRjdVx8UrLWSvRZTsK+r1rFsESybcNUlqFbZCksXChOPdGBip9BVLUQH/i7kksAIjIldPeH/u/4GI30oUTRdc9sAAAAASUVORK5CYII=",
  "🔤": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAEW0lEQVR42u2XX2hTdxTHP7/bpplpdEkzW5W1QVtrKGu1jpWxh7qpEzqcPviyaZ0ie9hD2QYbwqAvgmOgDMZwMIaMKVV82UO1IESLrrBRNkZny4Z1Bkm0ttY1yZqkmqS5vz3c3l9zc5O2bpQ9bAfu5f7O73fP+Z7vOb9/8F8XYbwrlUIrr5LL6VCfjQrVkCnK8zu18iqpudy8sGvnsjj/KXgVDbecnY4IGwOm8x3f9PLJrvXLAuCj4B36D+8FYHY6IpApA4DmqJWay03zp+e5fqCJ78cfcyo8q3481uSicZX2xA5Pj0zRn3ICsKMyzdvNPl4+9xsjH+wnl0wgc/eEslrV2sb1A02cHpliX1+IXHxKPQ9TGbLZ3BM9AP0pJ7n4FADdgxO8OZjkq9cDlhSrGqhfvQqAnuEHtNe6Obf92X9Edzab4+zzKwDDzlv4uTYSpstfbxmnAIQeThebH/Mi8/SyxJjC8XP9WVl6YHmh4uPtG5SBtIQLt+L0DD9Q/dW+SoOdPCBnRq1j8qWzpYZDmzwca3LZoi+aglZfxVx0kgujcboHJyw/3JxJcmY0zqGAx4huLszhMYPBCu9KADKxhJH7GQPl/k1e1jkd3IhmLfZKlnZah+BYEoCAS/BKs5+Ay3B29PLvpHXDuQPruhVwCY6/uIYTHRup8K4kE0vQPTjB+dHY0lIA4ECSBianUorG/ZtcDPk3sK8vpKJ0CPuiWe2r5I1Gj2ofvZyYY2NNUQA2BhxCgoAj1+5xc46+1xp8OISk7RkHAZcgE0vQcPYm8VmNtD7/rwlsWi/jflqUrIsFGTAr1ow+X69LqUCZOc6XTCzB1ViC54bHLfoTHRstrAAITSBzBQBmMrrNIMDWnl9tOlWAeukVUuYMsMGxJO1+L+uccvEU6FIWjcx8FpOdLWu5dHALlw5uYXPd04gywZWh+wyEl1CEpvNCECc6Nqrv7sEJMrGEiq6YNHqcqiBl5E9EmZHWR0XYKjoLNCEsFO5tqGKFpisAxZzn627F05Y6WgisDcAjXaP3dlQtLAC9t6Psbaii93aU9B/z+ve/C/PFtrr5wpqj+8rQfYvNV1vX0e73Lm0amkWTjzo4llQM5EvhTCkW6cndjXy2zY/XIRZn4JGu8e6NFGUeH32Ha2zMtPu99B1utRkppQdYXVmhWAyOJXlvc01pAFkE46EIa+vrVCHli9ch8HqcagnOIsgCbofA7XlqwdnRn3IycHdCAZC6tG/HyaxOta+S8VCEW/4NlijcDmu2sgvuxYbciT9W3+OhiNpL8rd+CwMD4RjHX6ql+4e77OsLKf23u+sXjbCY5NsIuASdLTXqqGeuhOpMCLC160Oq93TS5bdOjvV/w3khAwCnwrNMXuzh589PIjSBnr0rbKfiLUfeoXpP57Kciicv9vDL11/aT8XmxcQEUdXatiwAokM/os8k5y8nhQBMEGaFFr1KacJSxYVt245XoJd6zHIz+l/+dfkLsY//SNIVXjsAAAAASUVORK5CYII=",
  "🎓": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAEWklEQVR42u2WTUxcZRSGn29mgAtIASfjFARJ68S2VpAUWhI0wqILF01MamMXrlj4EzWamC403bBUY2KoaW2DpnHnX0xjuhMDRFCHQtOAaaQBZRzCMJ0MMD8MQ+/ce1zcubcMTG2L7cqezeTeOfe873fe851z4IH9301t90O32ytillhBXDqGEd9WLM9df+DaLaZkaPHtx5s7DsBMZoDQ2ogAiCyo+0JAKZ8o3DQ/soueg8dIXg/whL8TgGvRXQzNHibu+ZorUT1PJKbuiQRK1QtAq38f3txxXu182fkvvih5OaznTPYGF8PfkdaXCSb7uJOMqH8DVpg87d/Pi03vOad1gKVIXXigxqdYiQnXzV/5fKqf0NoIbqVhSLYoGbUFVBmImHTsOMGRvQe2AkNRcNvWczco85Ti9lgZSZdOcPGPy1xKf4SIBxF3AREF4HL5RcQESmj17+P9Qz84AVdigmEUQRILLLIa59E9A87rybkf8a5/SF2ll7KS0gJ5vvqzn2CyD/uQIjGl7JN37HiHd7veckABjNymHMmGZ4GRyM/MpibpO/Epzd033aaGrN/g2EnMeeumVGilVkwDvpw+zVjyE0xZLCTweFULDRUB2vbWWymPyK2rJk9mXbfSPJf5zHE5dWasKJHIapz5zAyzqUmCyY8LM+BWGlVuP23VPfi1Rl448FyhBJtOX0AoLwfApViQ8tp+AF55aYzmbotI/zeHmIs8z0TiPCkjiskqphlVavN1cyuNBq2dQMXhLUTsFBYjsJlMZDXOcPR7nnosyKkzY7z9xiG++P03QEcpF6YZVQWNyK5MA5+E1kZI6GFIQPQXKyMHfR3UN5ZtlUaKF+bE0iAA568Oc4ryvIOOSEyJ3KYPeFy7xZAsNZ4mVnIhajxNjjQba8SWZ1230m8Dp/VlpjMXWMmFcLnWSQ2VMzUEnb1rW2ZG0VZsSBaAtuoeJ9hP8ZO4VRXtVa8xn7lZrAvhdS7FgkSzYdL6MuOpcxiSosYTwK00RntdADR3Q4uvlcnYFdlI4pazwK00/Fojfq0RgEV9AoDx1DnGUzhENgIDNGjtAOwsaWM6cwEIOzHbfNVMxu5wGBmSpaEiYAWtCDhgtgWTfYynNMe3qfxZB3ijvX56D2eZBmAilrizaagwrQ+WBjnSeAyAukovkdUAfq2xgIhtNvBDJbXOiE6a1xj9ttzxOcs0nb3WLmHLUJSAKYtKqXoZWvqAtL5Ml/8odZVe6iq9TkZuRWSjtfhaIX96uw56nuzi/NXh20sgsqAM6iWY7HP0f+bhHg76OhyfhoqAc91sm8kMkNDDpIwotTt2/beFxO4N9rYzvzDO6FI7O0va6PIfdfzS+jKL+gQJPUwi9xeCC6WMe7cR2URMdsrf2WFCa4NOVhK6JcNKLpT3XcxfsfqCQWLPhc2FuO2l1F5YUBaO3Vo3L64tvlbOvjnt3IjJ2JWCZrRtAnezPRdc721uzw/sgd03+wfy+T9/kWdnzQAAAABJRU5ErkJggg==",
  "🗓": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADlElEQVR42s2Xz2scZRjHP8/Mm5rdxeQShQVbaLMbaEOb3UItNhIXvCg0f0GvguApWFCaQ6Eg/YUR9FAQycFDLoqIGMxBe4hEPKhs0lJ/pGZTFRwwvWTFTXBn5vUwO7OzOzM7u2LUB16YmefX93ne53nmfeE/JkkTMIzHdPjddXcG0kmTN9IMZXIj3L58gblKAQBT5XWazmT5NHOVAnOVQiSAgQAAvHjmccovzzM7czYAkRb5W7PHmVlYYHbmbGwWw6TCL6bKa+3aEaHqG1eDZ+3aqVEBjH70Xiy47i1RYefDmSwfP/tUwFxZXcMJA6xaXBzN8fwzTyc6nr39ZfB8buUuF0dzOOU850fGWa5v8ebnSmvXDoAoH53vXEpjbWurdBj7BHDKeaYtKxHAS8pBrz/ssHN+ZJxpy2KaLOajj7Cw62XRdXckqIFjEwWkNMa5lbvB8qPW6w/5Ip8P3tNoub5F6cNvuJRrAFDe/ingzR85TCY30l8RvjYxHmzFyupaYKAXzR85jFm1uPrzL5hVq0O+sf9n/BwwzLyeLJ3ia2XHGg0rZocPpWYgSd7//kTtV/b+qOO6O+IVobZ5rvYDtCLupn6cDizfch10wS3bhM2tf2kAm6Dt6Bzo1V7/FC3Xt+Cr37oyIIpjEwWeXHoH23EHNmq3xpKSdLl6bYNPX7jCvfU70QyE6X4j+q2YbRva3uvkHc1435X01g1KQEKTUCTKuf7AZbcZGq1DsDhpgNZs78Gl+53T+FpRPCcigW6zJTJ2qK3b81/QHvhtwaZO3wJfxtag0H3r9dyCOCNatw8QcQ6UDF6UqivgDhqLa2cRQMfz+uHHAeiogRaad0+a2K5uoxMBrdFaKOaExRPJRhdPSKCjDPHs9J2BlqPvfu9uR00xC4LGduO7wA+gzdOtBcWc9JmBFl1/oDu6AOD9KQMh2gVNDa9PCEczXh1063odJAMcyUKImtpbo0N+TNKzUP9WESa1Ybdxr76S28xsFeAg4Iy4LvCjHBJvAew2k7slTjcZYI8MfLZZpTI+hQBvH5eEnREKWfhgKu6SoUEkVlcZwr7t8v3mfjIAj7lBpVDqOVREQHVHo3VQO8qQSLb2bZe12kbyiQhtM1k+zYVXXj3Q3/HSzRvcW7+DCDi25R1KXccSMRS1zR9ZunnjQJ1/u+H9hh3bksjd0L92DWeyBwJgr9EIIk+8nBpmXh/kFriOJfyf6C/GS3dOsfK01AAAAABJRU5ErkJggg==",
  "🕹": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAEGElEQVR42t2XUUybVRTHf99dC2spW2Ht2o+KYhUmm8g00bgYyIJbIiwx24MPPsoyH/TFaDQmJntYYmJcYnzxyTAffNiDDz4tmEAmWWKmkLgJbkxo6pBBga9tSgulpd13fSh87deWDipo4kmafPeec+8593/O/9xb+I9F2ekCIbxSIkvmpb6o7HkA1ponpevhGuqRU3wT/d2Yf6vxWW7fGwZA1xeUPQlACK/0KDDa08XUJUnbRfPS6MQ0zy8t7DgIsa0ohcfk/M7wu3zf/U6J3a3DXsqlp5JYdpqztosKXPqqBIE8pAoIj9xuTYhqCmcr59WI2I1NohPTeTbsZQoKHZWT17SFHVNyWwhIfVFZlHkHW8mi3KiBveoDivBIr6Lwg9tboquGglV3wlyu96Hw0JT3arqhpZqis9k9dHVfYHVthUQ6zG8/X0Xqc8q/wgIdBY+rib4Tx3CrbuprXf+IQZZH5TwHsUAgkexDohv6k+1+vgtpQHbD1lJAR30jx3rF1FgqXTzbPYVEYLXs31KfzfrkVimybOW8uekZ3jv/UYnuy4HPTeNEOoyC4NVTH2B32soG8MvNYeZnbpQNQpRzftj3clnnVwavMTt/zxiPTAaN759ufkvw/iQAWkgzfsnYGi909ND0RDeK8MmKCBgn73/bmBsaC2B1CE62+wGoqTnAn3+N88kXHwOQWl3CYqnBfbDRhMpyNILEgbOxFoCO9lcASpCwFDqvqTlgOvnIZJCJqXE62p4DoL/3DCMt7WghjUQ6THz+Dk61Fd3pxetsoe/EMYbGAixHIyipBRrsh4jNRwCor3Xhb+kkpt0lmcwat2UuEqHK+oOP8+n7n5ngGRoLMDE1TmRxlKfau+jvPWMEdv/2j1weSBm2H57fT1RvyG2XCvD11TrTXmf7Zjl+/ByJdJjp8SGSyTBSn1MsuSgErWqracHIZJBYIhf9AacfLTTHlcFrACxHIzQUVc/lgRRn+0ZxeY6WLURHfAYAr7MFzX2U5MyNyo0oGVsDoFn14W/pxFrrIhZNb9DOwXTIfDNeeHPV0K3N3jK9GVznAsRtniLq6vkaKGwum9AXS7PqM77rVcik/bx++i7CmuO/nknhfqybZtXHA3p56fogXM+vd7e+QZ3NgdVSW8oCBUEsGWFoLMDpF5/G6hBYsWF32sis6FgdpUA563uIJTqNcZ3NYfQBt+pGU48U2R8CYDb8B/FYMNchC1mgLUeZmBo3nGVW8qgUfpfbtJxdsW7TuRaaK0VAopNaXUJhBS2kMVtktFuSSYeJx4KkVpeQG+WXQ0APKdmsTy49+BWJY4/+gq0YzrPZddBDSsmDRBEeabd7jcLaTdEzKdbX42Sz66a3Q+kNJVRZ+STiETejbtgVsmtzXbUPl/+v/A0Y07bEvQNRawAAAABJRU5ErkJggg=="
};
function pxiPortada(clave){
  const src=Object.hasOwn(PXI_PORTADA,clave)?PXI_PORTADA[clave]:null;
  return src?`<img class="pxi pxi-portada" src="${src}" alt="" aria-hidden="true" draggable="false">`:pxi(clave);
}
