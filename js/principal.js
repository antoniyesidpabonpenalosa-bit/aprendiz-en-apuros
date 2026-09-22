'use strict';
/* ── PAUSA / BOTONES GLOBALES ── */
$('#b-pause').onclick=()=>{
  if(pantallaId!=='nivel'&&pantallaId!=='dialogo')return;
  pausado=true;$('#p-titulo').textContent=t('pausa');
  $('#p-cont').textContent=t('continuar');$('#p-mapa').textContent=t('salirmapa');
  $('#pausa').hidden=false;
  /* El foco ENTRA en el diálogo. Sin esto se puede seguir tabulando por
     detrás del overlay, que es como no tener diálogo. */
  $('#p-cont').focus();
  SFX.click();
};
const cerrarPausa=()=>{
  pausado=false;$('#pausa').hidden=true;
  $('#b-pause').focus();          // y VUELVE a donde estaba
};
$('#p-cont').onclick=()=>{cerrarPausa();SFX.click()};
/* Escape cierra el diálogo, como cualquier diálogo del sistema */
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!$('#pausa').hidden){e.preventDefault();cerrarPausa();SFX.click()}
});
$('#p-mapa').onclick=()=>{SFX.click();rMapa()};
/* sonido en 3 estados: 🔊 todo → 🔉 solo efectos → 🔇 silencio */
$('#b-snd').onclick=()=>{
  if(S.snd&&S.mus)S.mus=false;
  else if(S.snd&&!S.mus)S.snd=false;
  else{S.snd=true;S.mus=true}
  guardar();hud();SFX.click();
};
$('#b-lang').onclick=()=>{
  S.lang=S.lang==='es'?'en':'es';aplicarIdioma();guardar();SFX.click();
  /* re-render de pantallas de menú; en juego solo cambia el HUD */
  if(['titulo'].includes(pantallaId))rTitulo();
  else if(pantallaId==='mapa')rMapa();
  else if(pantallaId==='tienda')rTienda();
  else if(pantallaId==='logros')rLogros();
  else if(pantallaId==='records')rRecords();
  else if(pantallaId==='perso')rPerso();
  else if(pantallaId==='stats')rStats();
  else if(pantallaId==='ascenso')rAscenso();
  else if(pantallaId==='borrar')rBorrar();
  else hud();
};

/* ── ARRANQUE ── */
/* Antes de pintar nada: la primera pantalla ya sale con el tamaño bueno.
   `resize` cubre también el giro del móvil y la barra de URL que aparece
   y desaparece; se agrupa por frame para no recalcular 60 veces por
   segundo mientras se arrastra el borde de la ventana. */
encajar();
let encajePend=0;
addEventListener('resize',()=>{if(!encajePend)encajePend=requestAnimationFrame(()=>{encajePend=0;encajar()})});
aplicarModo();
aplicarIdioma();
vidas=maxVidas();
rTitulo();
if('serviceWorker' in navigator&&location.protocol==='https:'){
  navigator.serviceWorker.register('./sw.js').catch(()=>{});
}
