'use strict';
/* ── ENCAJE EN LA PANTALLA ──
   El marco es una consola de 600×880 afinada píxel a píxel para el móvil, y
   en un monitor se quedaba en eso: una columna con el 25 % de un Full HD y
   letra de 7 px. Aquí se decide cómo encaja en la pantalla que haya:
   · vertical (móvil, tablet de pie): la consola de siempre, y si sobra
     sitio CRECE entera con `zoom`, que escala texto, bordes y canvas a la
     vez sin tocar ni una de las medidas afinadas;
   · apaisada (computador, tablet o móvil tumbados): un marco ancho con las
     pantallas repartidas en columnas (html.apaisado en el CSS), que también
     crece con `zoom` en monitores grandes.
   Nunca baja de 1: en el móvil todo sigue midiendo exactamente lo mismo.
   Las medidas del marco van en px LÓGICOS (antes del zoom). */
const ENCAJE={vertical:{w:600,h:880,maxH:1100},apaisado:{w:1040,h:700,maxW:1120,maxH:860}};
let escPantalla=1;
function encajar(){
  const html=document.documentElement,b=getComputedStyle(document.body);
  /* El alto se mide con una sonda de 100dvh y no con innerHeight: en algunos
     navegadores innerHeight encoge al abrir el teclado, y el marco se
     achicaba justo mientras escribes en el terminal. dvh sigue a la barra de
     URL pero no al teclado, que es lo que ya hacía el CSS de antes. */
  let sonda=$('#sonda-vp');
  if(!sonda){
    sonda=document.createElement('div');sonda.id='sonda-vp';sonda.setAttribute('aria-hidden','true');
    sonda.style.cssText='position:fixed;left:0;top:0;width:100%;height:100vh;height:100dvh;visibility:hidden;pointer-events:none';
    document.body.appendChild(sonda);
  }
  const vp=sonda.getBoundingClientRect();
  const aw=vp.width-parseFloat(b.paddingLeft)-parseFloat(b.paddingRight);
  const ah=vp.height-parseFloat(b.paddingTop)-parseFloat(b.paddingBottom);
  const {apaisado,esc,w,h}=encajeDe(aw,ah);
  escPantalla=esc;
  html.classList.toggle('apaisado',apaisado);
  html.classList.add('encaje');
  html.style.setProperty('--esc',String(esc));
  html.style.setProperty('--app-w',w+'px');
  html.style.setProperty('--app-h',h+'px');
}
/* Las cuentas, aparte y sin DOM, para poder probarlas (test/encaje.test.mjs).
   aw×ah: el sitio disponible en px de la pantalla. Devuelve el modo, el zoom
   y el marco en px lógicos; w·esc y h·esc nunca pasan de aw y ah. */
function encajeDe(aw,ah){
  /* Dos columnas en cuanto hay sitio (680 px) y la pantalla es casi tan
     ancha como alta: monitor, tablet o móvil tumbados, y también la ventana
     partida a media pantalla (960×1040), donde la consola de pie obligaba a
     hacer scroll en la portada. Una tablet de pie (proporción 0,75) sigue
     en vertical. */
  const apaisado=aw>=680&&aw>=ah*0.9;
  const E=apaisado?ENCAJE.apaisado:ENCAJE.vertical;
  /* Escalones de 1/16: un zoom con muchos decimales hace temblar los bordes
     de la fuente de píxeles al redimensionar la ventana. */
  const esc=Math.max(1,Math.floor(Math.min(2.5,aw/E.w,ah/E.h)*16)/16);
  return {apaisado,esc,
    w:Math.floor(Math.min(E.maxW||E.w,aw/esc)),
    h:Math.floor(Math.min(E.maxH,ah/esc))};
}
/* Densidad para los canvas: la de la pantalla por el zoom del marco, para
   que un runner escalado a un monitor grande no se vea emborronado. La
   del dispositivo sigue topada en 2 como siempre (en un móvil de 3x el
   búfer se iba a 1440 px de ancho con el HD, y se pinta 60 veces por
   segundo); el zoom solo suma en pantallas que ya tienen máquina. */
