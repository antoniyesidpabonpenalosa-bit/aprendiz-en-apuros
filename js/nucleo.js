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

/* ── ROUTER ── */
function pantalla(id,html){
  limpiarT();pausado=false;modoJefe=false;$('#pausa').hidden=true;$('#interrupcion').hidden=true;
  pantallaId=id;
  const sc=$('#screen');
  sc.innerHTML=html;
  sc.classList.remove('fade-in');void sc.offsetWidth;sc.classList.add('fade-in');
  hud();
}
function starsHtml(n,tot=3){let s='';for(let i=0;i<tot;i++)s+='<span class="'+(i<n?'on':'off')+'">★</span>';return '<span class="stars-row">'+s+'</span>'}

/* ── RESULTADO ── */
function resultado(i,stars,pts){
  const gan=Math.round(pts*facPts());
  S.pts+=gan;S.xp+=gan;
  if(stars>S.dias[i])S.dias[i]=stars;
  if(i===0)darLogro('primer');
  if(stars===3){darLogro('perfecto');sumaStat('perfectos');}
  if(progreso()>=5)darLogro('mitad');
  if(S.dif===2)darLogro('pesadilla');
  guardar();SFX.win();
  const r=rangoDe(S.xp);
  const sig=RANGOS[RANGOS.indexOf(r)+1];
  const pc=sig?Math.min(100,Math.round((S.xp-r.xp)/(sig.xp-r.xp)*100)):100;
  if(i===9){darLogro('titulado');registrarRecord();guardar();}
  if(i===14){darLogro('contrato');registrarRecord();guardar();}
  const esFinal=i===9||i===14;
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
  </div>`);
  tvez(SFX.star,300);
  confeti();
  if(i===9)$('#r-fin').onclick=()=>{SFX.click();rCutscene(FINAL[S.lang],rCertificado)};
  else if(i===14)$('#r-fin').onclick=()=>{SFX.click();rCutscene(FINAL2[S.lang],rAscenso)};
  else $('#r-sig').onclick=()=>{SFX.click();empezarDia(Math.min(i+1,NIVELES.length-1))};
  $('#r-mapa').onclick=()=>{SFX.click();rMapa()};
}
function fallo(i,reintento){
  vidas--;hud();SFX.lose();
  if(vidas<=0){
    pantalla('gameover',`
    <div class="centro">
      <span class="ico">💀</span>
      <h2 class="rojo">${t('gameover')}</h2>
      <p class="desc">${t('gameovertxt')}</p>
      <button class="btn btn2" id="g-mapa" type="button">${t('salirmapa')}</button>
    </div>`);
    $('#g-mapa').onclick=()=>{SFX.click();rMapa()};
    return;
  }
  pantalla('fallo',`
  <div class="centro">
    <span class="ico">😵</span>
    <h2 class="rojo">${t('fallado')}</h2>
    <p class="mini">${t('vidas_txt')}: ${'♥'.repeat(vidas)}</p>
    <button class="btn" id="f-re" type="button">${t('reintentar')}</button>
    <button class="btn btn2" id="f-mapa" type="button">${t('salirmapa')}</button>
  </div>`);
  $('#f-re').onclick=()=>{SFX.click();(reintento||(()=>jugarNivel(i)))()};
  $('#f-mapa').onclick=()=>{SFX.click();rMapa()};
}
