'use strict';
/* Logros, récords, código de aula y estadísticas (ver la lista en menus.js). */
/* Una imagen propia por logro. Los secretos ocultos usan el candado común. */
const SPRITES_LOGROS=new Set(['primer', 'perfecto', 'mitad', 'comprador', 'veloz', 'cerebro', 'gitmaster', 'revisor', 'resolutor', 'jefe', 'titulado', 'intacto', 'combo', 'coleccionista', 'pesadilla', 'maraton', 'sql', 'regex', 'contrato', 's10', 's6', 's7', 's4', 's3', 's5', 's9', 's1', 's8', 's2']);
function iconoLogro(id,emoji,bloqueado=false){
  const sprite=bloqueado?'secreto':SPRITES_LOGROS.has(id)?id:null;
  return sprite
    ? `<img class="logro-sprite${bloqueado?' logro-sprite-secreto':''}" src="img/logros/${sprite}.png" alt="" aria-hidden="true">`
    : `<span class="ico-lg" aria-hidden="true">${emoji}</span>`;
}
function rLogros(){
  pantalla('logros',`
  <div class="centro logros-pantalla">
    <h2>🏆 ${t('logros')}</h2>
    <div class="tit-bloque">
      <div class="barra tit-barra"><div class="barra-fill" style="width:${Math.round(LOGROS.filter(l=>S.logros.includes(l.id)).length/LOGROS.length*100)}%"></div></div>
      <p class="xp-txt">${LOGROS.filter(l=>S.logros.includes(l.id)).length} / ${LOGROS.length} · ${Math.round(LOGROS.filter(l=>S.logros.includes(l.id)).length/LOGROS.length*100)}%</p>
    </div>
    <div class="logros-grid">
      ${LOGROS.map(l=>{
        const hecho=S.logros.includes(l.id);
        /* El conseguido se enseña tal cual. El que falta enseña CÓMO se
           consigue: un icono gris y nada más no le dice nada a nadie. */
        return `<div class="logro ${hecho?'on':''}">
        ${iconoLogro(l.id,l.ico)}<p>${tj(l)}</p>
        <p class="pista">${'★'.repeat(l.dif||2)} ${hecho?'':tp(l)}</p></div>`}).join('')}
    </div>
    <h3>${S.lang==='es'?'🔒 SECRETOS':'🔒 SECRETS'} · ${LOGROS_SECRETOS.filter(l=>S.logros.includes(l.id)).length}/10</h3>
    <div class="logros-grid">
      ${LOGROS_SECRETOS.map(l=>{
        const logrado=S.logros.includes(l.id);
        return `<div class="logro ${logrado?'on':''}">${iconoLogro(l.id,logrado?l.ico:'❓',!logrado)}
          <p>${logrado?tj(l):'???'}</p><p class="pista">${'★'.repeat(l.dif)}</p>
          ${logrado?'':`<p class="pista pista-sec">${(S.lang==='en'?l.hen:l.hes)||(S.lang==='en'?'🔜 Not available yet':'🔜 Aún no disponible')}</p>`}
          ${logrado?`<p class="pista">${tp(l)} · ${S.lang==='es'?'Camisa':'Shirt'} ${t('pe_camisa_'+(CAMISAS.length+CAMISAS_SECRETAS.findIndex(c=>c.logro===l.id)))}</p>`:''}</div>`;
      }).join('')}
    </div>
    <button class="btn btn2" id="lo-volver" type="button">${t('volver')}</button>
  </div>`,rLogros);
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
  return `<div class="rec-tabla-marco"><table class="rec-tabla">
      <tr><th>#</th><th>${t('rec_nom')}</th><th>${t('rec_pts')}</th><th>${t('rec_rango')}</th></tr>
      ${filas.map((r,i)=>`<tr class="${r.yo?'yo':''}"><td>${i+1}</td><td>${r.ico?`<span class="rec-ico">${r.ico}</span>`:''}${esc(r.n)}</td><td>${r.p}</td><td>${tj(rangoDe(r.x))}</td></tr>`).join('')}
    </table></div>`;
}
function rRecords(){
  const locales=[...S.records].sort((a,b)=>b.p-a.p).slice(0,8);
  pantalla('records',`
  <div class="centro records-pantalla">
    <h2>📊 ${t('records')}</h2>
   <div class="col2">
    <section class="col records-col records-global">
    <h3>${t('glob_tit')}</h3>
    <div class="rec-filtros">
      <button class="rec-chip" data-tabla="campana" type="button">${pxi('🎓')} ${t('glob_campana')}</button>
      <button class="rec-chip" data-tabla="sinfin" type="button">♾️ ${t('glob_sinfin')}</button>
    </div>
    <div class="rec-filtros">
      <button class="rec-chip" data-dif="" type="button">${t('glob_todas')}</button>
      ${DIFS.map(d=>`<button class="rec-chip" data-dif="${d.id}" type="button">${pxi(d.ico)} ${tj(d)}</button>`).join('')}
    </div>
    <div class="grupo-barra">
      ${S.grupo
        ? `<span class="grupo-cod">🏫 ${esc(S.grupo)}</span>
           <button class="rec-chip ${soloGrupo?'act':''}" id="g-solo" type="button">${t('grupo_solo')}</button>
           <button class="rec-chip" id="g-cambiar" type="button">${t('grupo_cambiar')}</button>`
        : `<span class="grupo-vacio">${t('grupo_no')}</span>
           <button class="rec-chip" id="g-cambiar" type="button">${t('grupo_unirse')}</button>`}
    </div>
    <div id="rec-global" aria-live="polite"><p class="desc rec-estado">${t('glob_carga')}</p></div>
    </section>
    <section class="col records-col records-local">
    <h3>${t('glob_loc')}</h3>
    ${locales.length
      ? tablaRecords(locales)
      : `<p class="desc rec-estado rec-estado-local"><span aria-hidden="true">☆</span>${t('glob_locvacio')}</p>`}
    <h3>${t('rangos')}</h3>
    <div class="rango-lista">
      ${RANGOS.map((r,i)=>{
        const cls=S.xp>=r.xp?(rangoDe(S.xp)===r?'act':'hecho'):'';
        return `<div class="rango-fila ${cls}"><span class="rango-nombre"><span class="rango-num" aria-hidden="true">${i+1}</span>${tj(r)}</span><span class="rango-pts">${r.xp} XP</span></div>`}).join('')}
    </div>
    </section>
   </div>
    <button class="btn btn2" id="re-volver" type="button">${t('volver')}</button>
  </div>`,rRecords);
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
  </div>`,rGrupo);
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
  if(caja0) caja0.innerHTML=`<p class="desc rec-estado">${t('glob_carga')}</p>`;
  const filas=await RANKING.top(8,filtroDif,soloGrupo?S.grupo:'',tablaGlobal);
  if(mia!==peticionGlobal) return;              // llegó tarde: ya hay otro filtro
  const caja=$('#rec-global');
  if(!caja) return;
  if(!filas){ caja.innerHTML=`<p class="desc rec-estado rec-sinred"><span aria-hidden="true">↯</span>${t('glob_sinred')}</p>`; return; }
  if(!filas.length){ caja.innerHTML=`<p class="desc rec-estado"><span aria-hidden="true">☆</span>${t('glob_vacio')}</p>`; return; }
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
  const repaso=temasRepaso().filter(r=>r.pendientes>0);
  const vacio=filas.every(f=>!f[1]);
  pantalla('stats',`
  <div class="centro">
    <h2>${t('estadisticas')}</h2>
    ${vacio?`<p class="desc" style="text-align:center">${t('st_sinreg')}</p>`:''}
   <div class="col2">
    <div class="col">
    <div class="stats-grid">
      ${filas.map(f=>`<div><span style="font-size:16px">${f[0]}</span><b>${esc(f[1])}</b><span>${t(f[2])}</span></div>`).join('')}
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
    ${repaso.length?`<button class="btn btn3" id="es-repaso" type="button">🎯 ${t('repaso_btn')}</button>`:''}
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
  </div>`,rStats);
  const aviso=(ico,txt)=>{
    mostrarAviso(ico,txt,2200);
  };
  if($('#es-repaso'))$('#es-repaso').onclick=()=>{SFX.click();rRepaso()};
  $('#es-exp').onclick=()=>{
    const cod=exportarCodigo();
    const ta=$('#es-code');ta.value=cod;ta.select();
    if(navigator.clipboard&&navigator.clipboard.writeText)
      navigator.clipboard.writeText(cod).then(()=>aviso('💾',t('copiado'))).catch(()=>aviso('💾',t('guardado')));
    else aviso('💾',t('guardado'));
    SFX.moneda();
  };
  /* Importar REEMPLAZA toda la partida: un código ajeno o viejo borra el progreso de quien lo pega. Primero se comprueba el código
     (uno inválido se rechaza al momento) y luego hace falta un segundo toque para confirmar, como al terminar una sala. */
  $('#es-imp').onclick=()=>{
    const b=$('#es-imp');
    if(!leerCodigo($('#es-code').value)){SFX.mal();aviso('❌',t('impmal'));return}
    if(!b.classList.contains('armado')){
      b.classList.add('armado');b.textContent=t('imp_seguro');SFX.click();
      tvez(()=>{if(b.isConnected){b.classList.remove('armado');b.textContent=t('importar')}},4000);
      return;
    }
    if(importarCodigo($('#es-code').value)){SFX.win();aviso('✅',t('impok'));rTitulo()}
    else{SFX.mal();aviso('❌',t('impmal'))}
  };
  $('#es-volver').onclick=()=>{SFX.click();rTitulo()};
}
