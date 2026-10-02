'use strict';
/* Las pantallas de menú se reparten en cuatro archivos y se cargan en este orden
   desde index.html (todo son funciones y variables globales; al cargar no se
   ejecuta nada, así que el orden solo importa entre declaraciones):
     menus.js         · portada, borrar, nombre, cutscene, mapa, novedades,
                        flujo de un día y ayuda de controles
     certificados.js  · registrar récord, compartir, contrato (día 10) y título (día 15)
     tienda.js        · tienda y personalizar el avatar (los dos gastan puntos)
     records.js       · logros, récords, código de aula y estadísticas */
/* ── TÍTULO ── */
function rTitulo(){
  const {sig,pc}=progresoXp();
  const racha=RETO.rachaViva();
  const pcCampana=Math.round(progreso()/TOT_DIAS*100);
  const nuevoReto=!RETO.jugadoHoy();
  /* Icono + etiqueta + flecha, el patrón de fila de menú de la portada.
     La fila SIEMPRE recibe su icono por separado, así que si la etiqueta ya
     trae uno de serie (t('estadisticas') es '📈 ESTADÍSTICAS') se quita aquí:
     antes salía el gráfico dos veces seguidas. Se hace en el helper y no en
     cada llamada para que no vuelva a pasar con la siguiente etiqueta. */
  const sinIco=t=>t.replace(/^[^\p{L}\p{N}]+\s*/u,'');
  const fila=(id,ico,txt,cls)=>`<button class="btn ${cls||'btn2'} menu-fila" id="${id}" type="button">`+
    `<span class="m-ico">${ico}</span><span class="m-txt">${sinIco(txt)}</span></button>`;

  /* .col2/.col: en vertical no existen (display:contents) y el orden es el
     de siempre; en pantalla apaisada son dos columnas, identidad y JUGAR a
     la izquierda, modos y ajustes a la derecha. */
  pantalla('titulo',`
  <div class="centro portada">
   <div class="col2">
    <div class="col">
    <div class="tit-logo">
      <span class="guion" aria-hidden="true"><i></i><i></i><i></i></span>
      <h1 class="tit-h1"><span class="l1">PRACTICANTE</span><br><span class="l2">EN APUROS</span><span class="n4">4</span></h1>
      <span class="guion der" aria-hidden="true"><i></i><i></i><i></i></span>
    </div>
    <p class="sub">${t('sub')}</p>

    <div class="tit-id">
      <span>🎓 ${rangoNom()}</span>
      <span class="sep">★ ${S.pts} ${t('rec_pts')}</span>
    </div>
    <div class="tit-bloque">
      <div class="xp-bar"><div class="xp-fill" style="width:${pc}%"></div></div>
      <p class="xp-txt">${sig?`${S.xp} / ${sig.xp} XP · ${pc}%`:`${S.xp} XP · ${t('rango_max')}`}</p>
    </div>

    <div class="jugar-marco">
      <i></i><i></i><i></i><i></i>
      <button class="btn btn-jugar" id="t-jugar" type="button">${t('jugar')}</button>
    </div>

    <button class="tit-reto" id="t-reto" type="button">
      <span>🗓</span><span>${t('reto_tit')}</span>
      ${nuevoReto?'<span class="punto-nuevo">●</span>':''}
      ${racha?`<span class="r-racha"><span class="r-llama">🔥</span>${racha}</span>`:''}
    </button>
    </div>

    <div class="col">
    <div class="tit-rejilla c3 tit-modos">
      ${fila('t-libre','🎮',t('modo_libre'))}
      ${fila('t-sinfin','♾️',t('modo_sinfin'))}
      ${fila('t-sala','🏫',t('modo_sala'))}
    </div>

    <div class="dif-panel">
      <span class="dif-cap">${t('dificultad')}</span>
      <div class="dif-sel">
        ${DIFS.map(d=>`<button class="dif-op ${S.dif===d.id?'sel':''}" data-dif="${d.id}" type="button">
          <span class="dif-ico">${d.ico}</span>${tj(d)}
          <span class="dif-puntos">${[0,1,2].map(n=>`<i class="${n<=d.id?'on':''}"></i>`).join('')}</span>
        </button>`).join('')}
      </div>
    </div>

    <div class="tit-rejilla c3">
      ${fila('t-tienda','🛒',t('tienda'))}
      ${fila('t-logros','🏆',t('logros'))}
      ${fila('t-records','📊',t('records'))}
    </div>
    <div class="tit-rejilla c3">
      ${/* etiqueta corta: con tres columnas, ESTADÍSTICAS no cabe y se partía */''}
      ${fila('t-stats','📈',t('estad_corto'))}
      ${fila('t-modo',S.hd?'🕹':'✨',S.hd?t('modo_retro'):t('modo_hd'))}
      ${fila('t-texto',S.legible?'🕹':'🔤',S.legible?t('texto_pixel'):t('texto_legible'))}
    </div>

    <button class="tit-avatar" id="t-perso" type="button">
      <div class="tit-av-fila">
        <canvas id="t-av" width="24" height="24"></canvas>
        <div class="tit-av-txt">
          <b>${t('perso')}</b>
          <span>${t('perso_sub')}</span>
        </div>
        <span class="m-chev">❯</span>
      </div>
      <div class="tit-prog-fila">
        <span class="p-lbl">★ ${t('progreso_lbl')}</span>
        <div class="barra"><div class="barra-fill" style="width:${pcCampana}%"></div></div>
        <span class="p-pc">${pcCampana}%</span>
      </div>
    </button>
    </div>
   </div>

    <div class="tit-pie" aria-hidden="true"><i></i><span class="mini blink">${t('start')}</span><i></i></div>
    <div class="tit-menudo">
      ${/* La consola no tiene por qué esconderse: un ensayo no da puntos, no
           sube al marcador y no entra a una sala (ver js/consola.js). Lo que
           la protege son esas reglas, no que cueste encontrarla. */''}
      <button class="cut-skip" id="t-lab" type="button">⚗ ${t('lab_tit')}</button>
      <button class="cut-skip" id="t-borrar" type="button">${t('borrar')}</button>
    </div>
  </div>`,rTitulo);

  /* retrato del avatar dentro de la tarjeta */
  const av=$('#t-av'); if(av)retratoVivo(av,CARAS.yo(true));

  $$('.dif-op').forEach(b=>b.onclick=()=>{S.dif=+b.dataset.dif;guardar();SFX.click();rTitulo()});
  $('#t-stats').onclick=()=>{SFX.click();rStats()};
  $('#t-modo').onclick=()=>{S.hd=!S.hd;guardar();aplicarModo();SFX.moneda();rTitulo()};
  $('#t-texto').onclick=()=>{S.legible=!S.legible;guardar();aplicarModo();SFX.click();rTitulo()};
  $('#t-borrar').onclick=()=>{SFX.click();rBorrar()};
  $('#t-lab').onclick=()=>{if(typeof abrirLab==='function')abrirLab()};
  $('#t-jugar').onclick=()=>{
    SFX.click();
    const go=()=>S.intro?rMapa():rCutscene(INTRO,()=>{S.intro=true;guardar();rMapa()});
    tieneNombre()?go():rNombre(go);
  };
  $('#t-reto').onclick=()=>{SFX.click();rReto()};
  $('#t-libre').onclick=()=>{SFX.click();rLibre()};
  $('#t-sinfin').onclick=()=>{SFX.click();rSinFin()};
  $('#t-sala').onclick=()=>{SFX.click();rSala()};
  $('#t-tienda').onclick=()=>{SFX.click();rTienda()};
  $('#t-logros').onclick=()=>{SFX.click();rLogros()};
  $('#t-records').onclick=()=>{SFX.click();rRecords()};
  $('#t-perso').onclick=()=>{SFX.click();rPerso()};
}

