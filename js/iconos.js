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
