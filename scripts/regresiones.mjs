/* Regresiones en navegador: un caso por cada fallo arreglado que el barrido
   (scripts/barrido.mjs) no puede ver, porque no son de "llegar al final" sino
   de interacción: teclas mantenidas, dobles toques, salir deprisa, cambiar de
   idioma a mitad de algo.

   Antes estas comprobaciones vivían en un directorio temporal y se perdían al
   cerrar cada sesión: nada impedía que un arreglo se deshiciera sin aviso.
   Cada caso nombra el fallo que vigila.

   Uso:  node scripts/regresiones.mjs   (levanta su propio servidor local) */
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUERTO = 8131;
async function cargarPlaywright() {
  for (const m of ['playwright', '/opt/node22/lib/node_modules/playwright/index.mjs']) {
    try { return (await import(m)).chromium; } catch (e) { /* siguiente */ }
  }
  throw new Error('no encuentro playwright');
}
async function servidor() {
  const url = `http://127.0.0.1:${PUERTO}/index.html`;
  try { if ((await fetch(url)).ok) return null; } catch (e) {}
  const p = spawn('python3', ['-m', 'http.server', String(PUERTO)], { cwd: RAIZ, stdio: 'ignore' });
  for (let i = 0; i < 40; i++) {
    try { if ((await fetch(url)).ok) return p; } catch (e) {}
    await new Promise(r => setTimeout(r, 250));
  }
  p.kill(); throw new Error('no pude levantar el servidor local');
}

const chromium = await cargarPlaywright();
const srv = await servidor();
const nav = await chromium.launch();
let fallos = 0, total = 0;

/* Cada caso recibe una página con la partida ya preparada y devuelve
   [ok, detalle]. Un error de página sin capturar hace fallar el caso. */
async function caso(nombre, guardado, fn) {
  total++;
  const ctx = await nav.newContext({ viewport: { width: 390, height: 760 } });
  if (guardado) await ctx.addInitScript(g => { if (!localStorage.getItem('pa3')) localStorage.setItem('pa3', JSON.stringify(g)); }, guardado);
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  let ok = false, det = '';
  try {
    await pg.goto(`http://127.0.0.1:${PUERTO}/index.html`, { waitUntil: 'load' });
    await pg.waitForFunction(() => typeof pantallaId !== 'undefined');
    await pg.waitForTimeout(300);
    [ok, det] = await fn(pg);
  } catch (e) { det = e.message.split('\n')[0]; }
  if (errs.length) { ok = false; det = 'error de página: ' + errs[0]; }
  if (!ok) fallos++;
  console.log(`${ok ? '✓' : '✗'} ${nombre}${det ? ' → ' + det : ''}`);
  await ctx.close();
}
const prep = (pg, extra = {}) => pg.evaluate(x => {
  Object.assign(S, { nombre: 'R', intro: true, t2: true, version: VERSION,
    vistos: ['escribir', 'bugs', 'memoria', 'simon', 'quiz', 'review', 'merge', 'runner', 'sql', 'regex', 'terminal', 'orden', 'jefe'] }, x);
  guardar();
}, extra);
const pausa = ms => new Promise(r => setTimeout(r, ms));

/* ── MINIJUEGOS ── */
await caso('code review · una tecla mantenida es UNA respuesta (antes: línea 1 → 6)', null, async pg => {
  await prep(pg); await pg.evaluate(() => { diaAct = 5; vidas = 3; nvReview(5); }); await pausa(300);
  const r = await pg.evaluate(() => {
    const ev = rep => new KeyboardEvent('keydown', { code: 'ArrowRight', key: 'ArrowRight', repeat: rep, bubbles: true });
    document.dispatchEvent(ev(false)); for (let i = 0; i < 4; i++) document.dispatchEvent(ev(true));
    return +$('#v-prog').textContent;
  });
  return [r === 2, `quedó en la línea ${r}`];
});

