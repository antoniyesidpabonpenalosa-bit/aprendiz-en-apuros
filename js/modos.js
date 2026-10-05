'use strict';
/* ── MODOS SUELTOS ──
   MODO LIBRE: cualquiera de los diez minijuegos, cuando quieras, con marca
   personal por minijuego y dificultad. El juego tenía diez motores y solo se
   llegaba a cada uno el día que le tocaba, así que no había forma de repetir
   el que se te da mal.
   SIN FIN: minijuegos encadenados, una sola vida y la dificultad subiendo.

   Los dos reusan los minijuegos tal cual, igual que el reto diario: se marca
   una bandera y resultado()/fallo() desvían su final hacia aquí, en vez de
   duplicar mil líneas de minijuego. */

let libreActivo = null;    /* {tipo} mientras se juega uno suelto */
let sinFinActivo = null;   /* {ronda, pts} mientras dura la racha */

const TIPOS_LIBRES = ['escribir', 'bugs', 'memoria', 'simon', 'quiz',
                      'review', 'merge', 'sql', 'regex', 'runner',
                      'terminal', 'orden'];

/* Se resuelve al llamar, no al cargar: así este archivo no depende de ir
   después de minijuegos.js en el index. */
const fnDeTipo = tipo => ({
  escribir: nvEscribir, bugs: nvBugs, memoria: nvMemoria, simon: nvSimon,
  quiz: nvQuiz, review: nvReview, merge: nvMerge, sql: nvSQL,
  regex: nvRegex, runner: nvRunner, terminal: nvTerminal, orden: nvOrden,
}[tipo]);

/* Las marcas se guardan por minijuego Y dificultad: una marca de PRÁCTICA no
   compite con una de PESADILLA, que tiene más rondas y menos margen. */
const claveMarca = (tipo, dif = S.dif) => tipo + ':' + dif;
const marcaDe = (tipo, dif = S.dif) => S.mejores[claveMarca(tipo, dif)] || 0;
function guardarMarca(tipo, pts, dif = S.dif) {
  const k = claveMarca(tipo, dif);
  if (pts <= (S.mejores[k] || 0)) return false;
  S.mejores[k] = pts; guardar();
  return true;
}

/* ══════════ REPASO ══════════
   Los puntos débiles —lo que has fallado y aún no has vuelto a acertar— ya se
   guardan en S.pesos. Aquí se juegan: un minijuego suelto cuyo sorteo se queda
   SOLO con esos ítems (RETO.repasoSolo). Acertar uno lo va quitando de la lista
   (RETO.marcar), así que repasar de verdad vacía el repaso.

   Cada tema del repaso es un pool de contenido y se juega con el minijuego que
   lo usa. Caza-bugs y runner no tienen contenido que fallar, así que no salen. */
const POOL_A_TIPO = { quiz: 'quiz', review: 'review', sql: 'sql', regex: 'regex', merge: 'merge',
                      palabras: 'escribir', git: 'simon', parejas: 'memoria', terminal: 'terminal', orden: 'orden' };
/* Los temas con su tamaño y cuántos tiene pendientes cada uno, de más a menos
   deuda. Una sola lista para el repaso y para las estadísticas: antes la de
   estadísticas olvidaba parejas, terminal y ordena. */
function temasRepaso() {
  const total = { quiz: QUIZ[S.lang].length, review: CODIGO.length, sql: SQLS.length, regex: REGEXS.length,
                  merge: CONFLICTOS.length, palabras: PALABRAS.length, git: CMDS.length, parejas: PAREJAS.length,
                  terminal: TERMINALES.length, orden: PASOS.length };
  return RETO.repaso(Object.keys(POOL_A_TIPO).map(pool => ({
    pool, total: total[pool], tipo: POOL_A_TIPO[pool], etiqueta: t('tipo_' + POOL_A_TIPO[pool]),
  }))).map(r => Object.assign({ tipo: POOL_A_TIPO[r.pool] }, r)).filter(r => r.total > 0);
}
const pendientesRepaso = () => temasRepaso().reduce((a, r) => a + r.pendientes, 0);

