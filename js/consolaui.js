'use strict';
/* ── EL PANEL DE LA CONSOLA ──
   La parte que se ve del laboratorio: un terminal de fósforo verde sobre el
   juego. La lógica y las órdenes viven en js/consola.js (LAB), que no toca el
   DOM; aquí solo se pinta, se escucha el teclado y se ejecuta lo que LAB no
   puede hacer solo (saltar a un día, lanzar un minijuego, el contador de FPS).

   CÓMO SE ABRE
   · el enlace ⚗ CONSOLA en el pie de la portada (js/menus.js, rTitulo). Es la
     forma normal: un toque. No hace falta esconderla, porque lo que la hace
     inofensiva son las reglas del ensayo y no que cueste encontrarla.
   · mantener pulsado el día en la cabecera (arriba a la izquierda), 900 ms.
     Este sirve TAMBIÉN en mitad de una partida, donde no hay portada.
   · la tecla ` o ~ en el computador, con la consola cerrada.
   · terminar la dirección del juego en #lab para que se abra al cargar.
   Dentro de una sala NO se abre: ahí se juega derecho (ver rSala y
   SALA.puntuar, que además rechazan puntuar en ensayo).

   Mientras está abierta el juego queda en pausa (`pausado`), así abrirla en
   mitad de una prueba no la hace perder. */

let labAbierto = false;
let labFps = 0;            /* id del rAF del contador, 0 = apagado */

/* Un aviso corto reusando la burbuja de los logros, que ya es una región
   "live" y se anuncia en el lector de pantalla. */
function labAviso(ico, txt) {
  const p = $('#logro-popup');
  if (!p) return;
  p.querySelector('.ico-l').textContent = ico;
  p.querySelector('p').textContent = txt;
  p.hidden = false;
  setTimeout(() => { p.hidden = true; }, 2600);
}

/* La marca de ENSAYO de la cabecera. Se pinta desde cero cada vez para que
   siga al idioma y al estado sin que nadie tenga que acordarse. */
function labMarca() {
  const m = $('#lab-marca');
  if (!m) return;
  const on = LAB.ensayo();
  m.hidden = !on;
  if (!on) return;
  const r = LAB.resumen();
  m.textContent = '⚗ ' + t('lab_ensayo') + (r ? ' · ' + r : '');
  m.title = t('lab_ensayo_ay');
}

function labEscribir(lineas) {
  const caja = $('#lab-salida');
  for (const l of lineas) {
    const p = document.createElement('p');
    p.className = 'lab-l lab-' + l.c;
    p.textContent = l.s;                 /* textContent: la salida NUNCA es HTML */
    caja.appendChild(p);
  }
  /* Un terminal no crece sin fin: se queda con las últimas líneas */
  while (caja.children.length > 200) caja.removeChild(caja.firstChild);
  caja.scrollTop = caja.scrollHeight;
}

/* ── FPS ──
   Su propio requestAnimationFrame, no el `raf` del juego: limpiarT() cancela
   ese en cada cambio de pantalla y el contador se apagaría solo. */
function labToggleFps() {
  const el = $('#lab-fps');
  if (!el) return;
  if (labFps) { cancelAnimationFrame(labFps); labFps = 0; el.hidden = true; return; }
  el.hidden = false;
  let n = 0, t0 = performance.now();
  const tic = () => {
    n++;
    const ahora = performance.now();
    if (ahora - t0 >= 500) { el.textContent = Math.round(n * 1000 / (ahora - t0)) + ' FPS'; n = 0; t0 = ahora; }
    labFps = requestAnimationFrame(tic);
  };
  labFps = requestAnimationFrame(tic);
}

/* ── ACCIONES que LAB deja en manos del panel ── */
function labAccion(a) {
  if (!a) return;
  if (a.tipo === 'salir') return cerrarLab();
  if (a.tipo === 'fps') return labToggleFps();
  if (a.tipo === 'dia') {
    cerrarLab(); salirDeModos(); empezarDia(a.dia); return;
  }
  if (a.tipo === 'juego') {
    cerrarLab(); salirDeModos();
    /* Se lanza por el modo libre, que es el camino que ya existe para jugar un
       minijuego suelto: así no hay una segunda forma de arrancarlos. */
    if (typeof empezarLibre === 'function') empezarLibre(a.juego);
  }
}

/* ── ENTRADA DE ÓRDENES ── */
const labHist = [];
let labHistI = -1;

function labCorrer(texto) {
  const linea = String(texto || '').trim();
  if (!linea) return;
  labEscribir([{ c: 'eco', s: '> ' + linea }]);
  labHist.push(linea); labHistI = labHist.length;
  const r = LAB.ejecutar(linea, { enNivel: pantallaId === 'nivel', enSala: !!salaActiva });
  labEscribir(r.lineas);
  const malo = r.lineas.some(l => l.c === 'err');
  malo ? SFX.mal() : SFX.pop();
  labMarca();
  labChips();
  labAccion(r.accion);
}

