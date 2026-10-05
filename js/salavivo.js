'use strict';
/* ── RONDA EN VIVO y PANEL DEL INSTRUCTOR · pantallas ──
   La parte que se ve de db/sala-vivo.sql. La red y la lógica pura viven en
   sala.js (SALA.vivoMando, responder, reportar, resumen…); aquí solo se pinta.

   RONDA EN VIVO, estilo Kahoot: el instructor lanza una pregunta, todos
   responden a la vez en su celular y el proyector enseña el podio al instante.
     · proyector: la pregunta en grande, el reloj, cuántos han respondido y,
       al revelar, qué eligió cada opción y cuál era la buena;
     · alumno: cuatro botones grandes con forma y letra (no solo color) y su
       puesto al revelar;
     · la pregunta actual y su reloj viven en el SERVIDOR. Cada dispositivo
       solo pregunta cuál es y cuánto lleva, así que los relojes de los celulares
       no tienen que coincidir.

   PANEL: qué temas falló más la clase, agregado, nunca por nombre. */

/* Las cuatro opciones: letra + forma + color. La forma es la que importa para
   quien no distingue colores, igual que en el resto del juego. */
const SV_OPS = [
  { forma: '▲', cls: 'sv-a' }, { forma: '◆', cls: 'sv-b' },
  { forma: '●', cls: 'sv-c' }, { forma: '■', cls: 'sv-d' },
];
const SV_CADENCIA = r => (r.datos && SALA.esVivo(r.datos) && r.datos.estado === 'jugando') ? 1200 : 3000;

/* La pregunta del banco para un índice, en el idioma de ESTE dispositivo. Si el
   índice no existe (un celular con una versión más vieja del banco) es null y
   la pantalla lo dice en vez de reventar. */
const preguntaVivo = idx => {
  const banco = QUIZ[S.lang] || QUIZ.es;
  return Number.isInteger(idx) && idx >= 0 && idx < banco.length ? banco[idx] : null;
};

/* ══════════ PROYECTOR ══════════ */

let pvQ = 0, pvRevelando = false, pvEst = null, pvRecibido = 0;

/* Se llama en cada sondeo del proyector. Dibuja (o actualiza) la pregunta en
   curso y decide cuándo revelar. */
function proyectorVivo(codigo, est) {
  const caja = $('#sv-proy');
  if (!caja) return;
  if (!(SALA.esVivo(est) && est.estado === 'jugando')) { caja.innerHTML = ''; delete caja.dataset.q; return; }
  pvEst = est; pvRecibido = performance.now();
  const clave = est.q_n + '|' + !!est.revelada;
  if (est.q_n !== pvQ) { pvQ = est.q_n; pvRevelando = false; }
  if (est.revelada) pvRevelando = false;
  const Q = preguntaVivo(est.items[est.q_n - 1]);

  if (caja.dataset.q !== clave) {
    caja.dataset.q = clave;
    caja.innerHTML = `
    <div class="sv-caja">
      <div class="sv-cab"><span class="sv-num">${t('sv_pregunta').replace('{a}', est.q_n).replace('{b}', est.q_total)}</span>
        <span class="sv-reloj" id="sv-reloj" aria-hidden="true"></span></div>
      <div class="sv-barra" aria-hidden="true"><i id="sv-barra"></i></div>
      <p class="sv-preg">${Q ? esc(Q.q) : t('sv_sinpregunta')}</p>
      <div class="sv-ops sv-ops-proy">
        ${Q ? Q.o.map((o, k) => `<div class="sv-op ${SV_OPS[k].cls} ${est.revelada ? (k === Q.r ? 'bien' : 'apagada') : ''}">
          <b class="sv-forma" aria-hidden="true">${SV_OPS[k].forma}</b>
          <span class="sv-txt">${String.fromCharCode(65 + k)}) ${esc(o)}</span>
          ${est.revelada ? `<em class="sv-n"><i style="width:${distPc(est, k)}%"></i><b>${(est.dist || [])[k] || 0}</b></em>` : ''}
        </div>`).join('') : ''}
      </div>
      <p class="sv-resp" id="sv-resp" role="status" aria-live="polite"></p>
    </div>`;
    if (est.revelada) SFX.win();
    else SFX.click();
  }
  const n = est.jugadores.filter(j => !j.host).length;
  const resp = $('#sv-resp');
  if (resp) resp.textContent = est.revelada ? '' : t('sv_responden').replace('{a}', est.respondieron || 0).replace('{b}', n);

  /* el reloj corre solo en este dispositivo; el sondeo lo recoloca con la hora
     del servidor. Un solo temporizador por pantalla. */
  if (!caja._tic) {
    caja._tic = true;
    tcada(() => {
      const e = pvEst; if (!e || e.estado !== 'jugando') return;
      const resta = SALA.restanteMs(e, pvRecibido, performance.now());
      const r = $('#sv-reloj'), b = $('#sv-barra');
      if (r) r.textContent = e.revelada ? '' : String(Math.ceil(resta / 1000));
      if (b) { b.style.width = (e.revelada ? 0 : resta / (e.limite * 1000) * 100) + '%'; b.classList.toggle('peligro', resta < e.limite * 300); }
      revelarSiToca(codigo, e, resta);
    }, 200);
  }
  revelarSiToca(codigo, est, SALA.restanteMs(est, pvRecibido, performance.now()));
}
const distPc = (est, k) => {
  const d = est.dist || [], mx = Math.max(1, ...d);
  return Math.round((d[k] || 0) / mx * 100);
};

