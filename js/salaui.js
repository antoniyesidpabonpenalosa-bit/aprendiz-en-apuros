'use strict';
/* ── PANTALLAS DE LAS SALAS DE CLASE ──
   Tres caminos:
   · Instructor: crear (dificultad + minijuegos) → proyector. El proyector
     muestra el código gigante, quién va entrando y, al empezar, la tabla en
     vivo y el podio. Puede unirse él también ("JUGAR TAMBIÉN").
   · Aprendiz: código → sala de espera con los personajes de todos → cuenta
     atrás cuando el instructor empieza → las rondas → su puesto en vivo.
   · La partida: los minijuegos de siempre, desviados aquí igual que en el reto
     diario (resultado()/fallo() miran salaActiva). La dificultad la fija la
     sala (difForzada) y el contenido sale de la semilla de la sala, igual
     para todos (RETO.entrar(…, true)).

   Las pantallas que se refrescan solas (proyector, espera, tabla) NO se
   vuelven a pintar enteras: se actualizan en su sitio. Así el sondeo no roba
   el foco, los retratos no se redibujan y las filas pueden deslizarse. */

/* null fuera de la sala; {codigo, juegos, dificultad, ronda, pts} jugando */
let salaActiva = null;
/* Salas que ya arrancaron solas en esta visita: si alguien sale a mitad de
   partida y vuelve, se le ofrece seguir en vez de arrancarle la cuenta atrás
   por sorpresa. */
const salasArrancadas = new Set();

const DIRECCION_JUEGO = () =>
  /^https?:$/.test(location.protocol) ? location.host : 'aprendiz-en-apuros.vercel.app';
/* Traducción de los errores de la base (db/salas.sql) a lo que se le dice al jugador */
const errorSala = r => r.red ? t('glob_sinred')
  : ({ 'sala no existe': t('sala_no_existe'), 'sala cerrada': t('sala_cerrada'),
       'sala llena': t('sala_llena') }[r.error] || t('sala_error'));
const iconosJuegos = juegos => juegos.map(j => `<span title="${t('tipo_' + j)}">${ICO_TIPO[j] || '🎮'}</span>`).join('');
const difChip = d => { const x = DIFS[d] || DIFS[1]; return `${x.ico} ${tj(x)}`; };

/* ══════════ ENTRADA ══════════ */

