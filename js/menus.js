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
/* ── EL TÍTULO DE LA PORTADA (v28) ──
   El título es un dibujo en pixel art (img/titulo/, hecho con la tipografía del juego,
   con sus guiones y su raya de colores integrados). El <h1> de texto SIGUE ahí: es lo que
   leen los lectores de pantalla y lo que se ve si la imagen no carga o en el modo HD
   (que cambia la tipografía de todo el juego). Con el dibujo cargado y fuera del modo HD,
   el texto se esconde solo a la vista (clase con-imagen en .tit-logo; ver css/estilos.css),
   así que nunca se ven los dos. Se pide la imagen una vez, al abrir el juego. */
const TITULO_IMG='img/titulo/titulo-aprendiz-en-apuros.png';
let tituloListo=false;
if(typeof Image!=='undefined'){
  const im=new Image();
  im.onload=()=>{tituloListo=true;const l=document.querySelector('.tit-logo');if(l)l.classList.add('con-imagen')};
  im.src=TITULO_IMG;
}
/* ── EL APRENDIZ DE LA PORTADA (v29) ──
   El aprendiz de cuerpo entero (el mismo atlas recoloreado que usan el runner, el jefe y el
   pasillo: APRENDIZ.dibujar) está junto a JUGAR, con la piel y la camisa que eligió el jugador.
   Respira (la mitad de arriba sube un píxel cada 0,65 s con los pies quietos), parpadea cada
   4,1 s, saluda cada 12 s y, de golpe, al pasar el puntero, enfocar o tocar JUGAR. Desde la v33
   el parpadeo y el saludo son poses dibujadas (APRENDIZ.dibujarPortada). El lienzo es
   decorativo: aria-hidden y pointer-events:none, así que no intercepta ni retrasa el clic.
   Se pinta a 10 cuadros por segundo con tcada() —lo limpia pantalla()/limpiarT() al salir de la
   portada, y con ello no queda ningún bucle— y solo se redibuja cuando algo cambia. Quieto con la
   pestaña oculta o el juego en pausa; con "reducir movimiento" se pinta una sola vez, quieto.
   La cuenta de qué toca en cada instante va aparte (portadaEstado) para poder probarla. */
const PORTADA={RESPIRA:650,PARPADEO:{cada:4100,desde:3700,hasta:3840},SALUDO:{cada:12000,desde:6500,hasta:7550,dura:1050,paso:170}};
function portadaEstado(t,saludoHasta,reduce,ahora=t){
  if(reduce)return {saludo:false,parpadeo:false,respira:false,brazo:0};
  const p=PORTADA.SALUDO,k=PORTADA.PARPADEO;
  const saludo=ahora<saludoHasta||(t%p.cada>=p.desde&&t%p.cada<p.hasta);
  const parpadeo=!saludo&&(t%k.cada>=k.desde&&t%k.cada<k.hasta);
  const respira=!saludo&&Math.floor(t/PORTADA.RESPIRA)%2===1;
  return {saludo,parpadeo,respira,brazo:Math.floor(t/p.paso)%2};
}
function aprendizPortada(cv,boton){
  if(!cv||!boton||typeof APRENDIZ==='undefined')return;
  const c=cv.getContext('2d'),base=document.createElement('canvas');
  base.width=44;base.height=74;
  const b=base.getContext('2d');
  const t0=performance.now();
  let saludoHasta=0,ultimo='';
  const saludar=()=>{if(!quieto()){saludoHasta=performance.now()+PORTADA.SALUDO.dura;pinta()}};
  ['pointerenter','pointerdown','focus'].forEach(ev=>boton.addEventListener(ev,saludar));
  function pinta(){
    if(!cv.isConnected||pantallaId!=='titulo'||document.hidden||pausado)return;
    const ahora=performance.now(),t=ahora-t0,e=portadaEstado(t,saludoHasta,quieto(),ahora);
    /* v33: el parpadeo y el saludo son poses dibujadas del atlas de la portada
       (img/aprendiz-portada-hd.png: 0 reposo, 1 parpadeo, 2-3 saludo), no píxeles pintados
       encima. Si ese atlas no cargó, dibujarPortada pinta el reposo de la caminata. */
    const pose=e.saludo?2+e.brazo:e.parpadeo?1:0;
    const clave=[pose,e.respira?'r':'',S.skin,S.camisa,S.apariencia,S.acc,APRENDIZ.listaFemenina,APRENDIZ.listoPremium,APRENDIZ.listoPortadaPremium,APRENDIZ.listoPortada?'hd':''].join('|');
    if(clave===ultimo)return;
    b.clearRect(0,0,44,74);
    if(!APRENDIZ.dibujarPortada(b,22,74,74,pose))return;     /* el atlas aún no cargó: se reintenta */
    ultimo=clave;
    c.clearRect(0,0,56,80);c.imageSmoothingEnabled=false;
    /* pies fijos; al respirar solo se mueve la mitad de arriba, un píxel */
    if(e.respira){c.drawImage(base,0,0,44,49,6,2,44,49);c.drawImage(base,0,48,44,26,6,51,44,26)}
    else c.drawImage(base,6,3);
  }
  pinta();
  if(quieto()){let n=0;const reintenta=()=>{pinta();if((!ultimo||(S.apariencia==='femenina'?!APRENDIZ.listoPortada:!APRENDIZ.listoPortadaPremium))&&++n<8)tvez(reintenta,400)};tvez(reintenta,200)}
  else tcada(pinta,100);
}