/* Se revela solo cuando se acaba el tiempo o ya respondieron todos, igual que
   Kahoot. Una sola vez por pregunta. */
function revelarSiToca(codigo, est, resta) {
  if (est.revelada || pvRevelando || !SALA.soyHost(codigo)) return;
  const n = est.jugadores.filter(j => !j.host).length;
  if (resta <= 0 || (n > 0 && (est.respondieron || 0) >= n)) {
    pvRevelando = true;
    SALA.vivoMando(codigo, 'revelar');
  }
}

/* Los mandos del instructor durante la ronda: revelar / siguiente y terminar.
   Espacio o → hacen lo principal, para presentar con un puntero. */
let mvClave = '', mvTecla = false;
function mandosVivo(codigo, est) {
  const clave = [est.q_n, !!est.revelada, est.q_total].join('|');
  if (clave === mvClave && $('#sp-vivo-sig')) return;      // no se re-pinta: no roba el foco
  mvClave = clave;
  const ultima = est.q_n >= est.q_total;
  const txt = !est.revelada ? t('sv_revelar') : (ultima ? t('sv_podio') : t('sv_siguiente'));
  $('#sp-mandos').innerHTML = `
    <div class="jugar-marco"><i></i><i></i><i></i><i></i>
      <button class="btn btn-jugar" id="sp-vivo-sig" type="button">${txt}</button></div>
    <button class="btn btn2" id="sp-terminar" type="button">🏁 ${t('sala_terminar')}</button>
    <button class="btn btn2" id="sp-salir" type="button">${t('volver')}</button>`;
  $('#sp-vivo-sig').onclick = () => accionPrincipalVivo(codigo);
  $('#sp-terminar').onclick = () => {
    const e = $('#sp-terminar');
    if (!e.classList.contains('armado')) {
      e.classList.add('armado'); e.textContent = '🏁 ' + t('sala_seguro'); SFX.click();
      tvez(() => { if (e.isConnected) { e.classList.remove('armado'); e.textContent = '🏁 ' + t('sala_terminar'); } }, 3000);
      return;
    }
    e.disabled = true; SALA.mando(codigo, 'terminar');
  };
  $('#sp-salir').onclick = () => { SFX.click(); rTitulo(); };
  if (!mvTecla) {
    mvTecla = true;
    const kd = e => {
      if ((e.key === ' ' || e.key === 'ArrowRight') && !e.repeat && $('#sp-vivo-sig')
          && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName || '')) {
        e.preventDefault(); accionPrincipalVivo(codigo);
      }
    };
    document.addEventListener('keydown', kd);
    alLimpiar.push(() => { document.removeEventListener('keydown', kd); mvTecla = false; });
  }
}
let pvOcupado = false;
async function accionPrincipalVivo(codigo) {
  const est = pvEst;
  if (!est || pvOcupado) return;
  pvOcupado = true; SFX.star();
  try { await SALA.vivoMando(codigo, est.revelada ? 'siguiente' : 'revelar'); }
  finally { pvOcupado = false; }
}

/* Empezar la ronda en vivo: el instructor escoge las preguntas y las guarda el
   servidor, así todos ven las mismas. Devuelve la respuesta del servidor. */
async function empezarVivo(codigo) {
  const cfg = SALA.configVivo(codigo) || { n: 8, limite: 20 };
  const items = SALA.preguntasVivo(cfg.n, (QUIZ.es || []).length);
  pvQ = 0; pvRevelando = false; pvEst = null; mvClave = '';
  return SALA.vivoMando(codigo, 'iniciar', items, cfg.limite);
}

/* ══════════ ALUMNO ══════════ */

