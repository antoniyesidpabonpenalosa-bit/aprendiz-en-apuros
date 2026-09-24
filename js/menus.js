'use strict';
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
    <button class="cut-skip" id="t-borrar" type="button">${t('borrar')}</button>
  </div>`);

  /* retrato del avatar dentro de la tarjeta */
  const av=$('#t-av'); if(av)retratoVivo(av,CARAS.yo(true));

  $$('.dif-op').forEach(b=>b.onclick=()=>{S.dif=+b.dataset.dif;guardar();SFX.click();rTitulo()});
  $('#t-stats').onclick=()=>{SFX.click();rStats()};
  $('#t-modo').onclick=()=>{S.hd=!S.hd;guardar();aplicarModo();SFX.moneda();rTitulo()};
  $('#t-texto').onclick=()=>{S.legible=!S.legible;guardar();aplicarModo();SFX.click();rTitulo()};
  $('#t-borrar').onclick=()=>{SFX.click();rBorrar()};
  $('#t-jugar').onclick=()=>{
    SFX.click();
    const go=()=>S.intro?rMapa():rCutscene(INTRO[S.lang],()=>{S.intro=true;guardar();rMapa()});
    S.nombre?go():rNombre(go);
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
  </div>`);
  $('#bo-no').onclick=()=>{SFX.click();rTitulo()};
  $('#bo-si').onclick=()=>{
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
      <input class="entrada" id="n-in" maxlength="10" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="${t('tunombre')}">
    </div>
    <button class="btn" id="n-ok" type="button">${t('ok')}</button>
  </div>`);
  const inp=$('#n-in');
  const listo=()=>{
    S.nombre=(inp.value.trim()||t('tu')).toUpperCase().slice(0,10);
    guardar();SFX.ok();next();
  };
  $('#n-ok').onclick=listo;
  inp.onkeydown=e=>{if(e.key==='Enter')listo()};
  inp.focus();
}

/* ── CUTSCENE ── */
function rCutscene(paginas,fin){
  let i=0;
  function pag(){
    pantalla('cut',`
    <div class="centro cut" id="cut-zona">
      <span class="ico">${paginas[i].ico}</span>
      <p class="desc">${paginas[i].t}</p>
      <div class="cut-nav"><span class="cut-prog">${t('pagina')} ${i+1}/${paginas.length}</span></div>
      <p class="mini blink">${t('toca')}</p>
      <button class="cut-skip" id="cut-skip" type="button">${t('saltar')}</button>
    </div>`);
    $('#cut-zona').onclick=e=>{
      if(e.target.id==='cut-skip')return;
      SFX.click();i++;
      i<paginas.length?pag():fin();
    };
    $('#cut-skip').onclick=e=>{e.stopPropagation();SFX.click();fin()};
  }
  pag();
}

/* ── MAPA ── */
function rMapa(){
  const p=progreso();
  let cards=`<p class="mapa-sec">${t('t1sec')}</p>`;
  NIVELES.forEach((N,i)=>{
    const st=S.dias[i];
    const estado=st>=1?'ok':(i<=p?'open':'lock');
    const badge=st>=1?'★'.repeat(st):(estado==='lock'?'🔒':'▶');
    /* separador de temporada 2 */
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
    <div class="etapas">${cards}</div>
    <button class="btn btn2" id="m-volver" type="button">${t('volver')}</button>
  </div>`);
  $$('.etapa-card:not([disabled])').forEach(b=>b.onclick=()=>{SFX.click();empezarDia(+b.dataset.i)});
  const btnJefe=$('#m-jefe');
  if(btnJefe)btnJefe.onclick=()=>{SFX.click();rCutscene(JEFE_INTRO[S.lang],()=>nvJefe(9,0))};
  $('#m-volver').onclick=()=>{SFX.click();rTitulo()};
}

/* ── FLUJO DE DÍA ── */
function empezarDia(i){
  /* primera vez que entras a la temporada 2: cutscene del contrato */
  if(i===10&&!S.t2){
    return rCutscene(T2_INTRO[S.lang],()=>{S.t2=true;guardar();diaAct=i;vidas=maxVidas();rDialogo(i)});
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
  </div>`);
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
  </div>`);
  $('#ay-ok').onclick=()=>{SFX.click();seguir()};
}

/* ── CERTIFICADO ── */
/* Hitos que dan derecho a marca en el marcador global. El día 5 existe para
   que la parte social del juego sirva de algo antes: esperar al día 10 dejaba
   la tabla vacía justo cuando más engancha ver que hay gente jugando. */