function rTitulo(){
  /* entrada suave solo al LLEGAR a la portada; repintarla (dificultad, HD, texto) no la repite */
  const entradaPortada=pantallaId!=='titulo'||!$('#screen .portada');
  const {sig,pc}=progresoXp();
  const racha=RETO.rachaViva();
  const diasCampana=progreso();
  const pcCampana=Math.round(diasCampana/TOT_DIAS*100);
  const nuevoReto=!RETO.jugadoHoy();
  /* Icono + etiqueta + flecha, el patrón de fila de menú de la portada.
     La fila SIEMPRE recibe su icono por separado, así que si la etiqueta ya
     trae uno de serie (t('estadisticas') es '📈 ESTADÍSTICAS') se quita aquí:
     antes salía el gráfico dos veces seguidas. Se hace en el helper y no en
     cada llamada para que no vuelva a pasar con la siguiente etiqueta. */
  const sinIco=t=>t.replace(/^[^\p{L}\p{N}]+\s*/u,'');
  const fila=(id,ico,txt,cls)=>`<button class="btn ${cls||'btn2'} menu-fila" id="${id}" type="button">`+
    `<span class="m-ico">${pxiPortada(ico)}</span><span class="m-txt">${sinIco(txt)}</span></button>`;

  /* .col2/.col: en vertical no existen (display:contents) y el orden es el
     de siempre; en pantalla apaisada son dos columnas, identidad y JUGAR a
     la izquierda, modos y ajustes a la derecha. */
  pantalla('titulo',`
  <div class="centro portada${entradaPortada?' portada-entrada':''}">
   <div class="col2">
    <div class="col">
    <div class="tit-logo${tituloListo?' con-imagen':''}">
      <span class="guion" aria-hidden="true"><i></i><i></i><i></i></span>
      <h1 class="tit-h1"><span class="l1">APRENDIZ</span> <br><span class="l2">EN APUROS</span></h1>
      <span class="guion der" aria-hidden="true"><i></i><i></i><i></i></span>
      <img class="tit-img" src="${TITULO_IMG}" alt="" aria-hidden="true" width="920" height="360" draggable="false">
    </div>
    <p class="sub">${t('sub')}</p>

    <div class="tit-id">
      <span>${pxiPortada('🎓')} ${rangoNom()}</span>
      <span class="sep">★ ${S.pts} ${t('rec_pts')}</span>
    </div>
    <div class="tit-bloque rpg-xp-bloque">
      <div class="rpg-xp-cab"><b>XP · ${sig?"→ "+tj(sig):t('rango_max')}</b><strong>${pc}%</strong></div>
      ${barraRpg('xp',pc)}
      <p class="xp-txt">${sig?`${S.xp} / ${sig.xp} XP`:`${S.xp} XP`}</p>
    </div>

    <div class="tit-jugar-fila">
      <canvas id="t-aprendiz" class="tit-aprendiz" width="56" height="80" aria-hidden="true"></canvas>
      <div class="jugar-marco">
        <i></i><i></i><i></i><i></i>
        <button class="btn btn-jugar" id="t-jugar" type="button">${t('jugar')}</button>
      </div>
    </div>

    <button class="tit-reto" id="t-reto" type="button">
      <span>${pxiPortada('🗓')}</span><span>${t('reto_tit')}</span>
      ${nuevoReto?'<span class="punto-nuevo">●</span>':''}
      ${racha?`<span class="r-racha"><span class="r-llama">${pxi('🔥')}</span>${racha}</span>`:''}
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
        ${DIFS.map(d=>`<button class="dif-op ${S.dif===d.id?'sel':''}" data-dif="${d.id}" type="button" aria-pressed="${S.dif===d.id}">
          <span class="dif-ico">${pxiPortada(d.ico)}</span>${tj(d)}
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
      <span class="tit-av-fila">
        <span class="tit-av-portrait" aria-hidden="true"><canvas id="t-av" width="${S.av32?32:16}" height="${S.av32?32:16}"></canvas></span>
        <span class="tit-av-txt">
          <b>${t('perso')}</b>
          <span class="av-nombre">${esc(tieneNombre()?S.nombre:t('tu'))}</span>
          <span class="av-rango">${pxiPortada('🎓')} ${rangoNom()}</span>
        </span>
        <span class="m-chev" aria-hidden="true">❯</span>
      </span>
      <span class="av-metricas">
        <span class="av-xp"><b>XP</b> ${S.xp}${sig?` / ${sig.xp}`:''}</span>
        <span class="av-estrellas">★ ${totalStars()} / ${TOT_DIAS*3}</span>
      </span>
      <span class="tit-prog-fila">
        <span class="p-lbl">${t('progreso_lbl')}</span>
        <span class="av-dias">${diasCampana}/${TOT_DIAS}</span>
        ${barraRpg('campana',diasCampana,TOT_DIAS,null,true)}
        <span class="p-pc">${pcCampana}%</span>
      </span>
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

  aprendizPortada($('#t-aprendiz'),$('#t-jugar'));
  /* retrato del avatar dentro de la tarjeta */
  const av=$('#t-av'); if(av)retratoVivo(av,CARAS.yo(true));

  $$('.dif-op').forEach(b=>b.onclick=()=>{
    const teclado=b.matches(':focus-visible');
    S.dif=+b.dataset.dif;guardar();SFX.click();rTitulo();
    /* el menú se repinta entero: con teclado, el foco vuelve a la dificultad elegida */
    const elegida=$(`.portada .dif-op[data-dif="${S.dif}"]`);
    elegida?.classList.add('portada-confirmada');   /* destello dorado de confirmación (CSS) */
    if(teclado)elegida?.focus({preventScroll:true});
  });
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
  let i=0,finalizada=false;
  const terminar=()=>{if(finalizada)return;finalizada=true;fin()};
  function pag(){
    const paginas=guion[S.lang]||guion.es;
    if(!paginas.length)return terminar();
    i=Math.min(i,paginas.length-1);
    const p=CINE.pagina(paginas[i],{fondo:CINE.contexto(guion)});
    const html=CINE.escena(p,{tipo:'cut',contador:`${t('pagina')} ${i+1}/${paginas.length}`,progreso:{i,total:paginas.length}});
    pantalla('cut',`${html}`,pag);
    CINE.montar(p,'cut');
    const zona=$('#cut-zona'),avanzar=()=>{if(finalizada||pausado||!zona.isConnected)return;SFX.click();i++;i<paginas.length?pag():terminar()};
    zona.onclick=e=>{if(!e.target.closest('button'))avanzar()};
    $('#cut-next').onclick=avanzar;
    $('#cut-next').onkeydown=e=>{if(e.key==='Enter'&&e.repeat)e.preventDefault()};
    $('#cut-skip').onclick=()=>{if(!pausado&&!finalizada){SFX.click();terminar()}};
    zona.onkeydown=e=>{if(e.target.closest('button'))return;if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!e.repeat)avanzar()}};
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
  let dir=APRENDIZ.idx.south,bob=0,anda=0;
  /* Al girarse da unos pasos en el sitio (la caminata del sprite); el resto
     del tiempo, quieto con su rebote. */
  const pinta=()=>{
    c.clearRect(0,0,cv.width,cv.height);
    const andando=performance.now()<anda;
    APRENDIZ.dibujar(c,cv.width/2,cv.height-2-(andando?0:bob),APRENDIZ.FH*escala,dir,APRENDIZ.pasoDe(andando));
  };
  pinta();
  if(quieto()){                                    // sin animación: unos reintentos por si carga tarde
    [200,600,1200].forEach(ms=>tvez(pinta,ms));
    return;
  }
  const pasos=[0,1,2,3,2,1];let i=0;
  tcada(()=>{bob=pasos[i=(i+1)%pasos.length];pinta()},135);   // al ritmo de la caminata
  const mirar=()=>{
    dir=Math.floor(Math.random()*APRENDIZ.DIRS.length);
    anda=performance.now()+1080;                   // dos vueltas de la caminata
    pinta();
    tvez(mirar,1400+Math.random()*2600);
  };
  tvez(mirar,1200+Math.random()*2000);
}