function rRepaso() {
  const temas = temasRepaso().filter(r => r.pendientes > 0);
  pantalla('repaso', `
  <div class="centro">
    <h2>🎯 ${t('repaso_tit')}</h2>
    <p class="desc" style="text-align:center">${t('repaso_expl')}</p>
    ${temas.length ? `<div class="flojo-lista" id="rp-lista">
      ${temas.map(r => `<button class="flojo-fila rp-fila" data-tipo="${r.tipo}" type="button"
          aria-label="${t('repaso_btn')}: ${r.etiqueta}, ${r.pendientes}">
        <span class="f-nom">${ICO_TIPO[r.tipo] || '🎯'} ${r.etiqueta}</span>
        <div class="barra"><div class="barra-fill ${r.pc > 40 ? 'peligro' : ''}" style="width:${Math.max(6, r.pc)}%"></div></div>
        <span class="f-num">${r.pendientes}/${r.total}</span>
      </button>`).join('')}
    </div>
    <p class="mini">${t('repaso_toca')}</p>`
    : `<p class="desc" style="text-align:center">${t('flojo_nada')}</p>`}
    <button class="btn btn2" id="rp-volver" type="button">${t('volver')}</button>
  </div>`, rRepaso);
  $$('.rp-fila').forEach(b => { b.onclick = () => { SFX.click(); empezarRepaso(b.dataset.tipo); }; });
  $('#rp-volver').onclick = () => { SFX.click(); rLibre(); };
}

function empezarRepaso(tipo) {
  conAyuda(tipo, () => {
    RETO.repasoSolo(true);
    libreActivo = { tipo, repaso: true };
    vidas = maxVidas();
    fnDeTipo(tipo)(RETO_DIA[tipo] ?? 0);
  });
}

/* ══════════ MODO LIBRE ══════════ */

function rLibre() {
  const d = difActual();
  pantalla('libre', `
  <div class="centro">
    <h2>🎮 ${t('libre_tit')}</h2>
    <p class="desc" style="text-align:center">${t('libre_expl')}</p>
    <div class="tit-id"><span>${d.ico} ${tj(d)}</span></div>
    <button class="btn btn3 repaso-entrada" id="lb-repaso" type="button">🎯 ${t('repaso_tit')}
      <span class="repaso-n">${pendientesRepaso() ? pendientesRepaso() + ' ' + t('repaso_pend') : t('repaso_alDia')}</span></button>
    <div class="tit-rejilla c3" id="lb-lista">
      ${TIPOS_LIBRES.map(tipo => {
        const m = marcaDe(tipo);
        return `<button class="btn btn2 menu-fila" data-tipo="${tipo}" type="button">
          <span class="m-ico">${ICO_TIPO[tipo] || '🎮'}</span>
          <span class="m-txt">${t('tipo_' + tipo)}</span>
          <span class="m-marca">${m ? '★ ' + m : t('sin_marca')}</span>
        </button>`;
      }).join('')}
    </div>
    <button class="btn btn2" id="lb-volver" type="button">${t('volver')}</button>
  </div>`,rLibre);
  $$('#lb-lista .menu-fila').forEach(b => {
    b.onclick = () => { SFX.click(); empezarLibre(b.dataset.tipo); };
  });
  $('#lb-repaso').onclick = () => { SFX.click(); rRepaso(); };
  $('#lb-volver').onclick = () => { SFX.click(); rTitulo(); };
}

function empezarLibre(tipo) {
  /* La ficha de controles sale también aquí la primera vez: al modo libre se
     puede llegar sin haber pasado nunca por ese día de la campaña. */
  conAyuda(tipo, () => {
    libreActivo = { tipo };
    vidas = maxVidas();          /* el HUD necesita un valor con sentido */
    fnDeTipo(tipo)(RETO_DIA[tipo] ?? 0);
  });
}

/* Cierre de una partida suelta, venga de resultado() o de fallo(). No da XP
   ni puntos: es entrenamiento, y si diera progreso sería una granja. Lo que
   deja es la marca personal. */