/* Botones de orden: la consola tiene que servir en un móvil proyectado, sin
   teclado. Son las órdenes que de verdad se usan al explicar en clase. */
function labChips() {
  const caja = $('#lab-chips');
  if (!caja) return;
  const lista = S.lang === 'en'
    ? ['help', 'list', 'lives 9', 'time 2', 'level practice', 'reset', 'exit']
    : ['ayuda', 'listar', 'vidas 9', 'tiempo 2', 'dif practica', 'normal', 'salir'];
  caja.innerHTML = lista.map(c => `<button class="lab-chip" type="button" data-c="${esc(c)}">${esc(c)}</button>`).join('');
  $$('#lab-chips .lab-chip').forEach(b => { b.onclick = () => labCorrer(b.dataset.c); });
}

/* ── ABRIR / CERRAR ── */
function abrirLab() {
  if (labAbierto) return;
  /* En una sala no: la sala es competencia de verdad */
  if (salaActiva) { SFX.mal(); labAviso('🏫', t('lab_no_sala')); return; }
  labAbierto = true;
  pausado = true;                        /* el juego espera; nada se pierde */
  $('#lab').hidden = false;
  $('#lab-sub').textContent = t('lab_sub');
  $('#lab-tit').textContent = '⚗ ' + t('lab_tit');
  $('#lab-x').setAttribute('aria-label', t('lab_cerrar'));
  const inp = $('#lab-in');
  inp.setAttribute('aria-label', t('lab_orden'));
  inp.placeholder = t('lab_bienvenida');
  if (!$('#lab-salida').children.length) {
    labEscribir([{ c: 'tit', s: '⚗ ' + t('lab_tit') }, { c: 'info', s: t('lab_bienvenida') }]);
  }
  labChips();
  labMarca();
  SFX.ok();
  inp.value = '';
  inp.focus();
}
function cerrarLab() {
  if (!labAbierto) return;
  labAbierto = false;
  /* Soltar el foco ANTES de esconder el panel. Si no, el navegador lo saca del
     campo cuando le viene bien y durante ese rato la tecla ` no abre nada:
     el atajo se cree que se está escribiendo en un campo. */
  $('#lab-in').blur();
  $('#lab').hidden = true;
  /* Se devuelve la pausa a quien la tuviera: si el menú de pausa estaba
     abierto por detrás, el juego tiene que seguir parado al cerrar la consola. */
  pausado = !$('#pausa').hidden;
  labMarca();
  SFX.click();
}

/* ── EL GESTO ──
   Pulsación larga sobre el día de la cabecera. Se cancela si el dedo se va o
   se mueve, para no disparar por un roce al pasar. */
function labGesto() {
  const el = $('#h-nivel');
  if (!el) return;
  let reloj = 0;
  const fuera = () => { clearTimeout(reloj); reloj = 0; };
  const dentro = e => {
    if (labAbierto) return;
    fuera();
    reloj = setTimeout(() => { reloj = 0; abrirLab(); }, 900);
  };
  el.addEventListener('pointerdown', dentro);
  el.addEventListener('pointerup', fuera);
  el.addEventListener('pointercancel', fuera);
  el.addEventListener('pointerleave', fuera);
  /* El día no era pulsable; ahora lo es. Sin esto, en el móvil la pulsación
     larga selecciona el texto y sale el menú de copiar encima del juego. */
  el.style.touchAction = 'manipulation';
  el.style.userSelect = 'none';
}

/* ── CABLEADO ── */
(() => {
  const form = $('#lab-form'), inp = $('#lab-in');
  if (!form) return;                     /* el panel no está en esta página */
  form.addEventListener('submit', e => {
    e.preventDefault();
    const v = inp.value;
    inp.value = '';
    labCorrer(v);
  });
  /* Historial con las flechas, como en un terminal de verdad */
  inp.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp' && labHist.length) {
      e.preventDefault();
      labHistI = Math.max(0, labHistI - 1);
      inp.value = labHist[labHistI] || '';
    } else if (e.key === 'ArrowDown' && labHist.length) {
      e.preventDefault();
      labHistI = Math.min(labHist.length, labHistI + 1);
      inp.value = labHist[labHistI] || '';
    }
  });
  $('#lab-x').onclick = () => cerrarLab();
  document.addEventListener('keydown', e => {
    /* ` y ~ abren y cierran, pero no mientras se escribe en un campo */
    const enCampo = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '');
    if ((e.key === '`' || e.key === '~') && (!enCampo || labAbierto)) {
      e.preventDefault();
      labAbierto ? cerrarLab() : abrirLab();
      return;
    }
    if (e.key === 'Escape' && labAbierto) { e.preventDefault(); cerrarLab(); }
  });
  labGesto();
  labMarca();
  /* #lab en la dirección: para abrirla al cargar sin tocar nada */
  if (location.hash === '#lab') setTimeout(abrirLab, 300);
})();
