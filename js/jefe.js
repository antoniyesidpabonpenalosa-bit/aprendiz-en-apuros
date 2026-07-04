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
  const p={x:152,ancho:16};
  const jefe={x:160,y:36,hp:100,dir:1};
  let balas=[],errores=[],frame=0,golpes=0,pts=0,inv=0,fin=false;
  let izq=false,der=false,prevGolpe=0;
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
    const cadencia=Math.max(18,52-fase*12);
    if(frame%Math.round(cadencia)===0){
      errores.push({x:jefe.x+(Math.random()*40-20),y:56,v:1.4+fase*.5+Math.random()});
      if(fase===3&&Math.random()<.5)errores.push({x:jefe.x+(Math.random()*60-30),y:56,v:1.6+Math.random()});
    }
    errores.forEach(o=>o.y+=o.v);
    errores=errores.filter(o=>o.y<185);
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
        golpes++;inv=55;o.y=999;SFX.mal();
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
    /* jugador (parpadea si invulnerable) */
    if(inv%12<8){
      c.fillStyle=CAMISAS[S.camisa];c.fillRect(p.x,158,16,16);
      c.fillStyle=SKINS[S.skin];c.fillRect(p.x+2,148,12,12);
      c.fillStyle='#101018';c.fillRect(p.x+9,152,2,2);
    }
  }
  loop();
}
