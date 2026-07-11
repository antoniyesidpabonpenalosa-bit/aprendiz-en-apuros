'use strict';
/* ══════════ JEFE FINAL · EL BUG FINAL ══════════
   Batalla oculta tras el runner del día 10.
   Muévete con ◀ ▶ (táctil), flechas/A-D (teclado),
   stick o cruceta (mando) o inclinando el teléfono (giro).
   Disparas commits automáticamente; esquiva los errores. */
function nvJefe(dia,ptsBase){
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
  if(HD){cv.width=640;cv.height=360;c.scale(2,2)}
  modoJefe=true; /* activa el tema musical tenso */
  const fj=facJefe(); /* factor de agresividad según dificultad */
  const p={x:152,ancho:16};
  const jefe={x:160,y:36,hp:100,dir:1};
  let balas=[],errores=[],frame=0,golpes=0,pts=0,inv=0,fin=false;
  let izq=false,der=false,prevGolpe=0,faseAnt=1;
  /* láser telegrafiado (fases 2-3): 0 nada · 1 aviso · 2 disparando */
  let laserEstado=0,laserT=0,laserX=160;
  /* controles táctiles */
  const btnI=$('#j-izq'),btnD=$('#j-der');
  btnI.onpointerdown=e=>{e.preventDefault();izq=true};
  btnI.onpointerup=btnI.onpointerleave=()=>{izq=false};
  btnD.onpointerdown=e=>{e.preventDefault();der=true};
  btnD.onpointerup=btnD.onpointerleave=()=>{der=false};
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
  document.addEventListener('keydown',kd);document.addEventListener('keyup',ku);
  alLimpiar.push(()=>{document.removeEventListener('keydown',kd);document.removeEventListener('keyup',ku)});
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
    p.x=Math.max(8,Math.min(296,p.x+mov*3.4));
    /* ── disparo automático ── */
    if(frame%16===0){balas.push({x:p.x+7,y:150});beep(880,.03,'triangle',.05)}
    balas.forEach(b=>b.y-=4.5);
    balas=balas.filter(b=>b.y>0);
    /* ── jefe se mueve y ataca ── */
    jefe.x+=jefe.dir*(0.8+fase*0.55);
    if(jefe.x<50||jefe.x>270)jefe.dir*=-1;
    /* lluvia base de errores (más frecuente en dificultades altas) */
    const cadencia=Math.max(12,Math.round((52-fase*12)/fj));
    if(frame%cadencia===0){
      errores.push({x:jefe.x+(Math.random()*40-20),y:56,v:(1.4+fase*.5+Math.random())*fj,vx:0});
      if(fase===3&&Math.random()<.5)errores.push({x:jefe.x+(Math.random()*60-30),y:56,v:(1.6+Math.random())*fj,vx:0});
    }
    /* fase 2+: ráfaga en abanico que se abre */
    if(fase>=2&&frame%Math.round((fase===3?95:150)/fj)===0){
      for(let a=-2;a<=2;a++)errores.push({x:jefe.x+a*16,y:58,v:(1.2+fase*.35)*fj,vx:a*0.45});
      beep(180,.08,'sawtooth',.06);
    }
    /* fase 2+: láser telegrafiado (avisa antes de disparar en la columna del jugador) */
    if(fase>=2&&laserEstado===0&&frame%Math.round((fase===3?150:230)/fj)===0){
      laserEstado=1;laserT=42;laserX=Math.max(14,Math.min(306,p.x+8));beep(1200,.12,'square',.05);
    }
    if(laserEstado===1){if(--laserT<=0){laserEstado=2;laserT=fase===3?34:26;beep(300,.25,'sawtooth',.12)}}
    else if(laserEstado===2){
      if(inv<=0&&Math.abs((p.x+8)-laserX)<13){
        golpes++;inv=55;SFX.mal();sacudir();
        const ge=$('#j-gol');if(ge)ge.textContent=3-golpes;
        if(golpes>=3){terminar();fallo(dia,()=>nvJefe(dia,ptsBase));return}
      }
      if(--laserT<=0)laserEstado=0;
    }
    errores.forEach(o=>{o.y+=o.v;o.x+=o.vx||0});
    errores=errores.filter(o=>o.y<185&&o.x>-20&&o.x<340);
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
      if(inv<=0&&o.y>150&&o.y<176&&Math.abs(o.x-(p.x+8))<14){
        golpes++;inv=55;o.y=999;SFX.mal();sacudir();
        if(golpes>=3){terminar();fallo(dia,()=>nvJefe(dia,ptsBase));return}
        $('#j-gol').textContent=3-golpes;
      }
    });
    if(fin)return;
    /* ── dibujo ── */
    if(HD){
      const g=c.createLinearGradient(0,0,0,180);
      g.addColorStop(0,'#1a0f2e');g.addColorStop(.7,'#08050f');g.addColorStop(1,'#030208');
      c.fillStyle=g;
    }else c.fillStyle='#120a20';
    c.fillRect(0,0,320,180);
    /* lluvia digital de fondo */
    c.fillStyle=HD?'rgba(140,61,240,.16)':'#241048';
    for(let k=0;k<8;k++){const y=(frame*2+k*47)%200;c.fillRect(20+k*40,y-20,2,12)}
    /* barra de vida del jefe */
    c.fillStyle='#07080f';c.fillRect(60,6,200,8);
    c.fillStyle=jefe.hp>33?'#c22e44':'#ff5468';
    if(HD){c.shadowColor='#ff5468';c.shadowBlur=8}
    c.fillRect(60,6,jefe.hp*2,8);
    c.shadowBlur=0;
    /* jefe (parpadea al recibir daño) */
    if(frame-prevGolpe>4||frame%4<2){
      c.font=fase===3?'44px serif':'38px serif';
      c.textAlign='center';c.textBaseline='middle';
      c.fillText(fase===1?'👾':fase===2?'😡':'🤬',jefe.x,jefe.y+4);
      c.textAlign='start';c.textBaseline='alphabetic';
    }
    /* balas (commits) */
    if(HD){c.shadowColor='#54c41a';c.shadowBlur=6}
    c.fillStyle='#54c41a';
    balas.forEach(b=>c.fillRect(b.x,b.y,3,8));
    c.shadowBlur=0;
    /* errores que caen */
    c.font='13px serif';
    errores.forEach(o=>c.fillText('❌',o.x-6,o.y));
    /* láser del jefe: aviso parpadeante y luego rayo */
    if(laserEstado===1){
      if(frame%6<3){c.fillStyle='rgba(255,84,104,.5)';c.fillRect(laserX-2,jefe.y+8,4,168-jefe.y)}
      c.fillStyle='#ff5468';c.font='bold 9px monospace';c.textAlign='center';
      c.fillText(t('avisolaser'),laserX,jefe.y+2);
      c.textAlign='start';
    }else if(laserEstado===2){
      const w=10+(laserT%4<2?2:0);
      if(HD){c.shadowColor='#ff5468';c.shadowBlur=14}
      c.fillStyle='#ff5468';c.fillRect(laserX-w/2,jefe.y+8,w,170-jefe.y);
      c.fillStyle='#ffd0d6';c.fillRect(laserX-2,jefe.y+8,4,170-jefe.y);
      c.shadowBlur=0;
    }
    /* jugador (parpadea si invulnerable) */
    if(inv%12<8){
      c.fillStyle=CAMISAS[S.camisa];c.fillRect(p.x,158,16,16);
      c.fillStyle=SKINS[S.skin];c.fillRect(p.x+2,148,12,12);
      c.fillStyle='#101018';c.fillRect(p.x+9,152,2,2);
    }
  }
  loop();
}
