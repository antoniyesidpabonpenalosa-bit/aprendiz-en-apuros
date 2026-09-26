'use strict';
/* ── LOGROS ── */
function darLogro(id){
  if(S.logros.includes(id))return;
  S.logros.push(id);guardar();
  const L=LOGROS.find(l=>l.id===id);
  const p=$('#logro-popup');
  p.querySelector('.ico-l').textContent=L.ico;
  p.querySelector('p').innerHTML=t('logro')+'<br>'+tj(L);
  p.hidden=false;SFX.logro();
  setTimeout(()=>{p.hidden=true},2800);
}

/* ── INTERRUPCIONES ── */
function programarInterrupcion(){
  if(Math.random()<0.35)return;
  tvez(()=>{
    if(pantallaId!=='nivel')return;
    const msgs=INTERRUPCIONES[S.lang];
    $('#interrupcion p').textContent=msgs[Math.floor(Math.random()*msgs.length)];
    $('#interrupcion').hidden=false;SFX.mal();
    tvez(()=>{$('#interrupcion').hidden=true},2200);
  },5000+Math.random()*12000);
}

/* Salir a mitad de un minijuego (pausa → salir) tiene que dejar atrás el modo
   en el que se estaba. Antes no se hacía: tras salir así del reto diario, el
   siguiente día de campaña terminaba desviado al reto, y tras el sin fin la
   campaña seguía con su dificultad forzada. */
function salirDeModos(){
  retoActivo=null;libreActivo=null;sinFinActivo=null;salaActiva=null;
  RETO.salir();difForzada=-1;
}

/* ── ROUTER ── */
/* Cómo se vuelve a pintar lo que hay en pantalla AHORA. Lo entrega cada
   pantalla al pintarse y lo usa el botón de idioma (js/principal.js).

   Antes eso era una lista de pantallas escrita a mano en principal.js, y se
   quedó corta: de treinta y cuatro pantallas solo redibujaba nueve, así que
   cambiar de idioma en mitad de la campaña dejaba lo que decían los personajes
   en el idioma anterior. Con esto no hay lista que mantener.

   Una pantalla puede NO entregar ninguna a propósito: un minijuego en marcha o
   la cuenta atrás de la sala se rehacen empezando de cero, y eso le costaría la
   ronda a quien está jugando. Esas se quedan como están y solo cambia la
   cabecera. */
let rehacerPantalla=null;
function pantalla(id,html,rehacer){
  limpiarT();pausado=false;modoJefe=false;$('#pausa').hidden=true;$('#interrupcion').hidden=true;
  pantallaId=id;rehacerPantalla=rehacer||null;
  const sc=$('#screen');
  sc.innerHTML=html;
  sc.classList.remove('fade-in');void sc.offsetWidth;sc.classList.add('fade-in');
  hud();
}
function starsHtml(n,tot=3){let s='';for(let i=0;i<tot;i++)s+='<span class="'+(i<n?'on':'off')+'">★</span>';return '<span class="stars-row">'+s+'</span>'}

/* ── RESULTADO ── */
function resultado(i,stars,pts){
  /* En el reto diario no hay mapa, ni vidas, ni progreso de días: los
     minijuegos son los mismos, solo cambia a dónde va su final. */
  if(retoActivo)return retoRonda(stars,pts);
  if(libreActivo)return libreFin(stars,pts);
  if(sinFinActivo)return sinFinRonda(stars,pts);
  if(salaActiva)return salaRonda(stars,pts);
  const gan=Math.round(pts*facPts());
  S.pts+=gan;S.xp+=gan;
  if(stars>S.dias[i])S.dias[i]=stars;
  if(i===0)darLogro('primer');
  if(stars===3){darLogro('perfecto');sumaStat('perfectos');}
  if(progreso()>=8)darLogro('mitad'); /* mitad de los 15 días */
  if(S.dif===2)darLogro('pesadilla');
  guardar();SFX.win();
  const {sig,pc}=progresoXp();
  /* Primera marca publicable en el día 5, no en el 10: media etapa ya es
     mérito suficiente y así el marcador global tiene gente desde temprano. */
  if(i===4){registrarRecord(0);guardar();}
  if(i===9){darLogro('titulado');registrarRecord(1);guardar();}
  if(i===14){darLogro('contrato');registrarRecord(2);guardar();}
  const esFinal=i===9||i===14;
  /* pintar() solo dibuja y cablea los botones: todo lo que suma puntos, da
     logros o publica marcas quedó ARRIBA y no se repite al cambiar de idioma. */
  const pintar=()=>{
  pantalla('resultado',`
  <div class="centro">
    <span class="ico">${NIVELES[i].ico}</span>
    <h2 class="verde">${t('aprobado')}</h2>
    ${starsHtml(stars)}
    <p class="pts-final">+${gan} ${t('ptsgan')}</p>
    <div class="xp-bar"><div class="xp-fill" style="width:${pc}%"></div></div>
    <p class="xp-txt">${S.xp} XP · ${rangoNom()}${sig?' → '+tj(sig)+' ('+sig.xp+' XP)':''}</p>
    ${esFinal
      ?`<button class="btn" id="r-fin" type="button">${i===9?'🎓':'🚀'} ${t('continuar')}</button>`
      :`<button class="btn" id="r-sig" type="button">${t('siguiente')}</button>`}
    <button class="btn btn2" id="r-mapa" type="button">${t('salirmapa')}</button>
  </div>`,pintar);
  if(i===9)$('#r-fin').onclick=()=>{SFX.click();rCutscene(FINAL,rCertificado)};
  else if(i===14)$('#r-fin').onclick=()=>{SFX.click();rCutscene(FINAL2,rAscenso)};
  else $('#r-sig').onclick=()=>{SFX.click();empezarDia(Math.min(i+1,NIVELES.length-1))};
  $('#r-mapa').onclick=()=>{SFX.click();rMapa()};
  };
  pintar();
  tvez(SFX.star,300);
  confeti();
}
function fallo(i,reintento){
  if(retoActivo)return retoRonda(0,0);   /* en el reto se sigue, sin perder vidas */
  if(libreActivo)return libreFin(0,0);   /* en el modo libre solo cuenta la marca */
  if(sinFinActivo)return sinFinFin();    /* una sola vida: fallar acaba la racha */
  if(salaActiva)return salaRonda(0,0);   /* en la sala, como en el reto: cero y se sigue */
  vidas--;hud();SFX.lose();
  if(vidas<=0){
    const pintarGO=()=>{
    pantalla('gameover',`
    <div class="centro">
      <span class="ico">💀</span>
      <h2 class="rojo">${t('gameover')}</h2>
      <p class="desc">${t('gameovertxt')}</p>
      <button class="btn btn2" id="g-mapa" type="button">${t('salirmapa')}</button>
    </div>`,pintarGO);
    $('#g-mapa').onclick=()=>{SFX.click();rMapa()};
    };
    pintarGO();
    return;
  }
  const pintar=()=>{
  pantalla('fallo',`
  <div class="centro">
    <span class="ico">😵</span>
    <h2 class="rojo">${t('fallado')}</h2>
    <p class="mini">${t('vidas_txt')}: ${'♥'.repeat(vidas)}</p>
    <button class="btn" id="f-re" type="button">${t('reintentar')}</button>
    <button class="btn btn2" id="f-mapa" type="button">${t('salirmapa')}</button>
  </div>`,pintar);
  $('#f-re').onclick=()=>{SFX.click();(reintento||(()=>jugarNivel(i)))()};
  $('#f-mapa').onclick=()=>{SFX.click();rMapa()};
  };
  pintar();
}