/* ── BORRAR PROGRESO ── */
function rBorrar(){
  pantalla('borrar',`
  <div class="centro">
    <span class="ico">💣</span>
    <h2 class="rojo">${t('seguro')}</h2>
    <p class="desc" style="text-align:center">${t('borrartxt')}</p>
    <div class="stats-grid">
      <div><b>${progreso()}</b><span>${t('diascomp')}</span></div>
      <div><b>${totalStars()}</b><span>${t('estrellas')}</span></div>
      <div><b>${S.pts}</b><span>${t('ptstotal')}</span></div>
    </div>
    <p class="sub rojo">▲ ${t('perderas')} ▲</p>
    <button class="btn btn2" id="bo-no" type="button">${t('cancelar')}</button>
    <button class="btn-r" id="bo-si" type="button">${t('sioborrar')}</button>
  </div>`,rBorrar);
  $('#bo-no').onclick=()=>{SFX.click();rTitulo()};
  enfocar('#bo-no');           /* el foco empieza en lo seguro: CANCELAR */
  $('#bo-si').onclick=()=>{
    /* Igual que al importar: borrar con un ensayo en marcha dejaba la partida
       sin borrar en disco (guardar() no escribe en ensayo) y la copia volvía
       al salir. Primero se termina el ensayo. */
    if(typeof LAB!=='undefined'&&LAB.ensayo())LAB.volverANormal();
    const prefs={lang:S.lang,snd:S.snd,hd:S.hd,av32:S.av32};
    S=Object.assign({},DEF,{dias:Array(TOT_DIAS).fill(-1),logros:[],accs:[],mejoras:[],records:[],vistos:[],pesos:{},reto:{},mejores:{},mejorSinFin:0,stats:Object.assign({},STATS0)},prefs);
    sanear();guardar();
    vidas=maxVidas();
    SFX.lose();
    rTitulo();
    /* aviso rápido de partida nueva */
    const p=$('#logro-popup');
    p.querySelector('.ico-l').textContent='🌱';
    p.querySelector('p').textContent=t('borrado');
    p.hidden=false;
    setTimeout(()=>{p.hidden=true},2600);
  };
}