function libreFin(stars, pts) {
  if (!libreActivo) return;
  const tipo = libreActivo.tipo, repaso = !!libreActivo.repaso;
  libreActivo = null;
  RETO.repasoSolo(false);
  limpiarT();
  const ganados = Math.max(0, pts);
  const quedan = repaso ? temasRepaso().filter(r => r.tipo === tipo).reduce((a, r) => a + r.pendientes, 0) : 0;
  const nueva = ganados > 0 && guardarMarca(tipo, ganados);
  if (stars > 0) SFX.win(); else SFX.lose();
  /* Solo dibuja: lo de arriba ya pasó y no se repite al cambiar de idioma. */
  const pintar = () => {
  pantalla('libre-fin', `
  <div class="centro">
    <span class="ico">${ICO_TIPO[tipo] || '🎮'}</span>
    <h2 class="${stars > 0 ? 'verde' : 'rojo'}">${stars > 0 ? t('aprobado') : t('fallado')}</h2>
    ${starsHtml(Math.max(0, stars))}
    <p class="pts-final">${ganados} ${t('rec_pts')}</p>
    ${nueva ? `<p class="mini verde">${t('marca_nueva')}</p>`
            : `<p class="mini">${t('libre_mejor')}: ${marcaDe(tipo)}</p>`}
    ${repaso ? `<p class="mini ${quedan ? '' : 'verde'}">🎯 ${quedan ? t('repaso_quedan').replace('{n}', quedan) : t('repaso_limpio')}</p>` : ''}
    ${repaso && !quedan ? '' : `<button class="btn" id="lf-otra" type="button">${t('libre_otra')}</button>`}
    <button class="btn btn2" id="lf-volver" type="button">${t('volver')}</button>
  </div>`, pintar);
  if ($('#lf-otra')) $('#lf-otra').onclick = () => { SFX.click(); repaso ? empezarRepaso(tipo) : empezarLibre(tipo); };
  $('#lf-volver').onclick = () => { SFX.click(); repaso ? rRepaso() : rLibre(); };
  };
  pintar();
  if (nueva) { confeti(); tvez(SFX.star, 300); }
}

/* ══════════ SIN FIN ══════════ */

/* Cada tres rondas sube un escalón de dificultad, hasta PESADILLA. Empieza
   en la que tenga elegida el jugador, así que quien juega en PESADILLA
   arranca ya arriba y solo le queda aguantar. */
const difDeRonda = ronda => Math.min(2, S.dif + Math.floor(ronda / 3));
/* Y los puntos valen más cuanto más lejos llegas, que es lo que convierte
   aguantar una ronda más en algo que se nota en el marcador. */
const multSinFin = ronda => 1 + ronda * 0.15;

function rSinFin() {
  const mejor = S.mejorSinFin || 0;
  pantalla('sinfin', `
  <div class="centro">
    <h2>♾️ ${t('sinfin_tit')}</h2>
    <p class="desc" style="text-align:center">${t('sinfin_expl')}</p>
    <div class="reto-racha">
      <span class="reto-llama ${mejor ? 'viva' : ''}">${mejor ? '🏅' : '🕯'}</span>
      <div>
        <p class="reto-num">${mejor}</p>
        <p class="mini">${t('sinfin_mejor')}</p>
      </div>
    </div>
    <div class="jugar-marco">
      <i></i><i></i><i></i><i></i>
      <button class="btn btn-jugar" id="sf-jugar" type="button">${t('sinfin_jugar')}</button>
    </div>
    <button class="btn btn2" id="sf-volver" type="button">${t('volver')}</button>
  </div>`,rSinFin);
  $('#sf-jugar').onclick = () => { SFX.click(); empezarSinFin(); };
  $('#sf-volver').onclick = () => { SFX.click(); rTitulo(); };
}

function empezarSinFin() {
  sinFinActivo = { ronda: 0, pts: 0 };
  siguienteSinFin();
}

function siguienteSinFin() {
  if (!sinFinActivo) return;
  const r = sinFinActivo.ronda;
  difForzada = difDeRonda(r);
  const tipo = TIPOS_LIBRES[Math.floor(Math.random() * TIPOS_LIBRES.length)];
  sinFinActivo.tipo = tipo;
  vidas = 1;                      /* una sola vida: fallar termina la racha */
  conAyuda(tipo, () => fnDeTipo(tipo)(RETO_DIA[tipo] ?? 0));
}

/* Solo llega aquí una ronda SUPERADA: resultado() se llama al ganar y
   fallo() al perder, y perder termina la racha. */