function rSala() {
  /* En una sala se juega derecho: con un ensayo del laboratorio en marcha no se
     entra. SALA.puntuar también lo rechaza, pero avisar aquí es lo honesto:
     quien está probando cosas se enteraría al final, con la tabla vacía. */
  if (typeof LAB !== 'undefined' && LAB.ensayo()) {
    pantalla('sala-ensayo', `
    <div class="centro">
      <span class="ico">⚗</span>
      <h2 class="rojo">${t('lab_ensayo')}</h2>
      <p class="desc">${t('lab_sala_ensayo')}</p>
      <button class="btn" id="se-normal" type="button">${t('lab_tit')} → ${t('volver')}</button>
      <button class="btn btn2" id="se-volver" type="button">${t('volver')}</button>
    </div>`);
    $('#se-normal').onclick = () => { SFX.click(); LAB.volverANormal(); labMarca(); rSala(); };
    $('#se-volver').onclick = () => { SFX.click(); rTitulo(); };
    return;
  }
  pantalla('sala', `
  <div class="centro">
    <span class="ico">🏫</span>
    <h2>${t('sala_tit')}</h2>
    <p class="desc" style="text-align:center">${t('sala_expl')}</p>
    <div class="col2 sala-entrada">
      <div class="col sala-caja">
        <h3>${t('sala_soy_prof')}</h3>
        <p class="mini">${t('sala_crear_expl')}</p>
        <button class="btn" id="sa-crear" type="button">${t('sala_crear')}</button>
      </div>
      <div class="col sala-caja">
        <h3>${t('sala_soy_apr')}</h3>
        <input class="entrada sala-in" id="sa-cod" maxlength="5" autocomplete="off"
               autocapitalize="characters" spellcheck="false" aria-label="${t('sala_codigo')}"
               placeholder="K7M2Q">
        <button class="btn btn3" id="sa-unir" type="button">${t('sala_unirme')}</button>
        <p class="mini" id="sa-aviso" role="status">&nbsp;</p>
      </div>
    </div>
    <div id="sa-previa"></div>
    <button class="btn btn2" id="sa-volver" type="button">${t('volver')}</button>
  </div>`);

  const inp = $('#sa-cod'), aviso = $('#sa-aviso'), bUnir = $('#sa-unir');
  inp.oninput = () => { inp.value = SALA.limpiaCodigo(inp.value); };
  const unir = async () => {
    const cod = SALA.limpiaCodigo(inp.value);
    if (!SALA.CODIGO_OK.test(cod)) { aviso.textContent = t('sala_cod_malo'); SFX.mal(); inp.focus(); return; }
    /* En una sala el nombre importa: el proyector lo muestra en grande. */
    if (!tieneNombre()) return rNombre(() => { rSala(); $('#sa-cod').value = cod; $('#sa-unir').click(); });
    bUnir.disabled = true; aviso.textContent = t('glob_carga');
    const r = await SALA.unirse(cod);
    if (!$('#sa-unir')) return;                   // ya salió de la pantalla
    bUnir.disabled = false;
    if (!r.ok) { aviso.textContent = errorSala(r); SFX.mal(); return; }
    SFX.ok(); rSalaEspera(cod);
  };
  bUnir.onclick = () => { SFX.click(); unir(); };
  inp.onkeydown = e => { if (e.key === 'Enter') unir(); };
  $('#sa-crear').onclick = () => { SFX.click(); rSalaCrear(); };
  $('#sa-volver').onclick = () => { SFX.click(); rTitulo(); };

  /* ¿Hay una sala de antes en este dispositivo y sigue viva? Se ofrece volver. */
  const previa = SALA.sesion();
  if (previa) SALA.estado(previa.codigo).then(r => {
    const caja = $('#sa-previa');
    if (!caja || !r.ok || !r.datos || r.datos.estado === 'fin' && !previa.host) return;
    caja.innerHTML = `<button class="btn btn2 sala-previa" id="sa-previa-b" type="button">↩ ${t('sala_volver_a')} <b>${previa.codigo}</b></button>`;
    $('#sa-previa-b').onclick = () => { SFX.click(); volverASala(previa.codigo); };
  });
}

/* A dónde vuelve alguien que ya estaba en una sala */
function volverASala(codigo) {
  if (SALA.soyHost(codigo)) return rProyector(codigo);
  rSalaEspera(codigo);
}

/* ══════════ CREAR (instructor) ══════════ */

