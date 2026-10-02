'use strict';
/* ══════════ JEFE FINAL · EL BUG FINAL ══════════
   Batalla oculta tras el runner del día 10.
   Muévete con ◀ ▶ (táctil), flechas/A-D (teclado),
   stick o cruceta (mando) o inclinando el teléfono (giro).
   Disparas commits automáticamente; esquiva los errores. */
function nvJefe(dia,ptsBase){
  /* Se entra al jefe desde tres sitios (el mapa, el runner del día 10 y el
     del 15): la ayuda va aquí dentro para cubrir los tres. */
  if(!vistos().includes('jefe'))return conAyuda('jefe',()=>nvJefe(dia,ptsBase));
  ptsBase=ptsBase||0;
  pantalla('nivel',`
  <div class="cv-wrap">
    <div class="tope" style="width:100%">
      <span>👾 <b id="j-hp">100</b>%</span>
      <span>${t('jefefase')} <b id="j-fase">1</b>/3</span>
      <span>${t('vidas_txt')}: <b id="j-gol">3</b></span>
      <span>⛁ <b id="j-pts">0</b></span>
    </div>
    <canvas class="juego" id="j-cv" width="320" height="180"></canvas>
    <p class="cv-msg">${t('jefemsg')}</p>
    <div class="fila-cv">
      <div class="dpad">
        <button class="dp dp-izq" id="j-izq" type="button">◀</button>
        <button class="dp dp-der" id="j-der" type="button">▶</button>
      </div>
      <button class="dp" id="j-giro" type="button" style="width:auto;padding:0 12px">${t('girar')}</button>
    </div>
  </div>`);
  const cv=$('#j-cv'),c=cv.getContext('2d');
  const HD=!!S.hd;
  /* LA ARENA. En la última etapa (día 15, la revancha nocturna) la pelea es en
     un espacio más grande y con aire de terminal hacker: más ancho y MUCHO más
     alto, así las ❌ tardan más en caer y hay margen para esquivar. El resto de
     números de este archivo cuelgan de W y H en vez de ser 320 y 180. */
  const FINAL=dia===14;
  const W=FINAL?400:320, H=FINAL?270:180;
  cv.style.aspectRatio=W+'/'+H;
  cv.style.setProperty('--ar',W/H);       /* la rejilla apaisada del CSS dimensiona con esto */
  if(FINAL)$('.cv-wrap').classList.add('jefe-final');
  /* El lienzo se dibuja SIEMPRE en el espacio lógico de 320×180: el búfer se
     agranda según la densidad real de la pantalla y el transform lo compensa,
     así que ninguna coordenada del juego cambia. Antes esto era todo o nada
     (solo con el modo HD), y sin HD el navegador estiraba un búfer de 320 px
     en un móvil de alta densidad: borroso. El modo HD sigue sumando nitidez
     encima, ahora como multiplicador. */
  const dpr=densidad()*(HD?1.5:1);
  cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr);
  c.setTransform(dpr,0,0,dpr,0,0);
  modoJefe=true; /* activa el tema musical tenso */
  /* factor de agresividad: dificultad × revancha nocturna (día 15) */
  const fj=facJefe()*(dia===14?1.25:1);
  let escudo=mejora('escudo')?1:0;
  const p={x:W/2-8,ancho:16};
  const jefe={x:W/2,y:36,hp:100,dir:1};
  let balas=[],errores=[],frame=0,golpes=0,pts=0,inv=0,fin=false;
  let izq=false,der=false,prevGolpe=0,faseAnt=1;
  /* láser telegrafiado (fases 2-3): 0 nada · 1 aviso · 2 disparando */
  let laserEstado=0,laserT=0,laserX=W/2;
  /* controles táctiles */
  const btnI=$('#j-izq'),btnD=$('#j-der');
  btnI.onpointerdown=e=>{e.preventDefault();izq=true};
  /* pointercancel también suelta: en el celular el sistema cancela el toque
     (una notificación, un gesto desde el borde) y entonces NO llega pointerup.
     Sin esto el aprendiz se quedaba moviéndose solo hacia ese lado. */
  btnI.onpointerup=btnI.onpointerleave=btnI.onpointercancel=()=>{izq=false};
  btnD.onpointerdown=e=>{e.preventDefault();der=true};
  btnD.onpointerup=btnD.onpointerleave=btnD.onpointercancel=()=>{der=false};
  $('#j-giro').onclick=()=>{pedirGiro();SFX.click()};
  /* teclado */
  const kd=e=>{
    if(e.code==='ArrowLeft'||e.code==='KeyA'){e.preventDefault();izq=true}
    if(e.code==='ArrowRight'||e.code==='KeyD'){e.preventDefault();der=true}
  };
  const ku=e=>{
    if(e.code==='ArrowLeft'||e.code==='KeyA')izq=false;
    if(e.code==='ArrowRight'||e.code==='KeyD')der=false;
  };
  /* El autorrepetido del teclado no se filtra aquí a propósito: kd solo pone a
     true la bandera de movimiento, y repetirlo no cambia nada. */
  /* Al perder el foco (cambiar de ventana o de pestaña con una flecha
     pulsada) el keyup llega a otra parte: se suelta todo a mano. */
  const suelta=()=>{izq=false;der=false};
  document.addEventListener('keydown',kd);document.addEventListener('keyup',ku);
  addEventListener('blur',suelta);
  alLimpiar.push(()=>{document.removeEventListener('keydown',kd);document.removeEventListener('keyup',ku);removeEventListener('blur',suelta)});
  /* Lluvia de código tipo Matrix: columnas de caracteres que caen, con la cabeza
     brillante y la cola apagándose. Determinista por (columna, fila, fotograma/7)
     en vez de azar por fotograma, que parpadearía sin control. Con "reducir
     movimiento" se queda quieta. */
  const GLIFOS='01アイウエオカキクケコサシスセソタチツテトナニヌネ<>/{}$#;=+';
  const COLS=Math.floor(W/14);
  function matrix(){
    c.font='12px monospace';c.textAlign='center';c.textBaseline='top';
    const f=quieto()?0:frame;
    for(let k=0;k<COLS;k++){
      const x=7+k*14, vel=.7+(k*7%5)*.22, largo=7+(k*13%7);
      const cab=((f*vel)+k*53)%(H+largo*12);
      for(let r=0;r<largo;r++){
        const y=cab-r*12;
        if(y<-12||y>H)continue;
        const g=GLIFOS[(k*31+r*17+Math.floor(f/7))%GLIFOS.length];
        c.fillStyle=r===0?'#d4ffe0':'rgba(0,255,65,'+(0.42-r*0.05).toFixed(2)+')';
        c.fillText(g,x,y);
      }
    }
    c.textAlign='start';c.textBaseline='alphabetic';
  }
  function terminar(){if(raf){cancelAnimationFrame(raf);raf=0}fin=true}
  function loop(){
    if(fin)return;
    raf=requestAnimationFrame(loop);
    if(!$('#j-cv')){cancelAnimationFrame(raf);raf=0;fin=true;return}
    if(pausado)return;
    frame++;
    const fase=jefe.hp>66?1:jefe.hp>33?2:3;
    if(fase!==faseAnt){faseAnt=fase;const fe=$('#j-fase');if(fe)fe.textContent=fase}
    /* ── movimiento del jugador: táctil + teclado + mando + giro ── */
    let mov=0;
    if(izq)mov-=1;
    if(der)mov+=1;
    const m=leerMando();
    if(m){
      if(Math.abs(m.eje)>.25)mov+=m.eje;
      if(m.izq)mov-=1;
      if(m.der)mov+=1;
    }
    if(giroActivo&&Math.abs(giroGamma)>6)mov+=giroGamma/22;
    p.x=Math.max(8,Math.min(W-24,p.x+mov*3.4));
    /* a dónde mira el aprendiz: sigue el movimiento, de frente si está quieto */
    p.dir=APRENDIZ.dirDe(Math.abs(mov)>.1?mov:0,0);
    /* ── disparo automático ── */
    if(frame%16===0){balas.push({x:p.x+7,y:H-30});beep(880,.03,'triangle',.05)}
    balas.forEach(b=>b.y-=4.5);
    balas=balas.filter(b=>b.y>0);
    /* ── jefe se mueve y ataca ── */
    jefe.x+=jefe.dir*(0.8+fase*0.55);
    if(jefe.x<50||jefe.x>W-50)jefe.dir*=-1;
    /* lluvia base de errores (más frecuente en dificultades altas) */
    const cadencia=Math.max(12,Math.round((52-fase*12)/fj));
    if(frame%cadencia===0){
      errores.push({x:jefe.x+(Math.random()*40-20),y:56,v:(1.4+fase*.5+Math.random())*fj,vx:0});
      if(fase===3&&Math.random()<.5)errores.push({x:jefe.x+(Math.random()*60-30),y:56,v:(1.6+Math.random())*fj,vx:0});
    }
    /* fase 3: ráfaga en abanico que se abre. Antes salía también en la fase 2,
       pero con el rayo encima la fase 2 era demasiado; ahora el abanico se
       reserva para el tramo final. Es más LENTO que antes (cada 125 fotogramas
       en vez de 95, y las ❌ caen a tres cuartos de la velocidad): era lo que
       más golpes daba. */
    if(fase===3&&frame%Math.round(125/fj)===0){
      for(let a=-2;a<=2;a++)errores.push({x:jefe.x+a*16,y:58,v:(1.2+fase*.35)*.75*fj,vx:a*0.34});
      beep(180,.08,'sawtooth',.06);
    }
    /* fase 2+: láser telegrafiado (avisa antes de disparar en la columna del jugador) */
    if(fase>=2&&laserEstado===0&&frame%Math.round((fase===3?150:230)/fj)===0){
      laserEstado=1;laserT=42;laserX=Math.max(14,Math.min(W-14,p.x+8));beep(1200,.12,'square',.05);
    }
    if(laserEstado===1){if(--laserT<=0){laserEstado=2;laserT=fase===3?34:26;beep(300,.25,'sawtooth',.12)}}
    else if(laserEstado===2){
      if(inv<=0&&Math.abs((p.x+8)-laserX)<13){
        if(escudo>0){escudo--;inv=60;SFX.pop()}
        else{
          golpes++;inv=55;SFX.mal();sacudir();
          const ge=$('#j-gol');if(ge)ge.textContent=3-golpes;
          if(golpes>=3){terminar();fallo(dia,()=>nvJefe(dia,ptsBase));return}
        }
      }
      if(--laserT<=0)laserEstado=0;
    }
    errores.forEach(o=>{o.y+=o.v;o.x+=o.vx||0});
    errores=errores.filter(o=>o.y<H+5&&o.x>-20&&o.x<W+20);
    if(inv>0)inv--;
    /* ── colisiones: balas contra jefe ── */
    balas.forEach(b=>{
      if(fin)return;
      if(Math.abs(b.x-jefe.x)<24&&Math.abs(b.y-jefe.y)<18){
        jefe.hp=Math.max(0,jefe.hp-2);pts+=10;b.y=-9;
        prevGolpe=frame;
        if(jefe.hp<=0){
          terminar();
          darLogro('jefe');
          sumaStat('jefes');
          if(golpes===0)darLogro('intacto');
          SFX.win();
          const stars=golpes===0?3:golpes===1?2:1;
          resultado(dia,stars,ptsBase+pts+500);
          return;
        }
        $('#j-hp').textContent=jefe.hp;
        $('#j-pts').textContent=pts;
      }
    });
    if(fin)return;
    /* ── colisiones: errores contra jugador ── */
    errores.forEach(o=>{
      if(fin)return;
      if(inv<=0&&o.y>H-30&&o.y<H-4&&Math.abs(o.x-(p.x+8))<14){
        o.y=999;
        if(escudo>0){escudo--;inv=60;SFX.pop();return}
        golpes++;inv=55;SFX.mal();sacudir();
        if(golpes>=3){terminar();fallo(dia,()=>nvJefe(dia,ptsBase));return}
        $('#j-gol').textContent=3-golpes;
      }
    });
    if(fin)return;
    /* ── dibujo ── */
    if(FINAL){
      /* ── última etapa: terminal hacker, lluvia de código tipo Matrix ── */
      c.fillStyle='#000a03';c.fillRect(0,0,W,H);
      matrix();
    }else{
      if(HD){
        const g=c.createLinearGradient(0,0,0,H);
        g.addColorStop(0,'#1a0f2e');g.addColorStop(.7,'#08050f');g.addColorStop(1,'#030208');
        c.fillStyle=g;
      }else c.fillStyle='#120a20';
      c.fillRect(0,0,W,H);
      /* lluvia digital de fondo */
      c.fillStyle=HD?'rgba(140,61,240,.16)':'#241048';
      for(let k=0;k<8;k++){const y=(frame*2+k*47)%200;c.fillRect(20+k*40,y-20,2,12)}
    }
    /* barra de vida del jefe (en la última etapa, verde de terminal) */
    const bx=(W-200)/2;
    c.fillStyle=FINAL?'#001a07':'#07080f';c.fillRect(bx,6,200,8);
    c.fillStyle=jefe.hp>33?(FINAL?'#00ff41':'#c22e44'):'#ff5468';
    if(HD||FINAL){c.shadowColor=jefe.hp>33&&FINAL?'#00ff41':'#ff5468';c.shadowBlur=8}
    c.fillRect(bx,6,jefe.hp*2,8);
    c.shadowBlur=0;
    if(FINAL){c.strokeStyle='#00ff41';c.lineWidth=1;c.strokeRect(bx-.5,5.5,201,9)}
    /* jefe (parpadea al recibir daño) */
    if(frame-prevGolpe>4||frame%4<2){
      c.font=fase===3?'44px serif':'38px serif';
      c.textAlign='center';c.textBaseline='middle';
      c.fillText(fase===1?'👾':fase===2?'😡':'🤬',jefe.x,jefe.y+4);
      c.textAlign='start';c.textBaseline='alphabetic';
    }
    /* balas (commits) */
    if(HD){c.shadowColor='#54c41a';c.shadowBlur=6}
    c.fillStyle=FINAL?'#7dffa0':'#54c41a';
    balas.forEach(b=>c.fillRect(b.x,b.y,3,8));
    c.shadowBlur=0;
    /* errores que caen */
    c.font='13px serif';
    errores.forEach(o=>c.fillText('❌',o.x-6,o.y));
    /* láser del jefe: aviso parpadeante y luego rayo */
    if(laserEstado===1){
      if(frame%6<3){c.fillStyle='rgba(255,84,104,.5)';c.fillRect(laserX-2,jefe.y+8,4,H-12-jefe.y)}
      c.fillStyle='#ff5468';c.font='bold 9px monospace';c.textAlign='center';
      c.fillText(t('avisolaser'),laserX,jefe.y+2);
      c.textAlign='start';
    }else if(laserEstado===2){
      const w=10+(laserT%4<2?2:0);
      if(HD){c.shadowColor='#ff5468';c.shadowBlur=14}
      c.fillStyle='#ff5468';c.fillRect(laserX-w/2,jefe.y+8,w,H-10-jefe.y);
      c.fillStyle='#ffd0d6';c.fillRect(laserX-2,jefe.y+8,4,H-10-jefe.y);
      c.shadowBlur=0;
    }
    /* jugador (parpadea si invulnerable). El aprendiz de cuerpo entero mira
       hacia donde se mueve; si el sprite no cargó, cae al bloque de siempre. */
    if(inv%12<8){
      if(!APRENDIZ.dibujar(c,p.x+8,H-4,30,p.dir??APRENDIZ.idx.south)){
        const dy=H-180;
        c.fillStyle=CAMISAS[S.camisa];c.fillRect(p.x,158+dy,16,16);
        c.fillStyle=SKINS[S.skin];c.fillRect(p.x+2,148+dy,12,12);
        c.fillStyle='#101018';c.fillRect(p.x+9,152+dy,2,2);
      }
    }
  }
  loop();
}
