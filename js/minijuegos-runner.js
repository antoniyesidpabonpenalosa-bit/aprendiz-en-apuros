'use strict';
/* Minijuego 8: el runner (ver la lista en minijuegos.js). */
/* ══════════ MINIJUEGO 8 · RUNNER FINAL ══════════ */
function nvRunner(dia){
  const durF=Math.round(40*60*facTiempo());
  const topeGol=maxErr();
  pantalla('nivel',`
  <div class="cv-wrap">
    <div class="tope" style="width:100%">
      <span>${t('golpes')}: <b id="r-gol">0</b>/${topeGol}</span>
      <span>☕ <b id="r-caf">0</b></span>
      <span>${t('tiempo')}: <b id="r-seg">40</b>s</span>
    </div>
    <canvas class="juego" id="r-cv" width="320" height="180"></canvas>
    <p class="cv-msg">${t('runmsg')}</p>
    <div class="fila-cv">
      <div class="dpad">
        <button class="dp dp-arriba" id="r-up" type="button">▲</button>
        <button class="dp dp-abajo" id="r-dn" type="button">▼</button>
      </div>
    </div>
  </div>`);
  const cv=$('#r-cv'),c=cv.getContext('2d');
  const HD=!!S.hd;
  /* El lienzo se dibuja SIEMPRE en el espacio lógico de 320×180: el búfer se
     agranda según la densidad real de la pantalla y el transform lo compensa,
     así que ninguna coordenada del juego cambia. Antes esto era todo o nada
     (solo con el modo HD), y sin HD el navegador estiraba un búfer de 320 px
     en un móvil de alta densidad: borroso. El modo HD sigue sumando nitidez
     encima, ahora como multiplicador. */
  const dpr=densidad()*(HD?1.5:1);
  cv.width=Math.round(320*dpr); cv.height=Math.round(180*dpr);
  c.setTransform(dpr,0,0,dpr,0,0);
  const SUELO=140;
  const p={x:44,y:SUELO,vy:0,duck:0};
  const noche=dia>=10; /* deploy nocturno: más rápido y a oscuras */
  let obs=[],frame=0,golpes=0,cafes=0,pts=0,spawn=0,inv=0,prevA=false,prevAbajo=false,combo=0,fin=false;
  let escudo=mejora('escudo')?1:0;
  /* Efectos de "sensación de juego" (js/efectos.js), solo dibujo: alto =
     fotogramas que el mundo se queda quieto tras un golpe; rastro = posiciones
     recientes en el aire para la estela; aterriza = cuenta del aplastón al caer. */
  let alto=0,aterriza=0;
  /** @type {{y:number,f:number}[]} */ let rastro=[];
  const polvo=n=>{const q=FX.deCanvas(cv,p.x+7,SUELO,320,180);
    FX.chispas(q.x,q.y,{n,vel:70,col:['#9aa3d6','#e9ecff'],arco:[-Math.PI,0],g:60})};
  function comboFly(n,txt){
    const w=$('.cv-wrap');if(!w)return;
    const el=document.createElement('span');
    el.className='combo-fly';el.textContent=txt||('🔥 '+t('combo')+' x'+n);
    w.appendChild(el);setTimeout(()=>{el.remove()},700);
  }
  function salta(){if(p.y>=SUELO&&!pausado){p.vy=-8.2;beep(500,.07,'triangle',.1);polvo(5)}}
  function agacha(v){p.duck=v?26:0}
  $('#r-up').onpointerdown=e=>{e.preventDefault();salta()};
  $('#r-dn').onpointerdown=e=>{e.preventDefault();agacha(1)};
  /* Igual que en el jefe: un toque cancelado por el sistema no manda
     pointerup, y el aprendiz se quedaba agachado para siempre. */
  $('#r-dn').onpointerup=$('#r-dn').onpointerleave=$('#r-dn').onpointercancel=()=>agacha(0);
  cv.onpointerdown=e=>{e.preventDefault();salta()};
  /* Aquí el autorrepetido del teclado se deja pasar a propósito: salta() ya
     exige estar en el suelo, así que mantener la tecla solo vuelve a saltar al
     aterrizar, que es lo que cualquiera espera. (En caza-bugs y code review sí
     se filtra: allí cada repetición contaba como un golpe o una respuesta.) */
  const kd=e=>{if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();salta()}if(e.code==='ArrowDown'){e.preventDefault();agacha(1)}};
  const ku=e=>{if(e.code==='ArrowDown')agacha(0)};
  /* Cambiar de ventana con ▼ pulsada: el keyup se pierde, así que se suelta. */
  const suelta=()=>agacha(0);
  document.addEventListener('keydown',kd);document.addEventListener('keyup',ku);
  addEventListener('blur',suelta);
  alLimpiar.push(()=>{document.removeEventListener('keydown',kd);document.removeEventListener('keyup',ku);removeEventListener('blur',suelta)});
  function loop(){
    raf=requestAnimationFrame(loop);
    if(!$('#r-cv')){cancelAnimationFrame(raf);raf=0;fin=true;return}
    if(pausado||fin)return;
    /* congelado del golpe: el último cuadro se queda en pantalla */
    if(alto>0){alto--;return}
    frame++;
    /* mando: A o cruceta-arriba salta, cruceta-abajo agacha */
    const mnd=leerMando();
    if(mnd){
      const saltoPad=mnd.a||mnd.arriba;
      if(saltoPad&&!prevA)salta();
      prevA=saltoPad;
      if(mnd.abajo!==prevAbajo){agacha(mnd.abajo);prevAbajo=mnd.abajo}
    }
    const vel=2.4+frame/900+(noche?0.7:0);
    /* física */
    const enAire=p.y<SUELO;
    p.vy+=0.42;p.y+=p.vy;
    if(p.y>SUELO){p.y=SUELO;p.vy=0}
    if(enAire&&p.y>=SUELO){aterriza=8;polvo(8)}
    if(aterriza>0)aterriza--;
    if(p.y<SUELO&&frame%2===0)rastro.push({y:p.y,f:frame});
    rastro=rastro.filter(r=>frame-r.f<12);
    if(inv>0)inv--;
    /* spawns */
    if(--spawn<=0){
      spawn=alRitmo(Math.max(38,90-frame/40)+Math.random()*40);
      const r=Math.random();
      obs.push({x:340,tipo:r<.5?'bug':r<.75?'papel':'cafe'});
    }
    obs.forEach(o=>o.x-=vel);
    obs=obs.filter(o=>o.x>-24);
    /* colisiones */
    const py=p.y-30+p.duck, ph=30-p.duck;
    obs.forEach(o=>{
      if(fin)return;                  /* la partida ya acabó en un obstáculo anterior */
      const oy=o.tipo==='papel'?SUELO-34:SUELO-14;
      const oh=o.tipo==='papel'?14:14;
      if(o.x<p.x+14&&o.x+16>p.x&&oy<py+ph&&oy+oh>py){
        if(o.tipo==='cafe'){
          cafes++;combo++;sumaStat('cafes');mejorStat('racha',combo);
          const gan=60+(mejora('iman')?40:0)+(combo>=3?combo*15:0);
          pts+=gan;SFX.moneda();
          /* chispas de café y los puntos que suben desde el aprendiz */
          const q=FX.deCanvas(cv,p.x+7,p.y-15+p.duck/2,320,180);
          FX.chispas(q.x,q.y,{n:combo>=3?20:12,vel:150,col:['#ffcf3f','#fff1a8','#c98a4a']});
          FX.flotante(q.x,q.y-14,'+'+gan,combo>=3?'#ff9d2e':'#ffcf3f');
          if(combo>=3)FX.onda(q.x,q.y,'#ff9d2e',44);
          $('#r-caf').textContent=cafes;o.x=-99;
          FX.monedas(q.x,q.y,$('#r-caf'),combo>=3?6:4);
          /* la racha grande al llegar a 3 y cada 5 (pixelfx); entre medias, o con
             "reducir movimiento", la de siempre */
          if(combo>=3&&!((combo===3||combo%5===0)&&PX.racha(combo,t('combo'),cv)))comboFly(combo);
          if(combo>=5)darLogro('combo');
        }
        else if(inv<=0){
          o.x=-99;
          /* escudo dev: absorbe el primer golpe del nivel */
          const q=FX.deCanvas(cv,p.x+7,p.y-15+p.duck/2,320,180);
          if(escudo>0){escudo--;inv=70;SFX.pop();comboFly(0,'🛡');FX.onda(q.x,q.y,'#6fd2f0',50);return}
          FX.marca(q.x,q.y);FX.onda(q.x,q.y,'#ff5468',58);
          golpes++;combo=0;inv=60;SFX.mal();sacudir();$('#r-gol').textContent=golpes;
          if(!quieto()){alto=6;p.vy=Math.min(p.vy,-3)}
          if(golpes===topeGol-1&&topeGol>1)FX.peligro(true);
          /* Ojo: este return sale del callback del forEach, NO de loop(). Sin
             la bandera, la vuelta seguía y más abajo escribía en un #r-seg que
             fallo() acababa de borrar de la pantalla: "Cannot set properties of
             null". Lo encontró scripts/barrido.mjs en los días 10 y 15, que son
             los dos únicos con runner. */
          if(golpes>=topeGol){fin=true;limpiarRun();fallo(dia);return}}
      }
    });
    /* fin */
    if(fin)return;                    /* la pantalla ya cambió: nada que pintar */
    const segRest=Math.max(0,Math.ceil((durF-frame)/60));
    $('#r-seg').textContent=segRest;
    if(frame>=durF){
      fin=true;limpiarRun();
      const stars=golpes===0?3:golpes===1?2:1;
      /* día final: sobrevivir la oficina era solo la primera fase...
         Solo en la campaña: en modo libre, sin fin, reto diario y sala el
         runner llega con dia=9 y esto lanzaba la historia del jefe en mitad de
         una ronda suelta (en una sala, con toda la clase compitiendo). */
      if(enCampana()){
        if(dia===9)return rCutscene(JEFE_INTRO,()=>nvJefe(dia,pts+400+cafes*20));
        /* deploy nocturno: el BUG FINAL vuelve por venganza */
        if(dia===14)return rCutscene(JEFE2_INTRO,()=>nvJefe(dia,pts+400+cafes*20));
      }
      return resultado(dia,stars,pts+400+cafes*20);
    }
    /* dibujo (paleta nocturna en la etapa productiva) */
    if(HD){
      const g=c.createLinearGradient(0,0,0,180);
      if(noche){g.addColorStop(0,'#0d0620');g.addColorStop(.7,'#050310');g.addColorStop(1,'#020108')}
      else{g.addColorStop(0,'#131c3a');g.addColorStop(.7,'#070a16');g.addColorStop(1,'#03040a')}
      c.fillStyle=g;
    }else c.fillStyle=noche?'#070312':'#0b0e22';
    c.fillRect(0,0,320,180);
    if(noche){ /* estrellas + luna */
      c.fillStyle='#e8e4ff';
      for(let k=0;k<14;k++)c.fillRect((k*53+((k*k)%29))%320,(k*29)%70+6,1,1);
      c.fillStyle='#f4f0d8';c.beginPath();c.arc(276,26,10,0,7);c.fill();
      c.fillStyle=noche&&!HD?'#070312':'#0d0620';c.beginPath();c.arc(280,23,8,0,7);c.fill();
    }
    c.fillStyle=noche?'rgba(120,80,200,.15)':(HD?'rgba(90,110,200,.14)':'#141a38');
    for(let k=0;k<5;k++){const bx=(320-((frame*.5+k*90)%400));c.fillRect(bx,40+k*8%30,34,60)}
    if(HD){c.shadowColor=noche?'#a86bff':'#39a900';c.shadowBlur=10}
    c.fillStyle=noche?'#7a3bd0':'#39a900';c.fillRect(0,SUELO+2,320,3);
    c.shadowBlur=0;
    c.fillStyle=noche?'#0a0518':(HD?'#0a0d1c':'#11152a');c.fillRect(0,SUELO+5,320,40);
    /* jugador · es el sprite del aprendiz (js/sprite.js) mirando a la derecha:
       en el suelo recorre los 4 cuadros de la caminata, uno cada 8 fotogramas
       (el mismo ritmo de 135 ms del arte, pero contado en fotogramas para que
       se pare con la pausa y con el congelado del golpe); en el aire se queda
       con las piernas abiertas, y agachado se dibuja a dos tercios de alto,
       sobre el suelo. Es solo dibujo: la caja de choque sigue siendo la de
       p.x/p.y.
       Si el sprite no cargó, queda el dibujo por código de antes: corre con
       el paso clásico de dos cuadros, que cambia cada 8 fotogramas:
       piernas abiertas (la de atrás apenas levantada) y piernas juntas con
       el cuerpo 1 px arriba, estiradas para que el pie siga en el suelo. En el
       aire las recoge, y agachado va en cuclillas sobre el suelo: antes se
       bajaba el bloque entero 26 px y medio cuerpo quedaba hundido bajo la
       línea del piso. Es solo dibujo: la caja de choque sigue siendo la de
       p.x/p.y. Las zapatillas van claras porque sobre el fondo oscuro el
       pantalón no se distingue, y lo que se ve correr es el ir y venir de los
       pies. */
    /* estela: copias azuladas de donde estuvo en el aire, arrastradas por el mundo */
    if(!p.duck&&!quieto())for(const r of rastro){
      const k=(frame-r.f)/12;
      c.fillStyle='rgba(111,210,240,'+((1-k)*.32).toFixed(2)+')';
      c.fillRect(p.x-(frame-r.f)*vel*.5,r.y-30,14,30);
    }
    if(inv%12<8){
      /* aplastar y estirar: se estira en el aire y se aplasta al caer, desde los pies */
      let sx=1,sy=1;
      if(!quieto()&&!p.duck){
        if(p.y<SUELO){const k=Math.min(1,Math.abs(p.vy)/8);sy=1+.22*k;sx=1-.15*k}
        else if(aterriza>0){const k=Math.sin(aterriza/8*Math.PI);sy=1-.3*k;sx=1+.3*k}
      }
      c.save();
      c.translate(p.x+7,p.y);c.scale(sx,sy);c.translate(-(p.x+7),-p.y);
      if(alto>0)c.filter='brightness(0) invert(1)';   /* blanco en el instante del golpe */
      const enSuelo=p.y>=SUELO,agachado=p.duck>0,paso=(frame>>3)&1;
      let conSprite=false;
      if(APRENDIZ.listo){
        if(agachado){c.translate(p.x+7,p.y);c.scale(1,2/3);c.translate(-(p.x+7),-p.y)}
        conSprite=APRENDIZ.dibujar(c,p.x+7,p.y,30,APRENDIZ.idx.east,enSuelo?(frame>>3)&3:1);
      }
      if(!conSprite){
      const fy=agachado?p.y-20:p.y-30-(enSuelo&&paso?1:0);
      c.fillStyle=CAMISAS[S.camisa];
      if(agachado){
        c.fillRect(p.x,fy+12,14,6);
        c.fillStyle='#d8dce8';c.fillRect(p.x,fy+18,4,2);c.fillRect(p.x+10,fy+18,4,2);
      }else{
        c.fillRect(p.x,fy+12,14,11);
        /* pierna de `alto` px desde la cadera: pantalón y 2 px de zapatilla */
        const pierna=(dx,alto)=>{
          c.fillStyle=noche?'#3a2f6a':'#2e3563';c.fillRect(p.x+dx,fy+23,4,alto-2);
          c.fillStyle='#d8dce8';c.fillRect(p.x+dx,fy+21+alto,4,2);
        };
        if(!enSuelo){pierna(3,5);pierna(7,5)}
        else if(paso){pierna(3,8);pierna(7,8)}
        else{pierna(0,6);pierna(10,7)}
      }
      c.fillStyle=SKINS[S.skin];c.fillRect(p.x+1,fy,12,12);
      c.fillStyle='#101018';c.fillRect(p.x+8,fy+4,2,2);
      }
      c.restore();
    }
    /* obstáculos */
    c.font='16px serif';c.textBaseline='top';
    obs.forEach(o=>{
      const oy=o.tipo==='papel'?SUELO-36:SUELO-16;
      pxiDibujar(c,o.tipo==='bug'?'🐛':o.tipo==='papel'?'📄':'☕',o.x,oy,1.5);
    });
    c.fillStyle='#54c41a';c.font='8px monospace';
  }
  function limpiarRun(){if(raf){cancelAnimationFrame(raf);raf=0}}
  loop();
  programarInterrupcion();
}