const ICO_HITO={0:'⏳',1:'🎓',2:'📝',3:'♾️'};
function registrarRecord(hito){
  const nom=S.nombre||t('tu');
  S.records.push({n:nom,p:S.pts,x:S.xp,yo:1});
  S.records.sort((a,b)=>b.p-a.p);
  S.records=S.records.slice(0,5);
  /* Se envía al marcador global sin esperar respuesta: si no hay internet
     la partida ya quedó guardada localmente y no pasa nada. */
  RANKING.publicar({nombre:nom,puntos:S.pts,xp:S.xp,dificultad:S.dif,
                    temporada:ICO_HITO[hito]?hito:1,grupo:S.grupo});
}
function compartir(){
  const url='https://antoniyesidpabonpenalosa-bit.github.io/aprendiz-en-apuros/';
  const txt=t('compartexto').replace('{p}',S.pts).replace('{r}',rangoNom())+' '+url;
  SFX.click();
  const aviso=()=>{
    const p=$('#logro-popup');
    p.querySelector('.ico-l').textContent='📤';
    p.querySelector('p').textContent=t('copiado');
    p.hidden=false;setTimeout(()=>{p.hidden=true},2200);
  };
  if(navigator.share){navigator.share({text:txt}).catch(()=>{});return}
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(aviso).catch(()=>{try{prompt(t('copiado'),txt)}catch(e){}});
    return;
  }
  try{prompt(t('copiado'),txt)}catch(e){}
}
function rCertificado(){
  sumaStat('partidas');
  const hoy=new Date().toLocaleDateString(S.lang==='es'?'es-CO':'en-US');
  pantalla('cert',`
  <div class="centro">
    <div class="cert">
      <p class="dia">🎓 ${t('cert')} 🎓</p>
      <div class="retrato-wrap"><canvas class="retrato" id="c-cara" width="64" height="64"></canvas></div>
      <p class="sub cert-de">${t('certde')}</p>
      <p class="rango">${esc(S.nombre||t('tu'))}</p>
      <p class="desc" style="text-align:center">${t('certtxt')}</p>
      ${starsHtml(Math.min(3,Math.round(totalStars()/10)))}
      <div class="stats-grid">
        <div><b>${progreso()}</b><span>${t('diascomp')}</span></div>
        <div><b>${totalStars()}</b><span>${t('estrellas')}</span></div>
        <div><b>${S.pts}</b><span>${t('ptstotal')}</span></div>
      </div>
      <p class="sub cert-firma">${t('firma')} · ${t('fecha')}: ${hoy}</p>
      <span class="rango-badge grande">${rangoNom()}</span>
    </div>
    <button class="btn btn-share" id="c-share" type="button">${t('compartir')}</button>
    <button class="btn btn2" id="c-volver" type="button">${t('volver')}</button>
  </div>`);
  retrato($('#c-cara'),Object.assign(CARAS.yo(true),{medalla:true}));
  confeti();
  $('#c-share').onclick=compartir;
  $('#c-volver').onclick=()=>{SFX.click();rTitulo()};
}

/* ── ASCENSO (final de la temporada 2) ── */
function rAscenso(){
  const hoy=new Date().toLocaleDateString(S.lang==='es'?'es-CO':'en-US');
  pantalla('ascenso',`
  <div class="centro">
    <div class="cert">
      <p class="dia">🚀 ${t('ascenso')} 🚀</p>
      <div class="retrato-wrap"><canvas class="retrato" id="a-cara" width="64" height="64"></canvas></div>
      <p class="sub cert-de">${t('ascensode')}</p>
      <p class="rango">${esc(S.nombre||t('tu'))}</p>
      <p class="desc" style="text-align:center">${t('ascensotxt')}</p>
      ${starsHtml(Math.min(3,Math.round(totalStars()/15)))}
      <div class="stats-grid">
        <div><b>${progreso()}</b><span>${t('diascomp')}</span></div>
        <div><b>${totalStars()}</b><span>${t('estrellas')}</span></div>
        <div><b>${S.pts}</b><span>${t('ptstotal')}</span></div>
      </div>
      <p class="sub cert-firma">${t('firma')} · ${t('fecha')}: ${hoy}</p>
      <span class="rango-badge grande">${rangoNom()}</span>
    </div>
    <button class="btn btn-share" id="a-share" type="button">${t('compartir')}</button>
    <button class="btn btn2" id="a-volver" type="button">${t('volver')}</button>
  </div>`);
  retrato($('#a-cara'),Object.assign(CARAS.yo(true),{medalla:true,corona:S.accs.includes('corona')}));
  confeti();
  $('#a-share').onclick=compartir;
  $('#a-volver').onclick=()=>{SFX.click();rTitulo()};
}