/* ── MAPA CLÁSICO / LISTA DE DÍAS (respaldo accesible) ── */
function rMapaLista(){
  const p=progreso();
  let cards=`<p class="mapa-sec">${pxiTexto(t('t1sec'))}</p>`;
  NIVELES.forEach((N,i)=>{
    const st=S.dias[i];
    const estado=st>=1?'ok':(i<=p?'open':'lock');
    const badge=st>=1?'★'.repeat(st):(estado==='lock'?pxi('🔒'):'▶');
    /* separador: aquí empieza la etapa productiva */
    if(i===10)cards+=`<p class="mapa-sec">${pxiTexto(t('t2sec'))}</p>`;
    cards+=`
    <button class="etapa-card ${estado} ${i>=10?'t2':''}" data-i="${i}" ${estado==='lock'?'disabled':''} type="button">
      <span class="etapa-num">${i+1}</span>
      <span class="etapa-ico">${pxi(N.ico)}</span>
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
        <span class="etapa-nom">??? · ${t('jefe_nombre')}</span>
        <span class="etapa-sub" style="display:block">${t('jefereplay')}</span>
      </span>
      <span class="etapa-badge">⚔</span>
    </button>`;
  }
  pantalla('mapa',`
  <div class="centro mapa">
    <h2>${t('mapa')}</h2>
    <button class="btn btn2" id="m-pasillo" type="button">${t('pas_volver')}</button>
    <div class="tit-id">
      <span>${pxi('🎓')} ${rangoNom()}</span>
      <span class="sep">${pxi(difActual().ico)} ${tj(difActual())}</span>
      <span class="sep">⛁ ${S.pts}</span>
    </div>
    <canvas class="mapa-aprendiz" id="m-aprendiz" width="96" height="164" aria-hidden="true"></canvas>
    <div class="etapas">${cards}</div>
    <button class="btn btn2" id="m-volver" type="button">${t('volver')}</button>
  </div>`,rMapaLista);
  aprendizMapa($('#m-aprendiz'));
  $$('.etapa-card:not([disabled])').forEach(b=>b.onclick=()=>{SFX.click();empezarDia(+b.dataset.i)});
  const btnJefe=$('#m-jefe');
  if(btnJefe)btnJefe.onclick=()=>{SFX.click();rCutscene(JEFE_INTRO,()=>nvJefe(9,0))};
  $('#m-volver').onclick=()=>{SFX.click();rTitulo()};
  $('#m-pasillo').onclick=()=>{SFX.click();rMapa()};
}

/* El mapa de la campaña es el pasillo (js/pasillo.js). Todo lo que volvía "al
   mapa" (el resultado, la pausa, el game over, la portada) sigue llamando a
   rMapa() y llega aquí; la lista de arriba queda como la otra forma de verlo. */
function rMapa(){rPasillo();}

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
  let n=0,entrando=false;
  const N=NIVELES[i];
  function pintar(){
    const paginas=CINE.dia(DIALOGOS[S.lang][i],i);
    if(!paginas.length){if(!entrando){entrando=true;jugarNivel(i)}return;}
    n=Math.min(n,paginas.length-1);
    const p=paginas[n],ultimo=n===paginas.length-1;
    const html=CINE.escena(p,{tipo:'dia',contador:`${t('dia')} ${i+1}/${NIVELES.length}`,
      titulo:`${pxi(N.ico)} ${esc(tj({es:N.es,en:N.en}))}`,sub:tj({es:N.ses,en:N.sen}),
      ultimo,progreso:paginas.length>1?{i:n,total:paginas.length}:null});
    pantalla('dialogo',`${html}`,pintar);
    CINE.montar(p,'dia');
    const b=$('#d-go');
    b.onkeydown=e=>{if(e.key==='Enter'&&e.repeat)e.preventDefault()};
    b.onclick=()=>{if(entrando||pausado||!b.isConnected)return;SFX.click();
      if(!ultimo){n++;pintar();return;}entrando=true;jugarNivel(i)};
    enfocar('#d-go');
  }
  pintar();
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