function rSalaVivo(codigo) {
  pantalla('sala-vivo', `
  <div class="centro sv-alumno">
    <div class="sv-cab"><span class="sv-num" id="sv-num">…</span><span class="sv-reloj" id="sv-reloj" aria-hidden="true"></span></div>
    <div class="sv-barra" aria-hidden="true"><i id="sv-barra"></i></div>
    <p class="sv-preg" id="sv-preg">${t('glob_carga')}</p>
    <div class="sv-ops sv-ops-m" id="sv-ops"></div>
    <p class="sv-msg" id="sv-msg" role="status" aria-live="polite">&nbsp;</p>
    <p class="mini" id="sv-yo">&nbsp;</p>
  </div>`, () => rSalaVivo(codigo));

  let est = null, recibido = 0, qMostrada = 0, revMostrada = false;
  const mias = {};                       // q → { k, ok } lo que respondí en ESTE dispositivo
  const yo = SALA.miId(codigo);

  const pinta = () => {
    const Q = preguntaVivo(est.items[est.q_n - 1]);
    $('#sv-num').textContent = t('sv_pregunta').replace('{a}', est.q_n).replace('{b}', est.q_total);
    $('#sv-preg').textContent = Q ? Q.q : t('sv_sinpregunta');
    $('#sv-ops').innerHTML = Q ? Q.o.map((o, k) => `<button class="sv-op ${SV_OPS[k].cls}" data-k="${k}" type="button">
        <b class="sv-forma" aria-hidden="true">${SV_OPS[k].forma}</b>
        <span class="sv-txt">${String.fromCharCode(65 + k)}) ${esc(o)}</span></button>`).join('') : '';
    $$('#sv-ops .sv-op').forEach(b => b.onclick = () => responder(+b.dataset.k, Q));
    $('#sv-msg').innerHTML = '&nbsp;';
    qMostrada = est.q_n; revMostrada = false;
  };

  async function responder(k, Q) {
    const q = est.q_n;
    if (mias[q] || est.revelada || !Q) return;
    const ok = k === Q.r;
    mias[q] = { k, ok, pts: null };
    $$('#sv-ops .sv-op').forEach(b => { b.disabled = true; b.classList.toggle('elegida', +b.dataset.k === k); });
    $('#sv-msg').textContent = t('sv_enviado');
    SFX.click();
    const r = await SALA.responder(codigo, q, k, ok);
    if (!$('#sv-msg')) return;
    if (!r.ok || r.datos === -1) { mias[q].fallo = true; if (est.q_n === q && !est.revelada) $('#sv-msg').textContent = t('sv_noenvio'); }
    else mias[q].pts = r.datos;
  }

  const revela = () => {
    const Q = preguntaVivo(est.items[est.q_n - 1]), m = mias[est.q_n];
    const orden = SALA.ordenar(est.jugadores), pos = SALA.puestos(orden);
    const i = orden.findIndex(j => j.id === yo);
    $$('#sv-ops .sv-op').forEach(b => {
      b.disabled = true;
      if (Q) b.classList.toggle('bien', +b.dataset.k === Q.r), b.classList.toggle('apagada', +b.dataset.k !== Q.r);
    });
    const mio = est.jugadores.find(j => j.id === yo);
    let msg;
    if (m && m.ok && !m.fallo) { msg = `✔ ${t('sv_correcto')} +${mio ? mio.gan : (m.pts || 0)}`; SFX.ok(); }
    else if (m && !m.fallo) { msg = `✖ ${t('sv_incorrecto')}`; SFX.mal(); }
    else { msg = t('sv_nollegaste'); SFX.mal(); }
    $('#sv-msg').textContent = msg;
    $('#sv-msg').className = 'sv-msg ' + (m && m.ok && !m.fallo ? 'verde' : 'rojo');
    if (i >= 0) $('#sv-yo').textContent = `${t('sv_puesto').replace('{p}', pos[i]).replace('{n}', orden.length)} · ${orden[i].puntos} ${t('rec_pts')}`;
    revMostrada = true;
  };

  /* el reloj corre aquí; el sondeo lo corrige con la hora del servidor */
  tcada(() => {
    if (!est || est.estado !== 'jugando') return;
    const resta = SALA.restanteMs(est, recibido, performance.now());
    const r = $('#sv-reloj'), b = $('#sv-barra');
    if (r) r.textContent = est.revelada ? '' : String(Math.ceil(resta / 1000));
    if (b) { b.style.width = (est.revelada ? 0 : resta / (est.limite * 1000) * 100) + '%'; b.classList.toggle('peligro', resta < est.limite * 300); }
    if (!est.revelada && resta <= 0 && !mias[est.q_n] && $('#sv-msg') && !$('#sv-msg').dataset.tiempo) {
      $$('#sv-ops .sv-op').forEach(x => { x.disabled = true; });
      $('#sv-msg').textContent = t('sv_tiempo'); $('#sv-msg').dataset.tiempo = '1';
    }
  }, 200);

  SALA.vigilar(codigo, r => {
    if (!$('#sv-ops')) return;
    if (!r.ok) { $('#sv-msg').textContent = t('glob_sinred'); return; }
    if (!r.datos) { $('#sv-msg').textContent = t('sala_no_existe'); SALA.guardarSesion(null); return; }
    est = r.datos; recibido = performance.now();
    const mio = est.jugadores.find(j => j.id === yo);
    if (!mio) return rSalaEspera(codigo);                         // expulsado: vuelve a la entrada
    if (est.estado === 'fin') return rSalaTabla(codigo);
    if (!SALA.esVivo(est) || est.estado !== 'jugando') return rSalaEspera(codigo);
    if (est.q_n !== qMostrada) { pinta(); const m = $('#sv-msg'); if (m) delete m.dataset.tiempo; }
    if (est.revelada && !revMostrada) revela();
    else if (!est.revelada && mias[est.q_n] && !mias[est.q_n].fallo) {
      const el = $('#sv-msg'); if (el && !revMostrada) el.textContent = t('sv_enviado');
    }
  }, SV_CADENCIA);
}

