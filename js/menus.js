'use strict';
/* ── TÍTULO ── */
function rTitulo(){
  pantalla('titulo',`
  <div class="centro">
    <div class="logo-px">SENA · ${S.hd?'4K OLED':'32-BIT'} · v4.0</div>
    <h1>PRACTICANTE<br>EN APUROS <span class="verde">4</span></h1>
    <p class="sub">${t('sub')}</p>
    <div class="rango-linea">
      <span class="rango-badge grande">${rangoNom()}</span>
      <span class="moneda">⛁ ${S.pts} PTS</span>
    </div>
    <button class="btn" id="t-jugar" type="button">${t('jugar')}</button>
    <div class="custom-fila">
      <button class="btn btn2" id="t-tienda" type="button">🛒 ${t('tienda')}</button>
      <button class="btn btn2" id="t-logros" type="button">🏆 ${t('logros')}</button>
    </div>
    <div class="custom-fila">
      <button class="btn btn2" id="t-records" type="button">📊 ${t('records')}</button>
      <button class="btn btn3" id="t-perso" type="button">🎨 ${t('perso')}</button>
    </div>
    <button class="btn btn2" id="t-modo" type="button">${S.hd?t('modo_retro'):t('modo_hd')}</button>
    <p class="mini blink">${t('start')}</p>
    <button class="cut-skip" id="t-borrar" type="button">${t('borrar')}</button>
  </div>`);
  $('#t-modo').onclick=()=>{S.hd=!S.hd;guardar();aplicarModo();SFX.moneda();rTitulo()};
  $('#t-borrar').onclick=()=>{SFX.click();rBorrar()};
  $('#t-jugar').onclick=()=>{
    SFX.click();
    const go=()=>S.intro?rMapa():rCutscene(INTRO[S.lang],()=>{S.intro=true;guardar();rMapa()});
    S.nombre?go():rNombre(go);
  };
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
    const prefs={lang:S.lang,snd:S.snd,hd:S.hd};
    S=Object.assign({},DEF,{dias:Array(10).fill(-1),logros:[],accs:[],mejoras:[],records:[]},prefs);
    guardar();
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
  let cards='';
  NIVELES.forEach((N,i)=>{
    const st=S.dias[i];
    const estado=st>=1?'ok':(i<=p?'open':'lock');
    const badge=st>=1?'★'.repeat(st):(estado==='lock'?'🔒':'▶');
    cards+=`
    <button class="etapa-card ${estado}" data-i="${i}" ${estado==='lock'?'disabled':''} type="button">
      <span class="etapa-num">${i+1}</span>
      <span class="etapa-ico">${N.ico}</span>
      <span class="etapa-body">
        <span class="etapa-nom">${tj({es:N.es,en:N.en})}</span>
        <span class="etapa-sub" style="display:block">${tj({es:N.ses,en:N.sen})}</span>
        ${st>=1?`<span class="etapa-rango" style="display:block">${t('mejor')}: ${'★'.repeat(st)}</span>`:''}
      </span>
      <span class="etapa-badge">${badge}${estado==='open'&&i===p?`<span class="aqui">${t('aqui')}</span>`:''}</span>
    </button>
    ${i<9?'<div class="etapa-link"></div>':''}`;
  });
  /* casilla 11 ??? — solo visible tras completar el día 10 */
  if(S.dias[9]>=1){
    cards+=`
    <div class="etapa-link etapa-link-jefe"></div>
    <button class="etapa-card etapa-jefe" id="m-jefe" type="button">
      <span class="etapa-num">11</span>
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
    <div class="rango-linea">
      <span class="rango-badge">${t('rango')}: ${rangoNom()}</span>
      <span class="moneda">⛁ ${S.pts}</span>
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
  diaAct=i;vidas=maxVidas();
  rDialogo(i);
}
function rDialogo(i){
  const [quien,linea]=DIALOGOS[S.lang][i];
  const N=NIVELES[i];
  pantalla('dialogo',`
  <div class="centro">
    <p class="dia">${t('dia')} ${i+1}/10</p>
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
  cara($('#d-cara'),quienCara(quien));
  /* máquina de escribir */
  let j=0;const el=$('#d-linea');
  tcada(()=>{if(pausado)return;if(j<linea.length){el.textContent=linea.slice(0,++j);if(j%3===0)beep(700+Math.random()*200,.02,'triangle',.05)}},28);
  $('#d-go').onclick=()=>{SFX.click();jugarNivel(i)};
}
function jugarNivel(i){
  const tipo=NIVELES[i].tipo;
  ({escribir:nvEscribir,bugs:nvBugs,memoria:nvMemoria,simon:nvSimon,quiz:nvQuiz,
    review:nvReview,merge:nvMerge,runner:nvRunner})[tipo](i);
}

/* ── CERTIFICADO ── */
function registrarRecord(){
  S.records.push({n:S.nombre||t('tu'),p:S.pts,x:S.xp,yo:1});
  S.records.sort((a,b)=>b.p-a.p);
  S.records=S.records.slice(0,5);
}
function rCertificado(){
  const hoy=new Date().toLocaleDateString(S.lang==='es'?'es-CO':'en-US');
  pantalla('cert',`
  <div class="centro">
    <div class="cert">
      <p class="dia">🎓 ${t('cert')} 🎓</p>
      <div class="retrato-wrap"><canvas class="retrato" id="c-cara" width="64" height="64"></canvas></div>
      <p class="sub">${t('certde')}</p>
      <p class="rango">${S.nombre||t('tu')}</p>
      <p class="desc" style="text-align:center">${t('certtxt')}</p>
      ${starsHtml(Math.min(3,Math.round(totalStars()/10)))}
      <div class="stats-grid">
        <div><b>${progreso()}</b><span>${t('diascomp')}</span></div>
        <div><b>${totalStars()}</b><span>${t('estrellas')}</span></div>
        <div><b>${S.pts}</b><span>${t('ptstotal')}</span></div>
      </div>
      <p class="sub">${t('firma')} · ${t('fecha')}: ${hoy}</p>
      <span class="rango-badge grande">${rangoNom()}</span>
    </div>
    <button class="btn" id="c-volver" type="button">${t('volver')}</button>
  </div>`);
  cara($('#c-cara'),Object.assign(CARAS.yo(true),{medalla:true}));
  confeti();
  $('#c-volver').onclick=()=>{SFX.click();rTitulo()};
}

/* ── TIENDA ── */
function rTienda(){
  const nAcc=id=>t('acc_'+id);
  const nMej={vida:t('mejvida'),tiempo:t('mejtiempo'),doble:t('mejdoble')};
  pantalla('tienda',`
  <div class="centro">
    <h2>🛒 ${t('tienda')}</h2>
    <span class="moneda">⛁ ${S.pts} PTS</span>
    <div class="tienda-grid">
      ${ACCS.map(a=>{
        const tiene=S.accs.includes(a.id);
        const puede=S.pts>=a.precio;
        return `<div class="item-tienda ${tiene?'activa':(puede?'':'sin-pts')}" data-id="${a.id}">
          <span class="ico-t">${a.ico}</span>
          <span class="nom-t">${nAcc(a.id)}</span>
          <span class="precio">${tiene?(S.acc===a.id?'✔ '+t('equipado'):'✔'):'⛁'+a.precio}</span>
        </div>`}).join('')}
    </div>
    <p class="mej-titulo">⚙ ${t('mejoras')}</p>
    <div class="mejoras-tienda">
      ${MEJORAS.map(m=>{
        const tiene=S.mejoras.includes(m.id);
        const puede=S.pts>=m.precio;
        return `<div class="item-tienda ${tiene?'activa':(puede?'':'sin-pts')}" data-mej="${m.id}" style="flex-direction:row;justify-content:space-between;width:100%">
          <span class="ico-t">${m.ico}</span>
          <span class="nom-t">${nMej[m.id]}</span>
          <span class="precio">${tiene?'✔':'⛁'+m.precio}</span>
        </div>`}).join('')}
    </div>
    <button class="btn btn2" id="ti-volver" type="button">${t('volver')}</button>
  </div>`);
  $$('[data-id]').forEach(el=>el.onclick=()=>{
    const a=ACCS.find(x=>x.id===el.dataset.id);
    if(S.accs.includes(a.id)){S.acc=S.acc===a.id?'':a.id;guardar();SFX.click();rTienda();return}
    if(S.pts<a.precio){SFX.mal();return}
    S.pts-=a.precio;S.accs.push(a.id);S.acc=a.id;guardar();
    SFX.moneda();darLogro('comprador');rTienda();
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
    <p class="sub">${S.logros.length}/${LOGROS.length}</p>
    <div class="logros-grid">
      ${LOGROS.map(l=>`<div class="logro ${S.logros.includes(l.id)?'on':''}">
        <span class="ico-lg">${l.ico}</span><p>${tj(l)}</p></div>`).join('')}
    </div>
    <button class="btn btn2" id="lo-volver" type="button">${t('volver')}</button>
  </div>`);
  $('#lo-volver').onclick=()=>{SFX.click();rTitulo()};
}

/* ── RÉCORDS ── */
function rRecords(){
  const base=[{n:'MARIA_DEV',p:9500,x:3200},{n:'CARLOS.JS',p:7800,x:2500},{n:'LUISA_SQL',p:5900,x:1600},{n:'PEPE_HTML',p:3400,x:900}];
  const todos=[...base,...S.records].sort((a,b)=>b.p-a.p).slice(0,8);
  pantalla('records',`
  <div class="centro">
    <h2>📊 ${t('records')}</h2>
    <table class="rec-tabla">
      <tr><th>#</th><th>${t('rec_nom')}</th><th>${t('rec_pts')}</th><th>${t('rec_rango')}</th></tr>
      ${todos.map((r,i)=>`<tr class="${r.yo?'yo':''}"><td>${i+1}</td><td>${r.n}</td><td>${r.p}</td><td>${tj(rangoDe(r.x))}</td></tr>`).join('')}
    </table>
    <h3>${t('rangos')}</h3>
    <div class="rango-lista">
      ${RANGOS.map(r=>{
        const cls=S.xp>=r.xp?(rangoDe(S.xp)===r?'act':'hecho'):'';
        return `<div class="rango-fila ${cls}"><span>${tj(r)}</span><span>${r.xp} XP</span></div>`}).join('')}
    </div>
    <button class="btn btn2" id="re-volver" type="button">${t('volver')}</button>
  </div>`);
  $('#re-volver').onclick=()=>{SFX.click();rTitulo()};
}

/* ── PERSONALIZAR ── */
function rPerso(){
  pantalla('perso',`
  <div class="centro">
    <h2>🎨 ${t('perso')}</h2>
    <div class="retrato-wrap" style="width:96px;height:96px;flex:none">
      <canvas class="retrato" id="pe-cara" width="64" height="64" style="width:96px;height:96px"></canvas>
    </div>
    <h3>${t('piel')}</h3>
    <div class="custom-fila">
      ${SKINS.map((s,i)=>`<button class="skin-op ${S.skin===i?'sel':''}" data-s="${i}" style="background:${s}" type="button"></button>`).join('')}
    </div>
    <h3>${t('camisa')}</h3>
    <div class="custom-fila">
      ${CAMISAS.map((s,i)=>`<button class="camisa-op ${S.camisa===i?'sel':''}" data-c="${i}" style="background:${s}" type="button"></button>`).join('')}
    </div>
    <h3>${t('accesorio')}</h3>
    <div class="accs-tienda">
      <button class="acc-op ${S.acc===''?'sel':''}" data-a="" type="button"><span class="acc-ico">🚫</span></button>
      ${ACCS.map(a=>{
        const tiene=S.accs.includes(a.id);
        return `<button class="acc-op ${S.acc===a.id?'sel':''} ${tiene?'':'bloq'}" data-a="${a.id}" type="button">
          <span class="acc-ico">${a.ico}</span>
          ${tiene?(S.acc===a.id?'<span class="acc-eq">✔</span>':''):`<span class="acc-precio">⛁${a.precio}</span>`}
        </button>`}).join('')}
    </div>
    <button class="btn btn2" id="pe-volver" type="button">${t('volver')}</button>
  </div>`);
  const pinta=()=>cara($('#pe-cara'),CARAS.yo(true));
  pinta();
  $$('.skin-op').forEach(b=>b.onclick=()=>{S.skin=+b.dataset.s;guardar();SFX.click();rPerso()});
  $$('.camisa-op').forEach(b=>b.onclick=()=>{S.camisa=+b.dataset.c;guardar();SFX.click();rPerso()});
  $$('.acc-op').forEach(b=>b.onclick=()=>{
    const id=b.dataset.a;
    if(id&&!S.accs.includes(id)){b.classList.add('shake');SFX.mal();setTimeout(()=>b.classList.remove('shake'),320);return}
    S.acc=id;guardar();SFX.click();rPerso();
  });
  $('#pe-volver').onclick=()=>{SFX.click();rTitulo()};
}
