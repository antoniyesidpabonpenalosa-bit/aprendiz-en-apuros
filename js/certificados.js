'use strict';
/* Certificados y marcas (ver la lista en menus.js). */
/* ── CERTIFICADO ── */
/* Hitos que dan derecho a marca en el marcador global. El día 5 existe para
   que la parte social del juego sirva de algo antes: esperar al día 10 dejaba
   la tabla vacía justo cuando más engancha ver que hay gente jugando. */
/* 0 = día 5 (mitad de la lectiva) · 1 = día 10 (fin de la lectiva, sale el
   contrato de aprendizaje) · 2 = día 15 (fin de la productiva: el título) ·
   3 = sin fin. El 🎓 es del día 15, que es cuando de verdad te titulas. */
const ICO_HITO={0:'⏳',1:'📝',2:'🎓',3:'♾️'};
function registrarRecord(hito){
  const nom=S.nombre||t('tu');
  S.records.push({n:nom,p:S.pts,x:S.xp,yo:1});
  S.records.sort((a,b)=>b.p-a.p);
  S.records=S.records.slice(0,5);
  /* Se envía al marcador global sin esperar respuesta: si no hay internet
     la partida ya quedó guardada localmente y no pasa nada. */
  RANKING.publicar({nombre:nom,puntos:S.pts,xp:S.xp,dificultad:S.dif,
                    temporada:ICO_HITO[hito]?hito:1,grupo:S.grupo});
}
function compartir(){
  const url='https://antoniyesidpabonpenalosa-bit.github.io/aprendiz-en-apuros/';
  const txt=t('compartexto').replace('{p}',S.pts).replace('{r}',rangoNom())+' '+url;
  SFX.click();
  const aviso=()=>{
    const p=$('#logro-popup');
    p.querySelector('.ico-l').textContent='📤';
    p.querySelector('p').textContent=t('copiado');
    p.hidden=false;setTimeout(()=>{p.hidden=true},2200);
  };
  if(navigator.share){navigator.share({text:txt}).catch(()=>{});return}
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(aviso).catch(()=>{try{prompt(t('copiado'),txt)}catch(e){}});
    return;
  }
  try{prompt(t('copiado'),txt)}catch(e){}
}
function rCertificado(){
  sumaStat('partidas');
  /* Solo dibuja: la partida ya se contó y el confeti no se repite. La fecha se
     recalcula dentro, que su formato también depende del idioma. */
  const pintar=()=>{
  const hoy=new Date().toLocaleDateString(S.lang==='es'?'es-CO':'en-US');
  pantalla('cert',`
  <div class="centro">
    <div class="cert">
      <p class="dia">📝 ${t('cert')} 📝</p>
      <div class="retrato-wrap"><canvas class="retrato" id="c-cara" width="64" height="64"></canvas></div>
      <p class="sub cert-de">${t('certde')}</p>
      <p class="rango">${esc(S.nombre||t('tu'))}</p>
      <p class="desc" style="text-align:center">${t('certtxt')}</p>
      ${starsHtml(Math.min(3,Math.round(totalStars()/10)))}
      <div class="stats-grid">
        <div><b>${progreso()}</b><span>${t('diascomp')}</span></div>
        <div><b>${totalStars()}</b><span>${t('estrellas')}</span></div>
        <div><b>${S.pts}</b><span>${t('ptstotal')}</span></div>
      </div>
      <p class="sub cert-firma">${t('firma')} · ${t('fecha')}: ${hoy}</p>
      <span class="rango-badge grande">${rangoNom()}</span>
    </div>
    <button class="btn btn-share" id="c-share" type="button">${t('compartir')}</button>
    <button class="btn btn2" id="c-volver" type="button">${t('volver')}</button>
  </div>`,pintar);
  retrato($('#c-cara'),Object.assign(CARAS.yo(true),{medalla:true}));
  $('#c-share').onclick=compartir;
  $('#c-volver').onclick=()=>{SFX.click();rTitulo()};
  };
  pintar();
  confeti();
}

/* ── TÍTULO DE TÉCNICO (final de la etapa productiva) ── */
function rAscenso(){
  const pintar=()=>{
  const hoy=new Date().toLocaleDateString(S.lang==='es'?'es-CO':'en-US');
  pantalla('ascenso',`
  <div class="centro">
    <div class="cert">
      <p class="dia">🎓 ${t('ascenso')} 🎓</p>
      <div class="retrato-wrap"><canvas class="retrato" id="a-cara" width="64" height="64"></canvas></div>
      <p class="sub cert-de">${t('ascensode')}</p>
      <p class="rango">${esc(S.nombre||t('tu'))}</p>
      <p class="desc" style="text-align:center">${t('ascensotxt')}</p>
      ${starsHtml(Math.min(3,Math.round(totalStars()/15)))}
      <div class="stats-grid">
        <div><b>${progreso()}</b><span>${t('diascomp')}</span></div>
        <div><b>${totalStars()}</b><span>${t('estrellas')}</span></div>
        <div><b>${S.pts}</b><span>${t('ptstotal')}</span></div>
      </div>
      <p class="sub cert-firma">${t('firma2')} · ${t('fecha')}: ${hoy}</p>
      <span class="rango-badge grande">${rangoNom()}</span>
    </div>
    <button class="btn btn-share" id="a-share" type="button">${t('compartir')}</button>
    <button class="btn btn2" id="a-volver" type="button">${t('volver')}</button>
  </div>`,pintar);
  retrato($('#a-cara'),Object.assign(CARAS.yo(true),{medalla:true,corona:S.accs.includes('corona')}));
  $('#a-share').onclick=compartir;
  $('#a-volver').onclick=()=>{SFX.click();rTitulo()};
  };
  pintar();
  confeti();
}