function rSalaCrear() {
  let dif = S.dif;
  const sel = ['escribir', 'quiz', 'review'];      // una propuesta variada y corta
  pantalla('sala-crear', `
  <div class="centro sala-crear">
    <h2>🧑‍🏫 ${t('sala_nueva')}</h2>
    <div class="dif-panel">
      <span class="dif-cap">${t('dificultad')}</span>
      <div class="dif-sel" id="sc-dif">
        ${DIFS.map(d => `<button class="dif-op" data-dif="${d.id}" type="button" aria-pressed="false">
          <span class="dif-ico">${d.ico}</span>${tj(d)}
          <span class="dif-puntos">${[0, 1, 2].map(n => `<i class="${n <= d.id ? 'on' : ''}"></i>`).join('')}</span>
        </button>`).join('')}
      </div>
    </div>
    <h3>${t('sala_juegos')} <span class="sc-n" id="sc-n"></span></h3>
    <p class="mini">${t('sala_orden')}</p>
    <div class="tit-rejilla c3 sala-juegos" id="sc-lista">
      ${TIPOS_LIBRES.map(tipo => `<button class="btn btn2 menu-fila sala-j" data-tipo="${tipo}" type="button" aria-pressed="false">
        <span class="sj-num" aria-hidden="true"></span>
        <span class="m-ico">${ICO_TIPO[tipo] || '🎮'}</span>
        <span class="m-txt">${t('tipo_' + tipo)}</span>
      </button>`).join('')}
    </div>
    <div class="jugar-marco">
      <i></i><i></i><i></i><i></i>
      <button class="btn btn-jugar" id="sc-crear" type="button">${t('sala_crear')}</button>
    </div>
    <p class="mini" id="sc-aviso" role="status">&nbsp;</p>
    <button class="btn btn2" id="sc-volver" type="button">${t('volver')}</button>
  </div>`);

  /* Se actualiza en su sitio: re-pintar la pantalla entera en cada toque
     haría saltar el scroll y perder el foco del teclado. */
  const pinta = () => {
    $$('#sc-dif .dif-op').forEach(b => {
      const on = +b.dataset.dif === dif;
      b.classList.toggle('sel', on); b.setAttribute('aria-pressed', String(on));
    });
    $$('#sc-lista .sala-j').forEach(b => {
      const i = sel.indexOf(b.dataset.tipo);
      b.classList.toggle('sel', i >= 0); b.setAttribute('aria-pressed', String(i >= 0));
      b.querySelector('.sj-num').textContent = i >= 0 ? String(i + 1) : '';
      b.disabled = i < 0 && sel.length >= SALA.MAX_JUEGOS;
    });
    $('#sc-n').textContent = `${sel.length}/${SALA.MAX_JUEGOS}`;
    $('#sc-crear').disabled = !sel.length;
  };
  $$('#sc-dif .dif-op').forEach(b => b.onclick = () => { dif = +b.dataset.dif; SFX.click(); pinta(); });
  $$('#sc-lista .sala-j').forEach(b => b.onclick = () => {
    const i = sel.indexOf(b.dataset.tipo);
    if (i >= 0) sel.splice(i, 1); else if (sel.length < SALA.MAX_JUEGOS) sel.push(b.dataset.tipo);
    SFX.click(); pinta();
  });
  $('#sc-crear').onclick = async () => {
    const b = $('#sc-crear');
    b.disabled = true; $('#sc-aviso').textContent = t('glob_carga');
    const r = await SALA.crear(dif, sel.slice());
    if (!$('#sc-crear')) return;
    if (!r.ok) { b.disabled = false; $('#sc-aviso').textContent = errorSala(r); SFX.mal(); return; }
    SFX.ok(); rProyector(r.datos.codigo);
  };
  $('#sc-volver').onclick = () => { SFX.click(); rSala(); };
  pinta();
}

/* ══════════ LISTA DE JUGADORES (compartida) ══════════
   modo 'espera': rejilla de personajes. modo 'tabla': filas con puesto,
   progreso por ronda, barra y puntos. Cada jugador es un elemento con su id:
   entre un sondeo y otro solo se actualiza lo que cambió y las filas que
   cambian de puesto se deslizan (FLIP: se mide antes, se reordena, se
   compensa con transform y se suelta). */