/* ── TIENDA ── */
function rTienda(){
  const nAcc=id=>t('acc_'+id);
  const nMej={vida:t('mejvida'),tiempo:t('mejtiempo'),doble:t('mejdoble'),iman:t('mejiman'),escudo:t('mejescudo')};
  pantalla('tienda',`
  <div class="centro">
    <h2>🛒 ${t('tienda')}</h2>
    <span class="moneda">⛁ ${S.pts} PTS</span>
   <div class="col2">
    <div class="col">
    <div class="tienda-grid">
      ${ACCS.map(a=>{
        const tiene=S.accs.includes(a.id);
        const puede=S.pts>=a.precio;
        /* Botón de verdad, no un div: así se alcanza con el tabulador y un
           lector de pantalla lo anuncia. El que no alcanzas a pagar va
           `disabled`, que además lo saca del recorrido del teclado. */
        return `<button class="item-tienda ${tiene?'activa':(puede?'':'sin-pts')}" data-id="${a.id}"
          type="button" ${tiene||puede?'':'disabled'}>
          <span class="ico-t">${a.ico}</span>
          <span class="nom-t">${nAcc(a.id)}</span>
          <span class="precio">${tiene?(S.acc===a.id?'✔ '+t('equipado'):'✔'):'⛁'+a.precio}</span>
        </button>`}).join('')}
    </div>
    </div>
    <div class="col">
    <p class="mej-titulo">⚙ ${t('mejoras')}</p>
    <div class="mejoras-tienda">
      ${MEJORAS.map(m=>{
        const tiene=S.mejoras.includes(m.id);
        const puede=S.pts>=m.precio;
        /* Una mejora ya comprada no se puede volver a tocar, así que va
           `disabled` igual que la que no alcanzas a pagar. */
        return `<button class="item-tienda ${tiene?'activa':(puede?'':'sin-pts')}" data-mej="${m.id}"
          type="button" ${tiene||!puede?'disabled':''}
          style="flex-direction:row;justify-content:space-between;width:100%">
          <span class="ico-t">${m.ico}</span>
          <span class="mej-info">
            <span class="nom-t" style="text-align:left">${nMej[m.id]}</span>
            <span class="mej-desc">${t('d_'+m.id)}</span>
          </span>
          <span class="precio">${tiene?'✔':'⛁'+m.precio}</span>
        </button>`}).join('')}
    </div>
    </div>
   </div>
    <button class="btn btn2" id="ti-volver" type="button">${t('volver')}</button>
  </div>`);
  $$('[data-id]').forEach(el=>el.onclick=()=>{
    const a=ACCS.find(x=>x.id===el.dataset.id);
    if(S.accs.includes(a.id)){S.acc=S.acc===a.id?'':a.id;guardar();SFX.click();rTienda();return}
    if(S.pts<a.precio){SFX.mal();return}
    S.pts-=a.precio;S.accs.push(a.id);S.acc=a.id;guardar();
    SFX.moneda();darLogro('comprador');
    if(ACCS.every(x=>S.accs.includes(x.id)))darLogro('coleccionista');
    rTienda();
  });
  $$('[data-mej]').forEach(el=>el.onclick=()=>{
    const m=MEJORAS.find(x=>x.id===el.dataset.mej);
    if(S.mejoras.includes(m.id))return;
    if(S.pts<m.precio){SFX.mal();return}
    S.pts-=m.precio;S.mejoras.push(m.id);guardar();
    SFX.moneda();darLogro('comprador');rTienda();
  });
  $('#ti-volver').onclick=()=>{SFX.click();rTitulo()};
}

/* ── LOGROS ── */
function rLogros(){
  pantalla('logros',`
  <div class="centro">
    <h2>🏆 ${t('logros')}</h2>
    <div class="tit-bloque">
      <div class="barra tit-barra"><div class="barra-fill" style="width:${Math.round(S.logros.length/LOGROS.length*100)}%"></div></div>
      <p class="xp-txt">${S.logros.length} / ${LOGROS.length} · ${Math.round(S.logros.length/LOGROS.length*100)}%</p>
    </div>
    <div class="logros-grid">
      ${LOGROS.map(l=>{
        const hecho=S.logros.includes(l.id);
        /* El conseguido se enseña tal cual. El que falta enseña CÓMO se
           consigue: un icono gris y nada más no le dice nada a nadie. */
        return `<div class="logro ${hecho?'on':''}">
        <span class="ico-lg">${l.ico}</span><p>${tj(l)}</p>
        ${hecho?'':`<p class="pista">${tp(l)}</p>`}</div>`}).join('')}
    </div>
    <button class="btn btn2" id="lo-volver" type="button">${t('volver')}</button>
  </div>`);
  $('#lo-volver').onclick=()=>{SFX.click();rTitulo()};
}

