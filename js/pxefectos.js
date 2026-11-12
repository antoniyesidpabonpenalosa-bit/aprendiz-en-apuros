'use strict';
/* ── EFECTOS DE PIXEL ART · lo de pixelfx, puesto en el juego ──
   js/pixelfx.js (generado, ver scripts/build-pixelfx.mjs) trae el motor y tres
   efectos de pixelfx. Cada uno pinta en una cuadrícula pequeña de pixeles
   (96×88, 208×100…) y aquí esa cuadrícula se amplía con pixeles cuadrados
   sobre un lienzo propio, por encima de todo el juego, igual que el de
   js/efectos.js pero para estos:

     · el corazón que se rompe, al perder una vida (js/nucleo.js, fallo)
     · «NUEVO RANGO!» con su columna de luz, al subir de rango (resultado)
     · «xN RACHA», al encadenar cafés en el runner (js/minijuegos-runner.js)

   Mismo trato que el resto de efectos: nada de esto cuenta para el juego.
   Con "reducir movimiento" (quieto()) no se suelta nada y quien llama usa lo de
   siempre; si pixelfx.js no cargó, tampoco, y todo sigue igual. Cada función
   devuelve true si soltó el efecto y false si no, para que se pueda caer en el
   texto de antes. */
const PX=(()=>{
  const MAX=3;                          /* efectos de estos a la vez: el móvil manda */
  /* Están hechos a 30 cuadros por segundo (su `fps`) y cada cuadro cuesta más
     que uno de js/efectos.js, así que se calculan a ese ritmo y entre medias se
     vuelve a pintar el último. A 60 se vería igual y costaría el doble: en el
     runner, con un móvil flojo, eso eran tirones. */
  const PASO=1/30;
  /** @type {HTMLCanvasElement|null} */ let cv=null;
  /** @type {CanvasRenderingContext2D|null} */ let c=null;
  let w=0,h=0,dpr=1,corre=false,ult=0;
  /** @type {any[]} */ let vivos=[];

  const hay=()=>typeof PXFX!=='undefined'&&!!PXFX.efectos;

  /* El texto de los efectos sale de una fuente de pixeles propia: solo tiene
     A-Z, 0-9 y unos signos. Se quitan acentos y lo que no esté, en vez de
     dejar huecos en mitad de la palabra. */
  function limpia(txt){
    const F=PXFX.FONTS.big.glyphs;
    return String(txt).normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase()
      .split('').filter(ch=>ch===' '||F[ch]).join('').trim();
  }

  function lienzo(){
    if(cv)return true;
    if(typeof document==='undefined'||!document.body)return false;
    cv=document.createElement('canvas');
    cv.id='px-fx';cv.setAttribute('aria-hidden','true');
    cv.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:51;image-rendering:pixelated';
    document.body.appendChild(cv);
    c=cv.getContext('2d');
    ajustar();
    addEventListener('resize',ajustar);
    return !!c;
  }
  function ajustar(){
    if(!cv||!c)return;
    dpr=Math.min(2,window.devicePixelRatio||1);      /* como js/efectos.js: más no se nota y el lienzo pesa */
    w=window.innerWidth;h=window.innerHeight;
    cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);
  }

  /* El tamaño de cada pixel del efecto en la pantalla, en pixeles del
     DISPOSITIVO y siempre entero: un pixel repartido en 1,4 pixeles de pantalla
     se ve borroso y con filas más gruesas que otras. `esc` es cuánto crece el
     marco del juego en un monitor grande (js/graficos.js). */
  const pasoPx=k=>Math.max(1,Math.round(k*(typeof escPantalla==='number'?escPantalla:1)*dpr));

  /**
   * Suelta un efecto de pixelfx con su punto de origen (el `origin` del efecto)
   * en (x,y), en coordenadas de la ventana. `k`: cuántos pixeles de pantalla
   * ocupa cada pixel del efecto (1 = chiquito, 2 = el doble…).
   */
  function soltar(mod,opciones,x,y,k){
    if(quieto()||!hay()||!lienzo()||vivos.length>=MAX)return false;
    const [fw,fh]=mod.meta.size,[ox,oy]=mod.meta.origin;
    const frame=PXFX.createFrame(fw,fh);
    const fx=PXFX.createFx(mod,{x:ox,y:oy,...opciones});
    const tmp=document.createElement('canvas');tmp.width=fw;tmp.height=fh;
    const p=pasoPx(k);
    /* dónde cae en el lienzo, en pixeles del dispositivo: el origen del efecto
       queda en (x,y) y todo se redondea al pixel de pantalla */
    const r=[Math.round(x*dpr-ox*p),Math.round(y*dpr-oy*p),fw*p,fh*p];
    vivos.push({fx,frame,fw,fh,r,tmp,tc:tmp.getContext('2d'),img:new ImageData(fw,fh),acc:PASO});
    if(!corre){corre=true;ult=performance.now();requestAnimationFrame(tick)}
    return true;
  }

  function tick(ts){
    if(!c){corre=false;return}
    const dt=Math.min(.05,(ts-ult)/1000||.016);ult=ts;
    let cambio=false;
    /** @type {number[][]} */ const borrar=[];
    vivos=vivos.filter(v=>{
      v.acc+=dt;
      /* medio cuadro de margen: a 60 Hz, 2 vueltas = 33,3 ms y 1/30 = 33,3 ms exactos */
      if(v.acc<PASO-.004)return true;
      cambio=true;
      v.fx.update(v.acc);v.acc=0;
      if(v.fx.done()){borrar.push(v.r);return false}
      PXFX.clearFrame(v.frame);
      v.fx.draw(v.frame,'back');v.fx.draw(v.frame,'front');
      PXFX.composite(v.frame,v.img.data,null);
      v.tc.putImageData(v.img,0,0);
      return true;
    });
    /* El lienzo cubre toda la ventana (millones de pixeles en un móvil): se
       toca solo donde hay efectos y solo cuando alguno tiene cuadro nuevo. Se
       borran TODOS los rectángulos antes de pintar para que dos efectos que se
       solapen no se tapen mal. */
    if(cambio){
      c.setTransform(1,0,0,1,0,0);
      c.imageSmoothingEnabled=false;
      for(const r of borrar)c.clearRect(r[0],r[1],r[2],r[3]);
      for(const v of vivos)c.clearRect(v.r[0],v.r[1],v.r[2],v.r[3]);
      for(const v of vivos)c.drawImage(v.tmp,v.r[0],v.r[1],v.r[2],v.r[3]);
    }
    if(vivos.length)requestAnimationFrame(tick);
    else corre=false;
  }

  /* ── lo que se puede soltar ── */

  /** Un corazón del marcador se rompe. `vidasAntes`: las que había ANTES de
      perder esta (la última de ellas es la que cae). Sale donde está ese
      corazón en la cabecera; si no se encuentra, donde fue el último toque. */
  function corazon(vidasAntes){
    if(quieto()||!hay())return false;
    let x=innerWidth/2,y=innerHeight*.12;
    const el=document.getElementById('h-vidas');
    if(el&&el.firstChild&&vidasAntes>0){
      const t=document.createRange();t.selectNodeContents(el);
      const r=t.getBoundingClientRect(),n=(el.textContent||'').length;
      if(r.width>0&&n>0){x=r.left+r.width/n*(vidasAntes-.5);y=r.top+r.height/2}
    }
    return soltar(PXFX.efectos.corazonPerdido,{},x,y,1);
  }

  /** «NUEVO RANGO!» con su columna de luz, saliendo de `sobre` (un elemento de
      la pantalla de resultado, por lo general el icono grande). */
  function nivel(txt,sobre){
    if(quieto()||!hay())return false;
    const s=document.getElementById('screen');
    if(!s)return false;
    const rs=s.getBoundingClientRect(),re=(sobre||s).getBoundingClientRect();
    /* 2 pixeles de pantalla por pixel del efecto si cabe (176 de ancho), si no 1 */
    const k=rs.width>=176*2+24?2:1;
    return soltar(PXFX.efectos.nivel,{text:limpia(txt)},rs.left+rs.width/2,re.bottom+8,k);
  }

  /** «xN RACHA» al encadenar cafés; sale del centro de `canvas`, hacia arriba. */
  function racha(n,txt,canvas){
    if(quieto()||!hay()||!canvas)return false;
    const r=canvas.getBoundingClientRect();
    const k=r.width>=208*2+16?2:1;
    return soltar(PXFX.efectos.racha,{count:n,label:limpia(txt),palette:PXFX.PAL.fire},
      r.left+r.width/2,r.top+r.height*.3,k);
  }

  /* La primera vez que se usa, cada efecto tarda más en su primer cuadro
     (el navegador aún no ha preparado su código): en el runner, un tirón justo
     al pasar la racha. Por eso, cuando el navegador está libre, se prepara cada
     uno a escondidas con dos cuadros de mentira, de uno en uno. Con "reducir
     movimiento" no hace falta: no se suelta nunca. */
  function calentar(){
    if(quieto()||!hay())return;
    const nombres=Object.keys(PXFX.efectos);
    const uno=()=>{
      const mod=PXFX.efectos[nombres.shift()||''];
      if(!mod)return;
      try{
        const [fw,fh]=mod.meta.size,[ox,oy]=mod.meta.origin,frame=PXFX.createFrame(fw,fh);
        const fx=PXFX.createFx(mod,{x:ox,y:oy});
        for(let i=0;i<3;i++){fx.update(PASO);PXFX.clearFrame(frame);fx.draw(frame,'back');fx.draw(frame,'front')}
      }catch(e){}
      libre(uno);
    };
    libre(uno);
  }
  const libre=f=>typeof requestIdleCallback==='function'?requestIdleCallback(f,{timeout:4000}):setTimeout(f,1500);
  if(typeof addEventListener==='function')addEventListener('load',()=>libre(calentar));

  return{corazon,nivel,racha,limpia,calentar,
    /* para las pruebas */ _vivas:()=>vivos.length,_vaciar:()=>{vivos=[]}};
})();