function pintarLista(caja, est, { modo, yo = '', mando = false }) {
  if (!caja) return;
  if (caja.dataset.modo !== modo) { caja.innerHTML = ''; caja.dataset.modo = modo; caja._els = new Map(); }
  const els = caja._els;
  caja.className = 'sala-lista ' + (modo === 'espera' ? 'sl-rejilla' : 'sl-tabla');
  const orden = modo === 'espera' ? est.jugadores.slice().reverse() : SALA.ordenar(est.jugadores);
  const puestos = SALA.puestos(orden);
  const tope = Math.max(1, ...orden.map(j => j.puntos));
  const total = est.juegos.length;
  const animar = !quieto();

  /* F de FLIP: dónde estaba cada fila antes de moverla */
  const antes = new Map();
  if (animar && modo === 'tabla') els.forEach((el, id) => antes.set(id, el.getBoundingClientRect().top));

  const vivos = new Set(orden.map(j => j.id));
  els.forEach((el, id) => { if (!vivos.has(id)) { el.remove(); els.delete(id); } });

  orden.forEach((j, i) => {
    let el = els.get(j.id);
    if (!el) {
      el = document.createElement('div');
      el.className = modo === 'espera' ? 'sj-carta' : 'sj-fila';
      el.innerHTML = modo === 'espera'
        ? `<canvas class="retrato" width="64" height="64"></canvas>
           <span class="sj-nom"></span>${mando && j.id !== yo ? `<button class="sj-fuera" type="button" aria-label="${t('sala_expulsar')}">✕</button>` : ''}`
        : `<span class="sj-pos"></span><canvas class="retrato" width="64" height="64"></canvas>
           <span class="sj-info"><span class="sj-nom"></span><span class="sj-prog"></span>
           <span class="sj-barra"><i></i></span></span><span class="sj-pts"></span>
           ${mando && j.id !== yo ? `<button class="sj-fuera" type="button" aria-label="${t('sala_expulsar')}">✕</button>` : ''}`;
      /* La animación de entrada se quita al acabar: si no, cada vez que la
         fila se mueve de sitio el navegador la vuelve a arrancar. */
      if (animar) { el.classList.add('entra'); el.addEventListener('animationend', () => el.classList.remove('entra'), { once: true }); }
      retratoVivo(el.querySelector('canvas'), SALA.caraDe(j));
      const fuera = el.querySelector('.sj-fuera');
      if (fuera) fuera.onclick = () => expulsar(est.codigo, j.id, fuera);
      els.set(j.id, el);
    }
    el.classList.toggle('yo', j.id === yo);
    el.querySelector('.sj-nom').textContent = (j.host ? '👑 ' : '') + j.nombre;
    if (modo === 'tabla') {
      const p = puestos[i];
      el.querySelector('.sj-pos').textContent = p <= 3 ? ['🥇', '🥈', '🥉'][p - 1] : '#' + p;
      el.querySelector('.sj-pts').textContent = String(j.puntos);
      el.querySelector('.sj-prog').innerHTML = Array.from({ length: total },
        (_, k) => `<i class="${k < j.ronda ? 'on' : ''}"></i>`).join('');
      el.querySelector('.sj-prog').setAttribute('aria-label', `${j.ronda}/${total}`);
      el.querySelector('.sj-barra i').style.width = Math.round(j.puntos / tope * 100) + '%';
      el.classList.toggle('listo', j.ronda >= total);
    }
    /* Solo se mueve lo que cambió de sitio: mover un elemento en el DOM
       reinicia sus animaciones, y en cada sondeo parpadearían todas. */
    if (caja.children[i] !== el) caja.insertBefore(el, caja.children[i] || null);
  });

  /* L-I-P: dónde quedó, compensar la diferencia y soltarla con transición */
  if (animar && modo === 'tabla') els.forEach((el, id) => {
    const a = antes.get(id);
    if (a === undefined) return;
    const d = a - el.getBoundingClientRect().top;
    if (!d) return;
    el.style.transition = 'none';
    el.style.transform = `translateY(${d}px)`;
    void el.offsetWidth;
    el.style.transition = '';
    el.style.transform = '';
  });
}

/* Expulsar pide confirmar con un segundo toque: un ✕ al lado de un nombre es
   fácil de tocar sin querer delante de toda la clase. */
function expulsar(codigo, id, boton) {
  if (!boton.classList.contains('armado')) {
    boton.classList.add('armado'); boton.textContent = '?';
    SFX.click();
    tvez(() => { if (boton.isConnected) { boton.classList.remove('armado'); boton.textContent = '✕'; } }, 2500);
    return;
  }
  boton.disabled = true;
  SALA.mando(codigo, 'expulsar', id).then(() => { const c = boton.closest('.sj-carta, .sj-fila'); if (c) c.remove(); });
  SFX.mal();
}

