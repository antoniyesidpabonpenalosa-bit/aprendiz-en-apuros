/* Barrido de la campaña: juega los 15 días en las 3 dificultades y los 2
   idiomas, con un robot que contesta BIEN, y escribe un informe.

   Por qué existe: los últimos fallos que aparecieron llevaban meses vivos y
   todos tenían la misma forma —el camino por defecto estaba probado y los
   bordes no—. El cuestionario del día 5 se quedaba clavado solo en PRÁCTICA,
   porque solo ahí se sortean 5 preguntas en vez de 6. Nadie lo veía porque
   nadie jugaba en PRÁCTICA.

   El robot no juega "a lo que salga": para cada minijuego saca la respuesta
   correcta de los propios datos del juego (el banco de preguntas, el de
   conflictos, la expresión regular en pantalla, el orden de las piezas). Eso
   es lo que hace que el barrido valga: llega al FINAL de cada prueba, que es
   donde estaba escondido el fallo del día 5. Si una partida no termina, es un
   problema del juego y no del robot.

   Uso:
     node scripts/barrido.mjs                     · todo (90 partidas, ~20 min)
     node scripts/barrido.mjs --dias 5            · solo el día 5
     node scripts/barrido.mjs --dias 1-5 --dif 0  · días 1 a 5 en PRÁCTICA
     node scripts/barrido.mjs --lang es           · solo en español
     node scripts/barrido.mjs --informe ruta.md

   Necesita un servidor local sirviendo el repo; si no hay uno en el puerto,
   lo levanta él mismo. */
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

/* Playwright puede estar instalado en el proyecto o a lo bruto en el sistema
   (este contenedor lo trae en /opt). Se prueban los dos. */
async function cargarPlaywright() {
  for (const m of ['playwright', '/opt/node22/lib/node_modules/playwright/index.mjs']) {
    try { return (await import(m)).chromium; } catch (e) { /* siguiente */ }
  }
  throw new Error('no encuentro playwright: instálalo o ajusta la ruta en scripts/barrido.mjs');
}

/* ── argumentos ── */
const args = process.argv.slice(2);
const opt = (n, def) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : def; };
const rango = txt => {
  const out = [];
  for (const parte of String(txt).split(',')) {
    const m = parte.match(/^(\d+)-(\d+)$/);
    if (m) for (let i = +m[1]; i <= +m[2]; i++) out.push(i);
    else out.push(+parte);
  }
  return out;
};
const DIAS = rango(opt('dias', '1-15'));
const DIFS = rango(opt('dif', '0,1,2'));
const LANGS = String(opt('lang', 'es,en')).split(',');
const PUERTO = +opt('puerto', 8111);
const INFORME = opt('informe', join(RAIZ, 'informe-barrido.md'));
const TOPE_MS = +opt('tope', 150000);        // por partida, de sobra para el jefe

const NOMBRE_DIF = ['PRÁCTICA', 'NORMAL', 'PESADILLA'];

/* ── el robot, inyectado en la página ──
   Vive DENTRO del navegador y juega solo: si cada clic viniera desde aquí, una
   partida del jefe serían miles de ida y vuelta. */
