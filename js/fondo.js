'use strict';
/* ── FONDO DEL MENÚ PRINCIPAL: EL CAMPUS NOCTURNO HD (v36) ──
   En la pantalla principal (y SOLO en ella) las montañas de siempre se cambian por un
   campus nocturno en pixel art de 1600×900, hecho de capas independientes. Las demás
   pantallas, y el menú si la imagen no carga, siguen con las montañas (puro CSS, en #fondo).
   Sustituye a la ciudad animada de la v27 (hoja de 6 cuadros), que ya no existe.

   Las capas (img/portada/, mismo encuadre: cover anclado abajo al centro):
     · campus-noche.webp   el escenario, fijo.
     · estrellas-1/2.png   dos grupos que cambian de brillo despacio (11 y 17 s).
     · nubes-lejanas/cercanas.png   dos capas que se desplazan ±2,5 % (82 y 56 s).
     · ventanas.png        luz de las ventanas que sube y baja suave (13 s).
     · + un velo oscuro de CSS para que el menú se lea encima.

   Cómo funciona, sin ningún bucle de JavaScript:
     · Todo son animaciones de CSS en la capa .campus-hd, que solo existe mientras #app lleva
       la clase fondo-campus. La pone pantalla() (js/nucleo.js) llamando a fondoPantalla(id):
       con ella, las montañas se esconden (y sus animaciones se paran); sin ella, el campus
       no se dibuja y no anima nada. Así nunca corren los dos a la vez.
     · Solo se activa cuando el escenario (campus-noche.webp) ya cargó: si falla, montañas.
     · Con prefers-reduced-motion no se anima nada (estrellas y velo quietos, sin luz de
       ventanas que cambie).
     · Con la pestaña oculta las animaciones se pausan (clase pestana-oculta en <html>, con
       un solo listener de visibilitychange: este). */

const FONDO_CAMPUS={
  ANCHO:1600,ALTO:900,
  RUTAS:{base:'img/portada/campus-noche.webp',estrellas1:'img/portada/estrellas-1.png',estrellas2:'img/portada/estrellas-2.png',
         nubesLejos:'img/portada/nubes-lejanas.png',nubesCerca:'img/portada/nubes-cercanas.png',ventanas:'img/portada/ventanas.png'},
};
let fondoCampusListo=false;   /* ¿ya cargó el escenario? */
let fondoCampusFalla=false;

/* Pone o quita la clase de #app según la pantalla. Es lo único que pantalla() toca. */
function fondoPantalla(id){
  const app=document.getElementById('app');
  if(app)app.classList.toggle('fondo-campus',id==='titulo'&&fondoCampusListo);
}
/* Se pide el escenario una vez, al abrir el juego. Las capas animadas (pequeñas, ~80 KB
   entre todas) las pide el CSS cuando la capa se ve. */
function fondoPrecargar(){
  if(typeof Image==='undefined'||fondoCampusListo||fondoCampusFalla)return;
  const im=new Image();
  im.onload=()=>{fondoCampusListo=true;if(typeof pantallaId!=='undefined')fondoPantalla(pantallaId)};
  im.onerror=()=>{fondoCampusFalla=true};
  im.src=FONDO_CAMPUS.RUTAS.base;
}
fondoPrecargar();

/* Pestaña oculta: las animaciones se pausan en vez de gastar batería (la clase la
   lee el CSS: animation-play-state). */
if(typeof document!=='undefined'&&document.addEventListener){
  const marca=()=>document.documentElement.classList.toggle('pestana-oculta',document.hidden);
  document.addEventListener('visibilitychange',marca);
  marca();
}