/* Podio de los tres primeros: plata, oro, bronce (el oro en medio, más alto) */
function pintarPodio(caja, est) {
  if (!caja) return;
  const top = SALA.ordenar(est.jugadores).slice(0, 3);
  const clave = top.map(j => j.id + ':' + j.puntos).join('|');
  if (caja.dataset.clave === clave) return;
  caja.dataset.clave = clave;
  if (!top.length) { caja.innerHTML = ''; return; }
  const sitio = [1, 0, 2].filter(i => top[i]);
  caja.innerHTML = `<div class="podio">${sitio.map(i => `
    <div class="pd-col pd-${i + 1}">
      <canvas class="retrato" width="64" height="64"></canvas>
      <span class="pd-nom">${esc((top[i].host ? '👑 ' : '') + top[i].nombre)}</span>
      <span class="pd-pts">${top[i].puntos}</span>
      <div class="pd-base"><span>${['🥇', '🥈', '🥉'][i]}</span><b>${i + 1}</b></div>
    </div>`).join('')}</div>`;
  $$('#' + caja.id + ' .pd-col').forEach((col, k) => retratoVivo(col.querySelector('canvas'), SALA.caraDe(top[sitio[k]])));
}

/* ══════════ PROYECTOR (instructor) ══════════ */

function rProyector(codigo) {
  pantalla('sala-proy', `
  <div class="sala-proy">
    <div class="sp-lado">
      <p class="sp-cap">${t('sala_entra_en')}</p>
      <p class="sp-url">${esc(DIRECCION_JUEGO())}</p>
      <p class="sp-cap">${t('sala_codigo')}</p>
      <div class="jugar-marco sp-codigo-marco">
        <i></i><i></i><i></i><i></i>
        <p class="sp-codigo" aria-label="${codigo.split('').join(' ')}">${codigo.split('').map(c => `<b>${c}</b>`).join('')}</p>
      </div>
      <div class="sp-reglas" id="sp-reglas"></div>
      <p class="sp-estado" id="sp-estado" role="status">${t('glob_carga')}</p>
      <div class="sp-mandos" id="sp-mandos"></div>
    </div>
    <div class="sp-main">
      <div id="sp-podio"></div>
      <h3 id="sp-tit">${t('sala_jugadores')}</h3>
      <div id="sp-lista" class="sala-lista"></div>
      <p class="mini sp-vacio" id="sp-vacio"></p>
    </div>
  </div>`);

  let ultimo = null, mandosClave = '', celebrado = false;
  const pintaMandos = est => {
    const yo = SALA.miId(codigo);
    const mio = est.jugadores.find(j => j.id === yo);
    const pendiente = mio && mio.ronda < est.juegos.length;
    const clave = [est.estado, !!mio, pendiente, est.jugadores.length > 0].join('|');
    if (clave === mandosClave) return;              // no se re-pinta: no roba el foco
    mandosClave = clave;
    const b = (id, cls, txt) => `<button class="btn ${cls}" id="${id}" type="button">${txt}</button>`;
    let h = '';
    if (est.estado === 'espera') {
      h += `<div class="jugar-marco"><i></i><i></i><i></i><i></i>${b('sp-empezar', 'btn-jugar', t('sala_empezar'))}</div>`;
      if (!mio) h += b('sp-jugar-yo', 'btn3', '🎮 ' + t('sala_jugar_yo'));
    } else if (est.estado === 'jugando') {
      if (pendiente) h += b('sp-mi-partida', 'btn3', '▶ ' + t('sala_mi_partida'));
      else if (!mio) h += b('sp-jugar-yo', 'btn3', '🎮 ' + t('sala_jugar_yo'));
      h += b('sp-terminar', 'btn2', '🏁 ' + t('sala_terminar'));
    } else {
      h += b('sp-nueva', '', t('sala_nueva'));
    }
    h += b('sp-salir', 'btn2', t('volver'));
    $('#sp-mandos').innerHTML = h;

    const on = (id, f) => { const e = $('#' + id); if (e) e.onclick = f; };
    on('sp-empezar', async () => {
      if (!est.jugadores.length) { $('#sp-estado').textContent = t('sala_nadie_aun'); SFX.mal(); return; }
      $('#sp-empezar').disabled = true; SFX.star();
      await SALA.mando(codigo, 'empezar');
    });
    on('sp-jugar-yo', async () => {
      $('#sp-jugar-yo').disabled = true; SFX.click();
      if (!tieneNombre()) return rNombre(() => rProyector(codigo));
      const r = await SALA.unirse(codigo);
      if (!r.ok) { $('#sp-estado').textContent = errorSala(r); mandosClave = ''; return; }
      mandosClave = '';
    });
    on('sp-mi-partida', () => {
      SFX.click();
      const mio2 = ultimo && ultimo.jugadores.find(j => j.id === SALA.miId(codigo));
      if (ultimo && mio2) cuentaAtras(() => empezarSala(ultimo, mio2));
    });
    on('sp-terminar', () => {
      const e = $('#sp-terminar');
      if (!e.classList.contains('armado')) {       // segundo toque para confirmar
        e.classList.add('armado'); e.textContent = '🏁 ' + t('sala_seguro'); SFX.click();
        tvez(() => { if (e.isConnected) { e.classList.remove('armado'); e.textContent = '🏁 ' + t('sala_terminar'); } }, 3000);
        return;
      }
      e.disabled = true; SALA.mando(codigo, 'terminar');
    });
    on('sp-nueva', () => { SFX.click(); rSalaCrear(); });
    on('sp-salir', () => { SFX.click(); rTitulo(); });
  };

  SALA.vigilar(codigo, r => {
    const estado = $('#sp-estado');
    if (!estado) return;
    if (!r.ok) { estado.textContent = t('glob_sinred'); return; }
    if (!r.datos) { estado.textContent = t('sala_no_existe'); $('#sp-mandos').innerHTML = ''; return; }
    const est = ultimo = r.datos;
    $('#sp-reglas').innerHTML = `<span>${difChip(est.dificultad)}</span><span class="sp-juegos">${iconosJuegos(est.juegos)}</span>`;
    const n = est.jugadores.length, hechos = est.jugadores.filter(j => j.ronda >= est.juegos.length).length;
    const fin = est.estado === 'fin' || est.estado === 'jugando' && SALA.todosTerminaron(est);
    estado.textContent = est.estado === 'espera' ? t('sala_esperan').replace('{n}', n)
      : est.estado === 'jugando' ? t('sala_van').replace('{a}', hechos).replace('{n}', n)
      : t('sala_final');
    $('#sp-tit').textContent = `${t('sala_jugadores')} · ${n}`;
    $('#sp-vacio').textContent = n ? '' : t('sala_vacia');
    pintarLista($('#sp-lista'), est, {
      modo: est.estado === 'espera' ? 'espera' : 'tabla',
      yo: SALA.miId(codigo), mando: est.estado !== 'fin',
    });
    if (fin) {
      pintarPodio($('#sp-podio'), est);
      if (!celebrado && n) { celebrado = true; if (!quieto()) confeti(); SFX.win(); }
    }
    pintaMandos(est);
  });
}