function instalarRobot() {
  const B = window.__bot = { simon: [], pos: 0, mem: null, ultimo: {}, errs: [], acciones: 0 };
  const $1 = s => document.querySelector(s);
  const texto = s => { const e = $1(s); return e ? e.textContent.trim() : null; };
  /* Solo actúa cuando lo que hay en pantalla CAMBIÓ: así no se machaca un
     botón mientras el juego está en una pausa de 900 ms. */
  const nuevo = (k, v) => { if (B.ultimo[k] === v) return false; B.ultimo[k] = v; return true; };

  function tick() {
    if (typeof pantallaId === 'undefined') return;
    if (pantallaId === 'cut') { const z = $1('#cut-skip'); if (z) z.click(); return; }
    if (pantallaId === 'ayuda') { const z = $1('#ay-ok'); if (z) z.click(); return; }
    if (pantallaId !== 'nivel') return;
    B.acciones++;

    /* ESCRIBIR · la palabra está en pantalla, con · por los espacios */
    const ein = $1('#e-in');
    if (ein) {
      const obj = (texto('#e-palabra') || '').replace(/·/g, ' ');
      if (obj && ein.value !== obj) { ein.value = obj; ein.dispatchEvent(new Event('input', { bubbles: true })); }
      return;
    }

    /* CAZA-BUGS · pegarle a la casilla encendida, salvo si es bomba */
    const grilla = $1('#b-grilla');
    if (grilla) {
      const on = grilla.querySelector('.celda.on');
      if (on && on.querySelector('.px').textContent !== '💣') on.click();
      return;
    }

    /* MEMORIA · se memoriza durante la ojeada y luego se resuelve de una */
    const memo = $1('#m-memo');
    if (memo) {
      const cartas = [...memo.querySelectorAll('.carta')];
      if (!B.mem) {
        if (cartas.length && cartas.every(c => c.textContent !== '?')) B.mem = cartas.map(c => c.textContent);
        return;
      }
      const libres = cartas.map((c, i) => ({ c, i }))
        .filter(o => !o.c.classList.contains('fija') && !o.c.classList.contains('vista'));
      for (let a = 0; a < libres.length; a++)
        for (let b = a + 1; b < libres.length; b++)
          if (B.mem[libres[a].i] === B.mem[libres[b].i]) { libres[a].c.click(); libres[b].c.click(); return; }
      return;
    }

    /* SIMON · la secuencia se apunta con un observador: mirándola cada tantos
       milisegundos se perderían destellos seguidos del mismo comando */
    const sim = $1('#s-simon');
    if (sim) {
      if (!sim.__obs) {
        sim.__obs = new MutationObserver(ms => {
          for (const m of ms) {
            if (m.target === sim) {
              if (sim.classList.contains('muestra')) { B.simon = []; B.pos = 0; }
              continue;
            }
            if (m.target.classList.contains('activo') && sim.classList.contains('muestra'))
              B.simon.push(m.target.dataset.id);
          }
        });
        sim.__obs.observe(sim, { subtree: true, attributes: true, attributeFilter: ['class'] });
      }
      if (sim.classList.contains('muestra')) return;
      const id = B.simon[B.pos];
      if (!id) return;
      const b = sim.querySelector('.cmd[data-id="' + id + '"]');
      if (b) { b.click(); B.pos++; }
      return;
    }

    /* QUIZ · la respuesta sale del propio banco de preguntas */
    const ops = $1('#q-ops');
    if (ops) {
      const p = texto('#q-preg');
      if (!p || !nuevo('quiz', p)) return;
      const Q = QUIZ[S.lang].find(x => x.q === p);
      const b = ops.querySelectorAll('.op')[Q ? Q.r : 0];
      if (b) b.click();
      return;
    }

    /* CODE REVIEW · si la línea está marcada como buena en CODIGO, se aprueba */
    const code = $1('#v-code');
    if (code) {
      const l = code.textContent;
      if (!nuevo('rev', l)) return;
      const C = CODIGO.find(x => x.c === l);
      const b = $1(C && C.ok ? '#v-si' : '#v-no');
      if (b) b.click();
      return;
    }

    /* MERGE · la buena es la que aparece primera en CONFLICTOS */
    const ga = $1('#g-a'), gb = $1('#g-b');
    if (ga && gb) {
      const a = ga.textContent, b = gb.textContent;
      if (!nuevo('merge', a + '|' + b)) return;
      const par = CONFLICTOS.find(([bu, ma]) => (bu === a && ma === b) || (bu === b && ma === a));
      (par && par[0] === b ? gb : ga).click();
      return;
    }

    /* SQL / ORDENA · cada pieza lleva su sitio en data-i: va la más baja que
       siga habilitada, que es exactamente la que toca */
    const piezas = $1('#sq-piezas');
    if (piezas) {
      const libres = [...piezas.querySelectorAll('.sql-pieza:not([disabled])')]
        .sort((x, y) => +x.dataset.i - +y.dataset.i);
      if (libres[0] && nuevo('sql', texto('#sq-armada') + '|' + libres.length)) libres[0].click();
      return;
    }

    /* REGEX · el patrón está escrito en pantalla; se aplica tal cual */
    const grid = $1('#rx-grid');
    if (grid) {
      const re = texto('#rx-re');
      if (!re) return;
      let exp;
      try { exp = new RegExp(re.replace(/^\/|\/$/g, '')); } catch (e) { return; }
      const b = [...grid.querySelectorAll('.rx-op:not([disabled])')].find(x => exp.test(x.dataset.t));
      if (b) b.click();
      return;
    }

    /* TERMINAL · el comando exacto sale del banco de tareas */
    const tin = $1('#tm-in');
    if (tin) {
      const tarea = texto('#tm-tarea');
      if (!tarea || !nuevo('term', tarea)) return;
      const T = TERMINALES.find(x => tj(x) === tarea);
      if (!T) return;
      tin.value = T.cmd;
      const ok = $1('#tm-ok'); if (ok) ok.click();
      return;
    }

    /* RUNNER · saltar a menudo; acabe como acabe, termina por tiempo */
    if ($1('#r-cv')) { const u = $1('#r-up'); if (u && B.acciones % 6 === 0) u.click(); return; }

    /* JEFE · moverse de lado a lado. Ganarle pide puntería de verdad, así que
       aquí solo se comprueba que la pelea no se rompa ni se quede colgada:
       termina al recibir tres golpes. Queda dicho en el informe. */
    if ($1('#j-cv')) {
      const b = $1(B.acciones % 20 < 10 ? '#j-izq' : '#j-der');
      if (b) b.click();
      return;
    }
  }

  B.int = setInterval(() => { try { tick(); } catch (e) { B.errs.push(String(e && e.message || e)); } }, 60);
}