const densidad=()=>Math.min(3,Math.min(2,window.devicePixelRatio||1)*escPantalla);

/* ── CONFETI ── */
function confeti(){
  const cont=document.createElement('div');
  cont.style.cssText='position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:40';
  const em=['★','✦','●','▲','■'],cols=['#ffcf3f','#54c41a','#a86bff','#6fd2f0','#ff5468'];
  for(let k=0;k<26;k++){
    const s=document.createElement('span');
    s.className='confeti';s.textContent=em[k%5];
    s.style.left=Math.random()*100+'%';s.style.color=cols[(k+1)%5];
    s.style.fontSize=(10+Math.random()*10)+'px';
    s.style.animationDelay=(Math.random()*.8)+'s';
    cont.appendChild(s);
  }
  $('#app').appendChild(cont);
  setTimeout(()=>cont.remove(),3800);
}

/* ── HUD ── */
function hud(){
  /* Tres cabeceras distintas según dónde estés. Cada rama rellena las cuatro
     casillas: así ninguna se queda con un valor de la pantalla anterior. */
  /* Marca de qué cabecera es, para que el CSS pueda apretarla en móvil sin
     que el JS tenga que saber el ancho de la pantalla. */
  $('#hud').classList.toggle('hud-titulo',pantallaId==='titulo');
  if(pantallaId==='titulo'){
    /* Portada: identidad y nivel, como la cabecera de una app.
       Sin la palabra "PTS": el ★ ya lo dice y la portada repite los puntos
       en grande dos filas más abajo, en la píldora de identidad. */
    const {pc}=progresoXp();
    $('#h-nivel').textContent='SENA';
    $('#h-estrellas').innerHTML=`★ ${S.pts}`;
    $('#h-pts').textContent='LVL '+(RANGOS.indexOf(rangoDe(S.xp))+1);
    $('#h-vidas').innerHTML=`<span class="hud-xp"><i style="width:${pc}%"></i></span>`;
  }else if(retoActivo){
    /* Reto diario: ronda y racha. No hay vidas que perder. */
    $('#h-nivel').textContent='⚡ '+(retoActivo.ronda+1)+'/'+retoActivo.tipos.length;
    $('#h-estrellas').textContent='🔥 '+RETO.rachaViva();
    $('#h-pts').textContent=String(Math.min(retoActivo.pts,9999)).padStart(4,'0');
    $('#h-vidas').textContent='';
  }else if(!salaActiva&&pantallaId.startsWith('sala')){
    /* Pantallas de la sala (proyector, espera, tabla): nada de campaña */
    $('#h-nivel').textContent='🏫 '+t('modo_sala');
    $('#h-estrellas').textContent='';
    $('#h-pts').textContent='';
    $('#h-vidas').textContent='';
  }else if(salaActiva){
    /* Sala de clase: ronda, código de la sala y puntos de la sala */
    $('#h-nivel').textContent='🏫 '+Math.min(salaActiva.ronda+1,salaActiva.juegos.length)+'/'+salaActiva.juegos.length;
    $('#h-estrellas').textContent=salaActiva.codigo;
    $('#h-pts').textContent=String(Math.min(salaActiva.pts,9999)).padStart(4,'0');
    $('#h-vidas').textContent='';
  }else{
    /* Campaña: día, estrellas, puntos y vidas */
    const d=pantallaId==='nivel'?diaAct+1:Math.min(progreso()+1,TOT_DIAS);
    /* "DÍA" va en su propio span: en pantallas estrechas el CSS lo esconde y
       deja solo el 10/15, que es la información que de verdad hace falta. */
    $('#h-nivel').innerHTML=`<span class="h-lbl">${t('dia')}</span>${d}/${TOT_DIAS}`;
    $('#h-estrellas').textContent='★ '+totalStars()+'/'+(TOT_DIAS*3);
    $('#h-pts').textContent=String(Math.min(S.pts,9999)).padStart(4,'0');
    $('#h-vidas').textContent='♥'.repeat(Math.max(0,vidas))+'♡'.repeat(Math.max(0,maxVidas()-vidas));
  }
  $('#b-lang').textContent=S.lang==='es'?'EN':'ES';
  $('#b-snd').textContent=!S.snd?'🔇':(S.mus?'🔊':'🔉');
}