await caso('caza-bugs · una tecla mantenida no golpea sola', null, async pg => {
  await prep(pg); await pg.evaluate(() => { diaAct = 1; vidas = 3; nvBugs(1); }); await pausa(1200);
  const r = await pg.evaluate(() => {
    const on = document.querySelector('#b-grilla .celda.on');
    if (!on) return 'sin bug encendido';
    const n = +on.dataset.k + 1, antes = +$('#b-hits').textContent;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: String(n), repeat: true, bubbles: true }));
    return +$('#b-hits').textContent - antes;
  });
  return [r === 0, typeof r === 'number' ? `${r} golpe(s) por repetición` : r];
});

await caso('regex · tocar dos veces la misma opción mala cuenta UN error (antes: fuera del nivel en PESADILLA)', null, async pg => {
  await prep(pg, { dif: 2 }); await pg.evaluate(() => { diaAct = 11; vidas = 3; nvRegex(11); }); await pausa(300);
  const r = await pg.evaluate(() => {
    const re = new RegExp($('#rx-re').textContent.replace(/^\/|\/$/g, ''));
    const mala = [...document.querySelectorAll('.rx-op')].find(b => !re.test(b.dataset.t));
    if (!mala) return { salta: true };
    mala.click(); mala.click();
    return { pantalla: pantallaId, errores: pantallaId === 'nivel' ? +$('#rx-err').textContent : null };
  });
  if (r.salta) return [true, 'ronda sin opción mala, nada que probar'];
  return [r.pantalla === 'nivel' && r.errores === 1, JSON.stringify(r)];
});

await caso('terminal · fallar y salir enseguida no revienta', null, async pg => {
  await prep(pg); await pg.evaluate(() => { diaAct = 0; vidas = 3; nvTerminal(0); }); await pausa(300);
  await pg.evaluate(() => { $('#tm-in').value = 'nada'; $('#tm-ok').click(); salirDeModos(); rMapa(); });
  await pausa(500);
  return [true, ''];
});

await caso('cuestionario · en PRÁCTICA llega a la última pregunta (antes: clavado en 6/5)', null, async pg => {
  await prep(pg, { dif: 0 }); await pg.evaluate(() => { diaAct = 4; vidas = 3; nvQuiz(4); }); await pausa(300);
  for (let v = 0; v < 12; v++) {
    if (await pg.evaluate(() => pantallaId) !== 'nivel') break;
    await pg.evaluate(() => {
      const q = QUIZ[S.lang].find(x => x.q === $('#q-preg').textContent);
      const b = document.querySelectorAll('#q-ops .op')[q ? q.r : 0]; if (b) b.click();
    });
    await pausa(1000);
  }
  const p = await pg.evaluate(() => pantallaId);
  return [p === 'resultado', `terminó en "${p}"`];
});

/* ── JEFE · controles que se quedaban pegados ──
   El movimiento se lee espiando APRENDIZ.dirDe, que recibe cada fotograma el
   desplazamiento del jugador. */
const enJefe = pg => pg.evaluate(() => {
  const o = APRENDIZ.dirDe; APRENDIZ.dirDe = (dx, dy) => { window.__mov = dx; return o(dx, dy); };
  diaAct = 9; vidas = 3; nvJefe(9, 0);
});
await caso('jefe · un toque cancelado por el sistema suelta el botón (antes: se movía solo)', null, async pg => {
  await prep(pg); await enJefe(pg); await pausa(300);
  await pg.evaluate(() => { const b = $('#j-izq');
    b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    b.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true })); });
  await pausa(400);
  const m = await pg.evaluate(() => window.__mov);
  return [m === 0, `movimiento sin tocar nada: ${m}`];
});
await caso('jefe · cambiar de ventana con una flecha pulsada la suelta', null, async pg => {
  await prep(pg); await enJefe(pg); await pausa(300);
  await pg.evaluate(() => { document.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowLeft', bubbles: true }));
    window.dispatchEvent(new Event('blur')); });
  await pausa(400);
  const m = await pg.evaluate(() => window.__mov);
  return [m === 0, `movimiento sin tocar nada: ${m}`];
});

