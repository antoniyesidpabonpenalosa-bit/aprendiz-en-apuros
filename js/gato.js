'use strict';
/* Gato de oficina (v40.11): acompañante visual INDEPENDIENTE del protagonista.
   Ya no es una pieza pegada al cuerpo del aprendiz: tiene su propia posición, sus sprites (js/gato-arte.js, generado por
   scripts/build-gato.mjs: reposo, caminata, 8 orientaciones, parpadeo y cola) y su propio comportamiento. Se coloca junto al
   protagonista (a su lado o detrás, según hacia dónde mire), lo sigue con un pequeño retraso, camina mientras se mueve y se sienta
   cuando se detiene; sentado mueve la cola y parpadea. Es solo visual: no entra en colisiones, ni en velocidades, ni en la puntuación.
   Con «reducir movimiento» (quieto()) se queda sentado y sin animar.
   Uso en un lienzo del juego:  GATO.acompanar(ctx, x, yPie, alto, dirJugador, mueve)  (después de dibujar al aprendiz)
   Uso en la página (pasillo, menú, vestidor):  GATO.montar({cuerpo, contenedor, dir:()=>…, mueve:()=>…, activo:()=>…}) */
const GATO = (()=>{
  const A = (typeof ARTE_GATO!=='undefined')?ARTE_GATO:null;
  /* dónde se coloca respecto a los pies del aprendiz, en píxeles del sprite (74 de alto): [dx, dy] por orientación (S, SE, E, NE, N, NO, O, SO).
     Detrás de él cuando camina de lado; a su lado cuando está de frente o de espaldas. */
  const POS = [[19,2],[-16,3],[-19,1],[-16,-2],[19,-2],[16,-2],[19,1],[16,3]];
  const VEL = 900, MIN = 7, SALTO = 70, TAU = 12;          // velocidad máxima y mínima para «andar» (px sprite/s), distancia a la que salta junto a él y rapidez del suavizado
  const lienzos = new Map();
  function lienzo(clave, filas){
    let c = lienzos.get(clave); if(c) return c;
    c = document.createElement('canvas'); c.width = A.w; c.height = A.h;
    const g = c.getContext('2d'), pal = A.paleta, f = filas.split('/');
    f.forEach((fila,y)=>{ for(let x=0;x<fila.length;x++){ const ch=fila[x]; if(ch!=='.'){ g.fillStyle=pal[ch]; g.fillRect(x,y,1,1); } } });
    lienzos.set(clave, c); return c;
  }
  const quietoYa = () => (typeof quieto==='function') ? quieto() : false;
  const activoYa = () => typeof S!=='undefined' && S.acc==='gato';

  /* un cuadro: estado 'camina' (cuadro 0..3) o 'reposo' (cola 0..3, con o sin parpadeo) */
  function cuadro(estado, dir, f, parpadeo){
    if(!A) return null;
    const d = ((dir%8)+8)%8, k = ((f%4)+4)%4;
    if(estado==='camina') return lienzo('c'+d+k, A.camina[d][k]);
    return lienzo((parpadeo?'p':'r')+d+k, (parpadeo?A.reposoParpadeo:A.reposo)[d][k]);
  }
  /* dibuja un cuadro con el ancla (centro de las patas) en (x, yPie); sc = píxeles de pantalla por píxel de sprite del gato */
  function pinta(ctx, x, yPie, sc, estado, dir, f, parpadeo){
    const c = cuadro(estado, dir, f, parpadeo); if(!c) return false;
    const suave = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false;
    ctx.drawImage(c, 0, 0, A.w, A.h, Math.round(x - A.ax*sc), Math.round(yPie - A.ay*sc), Math.round(A.w*sc), Math.round(A.h*sc));
    ctx.imageSmoothingEnabled = suave; return true;
  }
  /* orientación (0 S … 7 SO) de un vector de pantalla (x a la derecha, y hacia abajo) */
  function orienta(vx, vy){ const a = Math.atan2(vx, vy)*180/Math.PI; return ((Math.round(a/45)%8)+8)%8; }

  /* ── el comportamiento: una instancia por lienzo o por montaje ── */
  function nuevo(){ return { x:null, y:null, t:0, dir:0, paso:0, anda:false, vel:0, semilla:Math.random()*4000 }; }
  /* avanza el estado. (hx, hy): pies del protagonista; s: píxeles de pantalla por píxel de sprite del protagonista */
  function avanza(st, hx, hy, s, dirJ, mueve, ms, fijo){
    const o = fijo || POS[((dirJ%8)+8)%8], tx = hx + o[0]*s, ty = hy + o[1]*s;
    const q = quietoYa();
    if(st.x===null || q || Math.hypot(tx-st.x, ty-st.y) > SALTO*s){ st.x = tx; st.y = ty; st.t = ms; st.vel = 0; }
    const dt = Math.min(0.1, Math.max(0, (ms - st.t)/1000)); st.t = ms;
    const dx = tx - st.x, dy = ty - st.y, d = Math.hypot(dx, dy);
    let paso = 0;
    if(d>0.001 && dt>0){ paso = Math.min(d, Math.min(d*TAU*dt, VEL*s*dt)); st.x += dx/d*paso; st.y += dy/d*paso; }
    st.vel = dt>0 ? paso/dt/s : 0;                                   // píxeles de sprite por segundo
    const camina = !q && (st.vel > MIN || (mueve && d < 3*s));       // sigue al protagonista, o corre en el sitio si él corre en el sitio
    if(st.vel > MIN && d > 0.5*s) st.dir = orienta(dx, dy);          // mira hacia donde va
    else st.dir = ((dirJ%8)+8)%8;                                    // si no, hacia donde mira él
    if(camina) st.paso += dt*(6 + Math.min(st.vel, 90)/18);
    st.anda = camina;
    return st;
  }
  function elige(st, ms){
    if(st.anda) return { estado:'camina', f:Math.floor(st.paso), parpadeo:false };
    const q = quietoYa(), t = ms + st.semilla;
    return { estado:'reposo', f: q ? 0 : [0,1,2,1][Math.floor(t/300)%4], parpadeo: !q && (t%3700) < 140 };
  }

  /* ── en un lienzo del juego (runner, jefe): se llama justo después de dibujar al aprendiz ── */
  const porLienzo = new WeakMap();
  function acompanar(ctx, x, yPie, alto, dirJ, mueve, ms = performance.now()){
    if(!A || !activoYa()) return false;
    let st = porLienzo.get(ctx.canvas); if(!st){ st = nuevo(); porLienzo.set(ctx.canvas, st); }
    const s = alto/74;
    avanza(st, x, yPie, s, dirJ, mueve, ms);
    const e = elige(st, ms), sc = s * (alto<40 ? 1.35 : 1);       // en escenas pequeñas se agranda un poco para que se reconozca
    return pinta(ctx, st.x, st.y, sc, e.estado, st.dir, e.f, e.parpadeo);
  }

  /* ── en la página: un lienzo propio junto al cuerpo del aprendiz ── */
  function montar(o){
    if(!A) return null;
    const el = document.createElement('canvas'); el.width = A.w; el.height = A.h; el.className = 'gato-compa'; el.setAttribute('aria-hidden','true');
    el.style.cssText = 'position:absolute;pointer-events:none;image-rendering:pixelated;z-index:6;display:none';
    // el lienzo es absoluto: el contenedor tiene que ser su bloque contenedor (relative no mueve nada ni cambia la maquetación)
    if(getComputedStyle(o.contenedor).position==='static')o.contenedor.style.position='relative';
    o.contenedor.appendChild(el);
    const g = el.getContext('2d'), st = nuevo(); let raf = 0, vivo = true;
    const activo = o.activo || activoYa;
    const tic = () => {
      if(!vivo) return;
      if(!el.isConnected || !o.cuerpo.isConnected){ vivo = false; return; }
      raf = requestAnimationFrame(tic);
      if(!activo()){ el.style.display = 'none'; st.x = null; return; }
      const rc = o.contenedor.getBoundingClientRect(), rb = o.cuerpo.getBoundingClientRect();
      if(!rb.width || !rb.height){ el.style.display = 'none'; return; }
      /* la página puede estar ampliada (modo HD, zoom del navegador, transformaciones): se trabaja en píxeles CSS del contenedor */
      const k = (rc.width && o.contenedor.offsetWidth) ? rc.width/o.contenedor.offsetWidth : 1;
      const s = rb.height/k/(o.alto||74), ms = performance.now();
      const hx = (rb.left - rc.left + rb.width/2)/k + (o.dx||0)*s, hy = (rb.bottom - rc.top)/k + (o.dy||0)*s;
      avanza(st, hx, hy, s, o.dir(), o.mueve(), ms, o.fijo);
      const e = elige(st, ms), sc = s*(o.escala||1);
      g.clearRect(0,0,A.w,A.h);
      pinta(g, A.ax, A.ay, 1, e.estado, st.dir, e.f, e.parpadeo);
      el.style.display = 'block'; el.style.width = (A.w*sc)+'px'; el.style.height = (A.h*sc)+'px';
      el.style.left = (st.x - A.ax*sc)+'px'; el.style.top = (st.y - A.ay*sc)+'px';
    };
    raf = requestAnimationFrame(tic);
    return { el, parar(){ vivo = false; cancelAnimationFrame(raf); el.remove(); } };
  }

  /* icono de la tienda (32×32): el gato sentado de frente */
  function icono(ctx){ return pinta(ctx, 16, 28, 1, 'reposo', 0, 0, false); }

  return { cuadro, pinta, acompanar, montar, icono, orienta, avanza, elige, nuevo, POS, ARTE:A };
})();
