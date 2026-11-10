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
    const pista=estado==='superada'?'★'.repeat(stars):(estado==='disponible'?'●':'🔒');
    return `<button class="pasillo-puerta ${estado}" type="button" data-dia="${i}"
       aria-label="${t('pas_dia')} ${i+1}: ${esc(tj({es:N.es,en:N.en}))} · ${t(NOM_ESTADO[estado])}"
       aria-pressed="false">
      <span class="pasillo-cartel">${t('pas_dia')} ${i+1}</span>
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
  /* pos: dónde está el aprendiz, en % del ancho de la escena */
  let pos=50,seleccion=null,andando=false,entrando=false,orientacion=APRENDIZ.idx.south;
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
  /* lista: el aprendiz ya llegó a la puerta (mientras camina, el botón espera) */
  const nuevaFicha=(i,lista=false)=>{
    const N=NIVELES[i];
    const disponible=i<=progreso(),stars=S.dias[i];
    ficha.innerHTML=`<div class="pasillo-ficha-datos">
      <strong>${t('pas_dia')} ${i+1} · ${N.ico} ${esc(tj({es:N.es,en:N.en}))}</strong>
      <span>${t(NOM_ESTADO[estadoDe(i)])}${stars>=1?' · '+'★'.repeat(stars):''}</span>
      <small>${esc(tj({es:N.ses,en:N.sen}))}</small>
    </div>
    <button class="btn" id="pasillo-entrar" type="button" ${!disponible||!lista?'disabled':''}>${disponible?t(stars>=1?'pas_repetir':'pas_entrar'):t('pas_cerrada')}</button>`;
    /* en una pantalla baja la ficha puede quedar a medias: que se vea entera */
    if(lista&&ficha.scrollIntoView)ficha.scrollIntoView({block:'nearest'});
    const b=$('#pasillo-entrar');
    if(b&&!b.disabled)b.onclick=()=>{
      /* Se comprueba otra vez: entre pintar el botón y pulsarlo puede haber
         cambiado la puerta elegida. */
      if(entrando||seleccion!==i||i>progreso()||andando)return;
      entrando=true;
      puertas[i-bloque.inicio].classList.add('abriendo');
      SFX.click();
      tvez(()=>{if(pantallaId==='pasillo'&&i<=progreso())empezarDia(i)},quieto()?0:350);
    };
  };
  const llegada=i=>{
    andando=false;orientacion=APRENDIZ.idx.north;paint();
    puertas.forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.dia===i)));
    nuevaFicha(i,true);
  };
  const elegir=i=>{
    if(entrando||i<bloque.inicio||i>=bloque.fin)return;
    if(anim){cancelAnimationFrame(anim);anim=0;}
    seleccion=i;
    puertas.forEach(b=>b.classList.toggle('seleccionada',+b.dataset.dia===i));
    SFX.click();
    /* A una puerta cerrada no se camina: solo se enseña su ficha. */
    if(i>progreso()){andando=false;paint();nuevaFicha(i,true);return;}
    if(quieto()||Math.abs(pos-xDia(i))<.5){pos=xDia(i);moveX();llegada(i);return;}
    andando=true;nuevaFicha(i,false);
    const desde=pos,hasta=xDia(i),delta=hasta-desde,duracion=280+Math.abs(delta)*7;
    orientacion=delta>0?APRENDIZ.idx.east:APRENDIZ.idx.west;
    const inicio=performance.now();
    const tick=now=>{
      if(cancelado||pantallaId!=='pasillo')return;
      const k=Math.min(1,(now-inicio)/duracion);
      pos=desde+delta*(k*k*(3-2*k));moveX();paint(k<1,now);
      if(k<1)anim=requestAnimationFrame(tick);else{anim=0;llegada(i);}
    };
    anim=requestAnimationFrame(tick);
  };
  puertas.forEach(b=>{b.onclick=()=>{elegir(+b.dataset.dia)}});
  /* Teclado: ← → cambian de puerta (y el foco va con ella); Enter en la puerta
     ya elegida, o con el foco en la escena, entra. Enter en OTRA puerta la
     elige: eso lo hace el clic normal del botón. */
  escena.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','Enter'].includes(e.key))return;
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
  moveX();paint();
  /* Por si el dibujo del aprendiz todavía se está descargando. */
  [200,800].forEach(ms=>tvez(()=>{if(!andando)paint()},ms));
  escena.focus({preventScroll:true});
}
