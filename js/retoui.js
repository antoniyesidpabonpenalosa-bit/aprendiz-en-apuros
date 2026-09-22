'use strict';
/* ── PANTALLAS DEL RETO DIARIO ──
   Reusa los minijuegos de la campaña tal cual: en vez de duplicarlos, se
   marca `retoActivo` y resultado()/fallo() desvían su final hacia aquí.
   Así el reto no hereda vidas, ni mapa, ni progreso de días. */

/* null fuera del reto; {tipos, ronda, pts, aciertos} mientras se juega */
let retoActivo = null;

/* Día nominal de cada tipo de minijuego: algunos leen NIVELES[dia] para su
   icono o su texto, así que se les pasa un día donde ese tipo existe. */
const RETO_DIA = {};
NIVELES.forEach((n, i) => { if (!(n.tipo in RETO_DIA)) RETO_DIA[n.tipo] = i; });

/* ── portada del reto ── */
function rReto() {
  const r = RETO.datos();
  const hecho = RETO.jugadoHoy();
  const racha = RETO.rachaViva();
  const prox = RETO.proximoPremio();
  const ganados = RETO.premiosGanados();

  pantalla('reto', `
  <div class="centro">
    <h2>⚡ ${t('reto_tit')}</h2>
   <div class="col2">
    <div class="col">
    <div class="tit-id"><span>🗓 ${RETO.hoy()}</span></div>

    <div class="reto-racha">
      <span class="reto-llama ${racha ? 'viva' : ''}">${racha ? '🔥' : '🕯'}</span>
      <div>
        <p class="reto-num">${racha}</p>
        <p class="mini">${t('reto_racha')}</p>
      </div>
      <div class="reto-mult">×${RETO.multiplicador(racha || 1).toFixed(2).replace(/\.?0+$/, '')}</div>
    </div>

    ${ganados.length ? `<div class="reto-premios">${ganados.map(p => `<span title="${p.dias}">${p.ico}</span>`).join('')}</div>` : ''}
    ${prox ? `<p class="mini">${t('reto_prox').replace('{d}', prox.dias).replace('{i}', prox.ico)}</p>` : ''}

    ${hecho
      ? `<p class="desc" style="text-align:center">${t('reto_hecho').replace('{p}', r.pts)}</p>`
      : `<p class="desc" style="text-align:center">${t('reto_expl')}</p>`}

    <div class="reto-tipos">
      ${RETO.retosDe().map((tp, i) => `<span class="reto-chip">${i + 1}· ${t('tipo_' + tp)}</span>`).join('')}
    </div>

    <div class="jugar-marco">
      <i></i><i></i><i></i><i></i>
      <button class="btn ${hecho ? 'btn2' : 'btn-jugar'}" id="rt-jugar" type="button">${hecho ? t('reto_otra') : t('reto_ya')}</button>
    </div>
    </div>
    <div class="col">
    <h3>${t('reto_tabla')}</h3>
    <div id="rt-tabla"><p class="desc" style="text-align:center">${t('glob_carga')}</p></div>
    </div>
   </div>
    <button class="btn btn2" id="rt-volver" type="button">${t('volver')}</button>
  </div>`);

  $('#rt-jugar').onclick = () => { SFX.click(); empezarReto(); };
  $('#rt-volver').onclick = () => { SFX.click(); rTitulo(); };
  pintarTablaReto();
}

/* Marcador del día. Igual que el global, pero se reinicia cada jornada: hoy
   cualquiera puede ser primero, cosa imposible en la tabla histórica. */
let peticionReto = 0;
async function pintarTablaReto() {
  const mia = ++peticionReto;
  const filas = await RANKING.topReto(8, RETO.hoy(), S.grupo);
  if (mia !== peticionReto) return;
  const caja = $('#rt-tabla');
  if (!caja) return;
  if (!filas) { caja.innerHTML = `<p class="desc" style="text-align:center">${t('glob_sinred')}</p>`; return; }
  if (!filas.length) { caja.innerHTML = `<p class="desc" style="text-align:center">${t('reto_nadie')}</p>`; return; }
  const mio = S.nombre || t('tu');
  caja.innerHTML = tablaRecords(filas.map(f => ({
    n: f.nombre, p: f.puntos, x: f.xp, yo: f.nombre === mio ? 1 : 0,
  })));
}