/* ── RÉCORDS ── */
/* Dificultad que se está mirando en el marcador: null = las tres mezcladas.
   Vive fuera de la función para que sobreviva al redibujado de la tabla. */
let filtroDif=null;
/* Si está encendido, el marcador enseña solo a tu cohorte. Vive fuera de la
   función para sobrevivir al redibujado, igual que filtroDif. */
let soloGrupo=false;
/* Cuál de los dos marcadores se mira: 'campana' son los hitos de los quince
   días y 'sinfin' las rachas sueltas. Están separados porque sus puntajes no
   son comparables — ver abajo el comentario de RANKING.top. */
/** @type {'campana'|'sinfin'} */
let tablaGlobal='campana';
function tablaRecords(filas){
  return `<table class="rec-tabla">
      <tr><th>#</th><th>${t('rec_nom')}</th><th>${t('rec_pts')}</th><th>${t('rec_rango')}</th></tr>
      ${filas.map((r,i)=>`<tr class="${r.yo?'yo':''}"><td>${i+1}</td><td>${r.ico?`<span class="rec-ico">${r.ico}</span>`:''}${esc(r.n)}</td><td>${r.p}</td><td>${tj(rangoDe(r.x))}</td></tr>`).join('')}
    </table>`;
}
function rRecords(){
  const locales=[...S.records].sort((a,b)=>b.p-a.p).slice(0,8);
  pantalla('records',`
  <div class="centro">
    <h2>📊 ${t('records')}</h2>
   <div class="col2">
    <div class="col">
    <h3>${t('glob_tit')}</h3>
    <div class="rec-filtros">
      <button class="rec-chip" data-tabla="campana" type="button">🎓 ${t('glob_campana')}</button>
      <button class="rec-chip" data-tabla="sinfin" type="button">♾️ ${t('glob_sinfin')}</button>
    </div>
    <div class="rec-filtros">
      <button class="rec-chip" data-dif="" type="button">${t('glob_todas')}</button>
      ${DIFS.map(d=>`<button class="rec-chip" data-dif="${d.id}" type="button">${d.ico} ${tj(d)}</button>`).join('')}
    </div>
    <div class="grupo-barra">
      ${S.grupo
        ? `<span class="grupo-cod">🏫 ${esc(S.grupo)}</span>
           <button class="rec-chip ${soloGrupo?'act':''}" id="g-solo" type="button">${t('grupo_solo')}</button>
           <button class="rec-chip" id="g-cambiar" type="button">${t('grupo_cambiar')}</button>`
        : `<span class="grupo-vacio">${t('grupo_no')}</span>
           <button class="rec-chip" id="g-cambiar" type="button">${t('grupo_unirse')}</button>`}
    </div>
    <div id="rec-global"><p class="desc" style="text-align:center">${t('glob_carga')}</p></div>
    </div>
    <div class="col">
    <h3>${t('glob_loc')}</h3>
    ${locales.length
      ? tablaRecords(locales)
      : `<p class="desc" style="text-align:center">${t('glob_locvacio')}</p>`}
    <h3>${t('rangos')}</h3>
    <div class="rango-lista">
      ${RANGOS.map(r=>{
        const cls=S.xp>=r.xp?(rangoDe(S.xp)===r?'act':'hecho'):'';
        return `<div class="rango-fila ${cls}"><span>${tj(r)}</span><span>${r.xp} XP</span></div>`}).join('')}
    </div>
    </div>
   </div>
    <button class="btn btn2" id="re-volver" type="button">${t('volver')}</button>
  </div>`);
  $('#re-volver').onclick=()=>{SFX.click();rTitulo()};
  $$('.rec-chip[data-dif]').forEach(b=>{
    b.onclick=()=>{
      const d=b.dataset.dif;
      filtroDif=d===''?null:Number(d);
      SFX.click();marcarChips();pintarGlobal();
    };
  });
  $$('.rec-chip[data-tabla]').forEach(b=>{
    b.onclick=()=>{
      tablaGlobal=b.dataset.tabla;
      SFX.click();marcarChips();pintarGlobal();
    };
  });
  const bSolo=$('#g-solo');
  if(bSolo)bSolo.onclick=()=>{soloGrupo=!soloGrupo;SFX.click();rRecords()};
  const bCam=$('#g-cambiar');
  if(bCam)bCam.onclick=()=>{SFX.click();rGrupo()};
  marcarChips();
  pintarGlobal();
}

/* ── CÓDIGO DE AULA ──
   Sin cuentas ni permisos: quien sepa el código ve ese marcador. Es un
   marcador de clase, no un sistema de seguridad, y el texto lo dice. */