/* ── IDIOMA ── */
await caso('idioma · el diálogo del día se traduce sin cambiar de día', null, async pg => {
  await prep(pg, { lang: 'es' }); await pg.evaluate(() => { aplicarIdioma(); diaAct = 0; rDialogo(0); }); await pausa(900);
  await pg.locator('#b-lang').click(); await pausa(900);
  const r = await pg.evaluate(() => ({ p: pantallaId, d: diaAct, t: $('#d-linea').textContent }));
  return [r.p === 'dialogo' && r.d === 0 && /training stage/i.test(r.t), r.t.slice(0, 40)];
});

await caso('idioma · redibujar el resultado no vuelve a sumar puntos', null, async pg => {
  await prep(pg, { pts: 0, xp: 0 }); await pg.evaluate(() => resultado(0, 3, 100));
  const a = await pg.evaluate(() => S.pts);
  for (let i = 0; i < 3; i++) { await pg.locator('#b-lang').click(); await pausa(150); }
  const b = await pg.evaluate(() => S.pts);
  return [a > 0 && a === b, `${a} → ${b}`];
});

await caso('idioma · redibujar el fallo no quita otra vida', null, async pg => {
  await prep(pg); await pg.evaluate(() => { vidas = 3; fallo(0); });
  for (let i = 0; i < 2; i++) { await pg.locator('#b-lang').click(); await pausa(150); }
  const v = await pg.evaluate(() => vidas);
  return [v === 2, `vidas ${v}`];
});

await caso('idioma · la ficha de controles no se salta sola', null, async pg => {
  await prep(pg, { vistos: [] });
  await pg.evaluate(() => { window.__entro = false; conAyuda('escribir', () => { window.__entro = true; }); });
  await pg.locator('#b-lang').click(); await pausa(200);
  const r = await pg.evaluate(() => ({ p: pantallaId, e: window.__entro }));
  return [r.p === 'ayuda' && !r.e, JSON.stringify(r)];
});