/* ══════════ SALA DE ESPERA (aprendiz) ══════════ */

function rSalaEspera(codigo) {
  pantalla('sala-esp', `
  <div class="centro sala-esp">
    <div class="tit-id"><span>🏫 <b>${codigo}</b></span><span class="sep" id="se-dif"></span><span class="sep sp-juegos" id="se-juegos"></span></div>
    <h2 id="se-tit">${t('sala_esperando')}</h2>
    <p class="mini" id="se-msg" role="status">${t('glob_carga')}</p>
    <div id="se-lista" class="sala-lista"></div>
    <div id="se-accion"></div>
    <button class="btn btn2" id="se-salir" type="button">${t('sala_salir')}</button>
  </div>`);
  $('#se-salir').onclick = () => { SFX.click(); rTitulo(); };

  let arrancando = false;
  SALA.vigilar(codigo, r => {
    const msg = $('#se-msg');
    if (!msg || arrancando) return;
    if (!r.ok) { msg.textContent = t('glob_sinred'); return; }
    const est = r.datos, yo = SALA.miId(codigo);
    if (!est) { msg.textContent = t('sala_no_existe'); SALA.guardarSesion(null); return; }
    const mio = est.jugadores.find(j => j.id === yo);
    if (!mio) {
      msg.textContent = yo ? t('sala_fuera') : t('sala_no_unido');
      if (yo) SALA.guardarSesion(null);
      $('#se-lista').innerHTML = '';
      return;
    }
    $('#se-dif').textContent = difChip(est.dificultad);
    $('#se-juegos').innerHTML = iconosJuegos(est.juegos);
    const total = est.juegos.length;
    if (mio.ronda >= total || est.estado === 'fin') return rSalaTabla(codigo);
    if (est.estado === 'espera') {
      msg.innerHTML = `${t('sala_espera_prof')}<span class="puntos-anim" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span>`;
      pintarLista($('#se-lista'), est, { modo: 'espera', yo });
      return;
    }
    /* Empezó. La primera vez se arranca solo, con cuenta atrás. Si ya jugó
       algo (salió a mitad o recargó), se le ofrece seguir. */
    if (mio.ronda === 0 && !salasArrancadas.has(codigo)) {
      arrancando = true;
      return cuentaAtras(() => empezarSala(est, mio));
    }
    $('#se-tit').textContent = t('sala_en_juego');
    msg.textContent = t('sala_te_quedan').replace('{n}', String(total - mio.ronda));
    if (!$('#se-seguir')) {
      $('#se-accion').innerHTML = `<div class="jugar-marco"><i></i><i></i><i></i><i></i>
        <button class="btn btn-jugar" id="se-seguir" type="button">▶ ${t('sala_seguir')}</button></div>`;
      $('#se-seguir').onclick = () => { SFX.click(); empezarSala(est, mio); };
    }
    pintarLista($('#se-lista'), est, { modo: 'tabla', yo });
  });
}

