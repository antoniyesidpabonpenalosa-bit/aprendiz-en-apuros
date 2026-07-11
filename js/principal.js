'use strict';
/* ── PAUSA / BOTONES GLOBALES ── */
$('#b-pause').onclick=()=>{
  if(pantallaId!=='nivel'&&pantallaId!=='dialogo')return;
  pausado=true;$('#p-titulo').textContent=t('pausa');
  $('#p-cont').textContent=t('continuar');$('#p-mapa').textContent=t('salirmapa');
  $('#pausa').hidden=false;SFX.click();
};
$('#p-cont').onclick=()=>{pausado=false;$('#pausa').hidden=true;SFX.click()};
$('#p-mapa').onclick=()=>{SFX.click();rMapa()};
/* sonido en 3 estados: 🔊 todo → 🔉 solo efectos → 🔇 silencio */
$('#b-snd').onclick=()=>{
  if(S.snd&&S.mus)S.mus=false;
  else if(S.snd&&!S.mus)S.snd=false;
  else{S.snd=true;S.mus=true}
  guardar();hud();SFX.click();
};
$('#b-lang').onclick=()=>{
  S.lang=S.lang==='es'?'en':'es';guardar();SFX.click();
  /* re-render de pantallas de menú; en juego solo cambia el HUD */
  if(['titulo'].includes(pantallaId))rTitulo();
  else if(pantallaId==='mapa')rMapa();
  else if(pantallaId==='tienda')rTienda();
  else if(pantallaId==='logros')rLogros();
  else if(pantallaId==='records')rRecords();
  else if(pantallaId==='perso')rPerso();
  else if(pantallaId==='stats')rStats();
  else if(pantallaId==='borrar')rBorrar();
  else hud();
};

/* ── ARRANQUE ── */
aplicarModo();
vidas=maxVidas();
rTitulo();
if('serviceWorker' in navigator&&location.protocol==='https:'){
  navigator.serviceWorker.register('./sw.js').catch(()=>{});
}
