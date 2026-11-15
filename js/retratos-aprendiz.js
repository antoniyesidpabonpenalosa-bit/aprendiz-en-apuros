'use strict';
/* Retratos del jugador derivados de los atlas premium (48×48 nativos).
   Se pintan desde datos embebidos: sin carga asíncrona, sin tocar los NPC.
   El 16 y 32 se rasterizan en su propia cuadrícula antes de ampliar. */
const RETRATOS_APRENDIZ=(()=>{
  const arte=ARTE_RETRATOS_APRENDIZ, N=arte.size;
  const hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
  const lum=rgb=>.3*rgb[0]+.59*rgb[1]+.11*rgb[2];
  const seguro=(v,base)=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v)?v:base;
  const color=(h,base,ref)=>{
    const k=lum(hex(h))/lum(hex(ref));
    return '#'+hex(base).map(x=>Math.min(255,Math.round(x*k)).toString(16).padStart(2,'0')).join('');
  };
  const lienzo=n=>{const cv=document.createElement('canvas');cv.width=cv.height=n;return cv;};
  const cache=new Map();
  function baseDe(o,sexo,gesto){
    const piel=seguro(o.skin,'#f4c898'),camisa=seguro(o.camisa,'#13648c');
    const key=[sexo,gesto,piel,camisa].join(':');
    if(cache.has(key))return cache.get(key);
    const cv=lienzo(N),c=cv.getContext('2d');
    const colores=arte.palette.map(([h,rol])=>rol===1?color(String(h),piel,'#facc99'):rol===2?color(String(h),camisa,'#206eab'):String(h));
    const seq=arte.frames[sexo][gesto];let pos=0;
    for(let k=0;k<seq.length;k+=2){let n=seq[k];const i=seq[k+1];
      if(i)c.fillStyle=colores[i];
      while(n){const x=pos%N,y=Math.floor(pos/N),w=Math.min(n,N-x);if(i)c.fillRect(x,y,w,1);pos+=w;n-=w;}
    }
    if(cache.size>=96)cache.delete(cache.keys().next().value);
    cache.set(key,cv);return cv;
  }
  /* Una sola capa de accesorios para los tres tamaños, ajustada a la cara
     nueva. Se conserva la semántica de todos los nueve artículos. */
  function accesorios(c,o,sexo){
    const R=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
    const dark='#111426', gold='#ffcf3f', red='#c22e44';
    const fem=sexo==='femenina',ey=fem?23:22;
    if(o.capa){R(4,39,5,9,'#731c32');R(6,38,4,10,red);R(39,39,5,9,'#731c32');R(38,38,4,10,red);R(9,38,2,3,'#ff5468');R(37,38,2,3,'#ff5468');}
    if(o.corbata){R(22,37,4,3,dark);R(23,37,2,3,red);R(22,40,4,6,red);R(23,46,2,2,'#842037');R(22,40,1,5,'#ff5468');}
    if(o.medalla){R(19,36,2,3,red);R(21,39,2,2,red);R(27,36,2,3,'#6fd2f0');R(25,39,2,2,'#6fd2f0');R(21,41,6,6,'#9d5815');R(22,41,4,5,gold);R(23,42,2,2,'#fff4a8');}
    if(o.gafas){
      for(const x of [14,25]){R(x,ey-1,9,1,dark);R(x,ey+6,9,1,dark);R(x,ey,1,6,dark);R(x+8,ey,1,6,dark);R(x+1,ey,7,6,'rgba(111,210,240,.28)');R(x+1,ey,2,1,'#c4f6ff');R(x+1,ey+5,7,1,'#37607a');}
      R(23,ey+2,2,2,dark);R(11,ey+1,3,2,dark);R(34,ey+1,3,2,dark);
    }
    if(o.audifonos){R(12,5,24,3,dark);R(9,8,4,7,dark);R(35,8,4,7,dark);R(13,5,22,1,'#69728f');
      for(const x of [8,35]){R(x,ey-3,5,10,dark);R(x+1,ey-2,3,8,'#525e7b');R(x+1,ey-2,2,2,'#6fd2f0');}}
    if(o.gorra){R(10,3,28,8,dark);R(12,3,24,6,'#28791d');R(14,3,19,2,'#54c41a');R(9,9,30,3,'#1c5400');R(9,11,23,2,dark);R(22,4,4,3,'#b7eb9b');}
    if(o.corona){R(11,2,26,10,'#713e14');R(12,3,24,7,gold);for(const x of [12,23,34]){R(x,0,2,4,'#ffed93');R(x,4,2,3,'#f6a52c');}R(15,6,3,3,'#ff5468');R(23,6,3,3,'#6fd2f0');R(30,6,3,3,'#ff5468');R(12,10,24,1,'#fff0a0');}
    if(o.cafe){R(36,36,9,10,dark);R(37,37,7,8,'#f4f4f8');R(38,37,5,2,'#6b4226');R(44,39,3,4,'#acb2cb');R(45,40,1,2,dark);R(37,45,7,1,'#b0b7ce');R(39,32,1,3,'rgba(255,255,255,.6)');R(42,30,1,4,'rgba(255,255,255,.4)');}
    if(o.gato){R(36,39,10,9,dark);R(36,37,3,4,'#e08030');R(43,37,3,4,'#e08030');R(37,40,8,7,'#e08030');R(38,41,1,2,dark);R(43,41,1,2,dark);R(40,44,2,2,'#f4f4f8');}
  }
  function dibujar(cv,o){
    const sexo=o.apariencia==='femenina'?'femenina':'masculina';
    const solicitado=o.gesto||(o.feliz?'feliz':'normal');
    const gesto=(['normal','feliz','enojado','sorprendido','preocupado'].includes(solicitado)?solicitado:'normal')+(o.parpadeo?'-blink':'');
    const n=o.cine?N:(o.av32??S.av32)?32:16;
    const ctx=cv.getContext('2d');if(!ctx)return false;
    const img=baseDe(o,sexo,gesto),mini=lienzo(n),m=mini.getContext('2d');
    m.imageSmoothingEnabled=false;m.drawImage(img,0,0,n,n);
    // El muestreo a 16px puede comerse el ojo bajo el flequillo.
    if(n===16){
      const piel=seguro(o.skin,'#f4c898');
      for(const x of [6,9]){
        m.fillStyle=o.parpadeo?piel:'#171420';m.fillRect(x,7,1,1);
        m.fillStyle=o.parpadeo?color('#bb7448',piel,'#facc99'):'#171420';m.fillRect(x,8,1,1);
      }
    }
    const overlay=lienzo(N);accesorios(overlay.getContext('2d'),o,sexo);
    m.drawImage(overlay,0,0,n,n);
    const smooth=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=false;
    ctx.clearRect(0,0,cv.width,cv.height);
    if(!o.cine){ctx.fillStyle='#0b0e22';ctx.fillRect(0,0,cv.width,cv.height);}
    ctx.drawImage(mini,0,0,cv.width,cv.height);ctx.imageSmoothingEnabled=smooth;return true;
  }
  return {dibujar};
})();
