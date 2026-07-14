'use strict';
/* ── CONFETI ── */
function confeti(){
  const cont=document.createElement('div');
  cont.style.cssText='position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:40';
  const em=['★','✦','●','▲','■'],cols=['#ffcf3f','#54c41a','#a86bff','#6fd2f0','#ff5468'];
  for(let k=0;k<26;k++){
    const s=document.createElement('span');
    s.className='confeti';s.textContent=em[k%5];
    s.style.left=Math.random()*100+'%';s.style.color=cols[(k+1)%5];
    s.style.fontSize=(10+Math.random()*10)+'px';
    s.style.animationDelay=(Math.random()*.8)+'s';
    cont.appendChild(s);
  }
  $('#app').appendChild(cont);
  setTimeout(()=>cont.remove(),3800);
}

/* ── HUD ── */
function hud(){
  const d=pantallaId==='nivel'?diaAct+1:Math.min(progreso()+1,TOT_DIAS);
  $('#h-nivel').textContent=t('dia')+' '+d+'/'+TOT_DIAS;
  $('#h-estrellas').textContent='★ '+totalStars()+'/'+(TOT_DIAS*3);
  $('#h-pts').textContent=String(Math.min(S.pts,9999)).padStart(4,'0');
  $('#h-vidas').textContent='♥'.repeat(Math.max(0,vidas))+'♡'.repeat(Math.max(0,maxVidas()-vidas));
  $('#b-lang').textContent=S.lang==='es'?'EN':'ES';
  $('#b-snd').textContent=!S.snd?'🔇':(S.mus?'🔊':'🔉');
}

/* ── SACUDIDA DE PANTALLA (al recibir daño) ── */
function sacudir(){
  const s=$('#screen');if(!s)return;
  s.classList.remove('sacudida');void s.offsetWidth;s.classList.add('sacudida');
}

/* ── RETRATOS PIXEL ── */
function cara(cv,o){
  const c=cv.getContext('2d'),P=cv.width/16;
  const R=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x*P,y*P,w*P,h*P)};
  R(0,0,16,16,'#0b0e22');
  R(3,12,10,4,o.camisa);
  R(4,3,8,8,o.skin);
  if(o.pelo){R(4,2,8,2,o.pelo);R(4,4,1,2,o.pelo);R(11,4,1,2,o.pelo);}
  if(o.largo&&o.pelo){R(3,3,1,7,o.pelo);R(12,3,1,7,o.pelo);}
  R(6,6,1,1,'#101018');R(9,6,1,1,'#101018');
  if(o.feliz){R(6,9,1,1,'#8a4030');R(7,10,2,1,'#8a4030');R(9,9,1,1,'#8a4030');}
  else R(6,9,4,1,'#8a4030');
  if(o.gafas){R(5,5,3,2,'rgba(111,210,240,.55)');R(8,5,1,1,'#222');R(9,5,3,2,'rgba(111,210,240,.55)');}
  if(o.corbata)R(7,12,2,3,'#c22e44');
  if(o.gorra){R(3,1,10,2,'#2e7a10');R(3,3,5,1,'#1c5400');}
  if(o.audifonos){R(3,5,1,4,'#15151f');R(12,5,1,4,'#15151f');R(3,2,10,1,'#15151f');}
  if(o.medalla){R(7,13,2,2,'#ffcf3f');}
  if(o.cafe){R(12,12,3,3,'#f4f4f8');R(12,11,3,1,'#6b4226');}
  if(o.capa){R(2,12,1,4,'#c22e44');R(13,12,1,4,'#c22e44');R(3,12,1,2,'#8c1c2e');R(12,12,1,2,'#8c1c2e');}
  if(o.corona){R(4,0,8,2,'#ffcf3f');R(5,0,1,1,'#ff5468');R(8,0,1,1,'#6fd2f0');R(11,0,1,1,'#ff5468');}
  if(o.gato){R(13,13,1,1,'#e08030');R(15,13,1,1,'#e08030');R(13,14,3,2,'#e08030');R(14,15,1,1,'#f4f4f8');}
}
const CARAS={
  yo:(f)=>({skin:SKINS[S.skin],camisa:CAMISAS[S.camisa],pelo:'#2a1c10',feliz:f,
    gafas:S.acc==='gafas',gorra:S.acc==='gorra',cafe:S.acc==='cafe',
    audifonos:S.acc==='audifonos',corbata:S.acc==='corbata',medalla:S.acc==='medalla',
    capa:S.acc==='capa',corona:S.acc==='corona',gato:S.acc==='gato'}),
  instructor:()=>({skin:'#e0b088',camisa:'#2c3460',pelo:'#9aa0aa',gafas:true}),
  lider:()=>({skin:'#d99b66',camisa:'#5a1bb0',pelo:'#241810',corbata:true}),
  compa:()=>({skin:'#f4c898',camisa:'#c22e44',pelo:'#a05224',largo:true,feliz:true}),
};
function quienCara(nom){
  if(/INSTRUCTOR/.test(nom))return CARAS.instructor();
  if(/LÍDER|LEAD/.test(nom))return CARAS.lider();
  if(/COMPA|COWORK/.test(nom))return CARAS.compa();
  return CARAS.yo(true);
}