/* ── servidor local ── */
async function servidor(puerto) {
  try {
    const r = await fetch(`http://127.0.0.1:${puerto}/index.html`);
    if (r.ok) return null;                       // ya hay uno, no es nuestro
  } catch (e) { /* hay que levantarlo */ }
  const p = spawn('python3', ['-m', 'http.server', String(puerto)], { cwd: RAIZ, stdio: 'ignore' });
  for (let i = 0; i < 40; i++) {
    try { const r = await fetch(`http://127.0.0.1:${puerto}/index.html`); if (r.ok) return p; } catch (e) {}
    await new Promise(r => setTimeout(r, 250));
  }
  p.kill(); throw new Error('no pude levantar el servidor local');
}

/* ── una partida ── */
async function partida(nav, { dia, dif, lang }) {
  const ctx = await nav.newContext({ viewport: { width: 390, height: 760 } });
  const pg = await ctx.newPage();
  const errores = [], consola = [];
  pg.on('pageerror', e => errores.push(e.message));
  pg.on('console', m => {
    const t = m.text();
    if (m.type() !== 'error') return;
    if (/ERR_CERT|supabase|Failed to load resource/i.test(t)) return;   // sin internet en el contenedor
    consola.push(t);
  });
  const t0 = Date.now();
  let estado = 'sin-arrancar', pantallaFinal = null, robot = null;
  try {
    await pg.goto(`http://127.0.0.1:${PUERTO}/index.html`, { waitUntil: 'load' });
    await pg.waitForFunction(() => typeof pantallaId !== 'undefined', null, { timeout: 15000 });
    await pg.evaluate(([d, df, lg]) => {
      S.dif = df; S.lang = lg; S.nombre = 'ROBOT'; S.intro = true; S.t2 = true;
      S.version = VERSION;
      /* las fichas de control ya vistas: estorban al medir, y tienen su propia
         prueba aparte */
      S.vistos = ['escribir', 'bugs', 'memoria', 'simon', 'quiz', 'review', 'merge', 'runner', 'sql', 'regex', 'terminal', 'orden', 'jefe'];
      S.dias = Array(15).fill(3);
      aplicarIdioma(); guardar();
      diaAct = d; vidas = 3;
      jugarNivel(d);
    }, [dia, dif, lang]);
    await pg.evaluate(instalarRobot);
    await pg.waitForFunction(
      () => pantallaId !== 'nivel' && pantallaId !== 'cut' && pantallaId !== 'ayuda',
      null, { timeout: TOPE_MS },
    );
    pantallaFinal = await pg.evaluate(() => pantallaId);
    estado = 'terminó';
  } catch (e) {
    pantallaFinal = await pg.evaluate(() => (typeof pantallaId === 'undefined' ? null : pantallaId)).catch(() => null);
    estado = /Timeout/i.test(e.message) ? 'SE QUEDÓ COLGADO' : 'REVENTÓ';
    if (!/Timeout/i.test(e.message)) errores.push(e.message);
  }
  robot = await pg.evaluate(() => (window.__bot ? { errs: window.__bot.errs.slice(0, 3), acciones: window.__bot.acciones } : null)).catch(() => null);
  const ms = Date.now() - t0;
  await ctx.close();
  return { dia, dif, lang, estado, pantallaFinal, ms, errores, consola, robot };
}