function sinFinRonda(stars, pts) {
  if (!sinFinActivo) return;
  const r = sinFinActivo.ronda;
  sinFinActivo.pts += Math.round(Math.max(0, pts) * multSinFin(r));
  sinFinActivo.ronda++;
  limpiarT();
  SFX.ok();
  const sigDif = DIFS[difDeRonda(sinFinActivo.ronda)];
  const sube = difDeRonda(sinFinActivo.ronda) > difDeRonda(r);
  /* Solo dibuja: lo de arriba ya pasó y no se repite al cambiar de idioma. */
  const pintar = () => {
  pantalla('sinfin-paso', `
  <div class="centro">
    <span class="ico">✅</span>
    <h2 class="verde">${t('sinfin_ronda').replace('{n}', sinFinActivo.ronda)}</h2>
    ${starsHtml(Math.max(0, stars))}
    <p class="pts-final">${sinFinActivo.pts} ${t('rec_pts')}</p>
    <p class="mini">×${multSinFin(sinFinActivo.ronda).toFixed(2).replace(/\.?0+$/, '')}</p>
    ${sube ? `<p class="mini rojo">${t('sinfin_sube').replace('{d}', tj(sigDif))} ${sigDif.ico}</p>` : ''}
    <button class="btn" id="sp-sig" type="button">${t('siguiente')}</button>
  </div>`, pintar);
  $('#sp-sig').onclick = () => { SFX.click(); siguienteSinFin(); };
  };
  pintar();
}

function sinFinFin() {
  const pts = sinFinActivo ? sinFinActivo.pts : 0;
  const rondas = sinFinActivo ? sinFinActivo.ronda : 0;
  sinFinActivo = null;
  difForzada = -1;                /* se vuelve a la dificultad del jugador */
  limpiarT();
  const nueva = pts > (S.mejorSinFin || 0);
  if (nueva) S.mejorSinFin = pts;
  /* Aguantar rondas es jugar de verdad, así que da progreso como la campaña.
     La marca del modo se guarda aparte. */
  if (pts > 0) { S.pts += pts; S.xp += pts; }
  if (rondas >= 10) darLogro('maraton');
  guardar();
  /* Al marcador del aula sube SOLO la marca personal: publicar cada racha
     llenaría la tabla de rachas de dos rondas y taparía las buenas. La XP que
     se envía es la de por vida, no la de la racha, para que la columna de rango
     diga en qué rango está quien hizo la marca; de paso cumple el invariante de
     la base (puntos <= xp), porque S.xp acaba de crecer con esos mismos puntos.
     La dificultad es la de salida, que es la que de verdad cambia la racha: el
     sin fin sube solo a partir de ahí. */
  if (nueva && pts > 0) {
    RANKING.publicar({ nombre: S.nombre || t('tu'), puntos: pts, xp: S.xp,
                       dificultad: S.dif, temporada: RANKING.HITO_SIN_FIN,
                       grupo: S.grupo });
  }
  SFX.lose();
  /* Solo dibuja: lo de arriba ya pasó y no se repite al cambiar de idioma. */
  const pintar = () => {
  pantalla('sinfin-fin', `
  <div class="centro">
    <span class="ico">♾️</span>
    <h2 class="${nueva ? 'verde' : 'rojo'}">${t('sinfin_fin')}</h2>
    <p class="mini">${t('sinfin_rondas').replace('{n}', rondas)}</p>
    <p class="pts-final">${pts} ${t('rec_pts')}</p>
    ${nueva ? `<p class="mini verde">${t('marca_nueva')}</p>`
            : `<p class="mini">${t('sinfin_mejor')}: ${S.mejorSinFin || 0}</p>`}
    <button class="btn" id="sff-otra" type="button">${t('libre_otra')}</button>
    <button class="btn btn2" id="sff-volver" type="button">${t('volver')}</button>
  </div>`, pintar);
  $('#sff-otra').onclick = () => { SFX.click(); empezarSinFin(); };
  $('#sff-volver').onclick = () => { SFX.click(); rSinFin(); };
  };
  pintar();
  if (nueva && pts > 0) { confeti(); tvez(SFX.star, 300); }
}
