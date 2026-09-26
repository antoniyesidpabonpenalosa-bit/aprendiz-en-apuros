'use strict';
/* ── PAUSA / BOTONES GLOBALES ── */
$('#b-pause').onclick=()=>{
  if(pantallaId!=='nivel'&&pantallaId!=='dialogo')return;
  pausado=true;$('#p-titulo').textContent=t('pausa');
  $('#p-cont').textContent=t('continuar');
  $('#p-mapa').textContent=salaActiva?t('sala_volver'):t('salirmapa');
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
$('#p-mapa').onclick=()=>{
  SFX.click();
  /* En una sala se vuelve a la sala (desde ahí se puede seguir), no al mapa */
  const sala=salaActiva&&salaActiva.codigo;
  salirDeModos();
  if(sala)volverASala(sala);else rMapa();
};
/* sonido en 3 estados: 🔊 todo → 🔉 solo efectos → 🔇 silencio */
$('#b-snd').onclick=()=>{
  if(S.snd&&S.mus)S.mus=false;
  else if(S.snd&&!S.mus)S.snd=false;
  else{S.snd=true;S.mus=true}
  guardar();hud();SFX.click();
};
$('#b-lang').onclick=()=>{
  S.lang=S.lang==='es'?'en':'es';aplicarIdioma();guardar();SFX.click();
  /* Cada pantalla entrega al router su forma de rehacerse (js/nucleo.js), así
     que aquí no hay lista que mantener: antes había una con nueve pantallas de
     treinta y cuatro, y cambiar de idioma en mitad de la campaña dejaba a los
     personajes hablando en el anterior.
     Un minijuego en marcha no entrega ninguna a propósito —rehacerlo sería
     empezar la ronda de cero—, así que ahí solo se actualiza la cabecera. */
  if(rehacerPantalla)rehacerPantalla();else hud();
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