/* ── SACUDIDA DE PANTALLA (al recibir daño) ── */
function sacudir(){
  const s=$('#screen');if(!s)return;
  s.classList.remove('sacudida');void s.offsetWidth;s.classList.add('sacudida');
}

/* ── RETRATOS PIXEL ── */
function cara(cv,o){
  const c=cv.getContext('2d'),P=cv.width/16;
  const R=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x*P,y*P,w*P,h*P)};
  R(0,0,16,16,'#0b0e22');
  R(3,12,10,4,o.camisa);
  R(4,3,8,8,o.skin);
  if(o.pelo){R(4,2,8,2,o.pelo);R(4,4,1,2,o.pelo);R(11,4,1,2,o.pelo);}
  if(o.largo&&o.pelo){R(3,3,1,7,o.pelo);R(12,3,1,7,o.pelo);}
  /* o.parpadeo: un instante con los ojos cerrados (lo pide retratoVivo). El
     párpado es la piel un poco más oscura, no un hueco: sin nada, la cara
     se quedaba sin ojos y leía como un fallo de dibujo, no como un parpadeo. */
  if(o.parpadeo){R(6,6,1,1,'rgba(16,16,24,.35)');R(9,6,1,1,'rgba(16,16,24,.35)');}
  else{R(6,6,1,1,'#101018');R(9,6,1,1,'#101018');}
  if(o.feliz){R(6,9,1,1,'#8a4030');R(7,10,2,1,'#8a4030');R(9,9,1,1,'#8a4030');}
  else R(6,9,4,1,'#8a4030');
  if(o.gafas){R(5,5,3,2,'rgba(111,210,240,.55)');R(8,5,1,1,'#222');R(9,5,3,2,'rgba(111,210,240,.55)');}
  if(o.corbata)R(7,12,2,3,'#c22e44');
  if(o.gorra){R(3,1,10,2,'#2e7a10');R(3,3,5,1,'#1c5400');}
  if(o.audifonos){R(3,5,1,4,'#15151f');R(12,5,1,4,'#15151f');R(3,2,10,1,'#15151f');}
  if(o.medalla){R(7,13,2,2,'#ffcf3f');}
  if(o.cafe){R(12,12,3,3,'#f4f4f8');R(12,11,3,1,'#6b4226');}
  if(o.capa){R(2,12,1,4,'#c22e44');R(13,12,1,4,'#c22e44');R(3,12,1,2,'#8c1c2e');R(12,12,1,2,'#8c1c2e');}
  if(o.corona){R(4,0,8,2,'#ffcf3f');R(5,0,1,1,'#ff5468');R(8,0,1,1,'#6fd2f0');R(11,0,1,1,'#ff5468');}
  if(o.gato){R(13,13,1,1,'#e08030');R(15,13,1,1,'#e08030');R(13,14,3,2,'#e08030');R(14,15,1,1,'#f4f4f8');}
}
/* ── RETRATO PIXEL, VERSIÓN 32×32 ──
   No es cara() estirada al doble: eso solo daría un dibujo más grande, no más
   fino. Cada trazo de cara() se dobla de coordenadas (mismo dibujo, mismo
   sitio, así sigue siendo reconocible pieza por pieza) y ENCIMA se le suma
   sombreado y algún detalle que a 16×16 no cabe — que es lo que un doblado
   simple nunca da. Recibe exactamente el mismo objeto `o` que cara(): dibujan
   el mismo personaje, este con más nivel de detalle.

   Se probó también un contorno de 1 px alrededor de la cabeza (una técnica
   normal en pixel art) y se quitó: a este tamaño de bloque se veía como un
   marco negro grueso, sobre todo bajo la barbilla, no como un borde fino. Se
   deja la nota para no repetir el intento sin capturas de por medio. */