/* 3 · 2 · 1 antes de la primera ronda: el aviso de que empieza llega a cada
   dispositivo con hasta 3 s de diferencia, y así nadie empieza distraído. */
function cuentaAtras(seguir) {
  pantalla('sala-cuenta', `
  <div class="centro">
    <p class="sub">${t('sala_empieza')}</p>
    <p class="sala-cuenta" id="sc-num" aria-live="assertive">3</p>
  </div>`);
  let n = 3;
  SFX.click();
  const paso = () => {
    n--;
    const e = $('#sc-num');
    if (!e) return;
    if (n <= 0) return seguir();
    e.textContent = String(n);
    e.classList.remove('late'); void e.offsetWidth; e.classList.add('late');
    SFX.click();
    tvez(paso, 800);
  };
  tvez(paso, 800);
}

/* ══════════ LA PARTIDA ══════════ */

function empezarSala(est, mio) {
  salasArrancadas.add(est.codigo);
  salaActiva = { codigo: est.codigo, juegos: est.juegos.slice(), dificultad: est.dificultad,
                 ronda: mio.ronda, pts: mio.puntos };
  difForzada = est.dificultad;                 // la de la sala, igual para todos
  RETO.entrar('sala-' + est.codigo, true);     // mismo contenido, sin sesgo personal
  siguienteSala();
}