await caso('idioma · una cutscene se traduce sin perder la página', null, async pg => {
  await prep(pg, { lang: 'es' }); await pg.evaluate(() => { aplicarIdioma(); rCutscene(INTRO, () => {}); });
  await pg.locator('#cut-zona').click(); await pausa(150);
  await pg.locator('#b-lang').click(); await pausa(200);
  const t = await pg.locator('.cut-prog').textContent();
  return [/2\//.test(t), t];
});

/* ── NOVEDADES ── */
await caso('novedades · a quien estrena el juego no se le enseñan', null, async pg => {
  const r = await pg.evaluate(() => ({ p: pantallaId, v: S.version === VERSION }));
  return [r.p === 'titulo' && r.v, JSON.stringify(r)];
});

await caso('novedades · a quien vuelve se le enseñan una sola vez', { pts: 500, intro: true, version: 'v0' }, async pg => {
  const p1 = await pg.evaluate(() => pantallaId);
  await pg.locator('#nv-ok').click(); await pausa(200);
  await pg.reload({ waitUntil: 'load' }); await pausa(400);
  const p2 = await pg.evaluate(() => pantallaId);
  return [p1 === 'novedades' && p2 === 'titulo', `${p1} → ${p2}`];
});

/* ── CONSOLA DE LABORATORIO ── */
await caso('consola · un ensayo no escribe en la partida guardada', null, async pg => {
  await prep(pg, { pts: 100 });
  const antes = await pg.evaluate(() => localStorage.getItem('pa3'));
  await pg.evaluate(() => { LAB.ejecutar('vidas 9', {}); S.pts = 999999; guardar(); });
  const despues = await pg.evaluate(() => localStorage.getItem('pa3'));
  await pg.evaluate(() => LAB.ejecutar('normal', {}));
  const pts = await pg.evaluate(() => S.pts);
  return [antes === despues && pts === 100, `guardado intacto: ${antes === despues}, puntos al volver: ${pts}`];
});

await caso('consola · con un ensayo no se entra a una sala', null, async pg => {
  await prep(pg); await pg.evaluate(() => { LAB.ejecutar('vidas 9', {}); rSala(); }); await pausa(200);
  const p = await pg.evaluate(() => pantallaId);
  return [p === 'sala-ensayo', p];
});

/* ── CRUCES ── */
await caso('consola × ajustes · volver a lo normal conserva idioma, sonido, piel y dificultad', null, async pg => {
  await prep(pg, { lang: 'es', snd: true, hd: false, dif: 1, pts: 100 });
  const r = await pg.evaluate(() => {
    LAB.ejecutar('vidas 9', {});
    S.lang = 'en'; aplicarIdioma(); S.snd = false; S.hd = true; S.dif = 2; S.pts = 99999;
    LAB.ejecutar('normal', {});
    return { lang: S.lang, html: document.documentElement.lang, snd: S.snd, hd: S.hd, dif: S.dif, pts: S.pts };
  });
  return [r.lang === 'en' && r.html === 'en' && !r.snd && r.hd && r.dif === 2 && r.pts === 100, JSON.stringify(r)];
});

await caso('pausa × idioma · el menú de pausa se traduce con la pausa abierta', null, async pg => {
  await prep(pg, { lang: 'es' }); await pg.evaluate(() => { aplicarIdioma(); diaAct = 4; vidas = 3; nvQuiz(4); }); await pausa(300);
  await pg.locator('#b-pause').click(); await pausa(150);
  await pg.locator('#b-lang').click(); await pausa(200);
  const t = await pg.locator('#p-titulo').textContent(), c = await pg.locator('#p-cont').textContent();
  return [t === 'PAUSED' && c === 'CONTINUE', `${t} / ${c}`];
});

await caso('consola × pausa · un Escape con la consola abierta cierra SOLO la consola', null, async pg => {
  await prep(pg); await pg.evaluate(() => { diaAct = 4; vidas = 3; nvQuiz(4); }); await pausa(300);
  await pg.locator('#b-pause').click(); await pausa(100);
  await pg.keyboard.press('`'); await pausa(150);
  await pg.keyboard.press('Escape'); await pausa(150);
  const r = await pg.evaluate(() => ({ lab: !$('#lab').hidden, pausa: !$('#pausa').hidden, pausado }));
  return [!r.lab && r.pausa && r.pausado, JSON.stringify(r)];
});

await caso('tienda · un doble toque al comprar no desequipa el accesorio (antes: pagabas y no lo veías puesto)', { pts: 5000, xp: 5000, intro: true, nombre: 'R', version: 'v0' }, async pg => {
  await pg.evaluate(() => { if (pantallaId === 'novedades') $('#nv-ok').click(); rTienda(); }); await pausa(150);
  const id = await pg.evaluate(() => document.querySelector('[data-id]').dataset.id);
  await pg.locator(`[data-id="${id}"]`).dblclick(); await pausa(200);
  const r = await pg.evaluate(i => ({ tiene: S.accs.includes(i), puesto: S.acc === i }), id);
  return [r.tiene && r.puesto, JSON.stringify(r)];
});

await caso('menús · ninguna pantalla revienta con una partida vieja o con datos raros', { intro: true, nombre: '<b>X</b>', stats: null, mejores: null, vistos: null, reto: null, pesos: null, records: [{ n: null }, 5], version: 'v0' }, async pg => {
  await pg.evaluate(() => { if (pantallaId === 'novedades') $('#nv-ok').click(); });
  const mal = await pg.evaluate(() => {
    const f = [];
    for (const n of ['rTitulo','rMapa','rTienda','rLogros','rRecords','rStats','rPerso','rLibre','rSinFin','rReto','rBorrar']) {
      try { window[n] ? window[n]() : eval(n + '()'); const t = $('#screen').innerText; if (/\bNaN\b|undefined|\bnull\b/.test(t)) f.push(n + ': texto roto'); }
      catch (e) { f.push(n + ': ' + e.message); }
    }
    return f;
  });
  return [mal.length === 0, mal.join(' | ')];
});

/* ── MODOS SUELTOS ── */
for (const [modo, arr] of [['modo libre', "empezarLibre('runner')"], ['sin fin', "empezarSinFin(); libreActivo = null; sinFinActivo.tipo = 'runner'; vidas = 1; nvRunner(RETO_DIA.runner)"],
                           ['reto diario', "retoActivo = { ronda: 0, pts: 0, aciertos: 0, tipos: ['runner'], fecha: 'x' }; vidas = 1; nvRunner(RETO_DIA.runner)"]]) {
  await caso(`${modo} · acabar el runner NO lanza la pelea del jefe (antes: cutscene del jefe en mitad de la ronda)`, null, async pg => {
    await prep(pg);
    await pg.evaluate(a => { LAB.ejecutar('tiempo 0.2', {}); LAB.ejecutar('errores 20', {}); new Function(a)(); }, arr);
    await pg.waitForFunction(() => pantallaId !== 'nivel', null, { timeout: 30000 }).catch(() => {});
    await pausa(300);
    const p = await pg.evaluate(() => pantallaId);
    return [p !== 'cut' && p !== 'nivel', `pantalla "${p}"`];
  });
}

await caso('cabecera · el modo libre y el sin fin no enseñan "DÍA x/15" de la campaña', null, async pg => {
  await prep(pg, { vistos: ['regex'] });
  await pg.evaluate(() => empezarLibre('regex')); await pausa(250);
  const libre = await pg.evaluate(() => $('#h-nivel').textContent);
  await pg.evaluate(() => { limpiarT(); libreActivo = null; empezarSinFin(); }); await pausa(250);
  const sinfin = await pg.evaluate(() => $('#h-nivel').textContent);
  return [!/\/15/.test(libre) && !/\/15/.test(sinfin), `libre "${libre}" · sin fin "${sinfin}"`];
});

await caso('reto diario · un reto empezado antes de medianoche cuenta para el día en que empezó', null, async pg => {
  await pg.clock.install({ time: new Date(2026, 9, 2, 23, 58, 0) });
  await pg.reload({ waitUntil: 'load' }); await pausa(300);
  await prep(pg);
  await pg.evaluate(() => empezarReto());
  await pg.clock.setFixedTime(new Date(2026, 9, 3, 0, 3, 0));
  const r = await pg.evaluate(() => { retoActivo.pts = 300; finReto(); return S.reto.fecha; });
  return [r === '2026-10-02', `registrado el ${r}`];
});

await caso('sala · las mejoras compradas no dan ventaja dentro de una sala (antes: +1 vida y +20 % de tiempo)', null, async pg => {
  await prep(pg, { mejoras: ['vida', 'tiempo', 'escudo', 'iman'], dif: 1 });
  const r = await pg.evaluate(() => {
    const fuera = { vidas: maxVidas(), tiempo: facTiempo(), escudo: mejora('escudo') };
    salaActiva = { codigo: 'K7M2Q', ronda: 0, juegos: ['quiz'], pts: 0 };
    const dentro = { vidas: maxVidas(), tiempo: facTiempo(), escudo: mejora('escudo') };
    salaActiva = null;
    return { fuera, dentro };
  });
  const ok = r.fuera.vidas === 4 && r.fuera.tiempo === 1.2 && r.fuera.escudo === true
          && r.dentro.vidas === 3 && r.dentro.tiempo === 1 && r.dentro.escudo === false;
  return [ok, JSON.stringify(r)];
});

/* ── GUARDADO ── */
for (const [nom, raw] of [
  ['idioma desconocido', { lang: 'xx', intro: true, nombre: 'R' }],
  ['listas que no son listas', { accs: 'gafas', mejoras: null, logros: {}, intro: true, nombre: 'R' }],
  ['piel y camisa fuera de rango', { skin: 99, camisa: -3, intro: true, nombre: 'R' }],
  ['__proto__ dentro del JSON', '{"__proto__":{"polluted":1},"intro":true,"nombre":"R"}'],
]) {
  total++;
  const ctx = await nav.newContext({ viewport: { width: 390, height: 760 } });
  await ctx.addInitScript(r => localStorage.setItem('pa3', r), typeof raw === 'string' ? raw : JSON.stringify(raw));
  const pg = await ctx.newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://127.0.0.1:${PUERTO}/index.html`, { waitUntil: 'load' }); await pausa(500);
  const r = await pg.evaluate(() => ({ texto: ($('#screen').innerText || '').length, contaminada: S.polluted === 1 }));
  const ok = !errs.length && r.texto > 0 && !r.contaminada;
  if (!ok) fallos++;
  console.log(`${ok ? '✓' : '✗'} guardado corrupto · ${nom} → el juego arranca${ok ? '' : ': ' + (errs[0] || JSON.stringify(r))}`);
  await ctx.close();
}

await caso('importar · con un ensayo en marcha termina el ensayo y se guarda entero', { intro: true, nombre: 'R', pts: 500, xp: 500, version: 'v0' }, async pg => {
  const r = await pg.evaluate(() => {
    const c = JSON.stringify(Object.assign({}, S, { pts: 9000, xp: 9000, nombre: 'OTRO' }));
    const b = btoa(unescape(encodeURIComponent(c)));
    LAB.ejecutar('vidas 9', {});
    importarCodigo('PA4.' + sumaCod(b) + '.' + b);
    const d = JSON.parse(localStorage.getItem('pa3'));
    return { ensayo: LAB.ensayo(), memoria: S.pts, disco: d.pts, nombre: d.nombre };
  });
  return [!r.ensayo && r.memoria === 9000 && r.disco === 9000 && r.nombre === 'OTRO', JSON.stringify(r)];
});

await caso('borrar · con un ensayo en marcha borra de verdad', { intro: true, nombre: 'R', pts: 500, xp: 500, version: 'v0' }, async pg => {
  await pg.evaluate(() => { if (pantallaId === 'novedades') $('#nv-ok').click(); LAB.ejecutar('vidas 9', {}); rBorrar(); });
  await pausa(150);
  await pg.locator('#bo-si').click(); await pausa(300);
  await pg.evaluate(() => { const b = document.querySelector('#bo-si2, #bo-ok, #bo-si'); if (b) b.click(); });
  await pausa(300);
  const r = await pg.evaluate(() => ({ ensayo: LAB.ensayo(), pts: S.pts, disco: (JSON.parse(localStorage.getItem('pa3')) || {}).pts }));
  return [!r.ensayo && r.pts === 0 && r.disco === 0, JSON.stringify(r)];
});

/* ── TECLADO Y MOVIMIENTO ── */
await caso('cutscene · Enter avanza una página y mantenerlo no se las salta todas', null, async pg => {
  await prep(pg); await pg.evaluate(() => rCutscene(INTRO, () => {})); await pausa(200);
  const p0 = await pg.locator('.cut-prog').textContent();
  await pg.evaluate(() => { const z = $('#cut-zona'); z.focus();
    z.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    for (let i = 0; i < 4; i++) z.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', repeat: true, bubbles: true })); });
  await pausa(150);
  const p1 = await pg.locator('.cut-prog').textContent();
  return [/1\//.test(p0) && /2\//.test(p1), `${p0} → ${p1}`];
});

await caso('foco · las pantallas "puerta" ponen el foco en su acción principal', { intro: true, pts: 5, xp: 5, nombre: 'R', version: 'v0' }, async pg => {
  const r = {};
  const foco = () => pg.evaluate(() => (document.activeElement && document.activeElement.id) || 'nada');
  r.novedades = await foco();
  await pg.locator('#nv-ok').click(); await pausa(150);
  await pg.evaluate(() => { vidas = 3; fallo(0); }); await pausa(150); r.fallo = await foco();
  await pg.evaluate(() => rBorrar()); await pausa(150); r.borrar = await foco();
  const ok = r.novedades === 'nv-ok' && r.fallo === 'f-re' && r.borrar === 'bo-no';
  return [ok, JSON.stringify(r)];
});

await caso('movimiento · con "reducir movimiento" la casilla del jefe no pulsa', { intro: true, nombre: 'R', pts: 5, xp: 5, version: 'v36', dias: Array(15).fill(3) }, async pg => {
  await pg.emulateMedia({ reducedMotion: 'reduce' });
  await pg.evaluate(() => rMapa()); await pausa(200);
  const a = await pg.evaluate(() => getComputedStyle(document.querySelector('#m-jefe')).animationName);
  return [a === 'none', `animación: ${a}`];
});

await nav.close();
if (srv) srv.kill();
console.log(`\n${total - fallos}/${total} regresiones en verde`);
process.exit(fallos ? 1 : 0);