function rGrupo(){
  pantalla('grupo',`
  <div class="centro">
    <span class="ico">🏫</span>
    <h2>${t('grupo_tit')}</h2>
    <p class="desc">${t('grupo_txt')}</p>
    <div style="width:min(300px,100%)">
      <input class="entrada" id="g-in" maxlength="8" autocomplete="off"
             autocapitalize="characters" spellcheck="false"
             placeholder="${t('grupo_ph')}" value="${esc(S.grupo)}">
    </div>
    <p class="mini" id="g-aviso">&nbsp;</p>
    <button class="btn" id="g-ok" type="button">${t('ok')}</button>
    ${S.grupo?`<button class="cut-skip" id="g-salir" type="button">${t('grupo_salir')}</button>`:''}
    <button class="btn btn2" id="g-volver" type="button">${t('volver')}</button>
  </div>`);
  const inp=$('#g-in');
  const guardarGrupo=()=>{
    const v=RANKING.limpiaGrupo(inp.value);
    if(!v){ $('#g-aviso').textContent=t('grupo_malo'); SFX.mal(); return; }
    S.grupo=v; soloGrupo=true; guardar(); SFX.ok(); rRecords();
  };
  $('#g-ok').onclick=guardarGrupo;
  inp.onkeydown=e=>{if(e.key==='Enter')guardarGrupo()};
  const bSalir=$('#g-salir');
  if(bSalir)bSalir.onclick=()=>{S.grupo='';soloGrupo=false;guardar();SFX.click();rRecords()};
  $('#g-volver').onclick=()=>{SFX.click();rRecords()};
  inp.focus();
}
function marcarChips(){
  $$('.rec-chip[data-dif]').forEach(b=>{
    const d=b.dataset.dif===''?null:Number(b.dataset.dif);
    b.classList.toggle('act',d===filtroDif);
  });
  $$('.rec-chip[data-tabla]').forEach(b=>{
    b.classList.toggle('act',b.dataset.tabla===tablaGlobal);
  });
}
/* Cada consulta lleva un número. Si el jugador cambia de filtro mientras una
   respuesta lenta viaja, esa respuesta llega con un número viejo y se tira:
   sin esto, la tabla podría acabar mostrando la dificultad equivocada. */
let peticionGlobal=0;
/* Rellena el bloque del marcador global cuando llega la respuesta. Si el
   jugador ya salió de la pantalla, no hay dónde pintar y se descarta. */
async function pintarGlobal(){
  const mia=++peticionGlobal;
  const caja0=$('#rec-global');
  if(caja0) caja0.innerHTML=`<p class="desc" style="text-align:center">${t('glob_carga')}</p>`;
  const filas=await RANKING.top(8,filtroDif,soloGrupo?S.grupo:'',tablaGlobal);
  if(mia!==peticionGlobal) return;              // llegó tarde: ya hay otro filtro
  const caja=$('#rec-global');
  if(!caja) return;
  if(!filas){ caja.innerHTML=`<p class="desc" style="text-align:center">${t('glob_sinred')}</p>`; return; }
  if(!filas.length){ caja.innerHTML=`<p class="desc" style="text-align:center">${t('glob_vacio')}</p>`; return; }
  const mio=S.nombre||t('tu');
  caja.innerHTML=tablaRecords(filas.map(f=>({
    n:f.nombre,p:f.puntos,x:f.xp,yo:f.nombre===mio?1:0,
    /* Con "TODAS" el icono de dificultad es la única pista de en qué condiciones
       se logró la marca; filtrando ya se sabe y solo estorbaría. */
    /* En el sin fin todas las filas son el mismo hito, así que ese icono no
       distingue nada y solo roba sitio al nombre. */
    ico:(filtroDif===null?(DIFS[f.dificultad]||DIFS[1]).ico:'')
       +(tablaGlobal==='sinfin'?'':(ICO_HITO[f.temporada]||ICO_HITO[1])),
  })));
}