/* ── NOMBRE DEL JUGADOR ── */
function rNombre(next){
  pantalla('nombre',`
  <div class="centro">
    <span class="ico">🪪</span>
    <h2>${t('nombreq')}</h2>
    <div style="width:min(300px,100%)">
      <input class="entrada" id="n-in" maxlength="10" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="${t('tunombre')}" aria-describedby="n-aviso" required>
    </div>
    <p class="mini rojo" id="n-aviso" role="status">&nbsp;</p>
    <button class="btn" id="n-ok" type="button">${t('ok')}</button>
  </div>`,()=>rNombre(next));
  const inp=$('#n-in'),aviso=$('#n-aviso');
  /* Sin nombre no se sigue: antes un campo vacío se guardaba como "TÚ". */
  const listo=()=>{
    if(!nombreValido(inp.value)){
      aviso.textContent=t('nombre_falta');
      inp.setAttribute('aria-invalid','true');
      inp.classList.remove('shake');void inp.offsetWidth;inp.classList.add('shake');
      SFX.mal();inp.focus();
      return;
    }
    S.nombre=limpiaNombre(inp.value);
    guardar();SFX.ok();next();
  };
  inp.oninput=()=>{if(aviso.textContent.trim()){aviso.innerHTML='&nbsp;';inp.removeAttribute('aria-invalid')}};
  $('#n-ok').onclick=listo;
  inp.onkeydown=e=>{if(e.key==='Enter')listo()};
  inp.focus();
}

/* ── CUTSCENE ── */
/* Recibe el guion BILINGÜE (INTRO, FINAL, T2_INTRO...), no una lista ya
   resuelta en un idioma: así, al cambiar de idioma a mitad de una escena, la
   página que se está leyendo se vuelve a pintar en el idioma nuevo en vez de
   quedarse con el texto con el que entró. */
function rCutscene(guion,fin){
  let i=0;
  function pag(){
    const paginas=guion[S.lang]||guion.es;
    i=Math.min(i,paginas.length-1);
    pantalla('cut',`
    <div class="centro cut" id="cut-zona" tabindex="0" role="button" aria-label="${t('toca')}">
      <span class="ico">${paginas[i].ico}</span>
      <p class="desc">${paginas[i].t}</p>
      <div class="cut-nav"><span class="cut-prog">${t('pagina')} ${i+1}/${paginas.length}</span></div>
      <p class="mini blink">${t('toca')}</p>
      <button class="cut-skip" id="cut-skip" type="button">${t('saltar')}</button>
    </div>`,pag);
    $('#cut-zona').onclick=e=>{
      if(e.target.id==='cut-skip')return;
      SFX.click();i++;
      i<paginas.length?pag():fin();
    };
    $('#cut-skip').onclick=e=>{e.stopPropagation();SFX.click();fin()};
    /* Con teclado la escena solo se podía saltar entera: ahora Enter o Espacio
       avanzan página, como el toque. */
    $('#cut-zona').onkeydown=e=>{
      if(e.target.id==='cut-skip')return;
      if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!e.repeat)$('#cut-zona').click()}
    };
    enfocar('#cut-zona');
  }
  pag();
}

/* El aprendiz de cuerpo entero se pasea por el mapa: mira alrededor (gira por
   las 8 direcciones en un ciclo irregular, como parpadean los retratos) y
   rebota un poco. Con prefers-reduced-motion se queda quieto de frente. Los
   temporizadores se limpian solos al cambiar de pantalla (limpiarT). Si el
   sprite aún no cargó, cada tic lo reintenta y aparece en cuanto esté. */
