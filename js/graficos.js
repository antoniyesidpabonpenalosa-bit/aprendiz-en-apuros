'use strict';
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
  R(6,6,1,1,'#101018');R(9,6,1,1,'#101018');
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

  /* ojos con un brillo de un píxel, para que no queden dos puntos muertos */
  R(12,12,2,2,'#101018');R(18,12,2,2,'#101018');
  R(12,12,1,1,'#3a4560');R(18,12,1,1,'#3a4560');

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