function cara32(cv,o){
  const c=cv.getContext('2d'),P=cv.width/32;
  const R=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x*P,y*P,w*P,h*P)};
  /* Aclara/oscurece un color sólido en hex, como si la luz viniera de arriba
     a la izquierda. Los colores con alfa (las gafas) no pasan por aquí: se
     quedan tal cual, solo con las coordenadas dobladas. */
  const sombra=(hex,d)=>{
    const n=parseInt(hex.slice(1),16);
    const ch=v=>Math.max(0,Math.min(255,v+d)).toString(16).padStart(2,'0');
    return '#'+ch((n>>16)&255)+ch((n>>8)&255)+ch(n&255);
  };
  const claro=hex=>sombra(hex,34),osc=hex=>sombra(hex,-34);

  R(0,0,32,32,'#0b0e22');

  R(6,24,20,8,o.camisa);
  R(6,24,2,8,claro(o.camisa));
  R(24,24,2,8,osc(o.camisa));
  R(6,24,20,1,claro(o.camisa));

  R(8,6,16,16,o.skin);
  R(8,6,2,16,claro(o.skin));
  R(22,6,2,16,osc(o.skin));
  R(8,6,16,1,claro(o.skin));
  R(8,21,16,1,osc(o.skin));

  if(o.pelo){
    R(8,4,16,4,o.pelo);
    R(8,4,16,1,claro(o.pelo));
    R(8,7,16,1,osc(o.pelo));
    R(8,8,2,4,o.pelo);R(22,8,2,4,o.pelo);
  }
  if(o.largo&&o.pelo){
    R(6,6,2,14,o.pelo);R(24,6,2,14,o.pelo);
    R(6,6,1,14,claro(o.pelo));R(25,6,1,14,osc(o.pelo));
  }

  /* ojos con un brillo de un píxel, para que no queden dos puntos muertos;
     parpadeando, una raya de párpado en la mitad de abajo del ojo */
  if(o.parpadeo){
    R(12,13,2,1,osc(o.skin));R(18,13,2,1,osc(o.skin));
  }else{
    R(12,12,2,2,'#101018');R(18,12,2,2,'#101018');
    R(12,12,1,1,'#3a4560');R(18,12,1,1,'#3a4560');
  }

  if(o.feliz){
    R(12,18,2,2,'#8a4030');R(14,20,4,2,'#8a4030');R(18,18,2,2,'#8a4030');
    R(14,19,4,1,osc('#8a4030'));
  }else{
    R(12,18,8,2,'#8a4030');
  }

  if(o.gafas){
    R(10,10,6,4,'rgba(111,210,240,.55)');R(16,10,2,2,'#222');R(18,10,6,4,'rgba(111,210,240,.55)');
    R(11,10,2,1,'rgba(255,255,255,.45)');R(19,10,2,1,'rgba(255,255,255,.45)');
  }
  if(o.corbata){
    R(14,24,4,6,'#c22e44');R(14,24,4,2,osc('#c22e44'));R(15,26,2,1,claro('#c22e44'));
  }
  if(o.gorra){
    R(6,2,20,4,'#2e7a10');R(6,2,20,1,claro('#2e7a10'));R(6,6,10,2,'#1c5400');
  }
  if(o.audifonos){
    R(6,10,2,8,'#15151f');R(24,10,2,8,'#15151f');R(6,4,20,2,'#15151f');
    R(6,10,2,1,'#33334a');R(24,10,2,1,'#33334a');
  }
  if(o.medalla){
    R(14,26,4,4,'#ffcf3f');R(15,24,2,2,'#c22e44');R(15,27,1,1,claro('#ffcf3f'));
  }
  if(o.cafe){
    R(24,24,6,6,'#f4f4f8');R(24,22,6,2,'#6b4226');R(25,25,2,2,'#dcdce4');
    R(25,20,1,1,'rgba(255,255,255,.5)');R(27,19,1,1,'rgba(255,255,255,.35)');
  }
  if(o.capa){
    R(4,24,2,8,'#c22e44');R(26,24,2,8,'#c22e44');
    R(6,24,2,4,'#8c1c2e');R(24,24,2,4,'#8c1c2e');
  }
  if(o.corona){
    R(8,0,16,4,'#ffcf3f');R(8,0,16,1,claro('#ffcf3f'));
    R(10,0,2,2,'#ff5468');R(16,0,2,2,'#6fd2f0');R(22,0,2,2,'#ff5468');
  }
  if(o.gato){
    R(26,26,2,2,'#e08030');R(30,26,2,2,'#e08030');
    R(26,28,6,4,'#e08030');R(28,30,2,2,'#f4f4f8');
  }
}
/* Punto único por el que pasa TODO retrato del juego (el tuyo y el de los
   personajes de las cutscenes): decide entre cara() y cara32() según la
   preferencia guardada. Ningún sitio de la interfaz llama a cara()/cara32()
   directamente, así que S.av32 se aplica en todas partes por igual — el
   jurado del quiz, los diálogos, el certificado, no solo "tu" retrato. */