function aprendizMapa(cv){
  if(!cv)return;
  const c=cv.getContext('2d');
  const escala=cv.width/APRENDIZ.FW;               // el sprite llena el ancho
  let dir=APRENDIZ.idx.south,bob=0;
  const pinta=()=>{
    c.clearRect(0,0,cv.width,cv.height);
    APRENDIZ.dibujar(c,cv.width/2,cv.height-2-bob,APRENDIZ.FH*escala,dir);
  };
  pinta();
  if(quieto()){                                    // sin animación: unos reintentos por si carga tarde
    [200,600,1200].forEach(ms=>tvez(pinta,ms));
    return;
  }
  const pasos=[0,1,2,3,2,1];let i=0;
  tcada(()=>{bob=pasos[i=(i+1)%pasos.length];pinta()},140);
  const mirar=()=>{
    dir=Math.floor(Math.random()*APRENDIZ.DIRS.length);
    pinta();
    tvez(mirar,1400+Math.random()*2600);
  };
  tvez(mirar,1200+Math.random()*2000);
}

/* ── MAPA ── */
function rMapa(){
  const p=progreso();
  let cards=`<p class="mapa-sec">${t('t1sec')}</p>`;
  NIVELES.forEach((N,i)=>{
    const st=S.dias[i];
    const estado=st>=1?'ok':(i<=p?'open':'lock');
    const badge=st>=1?'★'.repeat(st):(estado==='lock'?'🔒':'▶');
    /* separador: aquí empieza la etapa productiva */
    if(i===10)cards+=`<p class="mapa-sec">${t('t2sec')}</p>`;
    cards+=`
    <button class="etapa-card ${estado} ${i>=10?'t2':''}" data-i="${i}" ${estado==='lock'?'disabled':''} type="button">
      <span class="etapa-num">${i+1}</span>
      <span class="etapa-ico">${N.ico}</span>
      <span class="etapa-body">
        <span class="etapa-nom">${tj({es:N.es,en:N.en})}</span>
        <span class="etapa-sub" style="display:block">${tj({es:N.ses,en:N.sen})}</span>
        ${st>=1?`<span class="etapa-rango" style="display:block">${t('mejor')}: ${'★'.repeat(st)}</span>`:''}
      </span>
      <span class="etapa-badge">${badge}${estado==='open'&&i===p?`<span class="aqui">${t('aqui')}</span>`:''}</span>
    </button>
    ${i<NIVELES.length-1&&i!==9?'<div class="etapa-link"></div>':''}`;
  });
  /* casilla extra ??? — repetir al jefe tras completar el día 10 */
  if(S.dias[9]>=1){
    cards+=`
    <div class="etapa-link etapa-link-jefe"></div>
    <button class="etapa-card etapa-jefe" id="m-jefe" type="button">
      <span class="etapa-num">★</span>
      <span class="etapa-ico">👾</span>
      <span class="etapa-body">
        <span class="etapa-nom">??? · EL BUG FINAL</span>
        <span class="etapa-sub" style="display:block">${t('jefereplay')}</span>
      </span>
      <span class="etapa-badge">⚔</span>
    </button>`;
  }
  pantalla('mapa',`
  <div class="centro mapa">
    <h2>${t('mapa')}</h2>
    <div class="tit-id">
      <span>🎓 ${rangoNom()}</span>
      <span class="sep">${difActual().ico} ${tj(difActual())}</span>
      <span class="sep">⛁ ${S.pts}</span>
    </div>
    <canvas class="mapa-aprendiz" id="m-aprendiz" width="96" height="164" aria-hidden="true"></canvas>
    <div class="etapas">${cards}</div>
    <button class="btn btn2" id="m-volver" type="button">${t('volver')}</button>
  </div>`,rMapa);
  aprendizMapa($('#m-aprendiz'));
  $$('.etapa-card:not([disabled])').forEach(b=>b.onclick=()=>{SFX.click();empezarDia(+b.dataset.i)});
  const btnJefe=$('#m-jefe');
  if(btnJefe)btnJefe.onclick=()=>{SFX.click();rCutscene(JEFE_INTRO,()=>nvJefe(9,0))};
  $('#m-volver').onclick=()=>{SFX.click();rTitulo()};
}

/* ── NOVEDADES ──
   Lo que cambió desde la última vez que se abrió el juego en este aparato. Sale
   una sola vez por versión: en cuanto se enseña, se apunta la versión vista.
   Si el PNG de la lista crece, la caja hace scroll sola (CSS). */