/* ── ESTADÍSTICAS DE POR VIDA ── */
function rStats(){
  const st=S.stats;
  const filas=[
    ['🐛',st.bugs,'st_bugs'],['☕',st.cafes,'st_cafes'],['⌨️',st.palabras,'st_palabras'],
    ['👾',st.jefes,'st_jefes'],['🌟',st.perfectos,'st_perfectos'],['🔥',st.racha,'st_racha'],
    ['🎓',st.partidas,'st_partidas'],['⚡',st.retos||0,'st_retos'],
  ];
  /* Temas flojos: sale de los pesos que ya se guardan al fallar un ítem. */
  const repaso=RETO.repaso([
    {pool:'quiz',  total:QUIZ[S.lang].length, etiqueta:t('tipo_quiz')},
    {pool:'review',total:CODIGO.length,       etiqueta:t('tipo_review')},
    {pool:'sql',   total:SQLS.length,         etiqueta:t('tipo_sql')},
    {pool:'regex', total:REGEXS.length,       etiqueta:t('tipo_regex')},
    {pool:'merge', total:CONFLICTOS.length,   etiqueta:t('tipo_merge')},
    {pool:'palabras',total:PALABRAS.length,   etiqueta:t('tipo_palabras')},
    {pool:'git',   total:CMDS.length,         etiqueta:t('tipo_git')},
  ]).filter(r=>r.pendientes>0);
  const vacio=filas.every(f=>!f[1]);
  pantalla('stats',`
  <div class="centro">
    <h2>${t('estadisticas')}</h2>
    ${vacio?`<p class="desc" style="text-align:center">${t('st_sinreg')}</p>`:''}
   <div class="col2">
    <div class="col">
    <div class="stats-grid">
      ${filas.map(f=>`<div><span style="font-size:16px">${f[0]}</span><b>${f[1]}</b><span>${t(f[2])}</span></div>`).join('')}
    </div>
    <h3>${t('flojo_tit')}</h3>
    ${repaso.length
      ? `<p class="mini">${t('flojo_txt')}</p>
         <div class="flojo-lista">
           ${repaso.map(r=>`<div class="flojo-fila">
             <span class="f-nom">${r.etiqueta}</span>
             <div class="barra"><div class="barra-fill ${r.pc>40?'peligro':''}" style="width:${Math.max(6,r.pc)}%"></div></div>
             <span class="f-num">${r.pendientes}/${r.total}</span>
           </div>`).join('')}
         </div>`
      : `<p class="desc" style="text-align:center">${t('flojo_nada')}</p>`}
    </div>
    <div class="col">
    <h3>${t('guardado')}</h3>
    <p class="mini" style="text-align:center">${t('guardatxt')}</p>
    <div class="guardado-zona">
      <button class="btn btn2" id="es-exp" type="button">${t('exportar')}</button>
      <textarea class="entrada cod-guardado" id="es-code" rows="3" spellcheck="false" placeholder="${t('pegacodigo')}"></textarea>
      <button class="btn btn2" id="es-imp" type="button">${t('importar')}</button>
    </div>
    </div>
   </div>
    <button class="btn btn2" id="es-volver" type="button">${t('volver')}</button>
  </div>`);
  const aviso=(ico,txt)=>{
    const p=$('#logro-popup');
    p.querySelector('.ico-l').textContent=ico;
    p.querySelector('p').textContent=txt;
    p.hidden=false;setTimeout(()=>{p.hidden=true},2200);
  };
  $('#es-exp').onclick=()=>{
    const cod=exportarCodigo();
    const ta=$('#es-code');ta.value=cod;ta.select();
    if(navigator.clipboard&&navigator.clipboard.writeText)
      navigator.clipboard.writeText(cod).then(()=>aviso('💾',t('copiado'))).catch(()=>aviso('💾',t('guardado')));
    else aviso('💾',t('guardado'));
    SFX.moneda();
  };
  $('#es-imp').onclick=()=>{
    if(importarCodigo($('#es-code').value)){SFX.win();aviso('✅',t('impok'));rTitulo()}
    else{SFX.mal();aviso('❌',t('impmal'))}
  };
  $('#es-volver').onclick=()=>{SFX.click();rTitulo()};
}

/* ── PERSONALIZAR ── */
/* Pestaña abierta. Vive fuera de rPerso() porque la pantalla se repinta al
   comprar, y volver siempre a PIEL después de comprar un accesorio sería
   exasperante. */
let pePestana='piel';