/* ── la partida ── */
function empezarReto() {
  retoActivo = { tipos: RETO.retosDe(), ronda: 0, pts: 0, aciertos: 0 };
  RETO.entrar();          // a partir de aquí los minijuegos usan la semilla del día
  siguienteRonda();
}

function siguienteRonda() {
  if (!retoActivo) return;
  if (retoActivo.ronda >= retoActivo.tipos.length) return finReto();
  const tipo = retoActivo.tipos[retoActivo.ronda];
  const fn = { escribir: nvEscribir, bugs: nvBugs, memoria: nvMemoria, simon: nvSimon,
               quiz: nvQuiz, review: nvReview, merge: nvMerge, sql: nvSQL, regex: nvRegex,
               terminal: nvTerminal, orden: nvOrden }[tipo];
  vidas = maxVidas();                    // el HUD necesita un valor con sentido
  fn(RETO_DIA[tipo] ?? 0);
}

/* Cierre de una ronda, venga de resultado() o de fallo(). En el reto no se
   pierde: una ronda fallada suma cero y se sigue con la siguiente. */
function retoRonda(stars, pts) {
  if (!retoActivo) return;
  retoActivo.pts += Math.max(0, pts);
  if (stars > 0) retoActivo.aciertos++;
  retoActivo.ronda++;
  const n = retoActivo.ronda, total = retoActivo.tipos.length;
  if (n >= total) { limpiarT(); return finReto(); }

  limpiarT();
  SFX.ok();
  pantalla('reto-paso', `
  <div class="centro">
    <span class="ico">${stars > 0 ? '✅' : '➡️'}</span>
    <h2 class="${stars > 0 ? 'verde' : ''}">${t('reto_ronda').replace('{n}', n).replace('{t}', total)}</h2>
    ${starsHtml(Math.max(0, stars))}
    <p class="pts-final">${retoActivo.pts} ${t('rec_pts')}</p>
    <button class="btn" id="rp-sig" type="button">${t('siguiente')}</button>
  </div>`);
  $('#rp-sig').onclick = () => { SFX.click(); siguienteRonda(); };
}

function finReto() {
  const base = retoActivo ? retoActivo.pts : 0;
  const aciertos = retoActivo ? retoActivo.aciertos : 0;
  const total = retoActivo ? retoActivo.tipos.length : 3;
  retoActivo = null;
  RETO.salir();           // se vuelve al azar normal para la campaña
  limpiarT();

  const res = RETO.registrar(base);          // null si hoy ya estaba cerrado
  if (res) {
    RANKING.publicarReto({ nombre: S.nombre || t('tu'), puntos: res.ganado, xp: S.xp,
                           dificultad: S.dif, fecha: RETO.hoy(), grupo: S.grupo });
    sumaStat('retos');
  }

  pantalla('reto-fin', `
  <div class="centro">
    <span class="ico">⚡</span>
    <h2 class="verde">${t('reto_fin')}</h2>
    <p class="mini">${t('reto_rondas').replace('{a}', aciertos).replace('{t}', total)}</p>
    ${res
      ? `<p class="pts-final">+${res.ganado} ${t('ptsgan')}</p>
         ${res.mult > 1 ? `<p class="mini">${base} × ${res.mult.toFixed(2).replace(/\.?0+$/, '')} (🔥 ${res.racha})</p>` : ''}
         ${res.perdonUsado ? `<p class="mini">${t('reto_perdon')}</p>` : ''}
         <div class="reto-racha"><span class="reto-llama viva">🔥</span>
           <div><p class="reto-num">${res.racha}</p><p class="mini">${t('reto_racha')}</p></div></div>`
      : `<p class="desc">${t('reto_repe').replace('{p}', base)}</p>`}
    <button class="btn" id="rf-volver" type="button">${t('volver')}</button>
  </div>`);
  if (res) { confeti(); tvez(SFX.star, 300); }
  $('#rf-volver').onclick = () => { SFX.click(); rReto(); };
}