function rNovedades(seguir){
  const lista=novedadesPendientes();
  if(!lista.length){marcarVersionVista();return seguir()}
  const pintar=()=>{
  pantalla('novedades',`
  <div class="centro">
    <span class="ico">✨</span>
    <h2>${t('nov_tit')}</h2>
    <p class="mini">${t('nov_sub')}</p>
    <div class="nov-caja">
      ${lista.map(n=>`
        <p class="nov-ver">${t('nov_ver')} ${n.v}${n.fecha?` · ${n.fecha}`:''}</p>
        <ul class="nov-lista">${(S.lang==='en'?n.en:n.es).map(l=>`<li>${l}</li>`).join('')}</ul>`).join('')}
    </div>
    <button class="btn" id="nv-ok" type="button">${t('nov_ok')}</button>
  </div>`,pintar);
  $('#nv-ok').onclick=()=>{SFX.click();marcarVersionVista();seguir()};
  enfocar('#nv-ok');
  };
  pintar();
  SFX.logro();
}

/* ── FLUJO DE DÍA ── */
function empezarDia(i){
  /* primera vez que sales a la etapa productiva: cutscene de la empresa */
  if(i===10&&!S.t2){
    return rCutscene(T2_INTRO,()=>{S.t2=true;guardar();diaAct=i;vidas=maxVidas();rDialogo(i)});
  }
  diaAct=i;vidas=maxVidas();
  rDialogo(i);
}
function rDialogo(i){
  const [quien,linea]=DIALOGOS[S.lang][i];
  const N=NIVELES[i];
  pantalla('dialogo',`
  <div class="centro">
    <p class="dia">${t('dia')} ${i+1}/${NIVELES.length}</p>
    <h2>${N.ico} ${tj({es:N.es,en:N.en})}</h2>
    <div class="dialogo">
      <div class="retrato-wrap"><canvas class="retrato" id="d-cara" width="64" height="64"></canvas></div>
      <div>
        <p class="hablante">${quien}</p>
        <p class="linea" id="d-linea"></p>
      </div>
    </div>
    <span class="modo">${tj({es:N.ses,en:N.sen})}</span>
    <button class="btn" id="d-go" type="button">${t('empezar')}</button>
  </div>`,()=>rDialogo(i));
  retratoVivo($('#d-cara'),quienCara(quien));
  /* máquina de escribir */
  let j=0;const el=$('#d-linea');
  tcada(()=>{if(pausado)return;if(j<linea.length){el.textContent=linea.slice(0,++j);if(j%3===0)beep(700+Math.random()*200,.02,'triangle',.05)}},28);
  $('#d-go').onclick=()=>{SFX.click();jugarNivel(i)};
}
/* Arranca el minijuego del día, enseñando antes los controles si es la primera
   vez que se ve ese tipo. */
function jugarNivel(i){
  const tipo=NIVELES[i].tipo;
  const ir=()=>({escribir:nvEscribir,bugs:nvBugs,memoria:nvMemoria,simon:nvSimon,quiz:nvQuiz,
    review:nvReview,merge:nvMerge,runner:nvRunner,sql:nvSQL,regex:nvRegex})[tipo](i);
  conAyuda(tipo,ir);
}

/* ── AYUDA DE CONTROLES ──
   Se enseña una sola vez por tipo de minijuego y se recuerda en S.vistos, así
   que no estorba en la segunda partida. Si el tipo no tiene ficha de ayuda o ya
   se vio, se entra directo. */
function vistos(){
  if(!Array.isArray(S.vistos))S.vistos=[];
  return S.vistos;
}
function conAyuda(tipo,seguir){
  const a=AYUDA[tipo];
  if(!a||vistos().includes(tipo))return seguir();
  vistos().push(tipo);guardar();
  /* Solo dibuja. Volver a llamar a conAyuda() no valdría: el tipo ya quedó
     marcado como visto y se saltaría la ficha para entrar al minijuego. */
  const pintar=()=>{
  const lineas=(S.lang==='en'?a.en:a.es);
  pantalla('ayuda',`
  <div class="centro">
    <span class="ico">${a.ico}</span>
    <h2>${t('ayuda_tit')}</h2>
    <ul class="ayuda-lista">
      ${lineas.map(l=>`<li>${l}</li>`).join('')}
    </ul>
    <button class="btn" id="ay-ok" type="button">${t('ayuda_ok')}</button>
    <p class="mini">${t('ayuda_nota')}</p>
  </div>`,pintar);
  $('#ay-ok').onclick=()=>{SFX.click();seguir()};
  enfocar('#ay-ok');
  };
  pintar();
}
