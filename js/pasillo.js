'use strict';
/* ── PASILLO · el mapa de la campaña ──
   Tres zonas de cinco puertas: formación 1–5, formación 6–10 y empresa 11–15.
   Cada puerta es un día. Tocas una, el aprendiz camina hasta ella y sale su
   ficha con el botón de entrar.

   Aquí solo se elige el día: NO se escribe nada en S ni en localStorage. El
   estado de cada puerta sale de S.dias y progreso(), igual que en la lista, y
   se entra con empezarDia(i), que es quien lleva a la cutscene, el diálogo y el
   minijuego de siempre. La lista de días sigue viva en rMapaLista()
   (js/menus.js) para quien la prefiera. */
const PASILLO_BLOQUES=[
  {inicio:0, fin:5, nom:'pas_z1',tipo:'formacion'},
  {inicio:5, fin:10,nom:'pas_z2',tipo:'formacion'},
  {inicio:10,fin:15,nom:'pas_z3',tipo:'empresa'},
];
/* La zona del día que toca. Con la campaña terminada, la última. */
const pasilloZonaAuto=()=>Math.min(2,Math.floor(Math.min(progreso(),TOT_DIAS-1)/5));

function rPasillo(zona=pasilloZonaAuto()){
  zona=Math.max(0,Math.min(2,Math.floor(zona)));
  const bloque=PASILLO_BLOQUES[zona];
  const p=progreso();
  const diaActual=Math.max(bloque.inicio,Math.min(bloque.fin-1,p));
  const titulo=t(bloque.nom);
  const estadoDe=i=>S.dias[i]>=1?'superada':(i<=p?'disponible':'bloqueada');
  const NOM_ESTADO={superada:'pas_ok',disponible:'pas_libre',bloqueada:'pas_lock'};
  const puerta=i=>{
    const N=NIVELES[i],stars=S.dias[i],estado=estadoDe(i);
    const pista=estado==='superada'?'★'.repeat(stars):(estado==='disponible'?'●':pxi('🔒'));
    return `<button class="pasillo-puerta ${estado}" type="button" data-dia="${i}"
       aria-label="${t('pas_dia')} ${i+1}: ${esc(tj({es:N.es,en:N.en}))} · ${t(NOM_ESTADO[estado])}"
       aria-pressed="false">
      <span class="pasillo-cartel"><span class="pasillo-ico" aria-hidden="true">${pxi(N.ico)}</span><span>${t('pas_dia')} ${i+1}</span></span>
      <span class="pasillo-marco"><span class="pasillo-cristal" aria-hidden="true"></span><span class="pasillo-manija" aria-hidden="true"></span></span>
      <span class="pasillo-insignia" aria-hidden="true">${pista}</span>
    </button>`;
  };
  const locales=Array.from({length:5},(_,n)=>puerta(bloque.inicio+n)).join('');
  pantalla('pasillo',`
    <div class="centro pasillo-vista">
      <header class="pasillo-cabecera">
        <h2>${t('pas_tit')}</h2>
        <p class="pasillo-zona">${esc(titulo)}</p>
        <p class="pasillo-sub">${t('pas_ayuda')}</p>
      </header>
      <div class="pasillo-escena ${bloque.tipo==='empresa'?'pasillo-empresa':'pasillo-formacion'}" id="pasillo-escena" tabindex="0"
           role="group" aria-label="${esc(titulo)}">
        <div class="pasillo-techo" aria-hidden="true"><i></i><i></i><i></i></div>
        <div class="pasillo-muro" aria-hidden="true"></div>
        <div class="pasillo-ventana izq" aria-hidden="true"></div>
        <div class="pasillo-ventana der" aria-hidden="true"></div>
        <div class="pasillo-puertas">${locales}</div>
        ${PASILLO_GENTE[zona].map(g=>`<button class="pasillo-gente" type="button" data-p="${g.p}" data-hueco="${g.hueco}"
           aria-label="${esc(etiquetaDe(g.p,S.lang))}: ${t('pas_hablar')}"><canvas width="44" height="74" aria-hidden="true"></canvas><span class="pasillo-aviso" aria-hidden="true" hidden>!</span></button>`).join('')}
        <div class="pasillo-suelo" aria-hidden="true"></div>
        <div class="pasillo-actor" id="pasillo-actor" aria-hidden="true"><canvas id="pasillo-canvas" width="44" height="74"></canvas></div>
      </div>
      <div class="pasillo-bloques" role="group" aria-label="${t('pas_sec')}">
        ${PASILLO_BLOQUES.map((b,n)=>`<button class="pasillo-bloque ${zona===n?'actual':''}" data-zona="${n}" type="button" aria-current="${zona===n?'step':'false'}">${n+1}. ${esc(t(b.nom))}</button>`).join('')}
      </div>
      <div class="pasillo-ficha" id="pasillo-ficha" aria-live="polite">
        <p class="pasillo-ficha-ayuda">${t('pas_elige')}</p>
      </div>
      <div class="pasillo-navega">
        <button id="pasillo-anterior" class="btn btn2" ${zona===0?'disabled':''} type="button">◀ ${t('pas_ant')}</button>
        <button id="pasillo-lista" class="btn btn2" type="button">☷ ${t('pas_lista')}</button>
        <button id="pasillo-siguiente" class="btn btn2" ${zona===2?'disabled':''} type="button">${t('pas_sig')} ▶</button>
      </div>
      ${S.dias[9]>=1?`<button id="pasillo-jefe" class="pasillo-jefe" type="button">👾 ${t('pas_jefe')}</button>`:''}
      <button class="pasillo-volver" id="pasillo-salir" type="button">← ${t('pas_menu')}</button>
    </div>
  `,()=>rPasillo(zona));

  const escena=$('#pasillo-escena'),actor=$('#pasillo-actor');
  const cv=$('#pasillo-canvas'),cx=cv.getContext('2d');
  const puertas=[...escena.querySelectorAll('.pasillo-puerta')];
  const gente=/** @type {HTMLElement[]} */([...escena.querySelectorAll('.pasillo-gente')]);
  /* pos: dónde está el aprendiz, en % del ancho de la escena */
  let pos=50,seleccion=null,andando=false,entrando=false,orientacion=APRENDIZ.idx.south;
  /* parado: la puerta delante de la que está el aprendiz, o null si no está en ninguna */
  let parado=null;
  let anim=0,cancelado=false;
  /* El centro de cada puerta en % del ancho de la escena. Se mide en la página
     (así sigue al CSS si cambian los márgenes) y, si aún no hay medidas, se
     usa la cuenta de 5 columnas entre el 5 % y el 95 %. */
  const xDia=i=>{
    const n=i-bloque.inicio,re=escena.getBoundingClientRect(),rb=puertas[n].getBoundingClientRect();
    return re.width?(rb.left+rb.width/2-re.left)/re.width*100:12.9+18.55*n;
  };
  const paint=(mueve=false,ms=performance.now())=>{
    cx.clearRect(0,0,cv.width,cv.height);
    if(!APRENDIZ.dibujar(cx,22,73,71,orientacion,APRENDIZ.pasoDe(mueve,ms))){
      /* Respaldo sin imágenes si el atlas no ha terminado de cargar. */
      cx.fillStyle='#302019';cx.fillRect(13,6,18,13);
      cx.fillStyle=SKINS[S.skin]||'#f5cb9a';cx.fillRect(14,17,16,12);
      cx.fillStyle=CAMISAS[S.camisa]||'#17689d';cx.fillRect(10,30,24,19);
      cx.fillStyle='#30395d';cx.fillRect(13,49,8,17);cx.fillRect(23,49,8,17);
      cx.fillStyle='#80513f';cx.fillRect(11,66,11,6);cx.fillRect(23,66,11,6);
    }
  };
  const moveX=()=>{actor.style.left=pos+'%'};
  const ficha=$('#pasillo-ficha');
  /* Abre la puerta y entra al día. Se comprueba todo otra vez: entre pintar el
     botón y pulsarlo puede haber cambiado la puerta elegida. */
  const entrar=i=>{
    if(entrando||andando||seleccion!==i||parado!==i||i>progreso())return;
    entrando=true;
    puertas[i-bloque.inicio].classList.add('abriendo');
    SFX.click();
    tvez(()=>{if(pantallaId==='pasillo'&&i<=progreso())empezarDia(i)},quieto()?0:350);
  };
  /* lista: el aprendiz ya llegó a la puerta (mientras camina, el botón espera).
     mostrar: llevar la ficha a la vista (no al abrir el pasillo, que movería la
     pantalla sola antes de que el jugador toque nada). */
  const nuevaFicha=(i,lista=false,mostrar=true)=>{
    const N=NIVELES[i];
    const disponible=i<=progreso(),stars=S.dias[i];
    ficha.innerHTML=`<div class="pasillo-ficha-datos">
      <strong>${t('pas_dia')} ${i+1} · ${pxi(N.ico)} ${esc(tj({es:N.es,en:N.en}))}</strong>
      <span>${t(NOM_ESTADO[estadoDe(i)])}${stars>=1?' · '+'★'.repeat(stars):''}</span>
      <small>${esc(tj({es:N.ses,en:N.sen}))}</small>
    </div>
    <button class="btn" id="pasillo-entrar" type="button" ${!disponible||!lista?'disabled':''}>${disponible?t(stars>=1?'pas_repetir':'pas_entrar'):t('pas_cerrada')}</button>`;
    /* en una pantalla baja la ficha puede quedar a medias: que se vea entera */
    if(lista&&mostrar&&ficha.scrollIntoView)ficha.scrollIntoView({block:'nearest'});
    const b=$('#pasillo-entrar');
    if(b&&!b.disabled)b.onclick=()=>entrar(i);
  };
  const marcar=i=>{
    seleccion=i;
    puertas.forEach(b=>b.classList.toggle('seleccionada',+b.dataset.dia===i));
  };
  const llegada=(i,mostrar=true)=>{
    andando=false;parado=i;orientacion=APRENDIZ.idx.north;paint();
    puertas.forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.dia===i)));
    nuevaFicha(i,true,mostrar);
  };
  /* Camina hasta `hasta` (% del ancho) y llama a alLlegar(). Con "reducir
     movimiento", o si ya está ahí, llega al instante. */
  const caminar=(hasta,alLlegar)=>{
    if(anim){cancelAnimationFrame(anim);anim=0;}
    if(quieto()||Math.abs(pos-hasta)<.5){pos=hasta;moveX();alLlegar();return;}
    andando=true;
    const desde=pos,delta=hasta-desde,duracion=280+Math.abs(delta)*7;
    orientacion=delta>0?APRENDIZ.idx.east:APRENDIZ.idx.west;
    const inicio=performance.now();
    const tick=now=>{
      if(cancelado||pantallaId!=='pasillo')return;
      const k=Math.min(1,(now-inicio)/duracion);
      pos=desde+delta*(k*k*(3-2*k));moveX();paint(k<1,now);
      if(k<1)anim=requestAnimationFrame(tick);else{anim=0;alLlegar();}
    };
    anim=requestAnimationFrame(tick);
  };
  const elegir=i=>{
    if(entrando||i<bloque.inicio||i>=bloque.fin)return;
    marcar(i);parado=null;
    SFX.click();
    /* A una puerta cerrada no se camina: solo se enseña su ficha. */
    if(i>progreso()){if(anim){cancelAnimationFrame(anim);anim=0;}andando=false;paint();nuevaFicha(i,true);return;}
    const hasta=xDia(i);
    if(!(quieto()||Math.abs(pos-hasta)<.5))nuevaFicha(i,false);
    caminar(hasta,()=>llegada(i));
  };

  /* ── los personajes ── */
  /* El punto medio entre dos puertas, en % del ancho de la escena. */
  const xHueco=h=>{
    const re=escena.getBoundingClientRect(),a=puertas[h].getBoundingClientRect(),b=puertas[h+1].getBoundingClientRect();
    return re.width?((a.left+a.width/2+b.left+b.width/2)/2-re.left)/re.width*100:22.2+18.55*h;
  };
  /* Cada uno es el cuerpo del aprendiz con SU piel y SU camisa (js/consejos.js). */
  const pintaGente=()=>gente.forEach(g=>{
    const P=PERSONAJES[/** @type {string} */(g.dataset.p)],c=g.querySelector('canvas'),k=c.getContext('2d');
    k.clearRect(0,0,c.width,c.height);
    if(!APRENDIZ.dibujar(k,22,73,71,APRENDIZ.idx.south,0,P.piel,P.camisa)){
      k.fillStyle='#302019';k.fillRect(13,6,18,13);
      k.fillStyle=P.piel;k.fillRect(14,17,16,12);
      k.fillStyle=P.camisa;k.fillRect(10,30,24,19);
      k.fillStyle='#30395d';k.fillRect(13,49,8,17);k.fillRect(23,49,8,17);
      k.fillStyle='#80513f';k.fillRect(11,66,11,6);k.fillRect(23,66,11,6);
    }
  });
  /* De qué puerta habla un personaje: la elegida, o el día que toca si su puerta
     está en esta zona (en otra zona no tiene sentido hablar de una puerta que no se ve). */
  const diaDeConsejo=()=>seleccion!==null?seleccion:(p>=bloque.inicio&&p<bloque.fin?p:null);
  const contextoDe=pid=>({dia:diaDeConsejo(),pendientes:temasRepaso(),vuelta:charla.vueltas[pid]||0});
  /* El "!" de encima de quien tiene algo nuevo que decir. */
  const avisos=()=>gente.forEach(g=>{
    /** @type {HTMLElement} */(g.querySelector('.pasillo-aviso')).hidden=!tieneNovedad(/** @type {string} */(g.dataset.p),contextoDe(/** @type {string} */(g.dataset.p)));
  });
  const mostrarConsejo=pid=>{
    const c=consejoDe(pid,contextoDe(pid));
    charla.vueltas[pid]=(charla.vueltas[pid]||0)+1;
    charla.vistos.add(c.clave);
    const et=etiquetaDe(pid,S.lang);
    ficha.innerHTML=`<div class="retrato-wrap pasillo-retrato"><canvas class="retrato" id="pg-cara" width="64" height="64"></canvas></div>
      <div class="pasillo-ficha-datos">
        <strong>${esc(et)}</strong>
        <span class="pasillo-consejo">${esc(tj(c.txt))}</span>
      </div>
      ${c.tipo==='tema'?`<button class="btn" id="pasillo-repasar" type="button">🎯 ${t('repaso_btn')}</button>`:''}`;
    retratoVivo($('#pg-cara'),quienCara(et));
    retratoDibujo($('#pg-cara'),et,GESTO_CONSEJO[c.tipo]);
    if(c.tipo==='tema')$('#pasillo-repasar').onclick=()=>{SFX.click();empezarRepaso(c.juego)};
    if(ficha.scrollIntoView)ficha.scrollIntoView({block:'nearest'});
    avisos();
  };
  /* Tocar a un personaje: el aprendiz camina hasta quedar a su lado y le habla. */
  const hablar=pid=>{
    if(entrando)return;
    const g=gente.find(x=>x.dataset.p===pid);
    if(!g)return;
    const xg=xHueco(+g.dataset.hueco),izq=pos<xg;
    const hasta=Math.max(6,Math.min(94,izq?xg-7:xg+7));
    SFX.click();parado=null;
    puertas.forEach(b=>b.setAttribute('aria-pressed','false'));
    caminar(hasta,()=>{
      andando=false;orientacion=izq?APRENDIZ.idx.east:APRENDIZ.idx.west;paint();
      mostrarConsejo(pid);
    });
  };
  gente.forEach(g=>{g.onclick=()=>hablar(/** @type {string} */(g.dataset.p))});
  /* Tocar la puerta en la que ya estás parado es entrar (lo mismo que el botón
     de la ficha). Mientras camina no cuenta: un doble toque por descuido solo
     vuelve a elegirla. */
  puertas.forEach(b=>{b.onclick=()=>{
    const i=+b.dataset.dia;
    if(parado===i&&!andando)entrar(i);else elegir(i);
  }});
  /* Teclado: ← → cambian de puerta (y el foco va con ella); Enter en la puerta
     ya elegida, o con el foco en la escena, entra. Enter en OTRA puerta la
     elige: eso lo hace el clic normal del botón. */
  escena.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','Enter'].includes(e.key))return;
    /* sobre un personaje, el botón hace lo suyo (hablar) */
    if(/** @type {HTMLElement} */(e.target).closest('.pasillo-gente'))return;
    const en=/** @type {HTMLElement} */(e.target).closest('.pasillo-puerta');
    if(e.key==='Enter'){
      if(en&&+(/** @type {HTMLElement} */(en)).dataset.dia!==seleccion)return;
      e.preventDefault();
      const b=/** @type {HTMLButtonElement} */($('#pasillo-entrar'));
      if(b&&!b.disabled)b.click();
      return;
    }
    e.preventDefault();
    const paso=e.key==='ArrowRight'?1:-1;
    /* la primera flecha elige la puerta del día que toca, no la de al lado */
    const i=seleccion===null?diaActual:Math.max(bloque.inicio,Math.min(bloque.fin-1,seleccion+paso));
    elegir(i);
    puertas[i-bloque.inicio].focus({preventScroll:true});
  });
  $$('.pasillo-bloque').forEach(b=>b.onclick=()=>{SFX.click();rPasillo(+b.dataset.zona)});
  $('#pasillo-anterior').onclick=()=>{SFX.click();rPasillo(zona-1)};
  $('#pasillo-siguiente').onclick=()=>{SFX.click();rPasillo(zona+1)};
  $('#pasillo-lista').onclick=()=>{SFX.click();rMapaLista()};
  $('#pasillo-salir').onclick=()=>{SFX.click();rTitulo()};
  const jefe=$('#pasillo-jefe');
  if(jefe)jefe.onclick=()=>{SFX.click();rCutscene(JEFE_INTRO,()=>nvJefe(9,0))};
  /* El juego limpia sus temporizadores al cambiar de pantalla; este cuadro de
     animación es propio y se corta aquí. */
  alLimpiar.push(()=>{cancelado=true;if(anim)cancelAnimationFrame(anim)});
  /* Si el día que toca está en esta zona, el aprendiz ya espera delante de su
     puerta con la ficha lista: seguir la campaña es un toque, como en la lista.
     En las otras zonas (y con la campaña terminada) no hay nada elegido. */
  gente.forEach(g=>{g.style.left=xHueco(+g.dataset.hueco)+'%'});
  pintaGente();
  if(p>=bloque.inicio&&p<bloque.fin){marcar(p);pos=xDia(p);moveX();llegada(p,false);}
  else{moveX();paint();}
  avisos();
  /* Por si el dibujo del aprendiz todavía se está descargando. */
  [200,800].forEach(ms=>tvez(()=>{pintaGente();if(!andando)paint()},ms));
  escena.focus({preventScroll:true});
}
