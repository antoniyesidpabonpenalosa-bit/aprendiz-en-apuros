'use strict';
/* Minijuegos 6 y 7 (ver la lista en minijuegos.js). */
/* ══════════ MINIJUEGO 6 · CODE REVIEW ══════════ */
function nvReview(dia){
  const nLin=cuantos(10,6), topeErr=maxErr();
  const idxs=RETO.elegir('review',CODIGO.length,nLin,RETO.rngPara(':rev'));
  const lista=idxs.map(i=>CODIGO[i]);
  const tickMax=Math.round(45*facTiempo());
  let i=0,ticks=tickMax,errores=0,pts=0;
  pantalla('nivel',`
  <div class="l1">
    <div class="tope"><span>${t('lineasrev')}: <b id="v-prog">1</b>/${nLin}</span><span>${t('errores')}: <b id="v-err">0</b>/${topeErr}</span></div>
    <div class="term">
      <div class="term-bar"><i style="background:#ff5468"></i><i style="background:#ffcf3f"></i><i style="background:#54c41a"></i>
        <span class="term-line" style="margin-left:6px">pull-request #${dia+1}0${Math.floor(Math.random()*9)}</span></div>
      <div class="term-cuerpo">
        <p class="code-line" id="v-code"></p>
        <div class="barra"><div class="barra-fill" id="v-barra"></div></div>
      </div>
    </div>
    <div class="rev-botones">
      <button class="btn-r" id="v-no" type="button">${t('rechazar')}</button>
      <button class="btn" id="v-si" type="button">${t('aprobar')}</button>
    </div>
  </div>`);
  const code=$('#v-code'),bar=$('#v-barra');
  function pinta(){code.textContent=lista[i].c;$('#v-prog').textContent=i+1}
  function responde(aprueba){
    if(pausado)return;
    const bien=aprueba===!!lista[i].ok;
    RETO.marcar('review',idxs[i],bien);
    if(bien){pts+=50+Math.round(ticks*1.5);SFX.pop()}
    else{
      errores++;$('#v-err').textContent=errores;SFX.mal();
      code.classList.add('shake');setTimeout(()=>code.classList.remove('shake'),250);
      if(errores>=topeErr)return fallo(dia);
    }
    i++;
    if(i>=lista.length){
      if(errores===0)darLogro('revisor');
      return resultado(dia,errores===0?3:errores===1?2:1,pts+150);
    }
    ticks=tickMax;pinta();
  }
  $('#v-si').onclick=()=>responde(true);
  $('#v-no').onclick=()=>responde(false);
  /* e.repeat fuera: mantener la flecha un pelo de más respondía una línea por
     cada repetición del teclado. Medido: una sola pulsación mantenida pasaba
     de la línea 1 a la 6, aprobando cinco sin leerlas. */
  const kd=e=>{if(e.repeat)return;if(e.code==='ArrowRight')responde(true);if(e.code==='ArrowLeft')responde(false)};
  document.addEventListener('keydown',kd);
  alLimpiar.push(()=>document.removeEventListener('keydown',kd));
  tcada(()=>{
    if(pausado)return;
    ticks--;
    bar.style.width=Math.max(0,ticks/tickMax*100)+'%';
    bar.classList.toggle('peligro',ticks<tickMax*.3);
    /* tiempo agotado cuenta como respuesta equivocada */
    if(ticks<=0)responde(!lista[i].ok);
  },100);
  pinta();
  programarInterrupcion();
}

/* ══════════ MINIJUEGO 7 · MERGE CONFLICT ══════════ */
function nvMerge(dia){
  const nRon=cuantos(6,4), topeErr=maxErr();
  const idxs=RETO.elegir('merge',CONFLICTOS.length,nRon,RETO.rngPara(':merge'));
  const rondas=idxs.map(i=>CONFLICTOS[i]);
  const dur=Math.round(60*facTiempo());
  let i=0,errores=0,pts=0,seg=dur,bloq=false;
  pantalla('nivel',`
  <div class="l1">
    <div class="tope"><span>${t('ronda')}: <b id="g-prog">1</b>/${nRon}</span><span>${t('tiempo')}: <b id="g-seg">${dur}</b>s</span></div>
    <div class="barra"><div class="barra-fill" id="g-barra"></div></div>
    <p class="mini">${t('eligebuena')}</p>
    <div class="term">
      <div class="term-bar"><i style="background:#ff5468"></i><i style="background:#ffcf3f"></i><i style="background:#54c41a"></i>
        <span class="term-line" style="margin-left:6px">app.js — merge</span></div>
      <div class="term-cuerpo">
        <p class="conflicto-marca">&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD</p>
        <button class="op" id="g-a" type="button"></button>
        <p class="conflicto-marca">=======</p>
        <button class="op" id="g-b" type="button"></button>
        <p class="conflicto-marca">&gt;&gt;&gt;&gt;&gt;&gt;&gt; feature/practicante</p>
      </div>
    </div>
  </div>`);
  const A=$('#g-a'),B=$('#g-b');
  let buenaEs='a';
  function pinta(){
    const [buena,mala]=rondas[i];
    buenaEs=Math.random()<.5?'a':'b';
    A.textContent=buenaEs==='a'?buena:mala;
    B.textContent=buenaEs==='b'?buena:mala;
    A.className='op';B.className='op';
    $('#g-prog').textContent=i+1;
    bloq=false;
  }
  function elige(cual){
    if(pausado||bloq)return;
    bloq=true;
    const el=cual==='a'?A:B, otro=cual==='a'?B:A;
    RETO.marcar('merge',idxs[i],cual===buenaEs);
    if(cual===buenaEs){
      el.classList.add('bien');pts+=100;SFX.ok();
    }else{
      el.classList.add('mal');otro.classList.add('bien');
      errores++;SFX.mal();
      if(errores>=topeErr)return tvez(()=>fallo(dia),600);
    }
    tvez(()=>{
      i++;
      if(i>=rondas.length){
        if(errores===0)darLogro('resolutor');
        return resultado(dia,errores===0?3:errores===1?2:1,pts+seg*4+100);
      }
      pinta();
    },700);
  }
  A.onclick=()=>elige('a');
  B.onclick=()=>elige('b');
  tcada(()=>{
    if(pausado)return;
    seg--;$('#g-seg').textContent=seg;
    $('#g-barra').style.width=(seg/dur*100)+'%';
    $('#g-barra').classList.toggle('peligro',seg<dur*.3);
    if(seg<=0)fallo(dia);
  },1000);
  pinta();
  programarInterrupcion();
}
