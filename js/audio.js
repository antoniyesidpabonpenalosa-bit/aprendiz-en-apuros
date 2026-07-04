'use strict';
/* ── SONIDO ── */
let AC=null;
function beep(f,d=0.08,tipo='square',v=0.12){
  if(!S.snd)return;
  try{
    AC=AC||new (window.AudioContext||window.webkitAudioContext)();
    if(AC.state==='suspended')AC.resume();
    const o=AC.createOscillator(),g=AC.createGain();
    o.type=tipo;o.frequency.value=f;
    g.gain.setValueAtTime(v,AC.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+d);
    o.connect(g);g.connect(AC.destination);
    o.start();o.stop(AC.currentTime+d);
  }catch(e){}
}
const vibra=ms=>{try{if(navigator.vibrate)navigator.vibrate(ms)}catch(e){}};
const SFX={
  click:()=>beep(440,.05),
  ok:()=>{beep(660,.07);setTimeout(()=>beep(880,.1),80)},
  mal:()=>{beep(130,.22,'sawtooth',.15);vibra(70)},
  pop:()=>beep(760,.05,'triangle',.18),
  star:()=>{beep(523,.09);setTimeout(()=>beep(659,.09),90);setTimeout(()=>beep(784,.14),180)},
  win:()=>{[523,659,784,1046].forEach((f,i)=>setTimeout(()=>beep(f,.13),i*130))},
  lose:()=>{[392,330,262,196].forEach((f,i)=>setTimeout(()=>beep(f,.16,'sawtooth'),i*150))},
  logro:()=>{[784,988,1175].forEach((f,i)=>setTimeout(()=>beep(f,.1,'triangle',.16),i*90))},
  moneda:()=>{beep(988,.05,'triangle',.16);setTimeout(()=>beep(1319,.09,'triangle',.16),60)},
};

/* ── MÚSICA DE FONDO (secuenciador chiptune) ── */
const MEL=[392,0,523,0,659,523,659,784,659,0,523,659,523,0,440,494,
           392,0,523,0,659,523,659,784,880,0,784,659,523,0,494,440];
const BAJ=[131,165,196,165,147,175,220,175];
let musPaso=0;
setInterval(()=>{
  if(!S.snd||pausado||document.hidden)return;
  const n=MEL[musPaso%MEL.length];
  if(n)beep(n,.14,'triangle',.035);
  if(musPaso%2===0)beep(BAJ[(musPaso>>2)%BAJ.length],.18,'square',.028);
  musPaso++;
},170);
