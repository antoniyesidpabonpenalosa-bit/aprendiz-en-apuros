'use strict';
/* ── ENTRADA EXTENDIDA · mando (Gamepad API) y giroscopio ── */

/* Gamepad: se lee por sondeo dentro del bucle de cada juego de canvas.
   Devuelve null si no hay mando conectado. */
function leerMando(){
  if(!navigator.getGamepads)return null;
  const g=[...navigator.getGamepads()].find(x=>x&&x.connected);
  if(!g)return null;
  const b=i=>!!(g.buttons[i]&&g.buttons[i].pressed);
  return{
    eje:g.axes[0]||0,          /* stick izquierdo, -1 a 1 */
    a:b(0),                    /* A / cruz  → saltar-acción */
    arriba:b(12),abajo:b(13),izq:b(14),der:b(15),
  };
}
let mandoAvisado=false;
window.addEventListener('gamepadconnected',()=>{
  if(mandoAvisado)return;
  mandoAvisado=true;
  const p=document.querySelector('#logro-popup');
  if(p){
    p.querySelector('.ico-l').textContent='🎮';
    p.querySelector('p').textContent=t('mando');
    p.hidden=false;
    setTimeout(()=>{p.hidden=true},2400);
  }
});

/* Giroscopio: inclinar el teléfono mueve al jugador (gamma = eje izq/der).
   iOS exige pedir permiso desde un gesto del usuario. */
let giroActivo=false,giroGamma=0;
function escucharGiro(){
  if(giroActivo)return;
  giroActivo=true;
  window.addEventListener('deviceorientation',e=>{giroGamma=e.gamma||0});
}
function pedirGiro(){
  try{
    if(typeof DeviceOrientationEvent!=='undefined'&&DeviceOrientationEvent.requestPermission){
      DeviceOrientationEvent.requestPermission()
        .then(r=>{if(r==='granted')escucharGiro()}).catch(()=>{});
    }else escucharGiro();
  }catch(e){}
}