/* ══════════ PANEL DEL INSTRUCTOR ══════════ */

/* Qué es cada ítem, en una línea. Los índices vienen del servidor: si uno no
   existe en este banco se cae a "tema + número" en vez de reventar. */
function etiquetaItem(tema, item) {
  try {
    switch (tema) {
      case 'quiz': return (preguntaVivo(item) || {}).q;
      case 'review': return CODIGO[item].c;
      case 'sql': return SQLS[item].join(' ');
      case 'regex': return '/' + REGEXS[item].p + '/ ' + (S.lang === 'en' ? REGEXS[item].den : REGEXS[item].des);
      case 'merge': return CONFLICTOS[item][0];
      case 'palabras': return PALABRAS[item];
      case 'git': return CMDS[item].txt;
      case 'parejas': return PAREJAS[item];
      case 'terminal': return tj(TERMINALES[item]) + ' → ' + TERMINALES[item].cmd;
      case 'orden': return S.lang === 'en' ? PASOS[item].ten : PASOS[item].tes;
    }
  } catch (e) { /* cae abajo */ }
  return tema + ' #' + item;
}
const nombreTema = tema => t('tipo_' + (POOL_A_TIPO[tema] || tema));

/* Pinta el panel en su caja a partir de la respuesta de sala_resumen. */
function pintarPanel(caja, datos) {
  if (!caja) return;
  const temas = datos && datos.temas ? datos.temas.filter(x => x.intentos > 0 && x.fallos > 0).slice(0, 6) : [];
  if (!temas.length) { caja.innerHTML = ''; return; }
  caja.innerHTML = `<h3>🎯 ${t('panel_tit')}</h3>
    <p class="mini">${t('panel_expl')}</p>
    <div class="panel-flojos">${temas.map(x => {
      const pc = Math.round(x.fallos / x.intentos * 100);
      return `<div class="panel-fila">
        <span class="pf-tema">${ICO_TIPO[POOL_A_TIPO[x.tema]] || '🎯'} ${esc(nombreTema(x.tema))}</span>
        <span class="pf-txt">${esc(String(etiquetaItem(x.tema, x.item)).slice(0, 80))}</span>
        <div class="barra"><div class="barra-fill ${pc > 50 ? 'peligro' : ''}" style="width:${Math.max(6, pc)}%"></div></div>
        <span class="pf-num">${t('panel_fallaron').replace('{a}', x.fallos).replace('{b}', x.intentos)}</span>
      </div>`; }).join('')}</div>`;
}

/* El proyector lo refresca cada ~10 s mientras se juega y una vez más al
   terminar. Pide solo agregados. */
let panelUltimo = 0, panelFin = '';
function panelProyector(codigo, est) {
  const ahora = Date.now();
  if (est.estado === 'espera') return;
  if (est.estado === 'jugando' && ahora - panelUltimo < 10000) return;
  if (est.estado === 'fin' && panelFin === codigo && ahora - panelUltimo < 10000) return;
  panelUltimo = ahora;
  if (est.estado === 'fin') panelFin = codigo;
  SALA.resumen(codigo).then(r => { if (r.ok) pintarPanel($('#sp-panel'), r.datos); });
}

/* Lo que juega cada alumno en una sala a su ritmo se apunta para el panel:
   RETO.marcar avisa de cada ítem y, al cerrar la ronda, salaRonda lo manda
   (SALA.reportar). */
RETO.escuchar((pool, i, acerto) => {
  if (typeof salaActiva !== 'undefined' && salaActiva && salaActiva.items) salaActiva.items.push([pool, i, acerto]);
});