function rPerso(){
  const nAcc=id=>t('acc_'+id);
  const pestanas=[['piel',t('piel')],['camisa',t('camisa')],['acc',t('accesorio')]];
  /* Accesorio pendiente de confirmar la compra. Se compra aquí y no solo en
     la tienda: tocar uno bloqueado y que se sacudiera sin decir nada ni
     ofrecerte comprarlo era un callejón sin salida. */
  let pendiente=null;

  const htmlAccs=()=>`
    <button class="acc-op ${S.acc===''?'sel':''}" data-a="" type="button"
      title="${t('pe_ninguno')}" aria-label="${t('pe_ninguno')}"><span class="acc-ico">🚫</span></button>
    ${ACCS.map(a=>{
      const tiene=S.accs.includes(a.id);
      const puesto=S.acc===a.id;
      const estado=puesto?t('equipado'):tiene?t('pe_comprado'):t('pe_bloqueado');
      return `<button class="acc-op ${puesto?'sel':''} ${tiene?'comprado':'bloq'}" data-a="${a.id}"
        type="button" title="${nAcc(a.id)} · ${estado}" aria-label="${nAcc(a.id)}, ${estado}">
        <span class="acc-ico">${a.ico}</span>
        ${puesto?'<span class="acc-eq">✔</span>':''}
        ${tiene?'':`<span class="acc-precio">⛁${a.precio}</span>`}
      </button>`}).join('')}`;

  const htmlConfirma=()=>pendiente?`
    <div class="pe-confirma" role="group">
      <p>${t('pe_confirma').replace('{n}',nAcc(pendiente.id)).replace('{p}',pendiente.precio)}</p>
      <div class="pe-confirma-btns">
        <button class="btn" id="pe-si" type="button">${t('pe_comprar')}</button>
        <button class="btn btn2" id="pe-no" type="button">${t('cancelar')}</button>
      </div>
    </div>`:'';

  pantalla('perso',`
  <div class="pe-wrap">
    <div class="pe-cab">
      <h2>🎨 ${t('perso')}</h2>
      <span class="moneda" id="pe-pts">⛁ ${S.pts} PTS</span>
    </div>

    <div class="pe-cuerpo">
      <section class="pe-lado">
        <p class="pe-cap">${t('personaje')}</p>
        <div class="pe-escena">
          <canvas class="pe-av" id="pe-cara" width="64" height="64"></canvas>
        </div>
        <div class="pe-detalle" role="group" aria-label="${t('pe_detalle')}">
          <button class="rec-chip ${!S.av32?'act':''}" id="pe-d16" type="button">${t('pe_detalle16')}</button>
          <button class="rec-chip ${S.av32?'act':''}" id="pe-d32" type="button">${t('pe_detalle32')}</button>
        </div>
        <p class="pe-nombre">${esc(S.nombre||t('tu'))}</p>
        <p class="pe-rango">${rangoNom()}</p>
        <dl class="pe-stats">
          <div><dt>⛁</dt><dd id="pe-st-pts">${S.pts}</dd></div>
          <div><dt>★</dt><dd>${S.xp} XP</dd></div>
          <div><dt>🎁</dt><dd id="pe-st-acc">${S.accs.length}/${ACCS.length}</dd></div>
        </dl>
      </section>

      <section class="pe-custom">
        <div class="pe-tabs" role="tablist" aria-label="${t('perso')}">
          ${pestanas.map(([id,txt])=>`<button class="pe-tab${pePestana===id?' act':''}" type="button"
            role="tab" id="pe-t-${id}" data-tab="${id}" aria-controls="pe-p-${id}"
            aria-selected="${pePestana===id}" tabindex="${pePestana===id?0:-1}">${txt}</button>`).join('')}
        </div>

        <div class="pe-panel" id="pe-p-piel" role="tabpanel" aria-labelledby="pe-t-piel" ${pePestana==='piel'?'':'hidden'}>
          <div class="custom-fila">
            ${SKINS.map((c,i)=>`<button class="skin-op ${S.skin===i?'sel':''}" data-s="${i}"
              style="background:${c}" type="button" aria-label="${t('piel')} ${i+1}"></button>`).join('')}
          </div>
        </div>

        <div class="pe-panel" id="pe-p-camisa" role="tabpanel" aria-labelledby="pe-t-camisa" ${pePestana==='camisa'?'':'hidden'}>
          <div class="custom-fila">
            ${CAMISAS.map((c,i)=>`<button class="camisa-op ${S.camisa===i?'sel':''}" data-c="${i}"
              style="background:${c}" type="button" aria-label="${t('camisa')} ${i+1}"></button>`).join('')}
          </div>
        </div>

        <div class="pe-panel" id="pe-p-acc" role="tabpanel" aria-labelledby="pe-t-acc" ${pePestana==='acc'?'':'hidden'}>
          <div class="accs-tienda" id="pe-accs">${htmlAccs()}</div>
          <div id="pe-conf">${htmlConfirma()}</div>
        </div>

        <div class="pe-pie">
          <span class="pe-estado" id="pe-estado" role="status" aria-live="polite">${t('pe_guardado')}</span>
          <button class="btn btn2 pe-volver" id="pe-volver" type="button">${t('volver')}</button>
        </div>
      </section>
    </div>
  </div>`);

  const pinta=()=>retratoVivo($('#pe-cara'),CARAS.yo(true));
  const avisar=(txt,cls)=>{const e=$('#pe-estado');if(!e)return;e.textContent=txt;e.className='pe-estado'+(cls?' '+cls:'')};
  const latido=()=>{const a=$('#pe-escena-av')||$('#pe-cara');a.classList.remove('pe-pum');void a.offsetWidth;a.classList.add('pe-pum')};

  /* ── detalle del retrato: 16 de siempre / 32 más fino ──
     Es aparte de S.hd (la piel retro/OLED): los dos se combinan, no se
     excluyen. Cambia aquí mismo y no en el título porque este es el sitio
     donde se ve el avatar grande, así el cambio se nota al instante. */
  $('#pe-d16').onclick=()=>{
    if(!S.av32)return;
    S.av32=false;guardar();aplicarModo();SFX.click();
    $('#pe-d16').classList.add('act');$('#pe-d32').classList.remove('act');
    pinta();latido();
  };
  $('#pe-d32').onclick=()=>{
    if(S.av32)return;
    S.av32=true;guardar();aplicarModo();SFX.click();
    $('#pe-d32').classList.add('act');$('#pe-d16').classList.remove('act');
    pinta();latido();
  };

  /* ── pestañas ── */
  const abrir=id=>{
    pePestana=id;
    $$('.pe-tab').forEach(x=>{const on=x.dataset.tab===id;
      x.classList.toggle('act',on);x.setAttribute('aria-selected',on);x.tabIndex=on?0:-1});
    $$('.pe-panel').forEach(pn=>{pn.hidden=pn.id!=='pe-p-'+id});
  };
  $$('.pe-tab').forEach(b=>{
    b.onclick=()=>{SFX.click();abrir(b.dataset.tab)};
    /* Un role="tablist" se recorre con las flechas, no con el tabulador. */
    b.onkeydown=e=>{
      const k=e.key;
      if(k!=='ArrowRight'&&k!=='ArrowLeft')return;
      e.preventDefault();
      const ids=pestanas.map(x=>x[0]);
      const n=(ids.indexOf(pePestana)+(k==='ArrowRight'?1:ids.length-1))%ids.length;
      abrir(ids[n]);$('#pe-t-'+ids[n]).focus();SFX.click();
    };
  });

  /* ── piel y camisa ── */
  $$('.skin-op').forEach(b=>b.onclick=()=>{
    S.skin=+b.dataset.s;guardar();SFX.click();
    $$('.skin-op').forEach(x=>x.classList.toggle('sel',x===b));
    pinta();latido();avisar(t('pe_guardado'));
  });
  $$('.camisa-op').forEach(b=>b.onclick=()=>{
    S.camisa=+b.dataset.c;guardar();SFX.click();
    $$('.camisa-op').forEach(x=>x.classList.toggle('sel',x===b));
    pinta();latido();avisar(t('pe_guardado'));
  });

  /* ── accesorios ── */
  function refrescar(){
    $('#pe-accs').innerHTML=htmlAccs();
    $('#pe-conf').innerHTML=htmlConfirma();
    $('#pe-pts').textContent='⛁ '+S.pts+' PTS';
    $('#pe-st-pts').textContent=S.pts;
    $('#pe-st-acc').textContent=S.accs.length+'/'+ACCS.length;
    enlazarAccs();
    pinta();
  }
  function comprar(){
    const a=pendiente;pendiente=null;
    if(!a||S.pts<a.precio)return refrescar();
    S.pts-=a.precio;S.accs.push(a.id);S.acc=a.id;guardar();
    SFX.moneda();darLogro('comprador');
    if(ACCS.every(x=>S.accs.includes(x.id)))darLogro('coleccionista');
    refrescar();latido();confeti();
    avisar(t('pe_comprado')+': '+nAcc(a.id),'verde');
  }
  function enlazarAccs(){
    $$('#pe-accs .acc-op').forEach(b=>b.onclick=()=>{
      const id=b.dataset.a;
      if(!id){S.acc='';guardar();SFX.click();pendiente=null;refrescar();latido();avisar(t('pe_guardado'));return}
      const a=ACCS.find(x=>x.id===id);
      if(S.accs.includes(id)){
        S.acc=S.acc===id?'':id;guardar();SFX.click();pendiente=null;refrescar();latido();
        avisar(S.acc===id?t('equipado')+': '+nAcc(id):t('pe_guardado'));
        return;
      }
      if(S.pts<a.precio){
        SFX.mal();b.classList.add('shake');setTimeout(()=>b.classList.remove('shake'),320);
        avisar(t('pe_faltan').replace('{p}',a.precio-S.pts),'rojo');
        return;
      }
      pendiente=a;SFX.click();refrescar();
      avisar(t('pe_confirma').replace('{n}',nAcc(a.id)).replace('{p}',a.precio));
    });
    const si=$('#pe-si'),no=$('#pe-no');
    if(si)si.onclick=()=>{SFX.click();comprar()};
    if(no)no.onclick=()=>{SFX.click();pendiente=null;refrescar();avisar(t('pe_guardado'))};
  }
  enlazarAccs();
  pinta();
  $('#pe-volver').onclick=()=>{SFX.click();rTitulo()};
}

