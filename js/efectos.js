'use strict';
/* ── EFECTOS · chispas, ondas, textos flotantes, confeti, fuegos artificiales,
   monedas al marcador, rótulos, interferencia, latido de peligro y la cortina
   de pixeles al cambiar de pantalla ──
   UN solo lienzo transparente por encima de todo el juego (position:fixed, no
   recibe toques) y un solo bucle que solo corre mientras haya algo vivo. Así
   cualquier pantalla puede soltar efectos sin tocar su HTML, y el confeti ya
   no son 26 nodos del DOM animándose a la vez.

   Se dibuja en coordenadas de la ventana: el marco del juego se escala con
   `zoom`, y un lienzo fuera del marco no hereda ese zoom. Para soltar un efecto
   sobre un canvas del juego (el runner, el jefe) está FX.deCanvas().

   Nada de esto cuenta para el juego: si el sistema pide menos movimiento
   (quieto()) no se suelta nada, y sin el lienzo el juego sigue igual.
   La lógica de cada partícula (FX.paso) es cuenta pura y tiene sus pruebas
   en test/efectos.test.mjs. */
const FX=(()=>{
  const MAX=700;                       /* tope de partículas vivas: el móvil manda */
  const COLS=['#ffcf3f','#54c41a','#a86bff','#6fd2f0','#ff5468'];
  const BUENO=['#54c41a','#ffcf3f','#9dffb0'];
  const MALO=['#ff5468','#ff8a3d','#ffd1d1'];
  const ORO=['#ffcf3f','#fff1a8','#ff9d2e'];
  /** @type {HTMLCanvasElement|null} */ let cv=null;
  /** @type {CanvasRenderingContext2D|null} */ let c=null;
  let w=0,h=0,dpr=1,corre=false,ult=0;
  /** @type {any[]} */ let ps=[];
  /* Dónde fue el último toque: los efectos de acierto y fallo salen de ahí. */
  let toque={x:0,y:0,t:-1e9};

  const rnd=(a,b)=>a+Math.random()*(b-a);
  const elige=a=>a[(Math.random()*a.length)|0];
  const colDe=col=>Array.isArray(col)?elige(col):col;

  /* Un paso de una partícula, dt en segundos. Devuelve false cuando muere.
     Es cuenta pura (sin DOM) para poder probarla. */
  function paso(p,dt){
    p.edad+=dt;
    if(p.edad>=p.vida)return false;
    if(p.arr){const k=Math.max(0,1-p.arr*dt);p.vx*=k;p.vy*=k}
    p.vy+=(p.g||0)*dt;
    p.x+=p.vx*dt;p.y+=p.vy*dt;
    if(p.vr)p.rot+=p.vr*dt;
    return true;
  }

  function lienzo(){
    if(cv)return true;
    if(typeof document==='undefined'||!document.body)return false;
    cv=document.createElement('canvas');
    cv.setAttribute('aria-hidden','true');
    cv.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:50';
    document.body.appendChild(cv);
    c=cv.getContext('2d');
    ajustar();
    addEventListener('resize',ajustar);
    return !!c;
  }
  function ajustar(){
    if(!cv||!c)return;
    dpr=Math.min(2,window.devicePixelRatio||1);
    w=window.innerWidth;h=window.innerHeight;
    cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);
    c.setTransform(dpr,0,0,dpr,0,0);
  }

  function nueva(p){
    if(quieto()||!lienzo())return;
    if(ps.length>=MAX)return;
    p.edad=0;p.rot=p.rot||0;
    ps.push(p);
    if(!corre){corre=true;ult=performance.now();requestAnimationFrame(tick)}
  }

  function tick(ts){
    if(!c){corre=false;return}
    const dt=Math.min(.05,(ts-ult)/1000||.016);ult=ts;
    c.clearRect(0,0,w,h);
    /* p.fin: lo que pasa cuando una partícula llega (la moneda al marcador) */
    ps=ps.filter(p=>{const v=paso(p,dt);if(!v&&p.fin)p.fin();return v});
    for(const p of ps)dibuja(p);
    if(ps.length)requestAnimationFrame(tick);
    else corre=false;
  }

  function dibuja(p){
    if(!c)return;
    const f=p.edad/p.vida;                       /* 0 recién nacida → 1 muriendo */
    c.globalAlpha=f>.6?Math.max(0,1-(f-.6)/.4):1;
    if(p.k==='q'){                               /* cuadradito de pixel */
      const s=Math.max(1,Math.round(p.tam*(1-f*.5)));
      c.fillStyle=p.col;c.fillRect(Math.round(p.x),Math.round(p.y),s,s);
    }else if(p.k==='c'){                         /* confeti que revolotea */
      c.save();c.translate(p.x,p.y);c.rotate(p.rot);
      c.scale(1,Math.cos(p.edad*p.giro));        /* girar de canto, como papel de verdad */
      c.fillStyle=p.col;c.fillRect(-p.tam,-p.tam/2,p.tam*2,p.tam);
      c.restore();
    }else if(p.k==='s'){                         /* estrellita ★ */
      c.fillStyle=p.col;c.font=Math.round(p.tam)+'px sans-serif';
      c.textAlign='center';c.textBaseline='middle';
      c.save();c.translate(p.x,p.y);c.rotate(p.rot);c.fillText('★',0,0);c.restore();
    }else if(p.k==='o'){                         /* onda de choque cuadrada */
      const r=p.r0+(p.r1-p.r0)*(1-(1-f)*(1-f));
      c.strokeStyle=p.col;c.lineWidth=Math.max(1,3*(1-f));
      c.strokeRect(Math.round(p.x-r),Math.round(p.y-r),Math.round(r*2),Math.round(r*2));
    }else if(p.k==='t'){                         /* "+60" que sube y se apaga */
      const pop=f<.15?1+(1-f/.15)*.7:1;          /* nace grande y se asienta */
      c.save();c.translate(Math.round(p.x),Math.round(p.y));c.scale(pop,pop);
      c.font='12px "Press Start 2P",monospace';c.textAlign='center';c.textBaseline='middle';
      c.lineWidth=4;c.strokeStyle='#0b0e22';c.strokeText(p.txt,0,0);
      c.fillStyle=p.col;c.fillText(p.txt,0,0);
      c.restore();
    }else if(p.k==='m'){                         /* moneda en curva hacia el marcador */
      const e=f*f,u=1-e;
      const x=u*u*p.x+2*u*e*p.cx+e*e*p.dx,y=u*u*p.y+2*u*e*p.cy+e*e*p.dy;
      c.globalAlpha=1;
      c.fillStyle='#ffcf3f';c.fillRect(Math.round(x-3),Math.round(y-3),6,6);
      c.fillStyle='#fff1a8';c.fillRect(Math.round(x-2),Math.round(y-2),2,2);
    }else if(p.k==='p'){                         /* cortina de pixeles que se destapa */
      const e=1-(1-f)*(1-f),B=p.b;
      c.globalAlpha=1;
      /* dos pasadas (fondo y uno de cada nueve más claro) y un solo fill cada una */
      for(const claro of [false,true]){
        c.beginPath();
        for(let i=0;i<p.u.length;i++)
          if(p.u[i]>e&&(i%9===0)===claro)c.rect(p.x+(i%p.cols)*B,p.y+Math.floor(i/p.cols)*B,B,B);
        c.fillStyle=claro?'#1b2250':'#0b0e22';c.fill();
      }
    }else if(p.k==='f'){                         /* destello de borde (daño) */
      const g=c.createRadialGradient(w/2,h/2,Math.min(w,h)*.35,w/2,h/2,Math.max(w,h)*.75);
      g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,p.col);
      c.globalAlpha=p.alfa*(1-f);c.fillStyle=g;c.fillRect(0,0,w,h);
    }
    c.globalAlpha=1;
  }

  /* ── lo que se puede soltar ── */

  /** Ráfaga de cuadraditos. o: {n, vel, col, g, arco:[desde,hasta] en radianes} */
  function chispas(x,y,o={}){
    const n=o.n||14,vel=o.vel||150,arco=o.arco||[0,Math.PI*2];
    for(let i=0;i<n;i++){
      const a=rnd(arco[0],arco[1]),v=vel*rnd(.4,1.1);
      nueva({k:'q',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-30,g:o.g??380,arr:1.2,
        vida:rnd(.45,.9),tam:2+((Math.random()*3)|0),col:colDe(o.col||COLS)});
    }
  }
  function onda(x,y,col,r1=46){
    nueva({k:'o',x,y,vx:0,vy:0,r0:4,r1,vida:.42,col:colDe(col||'#6fd2f0')});
  }
  function flotante(x,y,txt,col){
    nueva({k:'t',x,y,vx:0,vy:-46,arr:.8,vida:.95,txt:String(txt),col:colDe(col||'#ffcf3f')});
  }
  function destello(col,alfa=.3){
    nueva({k:'f',x:0,y:0,vx:0,vy:0,vida:.3,col,alfa});
  }
  function estrellas(x,y,n=6){
    for(let i=0;i<n;i++){
      const a=rnd(-Math.PI*.95,-Math.PI*.05),v=rnd(80,200);
      nueva({k:'s',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:300,arr:.6,vida:rnd(.8,1.3),
        tam:rnd(11,19),col:colDe(ORO),rot:rnd(-1,1),vr:rnd(-4,4)});
    }
  }
  /** Dos cañones desde las esquinas de abajo, en dos tandas. */
  function confeti(){
    if(quieto()||!lienzo())return;
    const tanda=()=>{
      for(const lado of [-1,1]){
        const x0=lado<0?w*.06:w*.94,y0=h*.92;
        for(let i=0;i<46;i++){
          /* hacia arriba y un poco hacia el centro */
          const a=-Math.PI/2+(-lado)*rnd(.05,.55),v=rnd(380,820);
          nueva({k:i%9===0?'s':'c',x:x0,y:y0,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:620,arr:1.5,
            vida:rnd(2.1,3.2),tam:i%9===0?rnd(12,18):rnd(3,6),col:colDe(COLS),
            rot:rnd(0,6.3),vr:rnd(-7,7),giro:rnd(5,11)});
        }
      }
    };
    tanda();setTimeout(tanda,380);
  }
  /** Explosión grande (jefe vencido): varias ráfagas, ondas y sacudida fuerte. */
  function explosion(x,y){
    for(let i=0;i<5;i++)setTimeout(()=>{
      const ox=rnd(-34,34),oy=rnd(-24,24);
      chispas(x+ox,y+oy,{n:22,vel:240,col:ORO.concat(MALO)});
      onda(x+ox,y+oy,i%2?'#ffcf3f':'#ff5468',rnd(50,84));
    },i*110);
    estrellas(x,y,10);
    if(!quieto())sacudir(2);
  }

  /** Cohete que sube hasta (x1,y1) dejando estela y revienta en un anillo. */
  function cohete(x0,y0,x1,y1,col){
    if(quieto()||!lienzo())return;
    const t=rnd(.55,.8);
    nueva({k:'q',x:x0,y:y0,vx:(x1-x0)/t,vy:(y1-y0)/t,vida:t,tam:3,col:'#fff1a8'});
    for(let i=1;i<6;i++)setTimeout(()=>chispas(x0+(x1-x0)*i/6,y0+(y1-y0)*i/6,
      {n:2,vel:30,col:['#ff9d2e','#fff1a8'],g:120,vida:.35,tam:2}),t*1000*i/6);
    setTimeout(()=>{
      for(let i=0;i<34;i++){const a=i/34*Math.PI*2,v=rnd(170,215);
        nueva({k:'q',x:x1,y:y1,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:150,arr:1.6,vida:rnd(.9,1.3),tam:3,col:colDe(col)})}
      chispas(x1,y1,{n:10,vel:90,col:['#ffffff'],g:60,tam:2});
      onda(x1,y1,colDe(col),30);
    },t*1000);
  }
  /** Fuegos artificiales: cinco cohetes de colores. Solo para lo grande. */
  function fuegos(){
    if(quieto()||!lienzo())return;
    const pal=[['#ff5468','#ffd1d1'],['#54c41a','#9dffb0'],['#6fd2f0','#ffffff'],['#a86bff','#e2cfff'],['#ffcf3f','#fff1a8']];
    pal.forEach((col,i)=>setTimeout(()=>{
      const x0=w*rnd(.15,.85),x1=x0+rnd(-60,60),y1=h*rnd(.12,.4);
      cohete(x0,h,x1,y1,col);
    },i*260));
  }
  /** Monedas que vuelan de (x,y) al elemento `el` (el contador), que salta con cada una. */
  function monedas(x,y,el,n=4){
    if(!el||quieto()||!lienzo())return;
    const r=el.getBoundingClientRect(),dx=r.left+r.width/2,dy=r.top+r.height/2;
    for(let i=0;i<n;i++)setTimeout(()=>nueva({k:'m',x,y,vx:0,vy:0,vida:.55,
      cx:(x+dx)/2+rnd(-30,30),cy:Math.min(y,dy)-rnd(40,90),dx,dy,fin:()=>saltito(el)}),i*70);
  }
  function saltito(el){el.classList.remove('salto');void el.offsetWidth;el.classList.add('salto')}
  /** Rótulo grande ("¡RACHA x3!") que entra, rebota y se va. Devuelve false si
      no se mostró (reducir movimiento), para que quien llama ponga su texto de siempre. */
  function rotulo(txt,col){
    const s=document.getElementById('screen');
    if(quieto()||!s)return false;
    const r=s.getBoundingClientRect();
    const d=document.createElement('div');
    d.className='rotulo-fx';d.setAttribute('aria-hidden','true');d.textContent=txt;
    d.style.cssText=`left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height*.7}px;`+
      `font-size:${Math.round(Math.max(14,Math.min(30,r.width/13)))}px;color:${col||'#ffcf3f'}`;
    document.body.appendChild(d);
    if(!d.animate){setTimeout(()=>d.remove(),900);return true}
    d.animate([
      {opacity:0,transform:'scale(3) rotate(-10deg)'},
      {opacity:1,transform:'scale(.9) rotate(2deg)',offset:.18},
      {opacity:1,transform:'scale(1.06) rotate(-1deg)',offset:.26},
      {opacity:1,transform:'scale(1)',offset:.32},
      {opacity:1,transform:'translateX(-2px)',offset:.4},{opacity:1,transform:'translateX(2px)',offset:.45},
      {opacity:1,transform:'translate(0,0)',offset:.75},
      {opacity:0,transform:'translateY(-40px) scale(.9)'}],{duration:1300,easing:'ease-out'}).onfinish=()=>d.remove();
    setTimeout(()=>chispas(r.left+r.width/2,r.top+r.height*.35,{n:22,vel:220,col:ORO}),230);
    return true;
  }
  /** Interferencia de tele vieja sobre lo que haya en pantalla. */
  function glitch(){
    const s=document.getElementById('screen'),el=s&&s.firstElementChild;
    if(quieto()||!el)return;
    el.classList.remove('glitch');void /** @type {HTMLElement} */(el).offsetWidth;el.classList.add('glitch');
    setTimeout(()=>el.classList.remove('glitch'),360);
  }
  /** Borde rojo que late mientras queda una sola vida. Sin movimiento queda fijo (CSS). */
  function peligro(on){
    let d=document.getElementById('peligro-fx');
    if(!on){if(d)d.remove();return}
    if(d||!document.body)return;
    d=document.createElement('div');d.id='peligro-fx';d.className='peligro-fx';d.setAttribute('aria-hidden','true');
    document.body.appendChild(d);
  }
  /* La pantalla nueva se destapa a bloques de pixel (pequeños, 6 px). */
  function cortina(){
    const s=document.getElementById('screen');
    if(quieto()||!s||!lienzo())return;
    const r=s.getBoundingClientRect(),B=6;
    if(r.width<1||r.height<1)return;
    const cols=Math.ceil(r.width/B),filas=Math.ceil(r.height/B);
    const u=new Float32Array(cols*filas);
    for(let i=0;i<u.length;i++)u[i]=Math.random();
    nueva({k:'p',x:Math.floor(r.left),y:Math.floor(r.top),vx:0,vy:0,vida:.38,b:B,cols,u});
  }
  /* Los puntos del resultado suben rodando de 0 a su cifra y dan un golpe al final. */
  function contar(){
    if(quieto())return;
    for(const el of document.querySelectorAll('#screen .pts-final')){
      const txt=el.textContent||'',m=txt.match(/\d[\d.,]*/);
      if(!m)continue;
      const fin=parseInt(m[0].replace(/[.,]/g,''),10);
      if(!(fin>0))continue;
      const antes=txt.slice(0,m.index),despues=txt.slice((m.index||0)+m[0].length);
      const t0=performance.now(),dur=Math.min(1300,500+fin);
      const vuelta=ts=>{
        if(!el.isConnected)return;
        const k=Math.min(1,(ts-t0)/dur),n=Math.round(fin*(1-Math.pow(1-k,3)));
        el.textContent=antes+(k<1?n:m[0])+despues;
        if(k<1)requestAnimationFrame(vuelta);
        else{saltito(el);const q=el.getBoundingClientRect();estrellas(q.left+q.width/2,q.top+q.height/2,6)}
      };
      el.textContent=antes+'0'+despues;
      requestAnimationFrame(vuelta);
    }
  }
  /** Lo llama pantalla() cada vez que pinta: quita el peligro y, si la pantalla
      es otra, la destapa a pixeles; si trae puntos, los hace rodar. */
  function alPintar(otra){
    peligro(false);
    if(otra)cortina();
    contar();
  }

  /* Convierte una posición del canvas del juego (espacio lógico W×H) a la de la
     ventana, que es donde se dibuja este lienzo. Mide el canvas tal cual está
     en pantalla, así que sirve con cualquier zoom, encaje o tamaño. */
  function deCanvas(el,x,y,W,H){
    const r=el.getBoundingClientRect();
    return{x:r.left+x/W*r.width,y:r.top+y/H*r.height};
  }

  /* Dónde soltar un efecto "de la pantalla": donde se tocó hace un momento; si
     fue con teclado, el elemento enfocado; si no, el centro del juego. */
  function donde(){
    if(performance.now()-toque.t<1200)return toque;
    const a=document.activeElement;
    const el=a&&a!==document.body&&a.closest&&a.closest('#screen')?a:document.getElementById('screen');
    if(el){const r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height*(el===a?0.5:0.4)}}
    return{x:innerWidth/2,y:innerHeight/2};
  }
  /* Fija de dónde salen los próximos efectos de acierto/fallo: lo usan los
     juegos de canvas para que salgan del aprendiz o del jefe y no del último
     toque en un botón. */
  function marca(x,y){toque={x,y,t:performance.now()}}
  function acierto(){
    const q=donde();
    chispas(q.x,q.y,{n:16,vel:170,col:BUENO});
    onda(q.x,q.y,'#54c41a',40);
  }
  function fallo(){
    const q=donde();
    chispas(q.x,q.y,{n:12,vel:130,col:MALO,g:520});
    destello('rgba(255,84,104,.9)',.28);
    glitch();
  }

  /* Un toque en cualquier botón suelta un puñadito de chispas: el menú deja de
     sentirse mudo. Se anota siempre dónde fue el toque para los efectos de
     acierto y fallo. Los mandos del runner y del jefe se saltan: ahí se toca
     sin parar y taparían el juego. */
  if(typeof addEventListener==='function'){
    addEventListener('pointerdown',e=>{
      toque={x:e.clientX,y:e.clientY,t:performance.now()};
      const t=/** @type {Element|null} */(e.target);
      const b=t&&t.closest?t.closest('button'):null;
      if(b&&!b.disabled&&!b.closest('.cv-wrap'))
        chispas(e.clientX,e.clientY,{n:6,vel:95,col:['#6fd2f0','#ffffff','#a86bff']});
    },true);
  }

  return{paso,chispas,onda,flotante,destello,estrellas,confeti,explosion,deCanvas,marca,acierto,fallo,
    cohete,fuegos,monedas,rotulo,glitch,peligro,cortina,contar,alPintar,
    /* para las pruebas */ _vivas:()=>ps.length,_vaciar:()=>{ps=[]}};
})();

/* Lo de siempre —SFX.ok, SFX.mal, SFX.star…— ahora también se VE. Se envuelven
   aquí en vez de tocar las ~40 llamadas repartidas por los minijuegos: cada
   pantalla sigue haciendo lo mismo y gana el efecto sola. */
(()=>{
  const o={ok:SFX.ok,mal:SFX.mal,star:SFX.star,logro:SFX.logro};
  SFX.ok=()=>{o.ok();FX.acierto()};
  SFX.mal=()=>{o.mal();FX.fallo()};
  SFX.star=()=>{o.star();FX.estrellas(innerWidth/2,innerHeight*.4,8)};
  SFX.logro=()=>{o.logro();FX.estrellas(innerWidth/2,innerHeight*.2,6)};
})();

/* El confeti de toda la vida (resultado, récords, certificados, salas) */
function confeti(){FX.confeti()}