function siguienteSala() {
  const a = salaActiva;
  if (!a) return;
  if (a.ronda >= a.juegos.length) return finSala();
  const tipo = a.juegos[a.ronda];
  conAyuda(tipo, () => {
    if (salaActiva !== a) return;
    vidas = maxVidas();                        // el HUD necesita un valor con sentido
    fnDeTipo(tipo)(RETO_DIA[tipo] ?? 0);
  });
}

/* Cierre de una ronda, venga de resultado() o de fallo(). Como en el reto
   diario, una ronda fallada suma cero y se sigue. Se manda el total. */
function salaRonda(stars, pts) {
  const a = salaActiva;
  if (!a) return;
  a.pts = Math.min(100000, a.pts + Math.max(0, Math.round(pts || 0)));
  a.ronda++;
  SALA.puntuar(a.codigo, a.ronda, a.pts);
  limpiarT();
  if (a.ronda >= a.juegos.length) return finSala();
  SFX.ok();
  const sig = a.juegos[a.ronda];
  pantalla('sala-paso', `
  <div class="centro">
    <span class="ico">${stars > 0 ? '✅' : '➡️'}</span>
    <h2 class="${stars > 0 ? 'verde' : ''}">${t('reto_ronda').replace('{n}', a.ronda).replace('{t}', a.juegos.length)}</h2>
    ${starsHtml(Math.max(0, stars))}
    <p class="pts-final">${a.pts} ${t('rec_pts')}</p>
    <p class="mini">${t('sala_siguiente')}: ${ICO_TIPO[sig] || '🎮'} ${t('tipo_' + sig)}</p>
    <button class="btn" id="sl-sig" type="button">${t('sala_sig')} ▶</button>
  </div>`);
  $('#sl-sig').onclick = () => { SFX.click(); siguienteSala(); };
  $('#sl-sig').focus();
}

function finSala() {
  const cod = salaActiva ? salaActiva.codigo : '';
  salaActiva = null;
  RETO.salir();
  difForzada = -1;
  limpiarT();
  SFX.win();
  if (SALA.soyHost(cod)) rProyector(cod); else rSalaTabla(cod);
}

/* ══════════ TABLA DEL APRENDIZ (al terminar) ══════════ */

function rSalaTabla(codigo) {
  pantalla('sala-tabla', `
  <div class="centro sala-fin">
    <span class="ico">🏁</span>
    <h2 id="st-tit">${t('sala_terminaste')}</h2>
    <p class="pts-final" id="st-pts"></p>
    <p class="sub" id="st-puesto" role="status"></p>
    <div id="st-podio"></div>
    <h3>${t('sala_tabla')}</h3>
    <div id="st-lista" class="sala-lista"></div>
    <button class="btn btn2" id="st-salir" type="button">${t('volver')}</button>
  </div>`);
  $('#st-salir').onclick = () => { SFX.click(); rTitulo(); };
  let celebrado = false;
  SALA.vigilar(codigo, r => {
    const puesto = $('#st-puesto');
    if (!puesto) return;
    if (!r.ok) { puesto.textContent = t('glob_sinred'); return; }
    const est = r.datos;
    if (!est) { puesto.textContent = t('sala_no_existe'); return; }
    const yo = SALA.miId(codigo);
    const orden = SALA.ordenar(est.jugadores), pos = SALA.puestos(orden);
    const i = orden.findIndex(j => j.id === yo);
    if (i >= 0) {
      $('#st-pts').textContent = `${orden[i].puntos} ${t('rec_pts')}`;
      puesto.textContent = t('sala_puesto').replace('{p}', pos[i]).replace('{n}', orden.length);
    }
    pintarLista($('#st-lista'), est, { modo: 'tabla', yo });
    if (est.estado === 'fin' || SALA.todosTerminaron(est)) {
      $('#st-tit').textContent = t('sala_final');
      pintarPodio($('#st-podio'), est);
      if (!celebrado) { celebrado = true; if (i >= 0 && pos[i] <= 3 && !quieto()) confeti(); }
    }
  });
}