/* o.av32, si viene, manda sobre la preferencia: en una sala cada personaje
   sale con el detalle que eligió SU dueño, no el de quien mira. */
const retrato=(cv,o)=>((o.av32??S.av32)?cara32:cara)(cv,o);
/* ── RETRATO VIVO: el mismo retrato, pero parpadea ──
   Para las caras que están "en escena" (título, diálogo, jurado, el avatar
   grande), no para las que son un recuerdo fijo (certificado, ascenso).
   · Un solo reloj por lienzo: personalización repinta el avatar con cada
     cambio de piel o camisa, y cada llamada solo actualiza cv._cara, que
     es lo que dibuja el reloj ya en marcha. Si no, los relojes se sumaban.
   · Intervalo irregular (1,2 a 4,8 s, sorteado en cada vuelta): a tiempo
     fijo parece un metrónomo, y así las tres caras del jurado no parpadean
     a la vez.
   · tvez() se limpia solo al cambiar de pantalla (limpiarT en pantalla()),
     y con prefers-reduced-motion no se anima nada, como el resto del juego. */
const quieto=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}};
function retratoVivo(cv,o){
  if(!cv)return;
  cv._cara=o;
  retrato(cv,o);
  if(cv._vivo||quieto())return;
  cv._vivo=true;
  const parpadea=()=>{
    if(!cv.isConnected)return;
    retrato(cv,Object.assign({},cv._cara,{parpadeo:true}));
    tvez(()=>{if(cv.isConnected)retrato(cv,cv._cara)},120);
    tvez(parpadea,1200+Math.random()*3600);
  };
  tvez(parpadea,1200+Math.random()*3600);
}
const CARAS={
  yo:(f)=>({skin:SKINS[S.skin],camisa:CAMISAS[S.camisa],pelo:'#2a1c10',feliz:f,
    gafas:S.acc==='gafas',gorra:S.acc==='gorra',cafe:S.acc==='cafe',
    audifonos:S.acc==='audifonos',corbata:S.acc==='corbata',medalla:S.acc==='medalla',
    capa:S.acc==='capa',corona:S.acc==='corona',gato:S.acc==='gato'}),
  instructor:()=>({skin:'#e0b088',camisa:'#2c3460',pelo:'#9aa0aa',gafas:true}),
  lider:()=>({skin:'#d99b66',camisa:'#5a1bb0',pelo:'#241810',corbata:true}),
  compa:()=>({skin:'#f4c898',camisa:'#c22e44',pelo:'#a05224',largo:true,feliz:true}),
};
function quienCara(nom){
  if(/INSTRUCTOR/.test(nom))return CARAS.instructor();
  if(/LÍDER|LEAD/.test(nom))return CARAS.lider();
  if(/COMPA|COWORK/.test(nom))return CARAS.compa();
  return CARAS.yo(true);
}