/* ── barrido ── */
const chromium = await cargarPlaywright();
const srv = await servidor(PUERTO);
const nav = await chromium.launch();
const filas = [];
const total = DIAS.length * DIFS.length * LANGS.length;
let n = 0;
console.log(`Barrido: ${DIAS.length} día(s) × ${DIFS.length} dificultad(es) × ${LANGS.length} idioma(s) = ${total} partidas\n`);
for (const dia of DIAS) for (const dif of DIFS) for (const lang of LANGS) {
  const r = await partida(nav, { dia: dia - 1, dif, lang });
  filas.push(r);
  n++;
  const mal = r.estado !== 'terminó' || r.errores.length || r.consola.length;
  const etiqueta = `día ${String(dia).padStart(2)} · ${NOMBRE_DIF[dif].padEnd(9)} · ${lang}`;
  console.log(`${mal ? '✗' : '✓'} [${String(n).padStart(3)}/${total}] ${etiqueta} · ${r.estado}` +
    (r.pantallaFinal ? ` → ${r.pantallaFinal}` : '') + ` · ${(r.ms / 1000).toFixed(1)}s` +
    (r.errores.length ? `\n      ERROR: ${r.errores[0]}` : '') +
    (r.consola.length ? `\n      CONSOLA: ${r.consola[0]}` : ''));
}
await nav.close();
if (srv) srv.kill();

/* ── informe ── */
const NIVEL = ['PRIMER DÍA', 'CAZA-BUGS', 'MEMORIA TÉCNICA', 'FLUJO GIT', 'SUSTENTACIÓN', 'CODE REVIEW',
  'PROYECTO FORMATIVO', 'CONFLICTO GIT', 'DESPLIEGUE', 'EVALUACIÓN FINAL',
  'CONSULTA SQL', 'CAZA PATRONES', 'BUGS NIVEL 2', 'GIT AVANZADO', 'DEPLOY NOCTURNO'];
const malas = filas.filter(r => r.estado !== 'terminó' || r.errores.length || r.consola.length);
const hoy = new Date().toISOString().slice(0, 10);
let md = `# Informe del barrido de la campaña\n\n`;
md += `**Fecha:** ${hoy} · **Partidas:** ${filas.length} · `;
md += malas.length ? `**Con problemas: ${malas.length}**\n\n` : `**Sin problemas**\n\n`;
md += `Cada partida es un día jugado de principio a fin por un robot que contesta\n`;
md += `bien, sacando las respuestas de los propios datos del juego. Una partida que\n`;
md += `no llega al final es un fallo del juego, no del robot.\n\n`;

if (malas.length) {
  md += `## Problemas encontrados\n\n`;
  md += `| Día | Nivel | Dificultad | Idioma | Qué pasó | Detalle |\n|---|---|---|---|---|---|\n`;
  for (const r of malas) {
    const det = r.errores[0] || r.consola[0] || (r.pantallaFinal ? `se quedó en "${r.pantallaFinal}"` : '');
    md += `| ${r.dia + 1} | ${NIVEL[r.dia]} | ${NOMBRE_DIF[r.dif]} | ${r.lang} | ${r.estado} | ${String(det).replace(/\|/g, '/').slice(0, 120)} |\n`;
  }
  md += `\n`;
} else {
  md += `## Problemas encontrados\n\nNinguno.\n\n`;
}

md += `## Resultado de cada partida\n\n`;
md += `| Día | Nivel | Dificultad | Idioma | Terminó en | Segundos |\n|---|---|---|---|---|---|\n`;
for (const r of filas)
  md += `| ${r.dia + 1} | ${NIVEL[r.dia]} | ${NOMBRE_DIF[r.dif]} | ${r.lang} | ${r.pantallaFinal || '—'} | ${(r.ms / 1000).toFixed(1)} |\n`;

md += `\n## Qué NO cubre este barrido\n\n`;
md += `- **Ganarle al jefe** (días 10 y 15). El robot se mueve pero no apunta, así\n`;
md += `  que la pelea termina siempre por recibir tres golpes. Se comprueba que no\n`;
md += `  se cuelgue ni reviente, no el camino de victoria.\n`;
md += `- **El runner** se juega a saltar a ciegas: termina por tiempo, no por\n`;
md += `  esquivar bien.\n`;
md += `- Las fichas de controles se saltan a propósito (tienen su propia prueba).\n`;
md += `- El marcador global no se toca: el contenedor no sale a internet.\n`;

writeFileSync(INFORME, md);
console.log(`\n${malas.length ? `${malas.length} PARTIDA(S) CON PROBLEMAS` : 'TODAS LAS PARTIDAS TERMINARON BIEN'}`);
console.log(`Informe: ${INFORME}`);
process.exit(malas.length ? 1 : 0);
