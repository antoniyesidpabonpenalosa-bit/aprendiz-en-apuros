'use strict';
/* Retratos del jugador (v40.6): dibujados a mano para cada tamaño (16, 32 y 48) y para cada apariencia.
   Los datos (js/retratos-aprendiz-arte.js) los genera scripts/build-retratos-protagonistas.mjs; aquí solo se
   decodifican, se recolorean la piel y la camisa y se componen con el accesorio. No hay reducciones en
   ejecución: cada tamaño tiene su propio dibujo, así que ojos, boca y barba son nítidos y no cambian de
   sitio entre tamaños. Sin carga asíncrona y sin tocar los retratos de los NPC. */
const RETRATOS_APRENDIZ=(()=>{
  const arte=ARTE_RETRATOS_APRENDIZ;
  const hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
  const lum=rgb=>.3*rgb[0]+.59*rgb[1]+.11*rgb[2];
  const seguro=(v,base)=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v)?v:base;
  /* la piel y la camisa guardan el sombreado: el tono elegido se multiplica por la luz de cada píxel */
  const color=(h,base,ref)=>{
    const k=lum(hex(h))/lum(hex(ref));
    return '#'+hex(base).map(x=>Math.min(255,Math.round(x*k)).toString(16).padStart(2,'0')).join('');
  };
  const lienzo=n=>{const cv=document.createElement('canvas');cv.width=cv.height=n;return cv;};
  /* lista [repeticiones, color, …] → lienzo n×n; colores[i] = color CSS del índice i */
  function decodifica(seq,n,colores){
    const cv=lienzo(n),c=cv.getContext('2d');let pos=0;
    for(let k=0;k<seq.length;k+=2){let m=seq[k];const i=seq[k+1];
      if(i)c.fillStyle=colores[i];
      while(m){const x=pos%n,y=Math.floor(pos/n),w=Math.min(m,n-x);if(i)c.fillRect(x,y,w,1);pos+=w;m-=w;}
    }
    return cv;
  }
  const sinRol=arte.palette.map(([h])=>String(h));
  const capas=new Map();           // accesorios: no se recolorean, se decodifican una vez
  function capaAcc(id,sexo,n,cual){
    const d=arte.acc[id]&&arte.acc[id][sexo]&&arte.acc[id][sexo][n];if(!d||!d[cual])return null;
    const key=[id,sexo,n,cual].join(':');
    if(!capas.has(key))capas.set(key,decodifica(d[cual],n,sinRol));
    return capas.get(key);
  }
  const cache=new Map();           // retratos ya compuestos
  function compuesto(o,sexo,n,gesto,ids){
    const piel=seguro(o.skin,'#f4c898'),camisa=seguro(o.camisa,'#13648c');
    const key=[sexo,n,gesto,piel,camisa,ids.join()].join(':');
    if(cache.has(key))return cache.get(key);
    const colores=arte.palette.map(([h,rol])=>rol===1?color(String(h),piel,'#facc99'):rol===2?color(String(h),camisa,'#206eab'):String(h));
    const cv=lienzo(n),c=cv.getContext('2d');
    for(const id of ids){const d=capaAcc(id,sexo,n,'d');if(d)c.drawImage(d,0,0)}      // lo que va detrás de la cara
    c.drawImage(decodifica(arte.frames[sexo][n][gesto],n,colores),0,0);
    for(const id of ids){const e=capaAcc(id,sexo,n,'e');if(e)c.drawImage(e,0,0)}      // lo que va encima
    if(cache.size>=96)cache.delete(cache.keys().next().value);
    cache.set(key,cv);return cv;
  }
  const ACC=Object.keys(arte.acc);
  function dibujar(cv,o){
    const sexo=o.apariencia==='femenina'?'femenina':'masculina';
    const n=o.cine?48:(o.av32??S.av32)?32:16;
    const pedido=o.gesto||(o.feliz?'feliz':'normal');
    const gesto=(arte.gestos.includes(pedido)?pedido:'normal')+(o.parpadeo?'-blink':'');
    const ids=ACC.filter(id=>o[id]);
    const ctx=cv.getContext('2d');if(!ctx)return false;
    const img=compuesto(o,sexo,n,gesto,ids);
    const suave=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=false;
    ctx.clearRect(0,0,cv.width,cv.height);
    if(!o.cine){ctx.fillStyle='#0b0e22';ctx.fillRect(0,0,cv.width,cv.height);}
    ctx.drawImage(img,0,0,cv.width,cv.height);ctx.imageSmoothingEnabled=suave;return true;
  }
  return {dibujar,gestos:arte.gestos,tamanos:arte.tamanos,accesorios:ACC};
})();
