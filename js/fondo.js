'use strict';
/* ── FONDO DEL MENÚ PRINCIPAL: LA CIUDAD NOCTURNA (v27) ──
   En la pantalla principal (y SOLO en ella) las montañas de siempre se cambian por
   una ciudad nocturna en pixel art con ventanas verdes y violetas, estrellas que
   titilan y nubes. Las demás pantallas, y el menú si la imagen no carga, siguen
   con las montañas (puro CSS, en #fondo).

   Cómo funciona, sin ningún bucle de JavaScript:
     · img/fondo/ciudad-atlas.png es una hoja de 3 columnas × 2 filas con 6 cuadros de
       549×466. La capa .ciudad (css/estilos.css) muestra un cuadro y una animación de
       CSS con steps() los recorre, a --ciudad-ms por cuadro (800 ms: ambiente tranquilo).
     · Esta capa solo existe mientras #app lleva la clase fondo-ciudad. La pone
       pantalla() (js/nucleo.js) llamando a fondoPantalla(id): con ella, las montañas
       se esconden (y sus animaciones se paran); sin ella, la ciudad no se dibuja y no
       anima nada. Así nunca corren las dos a la vez.
     · Con prefers-reduced-motion se usa el PNG estático (el primer cuadro) y no se anima.
     · Con la pestaña oculta la animación se pausa (clase pestana-oculta en <html>).
   Si el navegador no sabe unidades de contenedor (cqw/cqh, con las que se encuadra
   "cover" sin deformar) o la imagen falla, simplemente no se activa. */

const FONDO_CIUDAD={
  /* el cuadro, en píxeles de la hoja: de aquí sale el encuadre (relación 549:466) */
  CUADRO:{w:549,h:466},COLUMNAS:3,FILAS:2,
  RUTAS:{atlas:'img/fondo/ciudad-atlas.png',estatico:'img/fondo/ciudad-estatica.png'},
};
let fondoCiudadLista=false;   /* ¿ya cargó la imagen que toca (la animada, o la estática si se pidió menos movimiento)? */
let fondoCiudadFalla=false;

/* ¿Se puede pintar? Unidades de contenedor + la imagen cargada. */
const fondoPuede=()=>{
  try{return fondoCiudadLista&&CSS.supports('width','1cqw')}catch(e){return false}
};
/* Pone o quita la clase de #app según la pantalla. Es lo único que pantalla() toca. */
function fondoPantalla(id){
  const app=document.getElementById('app');
  if(app)app.classList.toggle('fondo-ciudad',id==='titulo'&&fondoPuede());
}
/* Se pide la imagen una vez, al abrir el juego, la que se va a usar: con menos
   movimiento pedido, la estática (48 KB); si no, la hoja animada (274 KB). */
function fondoPrecargar(){
  if(typeof Image==='undefined'||fondoCiudadLista||fondoCiudadFalla)return;
  const quieta=typeof quieto==='function'&&quieto();
  const im=new Image();
  im.onload=()=>{fondoCiudadLista=true;if(typeof pantallaId!=='undefined')fondoPantalla(pantallaId)};
  im.onerror=()=>{fondoCiudadFalla=true};
  im.src=quieta?FONDO_CIUDAD.RUTAS.estatico:FONDO_CIUDAD.RUTAS.atlas;
}
fondoPrecargar();

/* Pestaña oculta: la animación se pausa en vez de gastar batería (la clase la
   lee el CSS: animation-play-state). */
if(typeof document!=='undefined'&&document.addEventListener){
  const marca=()=>document.documentElement.classList.toggle('pestana-oculta',document.hidden);
  document.addEventListener('visibilitychange',marca);
  marca();
}
