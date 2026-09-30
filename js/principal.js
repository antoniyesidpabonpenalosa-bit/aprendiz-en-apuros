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
/* ── AVISO DE VERSIÓN NUEVA ──
   Va ANTES de arrancar el juego a propósito: pantalla() llama a
   mostrarAvisoVersion() en cada cambio de pantalla, incluida la primera, y con
   `versionNuevaLista` declarado más abajo la primera pantalla moría en la zona
   muerta del `let` y se quedaba en blanco.

   Para quien ya tiene el juego abierto cuando publicamos: el proyector del
   aula encendido toda la mañana, o una pestaña que lleva días ahí. El service
   worker nuevo entra solo, pero la página cargada sigue con el código viejo
   hasta que se recargue; esto avisa de que toca hacerlo.

   El aviso ESPERA a que se acabe la prueba que se esté jugando: recargar en
   mitad de un minijuego costaría la ronda, y un aviso que aparece justo encima
   de lo que estás jugando es peor que no avisar. */
let versionNuevaLista=false;
function avisarVersionNueva(){
  versionNuevaLista=true;
  mostrarAvisoVersion();
}
function mostrarAvisoVersion(){
  const b=$('#aviso-ver');
  if(!b||!versionNuevaLista)return;
  if(pantallaId==='nivel'||salaActiva)return;     /* se enseña al salir */
  b.querySelector('.av-txt').textContent=t('nov_aviso');
  b.querySelector('.av-btn').textContent=t('nov_actualizar');
  b.hidden=false;
}
$('#aviso-ver .av-btn').onclick=()=>{location.reload()};
$('#aviso-ver .av-x').onclick=()=>{$('#aviso-ver').hidden=true;versionNuevaLista=false};

if('serviceWorker' in navigator&&location.protocol==='https:'){
  navigator.serviceWorker.register('./sw.js').then(reg=>{
    reg.addEventListener('updatefound',()=>{
      const nuevo=reg.installing;
      if(!nuevo)return;
      nuevo.addEventListener('statechange',()=>{
        /* Solo si YA había uno mandando: en la primera visita también se
           instala uno, y ahí no hay nada que avisar. */
        if(nuevo.state==='activated'&&navigator.serviceWorker.controller)avisarVersionNueva();
      });
    });
    /* El navegador solo busca versiones nuevas al navegar, y un proyector no
       navega en toda la clase: se pregunta cada media hora. */
    setInterval(()=>{reg.update().catch(()=>{})},30*60*1000);
  }).catch(()=>{});
}

/* Antes de la portada: si salió algo nuevo desde la última vez, se cuenta. */
rNovedades(rTitulo);
