/* Regresiones en navegador: un caso por cada fallo arreglado que el barrido
   (scripts/barrido.mjs) no puede ver, porque no son de "llegar al final" sino
   de interacción: teclas mantenidas, dobles toques, salir deprisa, cambiar de
   idioma a mitad de algo.

   Antes estas comprobaciones vivían en un directorio temporal y se perdían al
   cerrar cada sesión: nada impedía que un arreglo se deshiciera sin aviso.
   Cada caso nombra el fallo que vigila.

   Uso:  node scripts/regresiones.mjs   (levanta su propio servidor local)
         SOLO=jefe node scripts/regresiones.mjs   (solo los casos con "jefe" en el nombre) */
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
async function caso(nombre, guardado, fn, opciones = {}) {
  /* SOLO=texto: corre solo los casos cuyo nombre lo contenga (para iterar rápido) */
  if (process.env.SOLO && !nombre.includes(process.env.SOLO)) return;
  total++;
  const ctx = await nav.newContext({ viewport: { width: 390, height: 760 }, ...opciones });
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

await caso('puntos · repetir un día ya superado paga la cuarta parte y lo avisa; un día nuevo, completo', null, async pg => {
  await prep(pg, { pts: 0, xp: 0, dias: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] });
  const r = await pg.evaluate(() => {
    const dif = facPts();
    resultado(0, 2, 400); const nuevo = { pts: S.pts, aviso: !!$('.desc')?.textContent.match(/cuarta parte/) };
    resultado(0, 3, 400); const repe = { pts: S.pts - nuevo.pts, xp: S.xp, aviso: /cuarta parte/.test($('#screen').innerText), mejor: S.dias[0] };
    return { dif, nuevo, repe };
  });
  const ok = r.nuevo.pts === Math.round(400 * r.dif) && !r.nuevo.aviso
    && r.repe.pts === Math.round(400 * r.dif * 0.25) && r.repe.xp === r.nuevo.pts + r.repe.pts && r.repe.aviso && r.repe.mejor === 3;
  return [ok, JSON.stringify(r)];
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

await caso('sala y reto diario · las mejoras compradas no dan ventaja (antes: +1 vida y +20 % de tiempo)', null, async pg => {
  await prep(pg, { mejoras: ['vida', 'tiempo', 'escudo', 'iman'], dif: 1 });
  const r = await pg.evaluate(() => {
    const fuera = { vidas: maxVidas(), tiempo: facTiempo(), escudo: mejora('escudo') };
    salaActiva = { codigo: 'K7M2Q', ronda: 0, juegos: ['quiz'], pts: 0 };
    const dentro = { vidas: maxVidas(), tiempo: facTiempo(), escudo: mejora('escudo') };
    salaActiva = null;
    retoActivo = { ronda: 0, pts: 0, aciertos: 0, tipos: ['quiz'] };
    const reto = { vidas: maxVidas(), tiempo: facTiempo(), escudo: mejora('escudo') };
    retoActivo = null;
    return { fuera, dentro, reto };
  });
  const ok = r.fuera.vidas === 4 && r.fuera.tiempo === 1.2 && r.fuera.escudo === true
          && r.dentro.vidas === 3 && r.dentro.tiempo === 1 && r.dentro.escudo === false
          && r.reto.vidas === 3 && r.reto.tiempo === 1 && r.reto.escudo === false;
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
  await pg.evaluate(() => rMapaLista()); await pausa(200);
  const a = await pg.evaluate(() => getComputedStyle(document.querySelector('#m-jefe')).animationName);
  return [a === 'none', `animación: ${a}`];
});

/* ── EL JEFE, GANADO DE PUNTA A PUNTA ──
   El barrido no puede ganarle (su robot no apunta). Este sí: espía dónde se
   dibuja el jefe (por drawImage: sus dibujos están en img/jefe/; si no cargan, el
   respaldo es el dibujo de código de js/iconos.js, y en último caso el emoji) y las ❌
   (iconos pixel: cada canvas lleva su nombre en dataset.pxi), apunta con ADELANTO —la bala tarda ~25
   fotogramas y el jefe se mueve 35-60 px en ese rato— y esquiva lo que cae y el
   aviso del láser. La agresividad va al mínimo desde la consola: lo que se prueba
   es el CAMINO de victoria y lo que viene después, no la dificultad. Sin escudo
   ni ayudas: en el día 15 (arena grande, lluvia y rayo) tiene que poder ganar. */
const robotJefe = a => {
  const d = typeof a === 'number' ? a : a.d, agr = typeof a === 'number' ? 0.2 : a.agr;
  Object.assign(S, { nombre: 'ROBOT', intro: true, t2: true, version: VERSION, vistos: ['jefe'] });
  if (a.dif != null) S.dif = a.dif;
  LAB.ejecutar('jefe ' + agr, {});
  const W = d === 14 ? 400 : 320, H = d === 14 ? 270 : 180;   // la arena del día 15 es más grande
  const X = window.__x = { jefe: W / 2, vel: 0, p: W / 2 - 8, err: [], errNext: [] };
  const aviso = t('avisolaser');
  const ft = CanvasRenderingContext2D.prototype.fillText;
  /* REG: lo que pasó con el jefe, para las pruebas de la transformación. Cada
     dibujo del jefe apunta qué era (pose 1-3 o atlas fila/cuadro), dónde cayó
     y cómo estaban el indicador de fase y los golpes recibidos en ese instante. */
  const REG = window.__reg = { dibujos: [], emoji: 0, respaldo: 0 };
  const sigue = cx => { X.vel = X.vel * .6 + (cx - X.jefe) * .4; X.jefe = cx; X.err = X.errNext; X.errNext = []; };
  CanvasRenderingContext2D.prototype.fillText = function (txt, x, y) {
    if (txt === '👾' || txt === '😡' || txt === '🤬') { REG.emoji++; sigue(x); }
    else if (txt === aviso) X.laser = { x, hasta: performance.now() + 1500 };
    return ft.apply(this, arguments);
  };
  /* El jefe: los PNG de img/jefe/ (se anota cada dibujo) o, si no cargaron, el dibujo de
     código jefe1-3 de js/iconos.js (48 px, esquina en jefe.x-24: REG.respaldo). La ❌ es
     un icono de 12 px con la esquina en (o.x-6, o.y-11): se vuelve al centro y a la línea base. */
  const di = CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage = function (img, ...a) {
    const m = img && img.src && /img\/jefe\/(jefe-fase-(\d)|jefe-transformaciones-atlas)\.png/.exec(img.src);
    const k = img && img.dataset && img.dataset.pxi;
    if (m) {
      const atlas = a.length >= 8, [dx, dy, dw, dh] = atlas ? a.slice(4, 8) : a.slice(0, 4);
      sigue(dx + dw / 2);
      REG.dibujos.push({ k: atlas ? 'atlas' : 'pose', pose: atlas ? 0 : +m[2], fila: atlas ? a[1] / 128 : -1, cuadro: atlas ? a[0] / 128 : -1,
        dx, dy, dw, dh, cx: dx + dw / 2, fase: $('#j-fase')?.textContent, golpes: $('#j-gol')?.textContent,
        suave: this.imageSmoothingEnabled, t: performance.now() });
    } else if (k && k.startsWith('jefe')) { REG.respaldo++; sigue(a[0] + 24); }
    else if (k === '❌') X.errNext.push([a[0] + 6, a[1] + 11]);
    return di.apply(this, arguments);
  };
  const o = APRENDIZ.dirDe;
  APRENDIZ.dirDe = (dx, dy) => { X.p = Math.max(8, Math.min(W - 24, X.p + dx * 3.4)); return o(dx, dy); };
  const tecla = (code, on) => document.dispatchEvent(new KeyboardEvent(on ? 'keydown' : 'keyup', { code, bubbles: true }));
  /* Dónde caerá cada ❌: si alguna deriva de lado (en la arena alta del
     día 15 ya no hay abanico, pero se deja por si vuelve), se calcula dónde llega. Se empareja cada una con la
     más cercana del fotograma anterior para sacar su velocidad. */
  let antes = [];
  const caida = () => {
    const ahora = X.err.map(([ex, ey]) => {
      const prev = antes.filter(([px, py]) => ey - py > 0 && ey - py < 6 && Math.abs(ex - px) < 4)
        .sort((a, b) => Math.abs(ex - a[0]) - Math.abs(ex - b[0]))[0];
      const vx = prev ? ex - prev[0] : 0, vy = prev ? ey - prev[1] : 1;
      return [ex + vx * Math.max(0, H - 30 - ey) / Math.max(.2, vy), ey];
    });
    antes = X.err;
    return ahora;
  };
  (function paso() {
    let obj = Math.max(8, Math.min(W - 24, X.jefe + X.vel * 27 - 7));
    const amen = caida().filter(([ex, ey]) => ey > H - 95 && Math.abs(ex - (X.p + 8)) < 26).sort((a, b) => b[1] - a[1])[0];
    if (amen) obj = amen[0] > X.p + 8 ? X.p - 40 : X.p + 40;
    if (X.laser && performance.now() < X.laser.hasta && Math.abs(X.laser.x - (X.p + 8)) < 44) obj = X.laser.x > X.p + 8 ? X.p - 60 : X.p + 60;
    obj = Math.max(8, Math.min(W - 24, obj));
    tecla('ArrowLeft', obj < X.p - 1.8); tecla('ArrowRight', obj > X.p + 1.8);
    requestAnimationFrame(paso);
  })();
  diaAct = d; vidas = 3; nvJefe(d, 0);
};
/* ── EL JEFE EVOLUTIVO (v26) ──
   Lo que queda anotado en window.__reg (ver robotJefe) se revisa aquí: que el
   jefe se dibuje con sus tres poses y NO con emojis, que cada transformación
   salga una sola vez, completa (12 cuadros en orden) y con todo detenido
   (golpes y posición quietos, indicador de fase sin cambiar hasta el final), que
   el indicador y la pose nueva lleguen después, que los píxeles no se suavicen y
   que el dibujo quepa en la arena sin tapar la barra de vida (y = 14). */
const analizaEvolucion = (reg, W, H, { min, max = 2, poses = true } = {}) => {
  const d = reg.dibujos, mal = [];
  const corridas = []; let cur = null;
  for (const x of d) {
    if (x.k !== 'atlas') { cur = null; continue; }
    if (!cur || cur.fila !== x.fila) { cur = { fila: x.fila, cuadros: [], xs: new Set(), golpes: new Set(), fases: new Set(), t0: x.t, t1: x.t }; corridas.push(cur); }
    cur.cuadros.push(x.cuadro); cur.xs.add(Math.round(x.cx * 10)); cur.golpes.add(x.golpes); cur.fases.add(x.fase); cur.t1 = x.t;
  }
  if (corridas.length < min || corridas.length > max) mal.push(`transformaciones: ${corridas.length} (esperaba ${min}-${max})`);
  corridas.forEach((c, i) => {
    if (c.fila !== i) mal.push(`la corrida ${i + 1} usa la fila ${c.fila}, no la ${i}`);
    const orden = c.cuadros.every((q, k) => k === 0 || q >= c.cuadros[k - 1]);
    if (!orden || c.cuadros[0] !== 0 || c.cuadros.at(-1) !== 11 || new Set(c.cuadros).size !== 12) mal.push(`corrida ${i + 1}: cuadros ${[...new Set(c.cuadros)]}`);
    if (c.xs.size !== 1) mal.push(`corrida ${i + 1}: el jefe se movió (${[...c.xs]})`);
    if (c.golpes.size !== 1) mal.push(`corrida ${i + 1}: cambiaron los golpes (${[...c.golpes]})`);
    if (c.fases.size !== 1 || [...c.fases][0] !== String(i + 1)) mal.push(`corrida ${i + 1}: indicador de fase ${[...c.fases]}`);
    const ms = c.t1 - c.t0;
    if (ms < 850 || ms > 3000) mal.push(`corrida ${i + 1}: duró ${Math.round(ms)} ms (referencia 1020)`);
  });
  /* tras cada corrida, la primera pose es la nueva y el indicador ya la dice */
  let ultAtlas = null;
  d.forEach((x, k) => {
    if (x.k === 'atlas') { ultAtlas = x; return; }
    if (ultAtlas) { if (x.pose !== ultAtlas.fila + 2 || x.fase !== String(ultAtlas.fila + 2)) mal.push(`tras la fila ${ultAtlas.fila}: pose ${x.pose} indicador ${x.fase}`); ultAtlas = null; }
  });
  if (poses) { const vistas = [...new Set(d.filter(x => x.k === 'pose').map(x => x.pose))].sort().join(''); if (vistas !== '123'.slice(0, corridas.length + 1)) mal.push(`poses vistas: ${vistas}`); }
  if (reg.emoji || reg.respaldo) mal.push(`${reg.emoji} emojis y ${reg.respaldo} dibujos de respaldo (debería usar los PNG)`);
  if (d.some(x => x.suave !== false)) mal.push('algún dibujo con imageSmoothingEnabled activo');
  /* la celda de 128 px tiene margen transparente: lo que cuenta es lo VISIBLE
     (medido en el arte: de x=8 a 120 en todos los cuadros; arriba, la fase 1 empieza
     en y=65, la 2 en 49, la 3 en 30 y el cuadro más alto de las transformaciones en 24) */
  const arriba = x => x.k === 'atlas' ? 24 : [65, 49, 30][x.pose - 1];
  const fuera = d.filter(x => { const s = x.dw / 128; return x.dx + 8 * s < 0 || x.dx + 121 * s > W || x.dy + arriba(x) * s < 14 || x.dy + 113 * s > H; });
  if (fuera.length) mal.push(`${fuera.length} dibujos con lo visible fuera de la arena ${W}×${H} o sobre la barra de vida (p. ej. ${JSON.stringify(fuera[0], (k, v) => typeof v === 'number' ? Math.round(v * 10) / 10 : v)})`);
  return mal;
};
/* intenta el combate hasta 3 veces (el robot esquiva bien pero no perfecto) y devuelve el registro del último */
const luchaRobot = async (pg, arg, { hasta = () => pantallaId !== 'nivel', bueno = r => r.dibujos.some(x => x.k === 'atlas'), ms = 150000 } = {}) => {
  for (let intento = 1; intento <= 3; intento++) {
    if (intento > 1) { await pg.reload({ waitUntil: 'load' }); await pg.waitForFunction(() => typeof pantallaId !== 'undefined'); await pausa(300); }
    await pg.evaluate(robotJefe, arg);
    await pg.waitForFunction(hasta, null, { timeout: ms }).catch(() => {});
    const reg = await pg.evaluate(() => window.__reg);
    if (bueno(reg) || intento === 3) return { reg, intento };
  }
};
const hayAtlas = () => window.__reg.dibujos.some(x => x.k === 'atlas');
const poseVista = n => window.__reg.dibujos.some(x => x.k === 'pose' && x.pose === n);
for (const [dia, final, etiqueta] of [[9, /CONTRATO DE APRENDIZAJE/, 'día 10 → contrato de aprendizaje'], [14, /TÉCNICO EN PROGRAMACIÓN DE SOFTWARE/, 'día 15 → título de técnico']]) {
  await caso(`jefe · se le gana de punta a punta y la victoria lleva a: ${etiqueta}`, null, async pg => {
    /* Hasta 3 intentos: el robot esquiva bien pero no perfecto, y alguna
       partida la pierde (el CI fallaba así ~1 de cada 6 días, con y sin los
       efectos de v20). Lo que se prueba es que ganar lleva a donde debe, no
       la puntería del robot; si pierde las tres, sí es que algo se rompió. */
    let gano, intento = 1;
    for (; intento <= 3; intento++) {
      if (intento > 1) {
        await pg.reload({ waitUntil: 'load' });
        await pg.waitForFunction(() => typeof pantallaId !== 'undefined'); await pausa(300);
      }
      await pg.evaluate(robotJefe, dia);
      await pg.waitForFunction(() => pantallaId !== 'nivel', null, { timeout: 150000 }).catch(() => {});
      gano = await pg.evaluate(() => ({ p: pantallaId, logro: S.logros.includes('jefe'), jefes: S.stats.jefes }));
      if (gano.p === 'resultado') break;
    }
    if (gano.p !== 'resultado') return [false, `no ganó en 3 intentos: pantalla "${gano.p}"`];
    const evol = analizaEvolucion(await pg.evaluate(() => window.__reg), dia === 14 ? 400 : 320, dia === 14 ? 270 : 180, { min: 2, max: 2 });
    if (evol.length) return [false, 'evolución: ' + evol.join(' · ')];
    await pg.locator('#r-fin').click(); await pausa(300);
    for (let i = 0; i < 5 && await pg.evaluate(() => pantallaId) === 'cut'; i++) { await pg.locator('#cut-zona').click(); await pausa(200); }
    const txt = await pg.evaluate(() => $('#screen').innerText);
    const logroFin = await pg.evaluate(d => S.logros.includes(d === 9 ? 'titulado' : 'contrato'), dia);
    return [gano.logro && gano.jefes === 1 && final.test(txt) && logroFin,
            `intento ${intento}, logro jefe ${gano.logro}, victorias ${gano.jefes}, logro de fin ${logroFin}, pantalla: ${txt.slice(0, 28).replace(/\s+/g, ' ')}`];
  });
}


/* ── v26: las transformaciones del jefe, en las situaciones incómodas ── */
for (const [etiqueta, dif, agr, min] of [['práctica', 0, 0.75, 2], ['pesadilla', 2, 1.35, 1]]) {
  await caso(`jefe · evoluciona también en dificultad ${etiqueta} (día 10)`, null, async pg => {
    const { reg, intento } = await luchaRobot(pg, { d: 9, agr, dif });
    const mal = analizaEvolucion(reg, 320, 180, { min, max: 2, poses: false });
    return [mal.length === 0, mal.length ? mal.join(' · ') : `intento ${intento}, ${reg.dibujos.filter(x => x.k === 'atlas').length} cuadros dibujados`];
  });
}

await caso('jefe · pausar y continuar a mitad de la transformación (escritorio): se detiene y termina completa', null, async pg => {
  await pg.setViewportSize({ width: 1280, height: 800 }); await pausa(200);
  await pg.evaluate(robotJefe, 9);
  await pg.waitForFunction(hayAtlas, null, { timeout: 150000 });
  await pausa(250);                                          // ~un cuarto de la transformación
  await pg.click('#b-pause'); await pausa(150);
  const base = await pg.evaluate(() => window.__reg.dibujos.length);
  await pausa(900);
  const parado = await pg.evaluate(() => window.__reg.dibujos.length);
  await pg.click('#p-cont');
  await pg.waitForFunction(poseVista, 2, { timeout: 8000 });
  const reg = await pg.evaluate(() => window.__reg);
  /* solo la fila 0: la pelea sigue y puede que ya vaya por la 1 */
  const fila0 = { ...reg, dibujos: reg.dibujos.slice(0, reg.dibujos.findIndex(x => x.k === 'atlas' && x.fila === 1) < 0 ? undefined : reg.dibujos.findIndex(x => x.k === 'atlas' && x.fila === 1)) };
  const mal = analizaEvolucion(fila0, 320, 180, { min: 1, max: 1, poses: false });
  return [base === parado && mal.length === 0, `dibujos en pausa: ${base} → ${parado}` + (mal.length ? ' · ' + mal.join(' · ') : '')];
});

await caso('jefe · salir en plena transformación y volver a entrar empieza limpio, sin repetirla', null, async pg => {
  await pg.evaluate(robotJefe, 9);
  await pg.waitForFunction(hayAtlas, null, { timeout: 150000 });
  await pausa(200);
  await pg.evaluate(() => rMapa()); await pausa(300);
  const salio = await pg.evaluate(() => pantallaId);
  await pg.evaluate(() => { window.__reg.dibujos.length = 0; diaAct = 9; vidas = 3; nvJefe(9, 0); });
  await pausa(1800);
  const r = await pg.evaluate(() => ({ pantalla: pantallaId, fase: $('#j-fase')?.textContent, golpes: $('#j-gol')?.textContent, hp: $('#j-hp')?.textContent,
    atlas: window.__reg.dibujos.filter(x => x.k === 'atlas').length, poses: [...new Set(window.__reg.dibujos.filter(x => x.k === 'pose').map(x => x.pose))].join('') }));
  return [salio === 'pasillo' && r.pantalla === 'nivel' && r.fase === '1' && r.golpes === '3' && r.atlas === 0 && r.poses === '1', JSON.stringify({ salio, ...r })];
});

await caso('jefe · con "reducir movimiento" el cambio de fase es instantáneo (sin transformación animada)', null, async pg => {
  await pg.emulateMedia({ reducedMotion: 'reduce' });
  /* se espera a VER la pose 3 (tras un golpe el jefe parpadea y no se dibuja en todos los fotogramas) */
  const { reg } = await luchaRobot(pg, 9, { hasta: () => window.__reg.dibujos.some(x => x.pose === 3) || pantallaId !== 'nivel',
    bueno: r => new Set(r.dibujos.filter(x => x.k === 'pose').map(x => x.pose)).size === 3 });
  const poses = [...new Set(reg.dibujos.filter(x => x.k === 'pose').map(x => x.pose))].sort().join('');
  const atlas = reg.dibujos.filter(x => x.k === 'atlas').length;
  /* el indicador va siempre a la par de la pose que se ve */
  const desfase = reg.dibujos.filter(x => x.k === 'pose' && x.fase !== String(x.pose)).length;
  return [poses === '123' && atlas === 0 && reg.emoji === 0 && desfase === 0, `poses ${poses}, cuadros de transformación ${atlas}, emojis ${reg.emoji}, desfase ${desfase}`];
});

await caso('jefe · si los PNG no cargan, el combate sigue y evoluciona con el dibujo de respaldo (el de código de la v25)', null, async pg => {
  await pg.route('**/img/jefe/**', r => r.abort());
  const { reg } = await luchaRobot(pg, 9, { hasta: () => $('#j-fase')?.textContent === '2' || pantallaId !== 'nivel', bueno: r => r.respaldo > 0 });
  const fase = await pg.evaluate(() => $('#j-fase')?.textContent || 'fuera');
  return [reg.respaldo > 20 && reg.emoji === 0 && reg.dibujos.length === 0 && (fase === '2' || fase === 'fuera'), `dibujos de respaldo ${reg.respaldo}, emojis ${reg.emoji}, PNG ${reg.dibujos.length}, indicador ${fase}`];
});

await caso('jefe · sin conexión: el service worker guarda los dibujos y se sirven de su caché', null, async pg => {
  const { createServer } = await import('node:http');
  const { readFile } = await import('node:fs/promises');
  const tipos = { html: 'text/html', js: 'text/javascript', css: 'text/css', webmanifest: 'application/manifest+json', svg: 'image/svg+xml', png: 'image/png', webp: 'image/webp', woff2: 'font/woff2' };
  const mini = createServer(async (q, r) => {
    try {
      let ruta = decodeURIComponent(new URL(q.url, 'http://x').pathname);
      if (ruta.endsWith('/')) ruta += 'index.html';
      const cuerpo = await readFile(join(RAIZ, ruta));
      r.writeHead(200, { 'content-type': tipos[ruta.split('.').pop()] || 'application/octet-stream', 'cache-control': 'no-store' });
      r.end(cuerpo);
    } catch (e) { r.writeHead(404); r.end(); }
  });
  await new Promise(ok => mini.listen(0, '127.0.0.1', ok));
  try {
    await pg.goto(`http://127.0.0.1:${mini.address().port}/index.html`, { waitUntil: 'load' });
    await pg.waitForFunction(() => typeof pantallaId !== 'undefined');
    await pg.evaluate(() => registrarSW());
    await pg.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 8000 });
    await pausa(1500);
    const rutas = ['img/jefe/jefe-fase-1.png', 'img/jefe/jefe-fase-2.png', 'img/jefe/jefe-fase-3.png', 'img/jefe/jefe-transformaciones-atlas.png', 'js/jefe-sprites.js'];
    const guardadas = await pg.evaluate(async rs => Promise.all(rs.map(async u => !!(await caches.match(u)))), rutas);
    await pg.context().setOffline(true);
    const sinRed = await pg.evaluate(async () => {
      const r = await fetch('img/jefe/jefe-transformaciones-atlas.png', { cache: 'reload' });
      return { ok: r.ok, bytes: (await r.blob()).size };
    });
    await pg.context().setOffline(false);
    return [guardadas.every(Boolean) && sinRed.ok && sinRed.bytes > 100000, `en la caché: ${guardadas}, atlas sin red: ${JSON.stringify(sinRed)}`];
  } finally { mini.close(); }
});

await caso('jefe · la arena del día 15 es más grande y la del día 10 no cambia', null, async pg => {
  await prep(pg);
  const r = await pg.evaluate(() => { const o = {};
    for (const d of [9, 14]) { diaAct = d; vidas = 3; nvJefe(d, 0); const c = $('#j-cv'); o[d] = [c.width / (densidad() * (S.hd ? 1.5 : 1)), c.height / (densidad() * (S.hd ? 1.5 : 1))].map(Math.round).join('x'); }
    return o; });
  return [r[9] === '320x180' && r[14] === '400x270', JSON.stringify(r)];
});

/* ── MODO REPASO ── */
await caso('repaso · solo salen preguntas débiles y acertarlas vacía la lista', { intro: true, nombre: 'R', version: 'v0', dif: 1,
  vistos: ['quiz'], pesos: { 'quiz:1': 2, 'quiz:4': 1, 'quiz:7': 1, 'quiz:9': 3, 'quiz:12': 1, 'quiz:15': 2, 'quiz:18': 1 } }, async pg => {
  await pg.evaluate(() => { if (pantallaId === 'novedades') $('#nv-ok').click(); rRepaso(); }); await pausa(200);
  const lista = await pg.evaluate(() => [...document.querySelectorAll('.rp-fila')].map(b => b.dataset.tipo));
  if (!lista.includes('quiz')) return [false, 'el tema quiz no sale en el repaso: ' + lista];
  await pg.locator('.rp-fila[data-tipo="quiz"]').click(); await pausa(400);
  const debiles = [1, 4, 7, 9, 12, 15, 18];
  const vistas = [];
  for (let v = 0; v < 8; v++) {
    if (await pg.evaluate(() => pantallaId) !== 'nivel') break;
    const r = await pg.evaluate(() => {
      const i = QUIZ[S.lang].findIndex(x => x.q === $('#q-preg').textContent);
      const q = QUIZ[S.lang][i]; document.querySelectorAll('#q-ops .op')[q.r].click(); return i; });
    vistas.push(r); await pausa(1000);
  }
  const fin = await pg.evaluate(() => ({ p: pantallaId, suelto: !libreActivo, quedan: Object.keys(S.pesos).filter(k => k.startsWith('quiz:')).length }));
  const todasDebiles = vistas.length >= 4 && vistas.every(i => debiles.includes(i));
  return [todasDebiles && fin.p === 'libre-fin' && fin.quedan < 7, `preguntas ${vistas}, débiles que quedan ${fin.quedan}, pantalla ${fin.p}`];
});

await caso('repaso · salir del modo suelta el sorteo especial', { intro: true, nombre: 'R', version: 'v0', vistos: ['quiz'], pesos: { 'quiz:1': 2 } }, async pg => {
  await pg.evaluate(() => { empezarRepaso('quiz'); }); await pausa(300);
  await pg.evaluate(() => { salirDeModos(); rMapa(); }); await pausa(100);
  const visto = await pg.evaluate(() => { const s = new Set(); for (let k = 0; k < 120; k++) RETO.elegir('quiz', 30, 6).forEach(i => s.add(i)); return s.size; });
  return [visto > 15, `ítems distintos tras salir: ${visto}`];
});

await caso('repaso · sin nada pendiente dice que vas al día', { intro: true, nombre: 'R', version: 'v0' }, async pg => {
  await pg.evaluate(() => { if (pantallaId === 'novedades') $('#nv-ok').click(); rRepaso(); }); await pausa(150);
  const t = await pg.evaluate(() => $('#screen').innerText);
  return [/al día|caught up|Nada pendiente|Nothing left/i.test(t) && !(await pg.locator('.rp-fila').count()), t.slice(0, 50).replace(/\s+/g, ' ')];
});

await caso('panel del instructor · lista lo más fallado, sin nombres, y no revienta con índices que no existen', { intro: true, nombre: 'R', version: 'v0' }, async pg => {
  await pg.evaluate(() => { if (pantallaId === 'novedades') $('#nv-ok').click(); });
  const r = await pg.evaluate(() => {
    const caja = document.createElement('div'); document.body.appendChild(caja);
    pintarPanel(caja, { temas: [
      { tema: 'quiz', item: 0, intentos: 6, fallos: 5 }, { tema: 'git', item: 1, intentos: 4, fallos: 1 },
      { tema: 'sql', item: 99999, intentos: 3, fallos: 3 }, { tema: 'regex', item: 0, intentos: 5, fallos: 0 }] });
    return { filas: caja.querySelectorAll('.panel-fila').length, txt: caja.innerText };
  });
  return [r.filas === 3 && /5 de 6/.test(r.txt) && /sql #99999/.test(r.txt), `filas ${r.filas}`];
});

await caso('sala en vivo · crear: el modo EN VIVO esconde los minijuegos y guarda n y segundos', { intro: true, nombre: 'R', version: 'v0' }, async pg => {
  await pg.evaluate(() => { if (pantallaId === 'novedades') $('#nv-ok').click(); });
  await pg.evaluate(() => {
    window.__cfg = null;
    SALA.crear = async () => ({ ok: true, datos: { codigo: 'K7M2Q', token: 'x' } });
    SALA.fijarVivo = (c, cfg) => { window.__cfg = [c, cfg]; };
    SALA.vigilar = () => {}; rSalaCrear();
  });
  await pausa(100);
  await pg.click('#sc-modo [data-vivo="1"]');
  const oculto = await pg.$eval('#sc-ritmo', e => e.hidden);
  await pg.click('#sc-vn [data-n="10"]'); await pg.click('#sc-vl [data-l="30"]'); await pg.click('#sc-crear'); await pausa(200);
  const cfg = await pg.evaluate(() => window.__cfg);
  return [oculto && cfg && cfg[0] === 'K7M2Q' && cfg[1].n === 10 && cfg[1].limite === 30, JSON.stringify(cfg)];
});

/* El cartel «Hay una versión nueva» salía en la PRIMERA visita: el sw.js nuevo
   llama a skipWaiting() y clients.claim(), así que al activarse ya era el
   controlador de la página y la condición «ya había uno mandando» se cumplía.
   Aquí se registra a mano (en local el protocolo no es https, y el registro
   automático lo exige). Para simular una publicación hace falta que sw.js
   cambie de bytes entre dos comprobaciones, y Playwright no intercepta la
   descarga del service worker: por eso este caso levanta su propio servidor
   mínimo, que añade un comentario distinto al sw.js cada vez que se cambia
   `publicacion`. */
await caso('versión nueva · el cartel NO sale en la primera visita y SÍ al publicar otra versión', { intro: true, nombre: 'R', version: 'v0' }, async pg => {
  const { createServer } = await import('node:http');
  const { readFile } = await import('node:fs/promises');
  const tipos = { html: 'text/html', js: 'text/javascript', css: 'text/css', webmanifest: 'application/manifest+json', svg: 'image/svg+xml', png: 'image/png', webp: 'image/webp', woff2: 'font/woff2' };
  let publicacion = 0;
  const mini = createServer(async (q, r) => {
    try {
      let ruta = decodeURIComponent(new URL(q.url, 'http://x').pathname);
      if (ruta.endsWith('/')) ruta += 'index.html';
      let cuerpo = await readFile(join(RAIZ, ruta));
      if (ruta === '/sw.js') cuerpo = Buffer.concat([cuerpo, Buffer.from(`\n// publicación ${publicacion}\n`)]);
      r.writeHead(200, { 'content-type': tipos[ruta.split('.').pop()] || 'application/octet-stream', 'cache-control': 'no-store' });
      r.end(cuerpo);
    } catch (e) { r.writeHead(404); r.end(); }
  });
  await new Promise(ok => mini.listen(0, '127.0.0.1', ok));
  try {
    await pg.goto(`http://127.0.0.1:${mini.address().port}/index.html`, { waitUntil: 'load' });
    await pg.waitForFunction(() => typeof pantallaId !== 'undefined');
    await pg.evaluate(() => registrarSW());
    await pg.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 8000 });
    await pausa(800);
    const foto = () => pg.evaluate(() => ({ lista: versionNuevaLista, visible: !$('#aviso-ver').hidden }));
    const primera = await foto();
    publicacion = 1;
    await pg.evaluate(async () => { await (await navigator.serviceWorker.getRegistration()).update(); });
    await pg.waitForFunction(() => versionNuevaLista, null, { timeout: 8000 }).catch(() => {});
    const segunda = await foto();
    return [!primera.lista && !primera.visible && segunda.lista && segunda.visible, `primera=${JSON.stringify(primera)} segunda=${JSON.stringify(segunda)}`];
  } finally { mini.close(); }
});

/* ── EL PASILLO (v22) ──
   El mapa de la campaña pasó a ser un pasillo de puertas. Lo que no puede
   romperse: que solo ELIJA el día (nada de progreso propio), que una puerta
   cerrada no deje entrar, y que la lista de siempre siga ahí. */
const MEDIO = { intro: true, nombre: 'R', pts: 50, xp: 6065, version: 'v22', dias: [3, 3, 2, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };

await caso('pasillo · 15 puertas en 3 zonas, con el estado que dice el progreso', MEDIO, async pg => {
  await prep(pg, { t2: false });
  const r = await pg.evaluate(() => {
    const z = [];
    for (let n = 0; n < 3; n++) { rPasillo(n); z.push($$('.pasillo-puerta').map(b => b.dataset.dia + ':' + ['superada', 'disponible', 'bloqueada'].find(c => b.classList.contains(c))).join(' ')); }
    rMapa();
    return { z, pantalla: pantallaId, zonaAuto: $('.pasillo-bloque.actual').dataset.zona };
  });
  const ok = r.z[0] === '0:superada 1:superada 2:superada 3:superada 4:superada'
    && r.z[1] === '5:disponible 6:bloqueada 7:bloqueada 8:bloqueada 9:bloqueada'
    && r.z[2] === '10:bloqueada 11:bloqueada 12:bloqueada 13:bloqueada 14:bloqueada'
    && r.pantalla === 'pasillo' && r.zonaAuto === '1';
  return [ok, JSON.stringify(r)];
});

await caso('pasillo · tocar la puerta, caminar y entrar lleva al diálogo de ESE día', MEDIO, async pg => {
  /* en la zona 1 no está el día que toca: no hay nada elegido y hay que caminar */
  await prep(pg); await pg.evaluate(() => rPasillo(0)); await pausa(200);
  const alAbrir = await pg.evaluate(() => $$('.pasillo-puerta.seleccionada').length);
  await pg.click('.pasillo-puerta[data-dia="3"]');
  const andando = await pg.$eval('#pasillo-entrar', b => b.disabled);
  await pg.waitForFunction(() => !$('#pasillo-entrar').disabled, null, { timeout: 4000 });
  /* el aprendiz quedó delante de la puerta, no a un lado */
  const desvio = await pg.evaluate(() => {
    const a = $('#pasillo-actor').getBoundingClientRect(), d = $('.pasillo-puerta.seleccionada .pasillo-marco').getBoundingClientRect();
    return Math.abs((a.left + a.width / 2) - (d.left + d.width / 2));
  });
  await pg.click('#pasillo-entrar'); await pausa(700);
  const r = await pg.evaluate(() => ({ pantalla: pantallaId, dia: diaAct }));
  return [alAbrir === 0 && andando && desvio < 4 && r.pantalla === 'dialogo' && r.dia === 3, JSON.stringify({ alAbrir, andando, desvio: Math.round(desvio), ...r })];
});

/* v22.2: seguir la campaña vuelve a ser UN toque, como en la lista. */
await caso('pasillo · al abrir, el aprendiz ya espera en la puerta del día que toca y un toque entra', MEDIO, async pg => {
  await prep(pg); await pg.evaluate(() => rMapa()); await pausa(300);
  const r = await pg.evaluate(() => {
    const a = $('#pasillo-actor').getBoundingClientRect(), s = $('.pasillo-puerta.seleccionada'), d = s && s.querySelector('.pasillo-marco').getBoundingClientRect();
    const b = $('#pasillo-entrar'), sc = $('#screen');
    return { sel: s && s.dataset.dia, desvio: d ? Math.round(Math.abs((a.left + a.width / 2) - (d.left + d.width / 2))) : -1,
      listo: !!b && !b.disabled, sinMoverLaPantalla: sc.scrollTop === 0, pulsada: s && s.getAttribute('aria-pressed') };
  });
  await pg.click('#pasillo-entrar'); await pausa(700);
  const fin = await pg.evaluate(() => ({ pantalla: pantallaId, dia: diaAct }));
  const ok = r.sel === '5' && r.desvio < 4 && r.listo && r.sinMoverLaPantalla && r.pulsada === 'true' && fin.pantalla === 'dialogo' && fin.dia === 5;
  return [ok, JSON.stringify({ ...r, ...fin })];
});

await caso('pasillo · tocar otra vez la puerta en la que ya estás entra; mientras camina, no', MEDIO, async pg => {
  await prep(pg); await pg.evaluate(() => rPasillo(0)); await pausa(200);
  /* dos toques seguidos: el segundo llega caminando y NO debe entrar */
  const r = await pg.evaluate(async () => {
    const b = $('.pasillo-puerta[data-dia="1"]'); b.click(); b.click();
    await new Promise(r => setTimeout(r, 500));
    return pantallaId;
  });
  await pg.waitForFunction(() => !$('#pasillo-entrar').disabled, null, { timeout: 4000 });
  const abierta0 = await pg.evaluate(() => $$('.pasillo-puerta.abriendo').length);
  /* ya parado delante: ahora sí */
  await pg.click('.pasillo-puerta[data-dia="1"]');
  const abierta1 = await pg.evaluate(() => $('.pasillo-puerta[data-dia="1"]').classList.contains('abriendo'));
  await pausa(700);
  const fin = await pg.evaluate(() => ({ pantalla: pantallaId, dia: diaAct }));
  return [r === 'pasillo' && abierta0 === 0 && abierta1 && fin.pantalla === 'dialogo' && fin.dia === 1, JSON.stringify({ caminando: r, abierta0, abierta1, ...fin })];
});

await caso('pasillo · una puerta cerrada no entra ni tocándola dos veces, y la campaña terminada no elige nada', MEDIO, async pg => {
  await prep(pg); await pg.evaluate(() => rMapa()); await pausa(200);
  await pg.click('.pasillo-puerta[data-dia="7"]'); await pausa(150);
  await pg.click('.pasillo-puerta[data-dia="7"]'); await pausa(600);
  const cerrada = await pg.evaluate(() => ({ pantalla: pantallaId, abriendo: $$('.pasillo-puerta.abriendo').length }));
  const fin = await pg.evaluate(() => { S.dias = Array(15).fill(3); rMapa(); return { sel: $$('.pasillo-puerta.seleccionada').length, ayuda: !!$('.pasillo-ficha-ayuda'), zona: $('.pasillo-bloque.actual').dataset.zona }; });
  return [cerrada.pantalla === 'pasillo' && cerrada.abriendo === 0 && fin.sel === 0 && fin.ayuda && fin.zona === '2', JSON.stringify({ cerrada, fin })];
});

await caso('pasillo · cada letrero lleva el icono de su minijuego y cabe en su puerta (celular de 320 px)', MEDIO, async pg => {
  await pg.setViewportSize({ width: 320, height: 568 }); await pausa(200);
  await prep(pg);
  const r = await pg.evaluate(() => {
    const mal = [];
    for (const n of [0, 1, 2]) {
      rPasillo(n);
      for (const b of $$('.pasillo-puerta')) {
        const i = +b.dataset.dia, ico = b.querySelector('.pasillo-ico'), c = b.querySelector('.pasillo-cartel').getBoundingClientRect(), p = b.getBoundingClientRect();
        const im = ico && ico.querySelector('img.pxi');   // el icono es un dibujo pixel (js/iconos.js)
        if (!im || im.getAttribute('src') !== pxiSvg(NIVELES[i].ico)) mal.push('icono día ' + (i + 1));
        if (c.width > p.width + 1) mal.push('letrero ancho día ' + (i + 1));
        if (!b.querySelector('.pasillo-cartel').textContent.includes(String(i + 1))) mal.push('número día ' + (i + 1));
      }
    }
    return mal;
  });
  return [r.length === 0, r.length ? r.join(', ') : '15 letreros con icono y número'];
});

await caso('pasillo · una puerta cerrada enseña su ficha pero no deja entrar', MEDIO, async pg => {
  await prep(pg); await pg.evaluate(() => rMapa()); await pausa(200);
  await pg.click('.pasillo-puerta[data-dia="8"]'); await pausa(300);
  const r = await pg.evaluate(() => {
    const b = $('#pasillo-entrar'), dis = b.disabled;
    /* a la fuerza: ni quitándole el disabled entra */
    b.disabled = false; b.click();
    return { dis, ficha: $('#pasillo-ficha').innerText.includes('9'), pantalla: pantallaId };
  });
  await pausa(600);
  const despues = await pg.evaluate(() => pantallaId);
  return [r.dis && r.ficha && despues === 'pasillo', JSON.stringify({ ...r, despues })];
});

await caso('pasillo · pasear por él no cambia la partida guardada', MEDIO, async pg => {
  await prep(pg);
  const r = await pg.evaluate(async () => {
    /* una primera vez para que el Repaso normalice un guardado viejo sin `pesos` (js/reto.js crea el objeto vacío) */
    rMapa();
    const antes = localStorage.getItem('pa3'), mem = JSON.stringify(S);
    for (const n of [0, 1, 2]) { rPasillo(n); $$('.pasillo-puerta').forEach(b => b.click()); }
    $('#pasillo-lista').click(); $('#m-pasillo').click();
    await new Promise(r => setTimeout(r, 400));
    return { igualDisco: localStorage.getItem('pa3') === antes, igualMem: JSON.stringify(S) === mem, pantalla: pantallaId };
  });
  return [r.igualDisco && r.igualMem && r.pantalla === 'pasillo', JSON.stringify(r)];
});

await caso('pasillo · teclado: ← → eligen puerta y Enter entra', MEDIO, async pg => {
  await prep(pg); await pg.evaluate(() => rPasillo(0)); await pausa(200);
  /* la primera flecha elige el día que toca en esta zona (el 5), no el de al lado */
  await pg.keyboard.press('ArrowRight'); await pausa(100);
  const primera = await pg.evaluate(() => $('.pasillo-puerta.seleccionada').dataset.dia);
  await pg.keyboard.press('ArrowLeft'); await pg.keyboard.press('ArrowLeft'); await pausa(100);
  const r = await pg.evaluate(() => ({ sel: $('.pasillo-puerta.seleccionada').dataset.dia, foco: document.activeElement.dataset.dia }));
  await pg.waitForFunction(() => !$('#pasillo-entrar').disabled, null, { timeout: 4000 });
  await pg.keyboard.press('Enter'); await pausa(700);
  const fin = await pg.evaluate(() => ({ pantalla: pantallaId, dia: diaAct }));
  return [primera === '4' && r.sel === '2' && r.foco === '2' && fin.pantalla === 'dialogo' && fin.dia === 2, JSON.stringify({ primera, ...r, ...fin })];
});

await caso('pasillo · con "reducir movimiento" llega a la puerta sin caminar', MEDIO, async pg => {
  await pg.emulateMedia({ reducedMotion: 'reduce' });
  await prep(pg); await pg.evaluate(() => rPasillo(0)); await pausa(200);
  const r = await pg.evaluate(() => { $('.pasillo-puerta[data-dia="0"]').click(); return $('#pasillo-entrar').disabled; });
  return [r === false, r ? 'el botón seguía esperando a la caminata' : 'entra enseguida'];
});

await caso('pasillo · la lista de días sigue ahí, con el jefe, y cambiar de idioma no cambia de zona', { ...MEDIO, t2: true, dias: Array(15).fill(2) }, async pg => {
  await prep(pg); await pg.evaluate(() => rPasillo(1)); await pausa(150);
  await pg.click('#b-lang'); await pausa(200);
  const en = await pg.evaluate(() => ({ zona: $('.pasillo-bloque.actual').dataset.zona, cartel: $('.pasillo-cartel').textContent, jefe: !!$('#pasillo-jefe') }));
  await pg.click('#b-lang'); await pausa(150);
  await pg.click('#pasillo-lista'); await pausa(200);
  const lista = await pg.evaluate(() => ({ pantalla: pantallaId, cartas: $$('.etapa-card[data-i]').length, jefe: !!$('#m-jefe') }));
  await pg.click('.etapa-card[data-i="13"]'); await pausa(300);
  const fin = await pg.evaluate(() => ({ pantalla: pantallaId, dia: diaAct }));
  const ok = en.zona === '1' && en.cartel.includes('DAY') && en.jefe && lista.pantalla === 'mapa' && lista.cartas === 15 && lista.jefe && fin.pantalla === 'dialogo' && fin.dia === 13;
  return [ok, JSON.stringify({ en, lista, fin })];
});

await caso('pasillo · el día 11 abre primero la escena de la empresa, como en la lista', { ...MEDIO, dias: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0] }, async pg => {
  await prep(pg, { t2: false }); await pg.evaluate(() => rMapa()); await pausa(200);
  const zona = await pg.evaluate(() => $('.pasillo-bloque.actual').dataset.zona);
  await pg.click('.pasillo-puerta[data-dia="10"]');
  await pg.waitForFunction(() => !$('#pasillo-entrar').disabled, null, { timeout: 4000 });
  await pg.click('#pasillo-entrar'); await pausa(700);
  const p = await pg.evaluate(() => pantallaId);
  return [zona === '2' && p === 'cut', `zona ${zona}, pantalla ${p}`];
});

await caso('pasillo · en un celular de 320 px nada se sale: el botón de entrar queda dentro de su ficha', MEDIO, async pg => {
  await pg.setViewportSize({ width: 320, height: 568 }); await pausa(200);
  await prep(pg); await pg.evaluate(() => rPasillo(0)); await pausa(200);
  await pg.click('.pasillo-puerta[data-dia="2"]');
  await pg.waitForFunction(() => !$('#pasillo-entrar').disabled, null, { timeout: 4000 });
  const r = await pg.evaluate(() => {
    const c = s => $(s).getBoundingClientRect();
    const f = c('#pasillo-ficha'), b = c('#pasillo-entrar'), n = c('.pasillo-navega'), sc = c('#screen');
    return { dentro: b.bottom <= f.bottom + 1, sinPisar: f.bottom <= n.top + 1, visible: b.bottom <= sc.bottom + 1, ancho: $('#screen').scrollWidth <= $('#screen').clientWidth };
  });
  return [r.dentro && r.sinPisar && r.visible && r.ancho, JSON.stringify(r)];
});

/* ── EFECTOS DE PIXEL ART · pixelfx (v23) ──
   js/pxefectos.js pone tres efectos en el juego. Lo que no puede romperse: que
   cada uno salga en su momento y no en otro, que se vea de verdad (pixeles en
   el lienzo, no solo "un efecto vivo"), que "reducir movimiento" no suelte
   nada y que ninguno toque la partida. */
const pixelesPintados = (pg, caja) => pg.evaluate(c => {
  const cv = document.getElementById('px-fx');
  if (!cv) return -1;
  const k = cv.width / innerWidth, d = cv.getContext('2d').getImageData(Math.max(0, Math.floor(c.x * k)), Math.max(0, Math.floor(c.y * k)), Math.max(1, Math.floor(c.w * k)), Math.max(1, Math.floor(c.h * k))).data;
  let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 40) n++;
  return n;
}, caja);

await caso('pixelfx · perder una vida rompe el corazón sobre la cabecera, y solo resta UNA vida', MEDIO, async pg => {
  await prep(pg); await pg.evaluate(() => { diaAct = 5; vidas = 3; jugarNivel(5); }); await pausa(300);
  const r = await pg.evaluate(() => {
    const h = $('#h-vidas').getBoundingClientRect();
    fallo(5);
    return { vivos: PX._vivas(), vidas, pantalla: pantallaId, h: { x: h.left, y: h.top, w: h.width, h: h.height } };
  });
  await pausa(450);
  /* el corazón cae dentro de la zona de la cabecera: pixeles pintados ahí */
  const n = await pixelesPintados(pg, { x: r.h.x - 20, y: r.h.y - 30, w: r.h.w + 40, h: r.h.h + 70 });
  return [r.vivos === 1 && r.vidas === 2 && r.pantalla === 'fallo' && n > 40, JSON.stringify({ ...r, pixeles: n })];
});

await caso('pixelfx · «NUEVO RANGO!» solo sale al CRUZAR un rango, no en cualquier resultado', MEDIO, async pg => {
  await prep(pg);
  const sin = await pg.evaluate(async () => {
    /* 6065 XP + 100: sigue en PRACTICANTE, no hay rango nuevo */
    S.xp = 6065; PX._vaciar(); resultado(2, 2, 100);
    await new Promise(r => setTimeout(r, 1000));
    return PX._vivas();
  });
  const con = await pg.evaluate(async () => {
    /* 10.950 XP + 400 cruza los 11.000 de DEV JUNIOR */
    S.xp = 10950; PX._vaciar(); resultado(2, 2, 400);
    await new Promise(r => setTimeout(r, 1000));
    return { vivos: PX._vivas(), rango: rangoNom() };
  });
  await pausa(300);
  const n = await pixelesPintados(pg, { x: 0, y: 60, w: 400, h: 400 });
  return [sin === 0 && con.vivos === 1 && con.rango === 'DEV JUNIOR' && n > 100, JSON.stringify({ sinCruzar: sin, ...con, pixeles: n })];
});

await caso('pixelfx · «xN RACHA» sale del runner y se ve dentro de su pantalla', MEDIO, async pg => {
  await prep(pg); await pg.evaluate(() => { diaAct = 7; vidas = 3; nvRunner(7); }); await pausa(900);
  const r = await pg.evaluate(() => {
    const c = $('#r-cv').getBoundingClientRect();
    return { ok: PX.racha(5, t('combo'), $('#r-cv')), c: { x: c.left, y: c.top, w: c.width, h: c.height } };
  });
  await pausa(500);
  const n = await pixelesPintados(pg, r.c);
  return [r.ok === true && n > 150, JSON.stringify({ lanzado: r.ok, pixeles: n })];
});

await caso('pixelfx · con "reducir movimiento" no suelta ni crea nada', MEDIO, async pg => {
  await pg.emulateMedia({ reducedMotion: 'reduce' });
  await prep(pg); await pg.evaluate(() => { diaAct = 5; vidas = 3; jugarNivel(5); }); await pausa(300);
  const r = await pg.evaluate(async () => {
    fallo(5);
    const a = [PX.corazon(2), PX.nivel('X', null), PX.racha(3, 'RACHA', document.body)];
    resultado(2, 3, 5000);
    await new Promise(r => setTimeout(r, 2200));
    return { a, lienzo: !!document.getElementById('px-fx'), vidas };
  });
  return [r.a.every(x => x === false) && !r.lienzo && r.vidas === 2, JSON.stringify(r)];
});

await caso('pixelfx · los efectos no tocan la partida guardada y se apagan solos', MEDIO, async pg => {
  await prep(pg);
  const r = await pg.evaluate(async () => {
    const antes = JSON.stringify(S);
    PX.corazon(3); PX.racha(5, 'RACHA', document.body);
    await new Promise(r => setTimeout(r, 3000));
    return { igual: JSON.stringify(S) === antes, vivos: PX._vivas() };
  });
  return [r.igual && r.vivos === 0, JSON.stringify(r)];
});

/* ── LOS PERSONAJES DEL PASILLO (v24) ──
   Tocas a uno, el aprendiz camina hasta él y te aconseja. Lo que no puede
   romperse: que cada zona tenga a los suyos, que el consejo sea el que toca
   (tema flojo, puerta, general), que tocar a un personaje no cambie la partida
   ni deje entrar a un día, y que las puertas sigan funcionando igual. */

await caso('personajes · cada zona trae a los suyos, pintados, y el "!" lo tiene quien habla el día que toca', MEDIO, async pg => {
  await prep(pg);
  const r = await pg.evaluate(() => {
    const z = [];
    for (let n = 0; n < 3; n++) {
      rPasillo(n);
      z.push($$('.pasillo-gente').map(g => {
        const d = g.querySelector('canvas').getContext('2d').getImageData(0, 0, 44, 74).data;
        let px = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) px++;
        return g.dataset.p + (px > 300 ? '' : '(vacío)') + (g.querySelector('.pasillo-aviso').hidden ? '' : '!');
      }).join(' '));
    }
    return z;
  });
  /* el día que toca es el 6 (zona 2): lo dice la compañera */
  const ok = r[0] === 'instructor vigilante companera' && r[1] === 'companera! instructor' && r[2] === 'lider companera instructor';
  return [ok, JSON.stringify(r)];
});

await caso('personajes · tocar a uno: camina hasta su lado, se ve su retrato y su consejo, y el "!" se apaga', MEDIO, async pg => {
  await prep(pg); await pg.evaluate(() => rPasillo(1)); await pausa(300);
  await pg.click('.pasillo-gente[data-p="companera"]');
  await pg.waitForFunction(() => !!document.querySelector('#pg-cara'), null, { timeout: 4000 });
  const r = await pg.evaluate(() => {
    const a = $('#pasillo-actor').getBoundingClientRect(), g = $('.pasillo-gente[data-p="companera"]').getBoundingClientRect();
    return { texto: $('#pasillo-ficha').innerText.replace(/\n+/g, ' | '), cerca: Math.abs((a.left + a.width / 2) - (g.left + g.width / 2)),
      dibujo: !!$('#pasillo-ficha img.dibujo'), aviso: !$('.pasillo-gente[data-p="companera"] .pasillo-aviso').hidden, pantalla: pantallaId };
  });
  const ok = r.texto.startsWith('VALENTINA · COMPAÑERA') && r.texto.includes('=') && r.cerca > 3 && r.cerca < 120 && r.dibujo && !r.aviso && r.pantalla === 'pasillo';
  return [ok, JSON.stringify(r)];
});

await caso('personajes · un tema flojo lo nota quien lo sabe y ofrece REPASAR ese tema', { ...MEDIO, pesos: {} }, async pg => {
  await prep(pg);
  /* fallar preguntas de SQL: el juego guarda un peso por ítem (js/reto.js) */
  const flojos = await pg.evaluate(() => { for (let i = 0; i < 6; i++) RETO.marcar('sql', i, false); return temasRepaso().filter(r => r.pendientes > 0).map(r => r.pool).join(); });
  await pg.evaluate(() => rPasillo(2)); await pausa(300);
  const aviso = await pg.evaluate(() => !$('.pasillo-gente[data-p="lider"] .pasillo-aviso').hidden);
  await pg.click('.pasillo-gente[data-p="lider"]');
  await pg.waitForFunction(() => !!document.querySelector('#pasillo-repasar'), null, { timeout: 4000 });
  const texto = await pg.$eval('#pasillo-ficha', e => e.innerText);
  await pg.click('#pasillo-repasar'); await pausa(500);
  const r = await pg.evaluate(() => ({ pantalla: pantallaId, repaso: !!(libreActivo && libreActivo.repaso), tipo: libreActivo && libreActivo.tipo }));
  return [flojos.includes('sql') && aviso && /SQL/.test(texto) && r.repaso && r.tipo === 'sql', JSON.stringify({ flojos, aviso, texto: texto.slice(0, 60), ...r })];
});

await caso('personajes · Don Jairo no habla de puertas: cuenta lo que hay en el juego y rota', MEDIO, async pg => {
  await prep(pg); await pg.evaluate(() => rPasillo(0)); await pausa(300);
  const dichos = []; let dibujo = null;
  for (let n = 0; n < 3; n++) {
    await pg.click('.pasillo-gente[data-p="vigilante"]');
    await pg.waitForFunction(() => !!document.querySelector('#pg-cara'), null, { timeout: 4000 });
    await pausa(200);
    dichos.push(await pg.$eval('.pasillo-consejo', e => e.textContent));
    /* y se ve su retrato DIBUJADO (el de Don Jairo, no el pixel de respaldo) */
    if (n === 0) dibujo = await pg.evaluate(() => { const i = $('#pasillo-ficha img.dibujo'); return i ? i.dataset.p + ' ' + i.getAttribute('src') : null; });
    await pg.evaluate(() => $('#pasillo-ficha').innerHTML = ''); /* que el siguiente toque vuelva a esperar el retrato */
  }
  const ok = new Set(dichos).size === 3 && dichos[0].includes('tienda') && dichos[1].includes('reto') && dichos[2].includes('libre')
    && dibujo === 'vigilante img/retratos/vigilante-feliz.webp';
  return [ok, JSON.stringify({ dibujo, dichos: dichos.map(x => x.slice(0, 40)) })];
});

await caso('personajes · tocar a un personaje no deja entrar a un día ni toca la partida; la puerta pide volver a ella', MEDIO, async pg => {
  await prep(pg); await pg.evaluate(() => rPasillo(1)); await pausa(300);
  const antes = await pg.evaluate(() => localStorage.getItem('pa3') + '|' + JSON.stringify(S));
  /* el aprendiz está en la puerta 6: se va a hablar con la compañera y, estando allí, tocar la puerta no entra de golpe */
  await pg.click('.pasillo-gente[data-p="instructor"]');
  await pg.waitForFunction(() => !!document.querySelector('#pg-cara'), null, { timeout: 4000 });
  await pg.click('.pasillo-puerta[data-dia="5"]'); await pausa(500);
  const lejos = await pg.evaluate(() => pantallaId);
  await pg.waitForFunction(() => { const b = $('#pasillo-entrar'); return b && !b.disabled; }, null, { timeout: 4000 });
  const despues = await pg.evaluate(() => localStorage.getItem('pa3') + '|' + JSON.stringify(S));
  await pg.click('#pasillo-entrar'); await pausa(700);
  const fin = await pg.evaluate(() => ({ pantalla: pantallaId, dia: diaAct }));
  return [lejos === 'pasillo' && antes === despues && fin.pantalla === 'dialogo' && fin.dia === 5, JSON.stringify({ lejos, igual: antes === despues, ...fin })];
});

await caso('personajes · con la puerta elegida, quien la dice da SU consejo de esa puerta (aunque no sea la que toca)', MEDIO, async pg => {
  await prep(pg); await pg.evaluate(() => rPasillo(0)); await pausa(300);
  await pg.click('.pasillo-puerta[data-dia="2"]');                          /* día 3: lo dice la compañera */
  await pg.waitForFunction(() => { const b = $('#pasillo-entrar'); return b && !b.disabled; }, null, { timeout: 4000 });
  await pg.click('.pasillo-gente[data-p="companera"]');
  await pg.waitForFunction(() => !!document.querySelector('#pg-cara'), null, { timeout: 4000 });
  const r = await pg.$eval('.pasillo-consejo', e => e.textContent);
  return [r.includes('giros') && r.includes('estrellas'), r.slice(0, 70)];
});

await caso('personajes · en inglés hablan en inglés y con su nombre; en el diálogo del día sale "NOMBRE · ROL"', { ...MEDIO, lang: 'en' }, async pg => {
  await prep(pg, { lang: 'en' }); await pg.evaluate(() => { aplicarIdioma(); rPasillo(1); }); await pausa(300);
  await pg.click('.pasillo-gente[data-p="instructor"]');
  await pg.waitForFunction(() => !!document.querySelector('#pg-cara'), null, { timeout: 4000 });
  const ficha = await pg.$eval('#pasillo-ficha', e => e.innerText.replace(/\n+/g, ' | '));
  const aria = await pg.$eval('.pasillo-gente[data-p="companera"]', e => e.getAttribute('aria-label'));
  await pg.evaluate(() => rDialogo(10)); await pausa(200);
  const hablante = await pg.$eval('.hablante', e => e.textContent);
  return [/^GUSTAVO · INSTRUCTOR \| /.test(ficha) && !/[ñáéí]/.test(ficha.slice(0, 80)) && aria.startsWith('VALENTINA · COWORKER') && hablante === 'ANDRÉS · TECH LEAD',
    JSON.stringify({ ficha: ficha.slice(0, 80), aria, hablante })];
});

await caso('personajes · con "reducir movimiento" llega al instante, sin animar el "!"', MEDIO, async pg => {
  await pg.emulateMedia({ reducedMotion: 'reduce' });
  await prep(pg); await pg.evaluate(() => rPasillo(1)); await pausa(300);
  const anim = await pg.evaluate(() => getComputedStyle($('.pasillo-aviso:not([hidden])')).animationName);
  const r = await pg.evaluate(() => { $('.pasillo-gente[data-p="instructor"]').click(); return !!$('#pg-cara'); });
  return [anim === 'none' && r === true, `animación ${anim}, consejo al instante: ${r}`];
});

await caso('personajes · teclado: se llega a ellos con Tab y Enter les habla (no entra a una puerta)', MEDIO, async pg => {
  await prep(pg); await pg.evaluate(() => rPasillo(1)); await pausa(300);
  await pg.focus('.pasillo-gente[data-p="instructor"]');
  await pg.keyboard.press('Enter'); await pausa(300);
  await pg.waitForFunction(() => !!document.querySelector('#pg-cara'), null, { timeout: 4000 });
  const r = await pg.evaluate(() => ({ pantalla: pantallaId, habla: !!$('#pg-cara'), foco: document.activeElement.dataset.p }));
  return [r.pantalla === 'pasillo' && r.habla && r.foco === 'instructor', JSON.stringify(r)];
});

await caso('personajes · en un celular de 320 px caben, no tapan el texto y el retrato queda junto al consejo', MEDIO, async pg => {
  await pg.setViewportSize({ width: 320, height: 568 }); await pausa(200);
  await prep(pg); await pg.evaluate(() => rPasillo(0)); await pausa(300);
  await pg.click('.pasillo-gente[data-p="vigilante"]');
  await pg.waitForFunction(() => !!document.querySelector('#pg-cara'), null, { timeout: 4000 });
  await pausa(200);
  const r = await pg.evaluate(() => {
    const c = s => $(s).getBoundingClientRect();
    const e = c('#pasillo-escena'), f = c('#pasillo-ficha'), n = c('.pasillo-navega'), ret = c('.pasillo-retrato'), txt = c('.pasillo-consejo');
    const fuera = $$('.pasillo-gente').filter(g => { const b = g.getBoundingClientRect(); return b.left < e.left - 1 || b.right > e.right + 1; }).length;
    const a = c('#pasillo-actor'), g = c('.pasillo-gente');
    return { fuera, mismoTamano: Math.abs(a.height - g.height) < 1, retratoAlLado: txt.left >= ret.right - 2, sinPisar: f.bottom <= n.top + 1, ancho: $('#screen').scrollWidth <= $('#screen').clientWidth };
  });
  return [r.fuera === 0 && r.mismoTamano && r.retratoAlLado && r.sinPisar && r.ancho, JSON.stringify(r)];
});

/* ── EL FONDO DE LA PORTADA: EL CAMPUS NOCTURNO HD (v36) ──
   Seis capas (escenario, dos de estrellas, dos de nubes y la luz de las ventanas) y un velo,
   solo en el menú principal; las montañas de siempre en el resto y si el escenario falla.
   Sustituye a la ciudad de la v27. Lo que no puede romperse: que no corran dos fondos a la
   vez, que cubra sin deformarse, que respete "reducir movimiento" y la pestaña oculta, que el
   texto siga leyéndose y que funcione sin conexión. */
const FONDO = { intro: true, nombre: 'R', pts: 900, xp: 1700, version: 'v36', dias: [3, 2, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
/* cuántas animaciones de CSS hay en marcha en las capas del fondo */
const animFondo = () => ({
  campus: document.getAnimations().filter(a => a.effect?.target?.closest?.('.campus-hd') && a.playState === 'running').length,
  montanas: document.getAnimations().filter(a => a.effect?.target?.classList?.contains('mte') && a.playState === 'running').length,
});
/* las funciones de node no existen en la página: se instala animFondo como global de la página */
const instalaAnim = pg => pg.evaluate(f => { window.animFondo = eval('(' + f + ')'); }, animFondo.toString());
const esperaCampus = pg => pg.waitForFunction(() => document.querySelector('#app').classList.contains('fondo-campus'), null, { timeout: 5000 });

await caso('fondo del menú · el campus solo está en el menú principal y nunca corren dos fondos a la vez', FONDO, async pg => {
  await instalaAnim(pg);
  await pg.evaluate(() => rTitulo()); await esperaCampus(pg); await pausa(300);
  const pasos = [];
  const foto = async nombre => pasos.push({ nombre, clase: await pg.evaluate(() => document.querySelector('#app').classList.contains('fondo-campus')),
    display: await pg.evaluate(() => getComputedStyle(document.querySelector('.campus-hd')).display), ...(await pg.evaluate(() => animFondo())) });
  await foto('menú');
  for (const [nombre, js] of [['pasillo', () => rPasillo()], ['lista', () => rMapaLista()], ['tienda', () => rTienda()], ['logros', () => rLogros()],
                              ['récords', () => rRecords()], ['minijuego', () => { diaAct = 1; vidas = 3; nvBugs(1); }], ['jefe', () => { diaAct = 9; vidas = 3; nvJefe(9, 0); }]]) {
    await pg.evaluate(js); await pausa(350); await foto(nombre);
    await pg.evaluate(() => rTitulo()); await pausa(350);
    await foto('menú tras ' + nombre);
  }
  const mal = pasos.filter(p => p.nombre.startsWith('menú') ? !(p.clase && p.display === 'block' && p.campus === 5 && p.montanas === 0)
                                                           : !(!p.clase && p.display === 'none' && p.campus === 0));
  return [mal.length === 0, mal.length ? 'mal: ' + JSON.stringify(mal.slice(0, 3)) : `${pasos.length} pantallas: el campus solo en el menú (5 capas animadas) y fuera, 0`];
});

await caso('fondo del menú · fuera del menú siguen las montañas (con su animación) y se esconden en el menú', FONDO, async pg => {
  await instalaAnim(pg);
  await pg.evaluate(() => rTitulo()); await esperaCampus(pg);
  const menu = await pg.evaluate(() => ({ mte: getComputedStyle(document.querySelector('.mte.m1')).display, niebla: getComputedStyle(document.querySelector('.niebla')).display }));
  await pg.evaluate(() => rPasillo()); await pausa(400);
  const fuera = await pg.evaluate(() => ({ mte: getComputedStyle(document.querySelector('.mte.m1')).display, niebla: getComputedStyle(document.querySelector('.niebla')).display, ...animFondo() }));
  return [menu.mte === 'none' && menu.niebla === 'none' && fuera.mte === 'block' && fuera.niebla === 'block' && fuera.montanas === 3 && fuera.campus === 0, JSON.stringify({ menu, fuera })];
});

await caso('fondo del menú · las 6 capas cubren sin deformar, alineadas y abajo al centro, en 6 tamaños; detrás de todo y sin interceptar toques', FONDO, async pg => {
  const sal = [];
  for (const [w, h] of [[390, 760], [320, 568], [820, 1100], [1280, 800], [1920, 1080], [844, 390]]) {
    await pg.setViewportSize({ width: w, height: h }); await pg.evaluate(() => rTitulo()); await esperaCampus(pg); await pausa(300);
    const r = await pg.evaluate(() => {
      const f = document.querySelector('#fondo').getBoundingClientRect(), capas = [...document.querySelectorAll('.campus-hd>div')];
      const css = capas.map(c => { const s = getComputedStyle(c); return s.backgroundSize + '|' + s.backgroundPosition; });
      const cajas = capas.map(c => c.getBoundingClientRect());
      return { capas: capas.length, mismoEncuadre: new Set(css.slice(0, 6)).size === 1 && css[0] === 'cover|50% 100%',
        /* las fijas cubren todo; las dos de nubes se desplazan ±2,5 % (son transparentes: solo entra o sale una nube por un lado) */
        cubren: capas.every((c, i) => { const a = cajas[i], nube = /nubes/.test(c.className), m = f.width * .025 + 1;
          return a.top <= f.top + 1 && a.bottom >= f.bottom - 1 && (nube ? a.left <= f.left + m && a.right >= f.right - m : a.left <= f.left + 1 && a.right >= f.right - 1); }),
        detras: getComputedStyle(document.querySelector('.campus-hd')).pointerEvents === 'none' && getComputedStyle(document.querySelector('#fondo')).zIndex === '0',
        tocaMenu: document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.closest('#fondo') === null };
    });
    if (!(r.capas === 7 && r.mismoEncuadre && r.cubren && r.detras && r.tocaMenu)) sal.push(`${w}×${h}: ${JSON.stringify(r)}`);
  }
  return [sal.length === 0, sal.length ? sal.join(' · ') : '6 tamaños: 7 capas (6 imágenes + velo) que cubren, mismo encuadre cover abajo al centro, detrás y sin tocar'];
});

await caso('fondo del menú · las capas se mueven despacio y suave: nubes, estrellas y ventanas cambian sin saltos', FONDO, async pg => {
  await pg.evaluate(() => rTitulo()); await esperaCampus(pg);
  const m = await pg.evaluate(async () => {
    const lee = () => { const g = s => getComputedStyle(document.querySelector(s)); return { nubes: new DOMMatrix(g('.campus-nubes-cerca').transform).m41, estrellas: +g('.campus-estrellas-a').opacity, ventanas: +g('.campus-ventanas').opacity }; };
    const v = []; const t0 = performance.now();
    while (performance.now() - t0 < 2400) { v.push(lee()); await new Promise(r => setTimeout(r, 120)); }
    return v;
  });
  const salto = k => Math.max(...m.slice(1).map((x, i) => Math.abs(x[k] - m[i][k])));
  const cambia = k => Math.abs(m.at(-1)[k] - m[0][k]) > 0;
  const r = { nubesCambia: cambia('nubes'), estrellasCambia: cambia('estrellas'), ventanasCambia: cambia('ventanas'), saltoNubesPx: +salto('nubes').toFixed(2), saltoEstrellas: +salto('estrellas').toFixed(3), saltoVentanas: +salto('ventanas').toFixed(3) };
  return [r.nubesCambia && r.estrellasCambia && r.ventanasCambia && r.saltoNubesPx < 3 && r.saltoEstrellas < .05 && r.saltoVentanas < .08, JSON.stringify(r)];
});

await caso('fondo del menú · con "reducir movimiento": el campus quieto, sin ninguna animación ni luz de ventanas que cambie', FONDO, async pg => {
  await pg.emulateMedia({ reducedMotion: 'reduce' }); await pg.reload({ waitUntil: 'load' });
  await pg.waitForFunction(() => typeof pantallaId !== 'undefined'); await pausa(300);
  await instalaAnim(pg);
  await pg.evaluate(() => rTitulo()); await esperaCampus(pg); await pausa(300);
  const r = await pg.evaluate(() => { const g = s => getComputedStyle(document.querySelector(s)); return { anims: animFondo().campus, nubes: g('.campus-nubes-cerca').transform, ventanas: g('.campus-ventanas').opacity, estrellas: g('.campus-estrellas-a').opacity, base: /campus-noche\.webp/.test(g('.campus-base').backgroundImage) }; });
  return [r.anims === 0 && r.nubes === 'none' && r.ventanas === '0' && r.estrellas === '0.55' && r.base, JSON.stringify(r)];
});

await caso('fondo del menú · con la pestaña oculta las animaciones se pausan y al volver siguen', FONDO, async pg => {
  await instalaAnim(pg);
  await pg.evaluate(() => rTitulo()); await esperaCampus(pg); await pausa(200);
  const estado = () => pg.evaluate(() => ({ marca: document.documentElement.classList.contains('pestana-oculta'), play: getComputedStyle(document.querySelector('.campus-nubes-lejos')).animationPlayState, corre: animFondo().campus }));
  const visible = await estado();
  await pg.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  const oculta = await estado();
  await pg.evaluate(() => { Object.defineProperty(document, 'hidden', { value: false, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  const vuelve = await estado();
  return [!visible.marca && visible.play === 'running' && visible.corre === 5 && oculta.marca && oculta.play === 'paused' && oculta.corre === 0 && !vuelve.marca && vuelve.play === 'running' && vuelve.corre === 5, JSON.stringify({ visible, oculta, vuelve })];
});

await caso('fondo del menú · si el escenario no carga, el menú se queda con las montañas de siempre', FONDO, async pg => {
  await pg.route('**/img/portada/**', r => r.abort());
  await pg.reload({ waitUntil: 'load' }); await pg.waitForFunction(() => typeof pantallaId !== 'undefined'); await pausa(300);
  await instalaAnim(pg);
  await pg.evaluate(() => rTitulo()); await pausa(900);
  const r = await pg.evaluate(() => ({ clase: document.querySelector('#app').classList.contains('fondo-campus'), mte: getComputedStyle(document.querySelector('.mte.m1')).display, capa: getComputedStyle(document.querySelector('.campus-hd')).display, ...animFondo() }));
  return [!r.clase && r.mte === 'block' && r.capa === 'none' && r.montanas === 3 && r.campus === 0, JSON.stringify(r)];
});

await caso('fondo del menú · el texto suelto sobre el fondo sigue leyéndose (contraste ≥ 4,5 en móvil, móvil chico, escritorio y apaisado)', FONDO, async pg => {
  const lum = (r, g, b) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
  await pg.evaluate(() => rTitulo()); await esperaCampus(pg);
  const sal = [];
  for (const [w, h] of [[390, 760], [320, 568], [1280, 800], [844, 390]]) {
    await pg.setViewportSize({ width: w, height: h }); await pg.evaluate(() => rTitulo()); await pausa(500);
    /* se mide el fondo SIN el texto (transparente) justo detrás de cada línea: el 95 % más claro de sus píxeles manda */
    for (const sel of ['.sub', '.xp-txt', '.tit-h1 .l1', '.tit-h1 .l2', '.dif-cap', '.rpg-xp-cab b', '.rpg-xp-cab strong']) {
      const el = await pg.$(sel); if (!el) continue;
      /* desde la v28 el título lo pinta el dibujo y el h1 queda solo para lectores de pantalla (1 px, recortado): no hay texto que leer */
      if (await el.evaluate(e => { const h = e.closest('.tit-h1'); return !!h && h.getBoundingClientRect().width <= 2; })) continue;
      await el.scrollIntoViewIfNeeded(); await pausa(120);
      const caja = await el.boundingBox();
      if (!caja || caja.width < 2 || caja.y < 0 || caja.y + caja.height > h || caja.x < 0 || caja.x + caja.width > w) continue;
      const color = await el.evaluate(e => getComputedStyle(e).color);
      await el.evaluate(e => { e.dataset.c = e.style.color; e.style.color = 'transparent'; e.style.textShadow = 'none'; });
      const png = await pg.screenshot({ clip: { x: caja.x, y: caja.y, width: caja.width, height: caja.height } });
      await el.evaluate(e => { e.style.color = e.dataset.c; e.style.textShadow = ''; });
      const px = await pg.evaluate(async b64 => { const i = new Image(); i.src = 'data:image/png;base64,' + b64; await i.decode(); const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const g = c.getContext('2d'); g.drawImage(i, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data; const o = []; for (let k = 0; k < d.length; k += 4) o.push([d[k], d[k + 1], d[k + 2]]); return o; }, png.toString('base64'));
      const ls = px.map(p => lum(...p)).sort((a, b) => a - b), fondo = ls[Math.floor(ls.length * .95)];
      const m = color.match(/\d+/g).map(Number), texto = lum(m[0], m[1], m[2]);
      const contraste = (Math.max(texto, fondo) + .05) / (Math.min(texto, fondo) + .05);
      if (contraste < 4.5) sal.push(`${w}×${h} ${sel}: ${contraste.toFixed(1)}`);
    }
  }
  return [sal.length === 0, sal.length ? sal.join(' · ') : 'todos ≥ 4,5:1'];
});

await caso('fondo del menú · sin conexión: el service worker guarda las 6 capas y el campus se sirve de su caché', FONDO, async pg => {
  const { createServer } = await import('node:http');
  const { readFile } = await import('node:fs/promises');
  const tipos = { html: 'text/html', js: 'text/javascript', css: 'text/css', webmanifest: 'application/manifest+json', svg: 'image/svg+xml', png: 'image/png', webp: 'image/webp', woff2: 'font/woff2' };
  const mini = createServer(async (q, r) => {
    try {
      let ruta = decodeURIComponent(new URL(q.url, 'http://x').pathname);
      if (ruta.endsWith('/')) ruta += 'index.html';
      const cuerpo = await readFile(join(RAIZ, ruta));
      r.writeHead(200, { 'content-type': tipos[ruta.split('.').pop()] || 'application/octet-stream', 'cache-control': 'no-store' });
      r.end(cuerpo);
    } catch (e) { r.writeHead(404); r.end(); }
  });
  await new Promise(ok => mini.listen(0, '127.0.0.1', ok));
  try {
    await pg.goto(`http://127.0.0.1:${mini.address().port}/index.html`, { waitUntil: 'load' });
    await pg.waitForFunction(() => typeof pantallaId !== 'undefined');
    await pg.evaluate(() => registrarSW());
    await pg.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 8000 });
    await pausa(1500);
    const rutas = ['img/portada/campus-noche.webp', 'img/portada/estrellas-1.png', 'img/portada/estrellas-2.png', 'img/portada/nubes-cercanas.png', 'img/portada/nubes-lejanas.png', 'img/portada/ventanas.png', 'js/fondo.js'];
    const guardadas = await pg.evaluate(async rs => Promise.all(rs.map(async u => !!(await caches.match(u)))), rutas);
    const viejas = await pg.evaluate(async () => !!(await caches.match('img/fondo/ciudad-atlas.png')));
    await pg.context().setOffline(true);
    const sinRed = await pg.evaluate(async () => { const r = await fetch('img/portada/campus-noche.webp', { cache: 'reload' }); return { ok: r.ok, bytes: (await r.blob()).size }; });
    /* y el menú, recargado sin red, sigue con el campus */
    await pg.reload({ waitUntil: 'load' }); await pg.waitForFunction(() => typeof pantallaId !== 'undefined');
    await pg.evaluate(() => rTitulo());
    const campus = await pg.waitForFunction(() => document.querySelector('#app').classList.contains('fondo-campus'), null, { timeout: 5000 }).then(() => true, () => false);
    await pg.context().setOffline(false);
    return [guardadas.every(Boolean) && !viejas && sinRed.ok && sinRed.bytes > 150000 && campus, `en la caché: ${guardadas}, la ciudad vieja: ${viejas}, escenario sin red: ${JSON.stringify(sinRed)}, menú sin red con campus: ${campus}`];
  } finally { mini.close(); }
});

await caso('fondo del menú · con el campus, el menú se ve y los botones responden (JUGAR → pasillo, y volver)', FONDO, async pg => {
  await pg.evaluate(() => rTitulo()); await esperaCampus(pg);
  await pg.click('#t-jugar'); await pausa(500);
  const en = await pg.evaluate(() => ({ p: pantallaId, clase: document.querySelector('#app').classList.contains('fondo-campus') }));
  await pg.evaluate(() => rTitulo()); await pausa(500);
  const vuelve = await pg.evaluate(() => document.querySelector('#app').classList.contains('fondo-campus'));
  return [en.p === 'pasillo' && !en.clase && vuelve, JSON.stringify({ en, vuelve })];
});

/* ── EL TÍTULO DE LA PORTADA (v28) ──
   Un dibujo en pixel art en vez del texto, con el <h1> de siempre como respaldo y para los
   lectores de pantalla. Lo que no puede romperse: que nunca se vean los dos, que quepa y no
   tape el subtítulo ni los botones, que el modo HD siga con su título de texto, que el modo
   legible y las pantallas estrechas funcionen, y que si el dibujo no carga salga el texto. */
const TITULO = { intro: true, nombre: 'R', pts: 900, xp: 1700, version: 'v28', dias: [3, 2, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
const esperaTitulo = pg => pg.waitForFunction(() => document.querySelector('.tit-logo')?.classList.contains('con-imagen'), null, { timeout: 5000 });
const estadoTitulo = pg => pg.evaluate(() => {
  const l = document.querySelector('.tit-logo'), i = l.querySelector('.tit-img'), h = l.querySelector('.tit-h1'), g = l.querySelector('.guion');
  const ri = i.getBoundingClientRect(), rh = h.getBoundingClientRect(), rl = l.getBoundingClientRect(), sub = document.querySelector('.sub').getBoundingClientRect(), sc = document.querySelector('#screen');
  const imgVisible = getComputedStyle(i).display !== 'none' && ri.width > 4;
  const textoVisible = rh.width > 4 && rh.height > 4 && getComputedStyle(h).visibility !== 'hidden';
  return { imgVisible, textoVisible, guionVisible: getComputedStyle(g).display !== 'none', imgAncho: Math.round(ri.width), imgAlto: Math.round(ri.height),
    dentro: ri.left >= rl.left - 1 && ri.right <= rl.right + 1, subLibre: !imgVisible || ri.bottom <= sub.top + 1, sinScroll: sc.scrollWidth <= sc.clientWidth,
    ratio: imgVisible ? +(ri.width / ri.height).toFixed(3) : 0, nombre: h.textContent.replace(/\s+/g, ' ').trim(), alt: i.getAttribute('alt'), ocultoAria: i.getAttribute('aria-hidden') };
});

await caso('título del menú · con el dibujo cargado se ve solo el dibujo, y el h1 de texto queda para los lectores de pantalla', TITULO, async pg => {
  await pg.evaluate(() => rTitulo()); await esperaTitulo(pg);
  const e = await estadoTitulo(pg);
  const h1 = await pg.evaluate(() => { const h = document.querySelector('.tit-h1'); const c = getComputedStyle(h); return { tag: h.tagName, pos: c.position, vis: c.visibility, disp: c.display }; });
  return [e.imgVisible && !e.textoVisible && !e.guionVisible && e.nombre === 'APRENDIZ EN APUROS' && e.alt === '' && e.ocultoAria === 'true'
    && h1.tag === 'H1' && h1.pos === 'absolute' && h1.vis === 'visible' && h1.disp !== 'none', JSON.stringify({ ...e, h1 })];
});

await caso('título del menú · cabe sin deformarse, sin desbordar y sin tapar el subtítulo en 6 tamaños', TITULO, async pg => {
  const mal = [];
  for (const [w, h] of [[320, 568], [360, 640], [390, 760], [820, 1100], [1280, 800], [1920, 1080]]) {
    await pg.setViewportSize({ width: w, height: h }); await pg.evaluate(() => rTitulo()); await esperaTitulo(pg); await pausa(300);
    const e = await estadoTitulo(pg);
    if (!(e.imgVisible && e.dentro && e.subLibre && e.sinScroll && Math.abs(e.ratio - 920 / 360) < .02)) mal.push(`${w}×${h}: ${JSON.stringify(e)}`);
  }
  return [mal.length === 0, mal.length ? mal.join(' · ') : '6 tamaños: dentro de su caja, relación 920:360, sin scroll y sin tapar el subtítulo'];
});

await caso('título del menú · el modo HD conserva el título de texto de siempre (sin dibujo)', { ...TITULO, hd: true }, async pg => {
  await pg.evaluate(() => rTitulo()); await pausa(900);
  const e = await estadoTitulo(pg);
  return [!e.imgVisible && e.textoVisible && e.guionVisible && e.nombre === 'APRENDIZ EN APUROS', JSON.stringify(e)];
});

await caso('título del menú · con el texto legible se ve el dibujo y el subtítulo sigue en su tipografía legible', { ...TITULO, legible: true }, async pg => {
  await pg.evaluate(() => rTitulo()); await esperaTitulo(pg);
  const e = await estadoTitulo(pg);
  const fuente = await pg.evaluate(() => getComputedStyle(document.querySelector('.sub')).fontFamily);
  return [e.imgVisible && !e.textoVisible && e.subLibre && /VT323/.test(fuente), JSON.stringify({ imgVisible: e.imgVisible, subLibre: e.subLibre, fuente })];
});

await caso('título del menú · si el dibujo no carga, sale el título de texto con sus guiones', TITULO, async pg => {
  await pg.route('**/img/titulo/**', r => r.abort());
  await pg.reload({ waitUntil: 'load' }); await pg.waitForFunction(() => typeof pantallaId !== 'undefined'); await pausa(300);
  await pg.evaluate(() => rTitulo()); await pausa(900);
  const e = await estadoTitulo(pg);
  const clase = await pg.evaluate(() => document.querySelector('.tit-logo').className);
  return [!e.imgVisible && e.textoVisible && e.guionVisible && !/con-imagen/.test(clase), JSON.stringify({ ...e, clase })];
});

await caso('título del menú · cambiar de idioma y volver a la portada no duplica ni pierde el título', TITULO, async pg => {
  await pg.evaluate(() => rTitulo()); await esperaTitulo(pg);
  await pg.locator('#b-lang').click(); await pausa(500);
  await pg.evaluate(() => rPasillo()); await pausa(300); await pg.evaluate(() => rTitulo()); await pausa(500);
  const n = await pg.evaluate(() => ({ logos: document.querySelectorAll('.tit-logo').length, imgs: document.querySelectorAll('.tit-img').length, h1: document.querySelectorAll('h1').length, clase: document.querySelector('.tit-logo').className }));
  const e = await estadoTitulo(pg);
  return [n.logos === 1 && n.imgs === 1 && n.h1 === 1 && /con-imagen/.test(n.clase) && e.imgVisible && !e.textoVisible, JSON.stringify({ n, imgVisible: e.imgVisible })];
});

await caso('título del menú · las demás pantallas no cambian: ninguna lleva el título ni sus reglas', TITULO, async pg => {
  const r = await pg.evaluate(() => { const o = {};
    for (const [n, f] of [['pasillo', () => rPasillo()], ['lista', () => rMapaLista()], ['tienda', () => rTienda()], ['logros', () => rLogros()], ['récords', () => rRecords()]]) { f(); o[n] = document.querySelectorAll('.tit-logo,.tit-img').length; }
    return o; });
  return [Object.values(r).every(v => v === 0), JSON.stringify(r)];
});

await caso('título del menú · sin conexión: el service worker guarda el dibujo', TITULO, async pg => {
  const { createServer } = await import('node:http');
  const { readFile } = await import('node:fs/promises');
  const tipos = { html: 'text/html', js: 'text/javascript', css: 'text/css', webmanifest: 'application/manifest+json', svg: 'image/svg+xml', png: 'image/png', webp: 'image/webp', woff2: 'font/woff2' };
  const mini = createServer(async (q, r) => {
    try {
      let ruta = decodeURIComponent(new URL(q.url, 'http://x').pathname);
      if (ruta.endsWith('/')) ruta += 'index.html';
      const cuerpo = await readFile(join(RAIZ, ruta));
      r.writeHead(200, { 'content-type': tipos[ruta.split('.').pop()] || 'application/octet-stream', 'cache-control': 'no-store' });
      r.end(cuerpo);
    } catch (e) { r.writeHead(404); r.end(); }
  });
  await new Promise(ok => mini.listen(0, '127.0.0.1', ok));
  try {
    await pg.goto(`http://127.0.0.1:${mini.address().port}/index.html`, { waitUntil: 'load' });
    await pg.waitForFunction(() => typeof pantallaId !== 'undefined');
    await pg.evaluate(() => registrarSW());
    await pg.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 8000 });
    await pausa(1500);
    const guardada = await pg.evaluate(async () => !!(await caches.match('img/titulo/titulo-aprendiz-en-apuros.png')));
    await pg.context().setOffline(true);
    const sinRed = await pg.evaluate(async () => { const r = await fetch('img/titulo/titulo-aprendiz-en-apuros.png', { cache: 'reload' }); return { ok: r.ok, bytes: (await r.blob()).size }; });
    await pg.context().setOffline(false);
    return [guardada && sinRed.ok && sinRed.bytes > 1000, `en la caché: ${guardada}, sin red: ${JSON.stringify(sinRed)}`];
  } finally { mini.close(); }
});

/* ── EL APRENDIZ DE LA PORTADA (v29) ──
   Lo que no puede romperse: que JUGAR siga igual (y sin retraso), que el lienzo sea
   decorativo y no tape ni intercepte nada, que respire / parpadee / salude, que lleve la
   piel y la camisa del jugador, que respete "reducir movimiento", la pausa y la pestaña
   oculta, que no deje bucles al salir y que se vea bien en móvil y escritorio. */
const PORTADA_J = { intro: true, nombre: 'R', pts: 900, xp: 1700, version: 'v29', dias: [3, 2, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
/* una huella barata del lienzo: la suma de sus bytes y dónde tiene píxeles (para saber si cambió de dibujo) */
const huella = pg => pg.evaluate(() => { const cv = document.querySelector('#t-aprendiz'); const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let s = 0, n = 0; for (let i = 0; i < d.length; i += 4) { if (d[i + 3]) { n++; s = (s * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7 + (i >> 2)) % 1000003; } } return `${n}:${s}`; });
const listoAprendiz = pg => pg.waitForFunction(() => { const cv = document.querySelector('#t-aprendiz'); if (!cv) return false; const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; for (let i = 3; i < d.length; i += 4) if (d[i]) return true; return false; }, null, { timeout: 5000 });

await caso('aprendiz de la portada · está junto a JUGAR, es decorativo y no intercepta toques ni tapa nada', PORTADA_J, async pg => {
  await pg.evaluate(() => rTitulo()); await listoAprendiz(pg);
  const r = await pg.evaluate(() => {
    const cv = document.querySelector('#t-aprendiz'), j = document.querySelector('#t-jugar'), m = document.querySelector('.jugar-marco'), a = cv.getBoundingClientRect(), b = m.getBoundingClientRect();
    cv.scrollIntoView({ block: 'center' }); const a2 = cv.getBoundingClientRect();
    const tope = document.elementFromPoint(a2.left + a2.width / 2, a2.top + a2.height / 2);
    return { aria: cv.getAttribute('aria-hidden'), pe: getComputedStyle(cv).pointerEvents, izq: a.right <= b.left + 2, mismaFila: Math.abs((a.top + a.bottom) / 2 - (b.top + b.bottom) / 2) < 40,
      tope: tope && (tope === cv ? 'CANVAS' : tope.id || tope.className || tope.tagName), jugarAncho: Math.round(j.getBoundingClientRect().width) };
  });
  return [r.aria === 'true' && r.pe === 'none' && r.izq && r.mismaFila && r.tope !== 'CANVAS' && r.jugarAncho >= 120, JSON.stringify(r)];
});

await caso('aprendiz de la portada · se reparte bien en 6 tamaños: sin desbordar y sin tapar el título ni el reto diario', PORTADA_J, async pg => {
  const mal = [];
  for (const [w, h] of [[320, 568], [360, 640], [390, 760], [820, 1100], [1280, 800], [1920, 1080]]) {
    await pg.setViewportSize({ width: w, height: h }); await pg.evaluate(() => rTitulo()); await pausa(500);
    const r = await pg.evaluate(() => {
      const cv = document.querySelector('#t-aprendiz'), j = document.querySelector('.jugar-marco'), reto = document.querySelector('#t-reto'), xp = document.querySelector('.xp-txt'), sc = document.querySelector('#screen');
      const a = cv.getBoundingClientRect(), b = j.getBoundingClientRect(), rr = reto.getBoundingClientRect(), x = xp.getBoundingClientRect();
      const choca = (p, q) => !(p.right <= q.left || p.left >= q.right || p.bottom <= q.top || p.top >= q.bottom);
      return { sinScroll: sc.scrollWidth <= sc.clientWidth, noChoca: !choca(a, rr) && !choca(a, x) && !choca(b, rr) && !choca(b, x), ancho: Math.round(a.width), jugar: Math.round(b.width) };
    });
    if (!(r.sinScroll && r.noChoca && r.ancho >= 40 && r.jugar >= 120)) mal.push(`${w}×${h}: ${JSON.stringify(r)}`);
  }
  return [mal.length === 0, mal.length ? mal.join(' · ') : '6 tamaños: sin scroll horizontal y sin choques'];
});

await caso('aprendiz de la portada · JUGAR sigue entrando al pasillo y sin retraso (con ratón, teclado y toque)', PORTADA_J, async pg => {
  const mide = async accion => {
    await pg.evaluate(() => rTitulo()); await listoAprendiz(pg);
    const t0 = Date.now(); await accion(); await pg.waitForFunction(() => pantallaId === 'pasillo', null, { timeout: 3000 });
    return Date.now() - t0;
  };
  const raton = await mide(() => pg.click('#t-jugar'));
  const teclado = await mide(async () => { await pg.focus('#t-jugar'); await pg.keyboard.press('Enter'); });
  const toque = await mide(() => pg.evaluate(() => document.querySelector('#t-jugar').click()));
  return [raton < 1500 && teclado < 900 && toque < 900, `ratón ${raton} ms, teclado ${teclado} ms, clic ${toque} ms`];
});

await caso('aprendiz de la portada · respira: el dibujo cambia solo, cada ~0,65 s, sin que nadie toque nada', PORTADA_J, async pg => {
  await pg.evaluate(() => rTitulo()); await listoAprendiz(pg);
  const v = new Set(); const t0 = Date.now();
  while (Date.now() - t0 < 2400) { v.add(await huella(pg)); await pausa(60); }
  return [v.size >= 2, `${v.size} dibujos distintos en 2,4 s`];
});

await caso('aprendiz de la portada · saluda al pasar el puntero por JUGAR, al enfocarlo y al tocarlo, y luego vuelve al reposo', PORTADA_J, async pg => {
  await pg.evaluate(() => rTitulo()); await listoAprendiz(pg); await pausa(1100);
  const res = {};
  /* se mide por el brazo: el saludo es el único que pinta en la columna derecha del lienzo (x ≥ 46) */
  const brazo = pg => pg.evaluate(() => { const cv = document.querySelector('#t-aprendiz'); const d = cv.getContext('2d').getImageData(46, 20, 10, 30).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n; });
  const reposo = await brazo(pg);
  for (const [nombre, accion] of [['puntero', () => pg.hover('#t-jugar')], ['foco', async () => { await pg.mouse.move(2, 2); await pg.focus('#t-jugar'); }], ['toque', () => pg.evaluate(() => document.querySelector('#t-jugar').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })))]]) {
    await pg.evaluate(() => { document.activeElement?.blur(); }); await pg.mouse.move(2, 2); await pausa(1300);
    await accion(); await pausa(250);
    res[nombre] = await brazo(pg);
  }
  /* y vuelve al reposo (puede coincidir con el saludo periódico, que dura ~1 s: se espera hasta 4 s) */
  const vuelve = await pg.waitForFunction(() => { const cv = document.querySelector('#t-aprendiz'); const d = cv.getContext('2d').getImageData(46, 20, 10, 30).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n < 30; }, null, { timeout: 4000 }).then(() => true, () => false);
  return [Object.values(res).every(n => n > reposo + 20) && vuelve, JSON.stringify({ reposo, ...res, vuelveAlReposo: vuelve })];
});

await caso('aprendiz de la portada · lleva la piel y la camisa del jugador (y cambian al elegir otras)', PORTADA_J, async pg => {
  const color = (pg, y) => pg.evaluate(yy => { const cv = document.querySelector('#t-aprendiz'); const d = cv.getContext('2d').getImageData(12, yy, 30, 1).data; const c = {}; for (let i = 0; i < d.length; i += 4) if (d[i + 3] === 255) { const k = d[i] + ',' + d[i + 1] + ',' + d[i + 2]; c[k] = (c[k] || 0) + 1; } return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0]; }, y);
  const casos = [[0, 0], [1, 2], [3, 3]], vistos = [];
  for (const [skin, camisa] of casos) {
    await pg.evaluate(([s, c]) => { S.skin = s; S.camisa = c; rTitulo(); }, [skin, camisa]); await listoAprendiz(pg); await pausa(400);
    const cam = await color(pg, 42), piel = await color(pg, 12);   /* 42: el pecho; desde v40.1 en el 36 está el cuello */
    const hexes = await pg.evaluate(([s, c]) => [SKINS[s], CAMISAS[c]], [skin, camisa]);
    vistos.push({ skin, camisa, cam, piel, hexes });
  }
  /* el color dominante del torso tiene que parecerse al de la camisa elegida (el sprite lleva sombreado: se admite ±70 por canal) */
  const cerca = (rgb, hex) => { if (!rgb) return false; const [r, g, b] = rgb.split(',').map(Number), h = hex.slice(1).match(/../g).map(x => parseInt(x, 16)); return Math.abs(r - h[0]) < 80 && Math.abs(g - h[1]) < 80 && Math.abs(b - h[2]) < 80; };
  const ok = vistos.every(v => cerca(v.cam, v.hexes[1])) && new Set(vistos.map(v => v.cam)).size === 3;
  return [ok, JSON.stringify(vistos.map(v => ({ skin: v.skin, camisa: v.camisa, torso: v.cam, esperado: v.hexes[1] })))];
});

await caso('aprendiz de la portada · con "reducir movimiento" se pinta una vez, quieto: ni respira ni saluda', PORTADA_J, async pg => {
  await pg.emulateMedia({ reducedMotion: 'reduce' }); await pg.reload({ waitUntil: 'load' });
  await pg.waitForFunction(() => typeof pantallaId !== 'undefined'); await pausa(300);
  await pg.evaluate(() => rTitulo()); await listoAprendiz(pg);
  const v = new Set(); const t0 = Date.now();
  while (Date.now() - t0 < 2200) { v.add(await huella(pg)); await pausa(80); }
  await pg.hover('#t-jugar'); await pausa(300); v.add(await huella(pg));
  const intervalos = await pg.evaluate(() => tms.length);
  return [v.size === 1 && intervalos <= 3, `${v.size} dibujo(s) distintos (con el puntero encima también), temporizadores del juego: ${intervalos}`];
});

await caso('aprendiz de la portada · en pausa y con la pestaña oculta se queda quieto', PORTADA_J, async pg => {
  await pg.evaluate(() => rTitulo()); await listoAprendiz(pg); await pausa(500);
  const quietoDurante = async () => { const a = await huella(pg); const v = new Set([a]); const t0 = Date.now(); while (Date.now() - t0 < 2000) { v.add(await huella(pg)); await pausa(100); } return v.size; };
  await pg.evaluate(() => { pausado = true; });
  const enPausa = await quietoDurante();
  await pg.evaluate(() => { pausado = false; Object.defineProperty(document, 'hidden', { value: true, configurable: true }); });
  const oculta = await quietoDurante();
  await pg.evaluate(() => { Object.defineProperty(document, 'hidden', { value: false, configurable: true }); });
  const vuelve = await quietoDurante();
  return [enPausa === 1 && oculta === 1 && vuelve >= 2, `en pausa: ${enPausa} dibujo(s), pestaña oculta: ${oculta}, al volver: ${vuelve}`];
});

await caso('aprendiz de la portada · al salir de la portada no queda ningún bucle (y volver 10 veces no los acumula)', PORTADA_J, async pg => {
  await pg.evaluate(() => rTitulo()); await listoAprendiz(pg);
  const base = await pg.evaluate(() => { rPasillo(); return tms.length; });
  const salidas = [];
  for (let i = 0; i < 10; i++) { await pg.evaluate(() => rTitulo()); const dentro = await pg.evaluate(() => tms.length); await pg.evaluate(() => rPasillo()); salidas.push([dentro, await pg.evaluate(() => tms.length), await pg.evaluate(() => document.querySelectorAll('#t-aprendiz').length)]); }
  const ok = salidas.every(([dentro, fuera, lienzos]) => fuera === base && lienzos === 0 && dentro <= base + 3);
  return [ok, `fuera de la portada: ${base} temporizadores; en 10 vueltas ${JSON.stringify(salidas.slice(0, 3))}…`];
});

await caso('aprendiz de la portada · con el modo HD y con el texto legible sigue en su sitio, sin desbordar', PORTADA_J, async pg => {
  const mal = [];
  for (const modo of [{ hd: true }, { legible: true }]) {
    await pg.evaluate(m => { Object.assign(S, { hd: false, legible: false }, m); aplicarModo(); rTitulo(); }, modo); await listoAprendiz(pg); await pausa(300);
    const r = await pg.evaluate(() => { const a = document.querySelector('#t-aprendiz').getBoundingClientRect(), b = document.querySelector('.jugar-marco').getBoundingClientRect(), sc = document.querySelector('#screen'); return { izq: a.right <= b.left + 2, sinScroll: sc.scrollWidth <= sc.clientWidth, ancho: Math.round(a.width) }; });
    if (!(r.izq && r.sinScroll && r.ancho >= 40)) mal.push(JSON.stringify(modo) + ' ' + JSON.stringify(r));
  }
  await pg.evaluate(() => { Object.assign(S, { hd: false, legible: false }); aplicarModo(); });
  return [mal.length === 0, mal.length ? mal.join(' · ') : 'HD y legible: a la izquierda de JUGAR, sin scroll'];
});

await caso('aprendiz de la portada · las demás pantallas no cambian: ninguna lleva el lienzo ni sus reglas', PORTADA_J, async pg => {
  const r = await pg.evaluate(() => { const o = {};
    for (const [n, f] of [['pasillo', () => rPasillo()], ['lista', () => rMapaLista()], ['tienda', () => rTienda()], ['logros', () => rLogros()], ['récords', () => rRecords()], ['perso', () => rPerso()]]) { f(); o[n] = document.querySelectorAll('#t-aprendiz,.tit-jugar-fila').length; }
    return o; });
  return [Object.values(r).every(v => v === 0), JSON.stringify(r)];
});

/* ── LOS BOTONES DE LA PORTADA (v30) ──
   Lo que no puede romperse: que las nueve tarjetas, JUGAR, el reto diario, las tres
   dificultades, la consola y borrar sigan haciendo lo de siempre; que los iconos sigan siendo
   los de pixel art; que todo quepa en móvil, escritorio, HD y texto legible; que el teclado no
   pierda el foco al elegir dificultad; y que nada de esto salga de la portada. */
const BOTONES_J = { intro: true, nombre: 'R', pts: 900, xp: 1700, version: 'v30', dias: [3, 2, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };

await caso('botones de la portada · las 9 tarjetas llevan su icono de pixel art (no emoji) a 36 px, y 32 px en móvil (v34)', BOTONES_J, async pg => {
  const mide = async (w, h) => { await pg.setViewportSize({ width: w, height: h }); await pg.evaluate(() => rTitulo()); await pausa(400);
    return pg.evaluate(() => { const f = [...document.querySelectorAll('.portada .menu-fila')]; const ico = f.map(b => b.querySelector('.m-ico img.pxi')?.getBoundingClientRect().width || 0);
      const d = [...document.querySelectorAll('.portada .dif-op .dif-ico img.pxi')].length;
      return { filas: f.length, conPxi: ico.filter(x => x > 0).length, min: Math.min(...ico), dif: d }; }); };
  const m = await mide(390, 760), g = await mide(1280, 800);
  return [m.filas === 9 && m.conPxi === 9 && m.dif === 3 && m.min >= 31 && m.min <= 33 && g.conPxi === 9 && g.min >= 35, `móvil ${JSON.stringify(m)} · escritorio ${JSON.stringify(g)}`];
});

await caso('botones de la portada · cada acceso sigue llevando a su pantalla', BOTONES_J, async pg => {
  const fuera = [];
  for (const [id, pant] of [['t-libre', 'libre'], ['t-sinfin', 'sinfin'], ['t-sala', 'sala'], ['t-tienda', 'tienda'], ['t-logros', 'logros'], ['t-records', 'records'], ['t-stats', 'stats'], ['t-perso', 'perso'], ['t-reto', 'reto'], ['t-borrar', 'borrar'], ['t-jugar', 'mapa']]) {
    await pg.evaluate(() => rTitulo()); await pausa(150);
    await pg.evaluate(i => document.getElementById(i).click(), id); await pausa(250);
    const ahora = await pg.evaluate(() => pantallaId);
    if (ahora === 'titulo') fuera.push(id + '→se quedó');
    else if (pant && !ahora.includes(pant) && !(id === 't-jugar')) fuera.push(`${id}→${ahora}`);
  }
  return [fuera.length === 0, fuera.length ? fuera.join(' · ') : '11 botones: todos cambian de pantalla'];
});

await caso('botones de la portada · HD y texto legible siguen funcionando (alternan y se repintan)', BOTONES_J, async pg => {
  await pg.evaluate(() => rTitulo()); await pausa(200);
  await pg.evaluate(() => document.getElementById('t-modo').click()); await pausa(200);
  const hd = await pg.evaluate(() => ({ hd: S.hd, clase: document.documentElement.classList.contains('hd'), pant: pantallaId }));
  await pg.evaluate(() => document.getElementById('t-texto').click()); await pausa(200);
  const lg = await pg.evaluate(() => ({ legible: S.legible, clase: document.documentElement.classList.contains('legible'), pant: pantallaId }));
  await pg.evaluate(() => { Object.assign(S, { hd: false, legible: false }); aplicarModo(); });
  return [hd.hd && hd.clase && hd.pant === 'titulo' && lg.legible && lg.clase && lg.pant === 'titulo', JSON.stringify({ hd, lg })];
});

await caso('botones de la portada · la dificultad se elige y se guarda, con aria-pressed y en dorado', BOTONES_J, async pg => {
  await pg.evaluate(() => rTitulo()); await pausa(200);
  const r = [];
  for (const id of [0, 2, 1]) {
    await pg.evaluate(i => document.querySelector(`.dif-op[data-dif="${i}"]`).click(), id); await pausa(150);
    r.push(await pg.evaluate(i => { const bs = [...document.querySelectorAll('.dif-op')]; const sel = bs[i], otra = bs[(i + 1) % 3];
      return { esperado: i, dif: S.dif, disco: JSON.parse(localStorage.getItem('pa3')).dif, pres: bs.map(b => b.getAttribute('aria-pressed')).join(','), nSel: document.querySelectorAll('.dif-op.sel').length, dorado: getComputedStyle(sel).borderTopColor !== getComputedStyle(otra).borderTopColor }; }, id));
  }
  const bien = r.every(x => x.dif === x.esperado && x.disco === x.dif && x.nSel === 1 && x.pres.split(',')[x.dif] === 'true' && x.pres.split(',').filter(v => v === 'true').length === 1 && x.dorado);
  return [bien, JSON.stringify(r)];
});

await caso('botones de la portada · con teclado, al elegir dificultad el foco se queda en la elegida (no se pierde al repintar)', BOTONES_J, async pg => {
  await pg.evaluate(() => rTitulo()); await pausa(200);
  await pg.focus('.dif-op[data-dif="0"]'); await pg.keyboard.press('Enter'); await pausa(250);
  const a = await pg.evaluate(() => ({ dif: S.dif, activo: document.activeElement?.dataset?.dif ?? document.activeElement?.id ?? document.activeElement?.tagName }));
  await pg.focus('.dif-op[data-dif="2"]'); await pg.keyboard.press('Space'); await pausa(250);
  const b = await pg.evaluate(() => ({ dif: S.dif, activo: document.activeElement?.dataset?.dif ?? document.activeElement?.tagName }));
  return [a.dif === 0 && a.activo === '0' && b.dif === 2 && b.activo === '2', JSON.stringify({ a, b })];
});

await caso('botones de la portada · se reparte bien en 7 tamaños, también con HD y con texto legible: sin desbordar ni cortar textos', BOTONES_J, async pg => {
  const mal = [];
  for (const modo of [{}, { hd: true }, { legible: true }, { hd: true, legible: true }]) {
    await pg.evaluate(m => { Object.assign(S, { hd: false, legible: false }, m); aplicarModo(); }, modo);
    for (const [w, h] of [[320, 568], [360, 640], [390, 760], [844, 390], [820, 1100], [1280, 800], [1920, 1080]]) {
      await pg.setViewportSize({ width: w, height: h }); await pg.evaluate(() => rTitulo()); await pausa(350);
      const r = await pg.evaluate(() => { const sc = document.querySelector('#screen');
        const corta = [...document.querySelectorAll('.portada .menu-fila .m-txt,.portada .dif-op,.portada .tit-reto,.portada .btn-jugar,.portada .cut-skip')].filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.id || e.className);
        const f = [...document.querySelectorAll('.portada .menu-fila')].map(b => b.getBoundingClientRect());
        const pisa = f.some((p, i) => f.some((q, j) => i < j && !(p.right <= q.left + 1 || p.left >= q.right - 1 || p.bottom <= q.top + 1 || p.top >= q.bottom - 1)));
        return { sinScrollX: sc.scrollWidth <= sc.clientWidth && document.documentElement.scrollWidth <= innerWidth, corta, pisa, minAlto: Math.round(Math.min(...f.map(p => p.height))), minAncho: Math.round(Math.min(...f.map(p => p.width))) }; });
      if (!(r.sinScrollX && r.corta.length === 0 && !r.pisa && r.minAlto >= 60 && r.minAncho >= 100)) mal.push(`${JSON.stringify(modo)} ${w}×${h}: ${JSON.stringify(r)}`);
    }
  }
  await pg.evaluate(() => { Object.assign(S, { hd: false, legible: false }); aplicarModo(); });
  return [mal.length === 0, mal.length ? mal.slice(0, 4).join(' · ') : '4 modos × 7 tamaños: sin desbordar, cortar ni solaparse'];
});

await caso('botones de la portada · al pulsar se hunde 2 px, y con "reducir movimiento" no se mueve', BOTONES_J, async pg => {
  const sube = async () => { await pg.evaluate(() => rTitulo()); await pausa(300);
    await pg.evaluate(() => document.querySelector('#t-tienda').scrollIntoView({ block: 'center' })); const c = await pg.evaluate(() => { const r = document.querySelector('#t-tienda').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    await pg.mouse.move(c[0], c[1]); await pg.mouse.down(); await pausa(150);
    const t = await pg.evaluate(() => getComputedStyle(document.querySelector('#t-tienda')).transform); await pg.mouse.move(2, 2); await pg.mouse.up(); await pausa(100); return t; };
  const normal = await sube();
  await pg.emulateMedia({ reducedMotion: 'reduce' });
  const reducido = await sube();
  await pg.emulateMedia({ reducedMotion: 'no-preference' });
  return [/matrix\(1, 0, 0, 1, 0, 2\)|translateY\(2px\)/.test(normal) && (reducido === 'none' || /matrix\(1, 0, 0, 1, 0, 0\)/.test(reducido)), `normal: ${normal} · reducido: ${reducido}`];
});

await caso('botones de la portada · el foco del teclado se ve (contorno dorado) en tarjetas, dificultad, JUGAR y reto diario', BOTONES_J, async pg => {
  await pg.evaluate(() => rTitulo()); await pausa(300);
  const r = {};
  for (const sel of ['#t-tienda', '.dif-op[data-dif="1"]', '#t-jugar', '#t-reto']) {
    await pg.evaluate(() => document.body.focus()); await pg.keyboard.press('Tab'); await pg.focus(sel); await pg.keyboard.press('Shift+Tab'); await pg.keyboard.press('Tab'); await pausa(60);
    r[sel] = await pg.evaluate(s => { const e = document.querySelector(s), c = getComputedStyle(e); return { foco: document.activeElement === e, contorno: c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) >= 3 || /inset/.test(c.boxShadow) && /4px/.test(c.boxShadow) }; }, sel);
  }
  return [Object.values(r).every(v => v.foco && v.contorno), JSON.stringify(r)];
});

await caso('botones de la portada · ES y EN: los textos de las tarjetas salen y caben en los dos idiomas', BOTONES_J, async pg => {
  const mal = [];
  for (const lang of ['es', 'en']) {
    await pg.evaluate(l => { S.lang = l; guardar(); }, lang);
    for (const [w, h] of [[320, 568], [390, 760], [1280, 800]]) {
      await pg.setViewportSize({ width: w, height: h }); await pg.evaluate(() => rTitulo()); await pausa(300);
      const r = await pg.evaluate(() => ({ txt: [...document.querySelectorAll('.portada .menu-fila .m-txt')].map(e => e.textContent.trim()), corta: [...document.querySelectorAll('.portada .menu-fila .m-txt,.portada .dif-op')].filter(e => e.scrollWidth > e.clientWidth + 1).length, sc: document.querySelector('#screen').scrollWidth <= document.querySelector('#screen').clientWidth }));
      if (r.txt.length !== 9 || r.txt.some(x => !x) || r.corta || !r.sc) mal.push(`${lang} ${w}: ${JSON.stringify(r)}`);
    }
  }
  await pg.evaluate(() => { S.lang = 'es'; guardar(); });
  return [mal.length === 0, mal.length ? mal.join(' · ') : 'ES y EN × 3 tamaños: 9 textos, sin cortar'];
});

await caso('botones de la portada · fondo, título y aprendiz siguen ahí y las demás pantallas no cambian', BOTONES_J, async pg => {
  await pg.evaluate(() => rTitulo()); await pausa(500);
  const p = await pg.evaluate(() => ({ fondo: document.getElementById('app').classList.contains('fondo-campus'), titulo: !!document.querySelector('.tit-logo .tit-img, .tit-logo h1'), aprendiz: !!document.querySelector('#t-aprendiz'), portada: !!document.querySelector('.centro.portada') }));
  const otras = await pg.evaluate(() => { const o = {};
    for (const [n, f] of [['libre', () => rLibre()], ['sala', () => rSala()], ['tienda', () => rTienda()], ['logros', () => rLogros()], ['perso', () => rPerso()], ['borrar', () => rBorrar()]]) { f();
      const m = document.querySelector('#screen .menu-fila'); o[n] = { portada: !!document.querySelector('.portada'), sombra: m ? getComputedStyle(m).boxShadow.includes('rgb(18, 24, 47)') : false, minAlto: m ? getComputedStyle(m).minHeight : '' }; }
    return o; });
  const sinCambios = Object.values(otras).every(v => !v.portada && !v.sombra && v.minAlto !== '76px');
  return [p.fondo && p.titulo && p.aprendiz && p.portada && sinCambios, JSON.stringify({ p, otras })];
});

/* ── LA FICHA DE JUGADOR DE LA PORTADA (v31) ──
   Lo que no puede romperse: que los números sean los de la partida (y cambien con ella), que
   siga siendo un solo botón que abre la personalización, que el retrato lleve lo que elegiste
   allí (piel, camisa, accesorio, detalle 16/32), que quepa en todos los tamaños y modos, y que
   las demás pantallas no cambien. */
const FICHA_J = { intro: true, nombre: 'ANTONI', pts: 900, xp: 1700, version: 'v31', accs: ['gafas', 'gorra'], dias: [3, 2, 3, 1, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
const leeFicha = pg => pg.evaluate(() => { const b = document.querySelector('#t-perso');
  return { nombre: b.querySelector('.av-nombre').textContent.trim(), rango: b.querySelector('.av-rango').textContent.trim(), xp: b.querySelector('.av-xp').textContent.replace(/\s+/g, ' ').trim(),
    est: b.querySelector('.av-estrellas').textContent.replace(/\s+/g, ' ').trim(), dias: b.querySelector('.av-dias').textContent.trim(), pc: b.querySelector('.p-pc').textContent.trim(),
    /* v35: la barra de campaña es un medidor RPG (barraRpg); su relleno exacto va en --rpg-hasta */
    barra: Math.round(parseFloat(b.querySelector('.rpg-medidor').style.getPropertyValue('--rpg-hasta'))) + '%',
    esperado: { nombre: S.nombre, rango: rangoNom(), xp: `XP ${S.xp}${progresoXp().sig ? ' / ' + progresoXp().sig.xp : ''}`, est: `★ ${totalStars()} / ${TOT_DIAS * 3}`, dias: `${progreso()}/${TOT_DIAS}`, pc: Math.round(progreso() / TOT_DIAS * 100) + '%' } }; });
const cuadra = f => f.nombre === f.esperado.nombre && f.rango === f.esperado.rango && f.xp === f.esperado.xp && f.est === f.esperado.est && f.dias === f.esperado.dias && f.pc === f.esperado.pc && f.barra === f.pc;
const huellaAv = pg => pg.evaluate(() => { const cv = document.querySelector('#t-av'); const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let s = 0; for (let i = 0; i < d.length; i++) s = (s * 31 + d[i]) >>> 0; return cv.width + ':' + s; });

await caso('ficha de la portada · enseña los datos reales: nombre, rango, XP, estrellas y días de campaña', FICHA_J, async pg => {
  await pg.evaluate(() => rTitulo()); await pausa(200);
  const f = await leeFicha(pg);
  return [cuadra(f) && f.dias === '6/15' && f.est === '★ 14 / 45' && f.pc === '40%', JSON.stringify(f)];
});

await caso('ficha de la portada · al superar un día cambian estrellas, días, porcentaje, XP y rango (también tras recargar)', FICHA_J, async pg => {
  await pg.evaluate(() => rTitulo()); await pausa(200);
  const antes = await leeFicha(pg);
  await pg.evaluate(() => { S.dias[6] = 3; S.xp = 6000; guardar(); rTitulo(); }); await pausa(200);
  const despues = await leeFicha(pg);
  await pg.reload({ waitUntil: 'load' }); await pg.waitForFunction(() => typeof pantallaId !== 'undefined'); await pg.evaluate(() => rTitulo()); await pausa(300);
  const recargado = await leeFicha(pg);
  const ok = cuadra(despues) && cuadra(recargado) && despues.dias === '7/15' && despues.est === '★ 17 / 45' && despues.pc === '47%' && despues.rango !== antes.rango && recargado.xp === despues.xp;
  return [ok, JSON.stringify({ antes: [antes.rango, antes.xp, antes.est, antes.dias], despues: [despues.rango, despues.xp, despues.est, despues.dias, despues.pc], recargado: [recargado.xp, recargado.dias] })];
});

await caso('ficha de la portada · en el rango máximo solo sale la XP, y sin nombre sale TÚ / YOU (el nombre va escapado)', FICHA_J, async pg => {
  await pg.evaluate(() => { S.xp = 999999; rTitulo(); }); await pausa(150);
  const max = await leeFicha(pg);
  await pg.evaluate(() => { S.nombre = ''; rTitulo(); }); await pausa(150);
  const es = await pg.evaluate(() => document.querySelector('.av-nombre').textContent.trim());
  await pg.evaluate(() => { S.lang = 'en'; rTitulo(); }); await pausa(150);
  const en = await pg.evaluate(() => document.querySelector('.av-nombre').textContent.trim());
  await pg.evaluate(() => { S.lang = 'es'; S.nombre = 'A<b>B'; rTitulo(); }); await pausa(150);
  const raro = await pg.evaluate(() => ({ txt: document.querySelector('.av-nombre').textContent, etiquetas: document.querySelectorAll('.av-nombre *').length }));
  return [max.xp === max.esperado.xp && !max.xp.includes('/') && es === 'TÚ' && en === 'YOU' && raro.etiquetas === 0, JSON.stringify({ xp: max.xp, es, en, raro })];
});

await caso('ficha de la portada · es un solo botón: con clic, Enter y Espacio abre Mi Avatar', FICHA_J, async pg => {
  const r = {};
  for (const modo of ['clic', 'Enter', 'Space']) {
    await pg.evaluate(() => rTitulo()); await pausa(150);
    if (modo === 'clic') await pg.click('#t-perso'); else { await pg.focus('#t-perso'); await pg.keyboard.press(modo); }
    await pausa(250); r[modo] = await pg.evaluate(() => pantallaId);
  }
  const unico = await pg.evaluate(() => { rTitulo(); const b = document.querySelector('#t-perso'); return { botones: b.querySelectorAll('button,a,input').length, divs: b.querySelectorAll('div').length }; });
  return [Object.values(r).every(p => p === 'perso') && unico.botones === 0 && unico.divs === 0, JSON.stringify({ r, unico })];
});

await caso('ficha de la portada · el retrato lleva lo que eliges en Mi Avatar: piel, camisa, accesorio y detalle 16/32', FICHA_J, async pg => {
  await pg.evaluate(() => rTitulo()); await pausa(200);
  const h0 = await huellaAv(pg); const pasos = [];
  const vuelta = async (accion, nombre) => {
    await pg.click('#t-perso'); await pausa(200); await pg.evaluate(accion); await pausa(150);
    await pg.evaluate(() => document.getElementById('pe-volver').click()); await pausa(250);
    const p = await pg.evaluate(() => pantallaId); const h = await huellaAv(pg); pasos.push({ nombre, p, h }); return h;
  };
  const h1 = await vuelta(() => document.querySelector('.skin-op[data-s="2"]').click(), 'piel');
  const h2 = await vuelta(() => document.querySelector('.camisa-op[data-c="3"]').click(), 'camisa');
  const h3 = await vuelta(() => { document.querySelector('.acc-op[data-a="gafas"]').click(); document.getElementById('pe-si').click(); }, 'gafas');   /* v40.4: tocar prueba; EQUIPAR lo pone */
  const h4 = await vuelta(() => document.getElementById('pe-d32').click(), 'detalle 32');
  const s = await pg.evaluate(() => ({ skin: S.skin, camisa: S.camisa, acc: S.acc, av32: S.av32, ancho: document.querySelector('#t-av').width }));
  const distintas = new Set([h0, h1, h2, h3, h4]).size === 5;
  return [distintas && pasos.every(p => p.p === 'titulo') && s.skin === 2 && s.camisa === 3 && s.acc === 'gafas' && s.av32 && s.ancho === 32 && h0.startsWith('16:'), JSON.stringify({ s, pasos: pasos.map(p => p.nombre + '→' + p.p + ' ' + p.h.split(':')[0]) })];
});

await caso('ficha de la portada · se reparte bien en 7 tamaños, con HD y texto legible, en ES y EN: sin desbordar ni salirse', FICHA_J, async pg => {
  const mal = [];
  for (const modo of [{}, { hd: true }, { legible: true }, { hd: true, legible: true }, { lang: 'en', av32: true }]) {
    await pg.evaluate(m => { Object.assign(S, { hd: false, legible: false, lang: 'es', av32: false }, m); aplicarModo(); }, modo);
    for (const [w, h] of [[320, 568], [360, 640], [390, 760], [844, 390], [820, 1100], [1280, 800], [1920, 1080]]) {
      await pg.setViewportSize({ width: w, height: h }); await pg.evaluate(() => rTitulo()); await pausa(300);
      const r = await pg.evaluate(() => { const sc = document.querySelector('#screen'), b = document.querySelector('#t-perso'), bb = b.getBoundingClientRect();
        const fuera = [...b.querySelectorAll('span,b,canvas')].filter(e => { const q = e.getBoundingClientRect(); return q.width && (q.right > bb.right + 1 || q.left < bb.left - 1 || q.bottom > bb.bottom + 1); }).map(e => e.className || e.tagName);
        const corta = [...b.querySelectorAll('.av-xp,.av-estrellas,.av-dias,.p-pc,.p-lbl,.tit-av-txt b')].filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.className || e.tagName);
        const cv = document.querySelector('#t-av').getBoundingClientRect();
        return { sinScrollX: sc.scrollWidth <= sc.clientWidth && document.documentElement.scrollWidth <= innerWidth, fuera, corta, retrato: Math.round(cv.width), barra: Math.round(b.querySelector('.rpg-medidor').getBoundingClientRect().width) }; });
      if (!(r.sinScrollX && !r.fuera.length && !r.corta.length && r.retrato >= 40 && r.barra >= 40)) mal.push(`${JSON.stringify(modo)} ${w}×${h}: ${JSON.stringify(r)}`);
    }
  }
  await pg.evaluate(() => { Object.assign(S, { hd: false, legible: false, lang: 'es', av32: false }); aplicarModo(); });
  return [mal.length === 0, mal.length ? mal.slice(0, 4).join(' · ') : '5 modos × 7 tamaños: todo dentro de la ficha, sin scroll horizontal'];
});

await caso('ficha de la portada · con "reducir movimiento" el retrato no parpadea y la ficha no se hunde al pulsar', FICHA_J, async pg => {
  await pg.emulateMedia({ reducedMotion: 'reduce' });
  await pg.evaluate(() => rTitulo()); await pausa(200);
  const hs = new Set(); for (let i = 0; i < 12; i++) { hs.add(await huellaAv(pg)); await pausa(500); }
  await pg.evaluate(() => document.querySelector('#t-perso').scrollIntoView({ block: 'center' }));
  const c = await pg.evaluate(() => { const r = document.querySelector('#t-perso').getBoundingClientRect(); return [r.left + 20, r.top + 20]; });
  await pg.mouse.move(c[0], c[1]); await pg.mouse.down(); await pausa(120);
  const tr = await pg.evaluate(() => getComputedStyle(document.querySelector('#t-perso')).transform);
  await pg.mouse.move(1, 1); await pg.mouse.up(); await pg.emulateMedia({ reducedMotion: 'no-preference' });
  return [hs.size === 1 && tr === 'none', `dibujos distintos en 6 s: ${hs.size} · al pulsar: ${tr}`];
});

await caso('ficha de la portada · la pantalla de Mi Avatar y las demás no cambian (sin reglas de la ficha fuera de la portada)', FICHA_J, async pg => {
  const r = await pg.evaluate(() => { const o = {};
    for (const [n, f] of [['perso', () => rPerso()], ['tienda', () => rTienda()], ['logros', () => rLogros()], ['stats', () => rStats()], ['libre', () => rLibre()]]) { f();
      o[n] = { portada: !!document.querySelector('.portada'), ficha: document.querySelectorAll('.tit-avatar,.av-metricas,.tit-av-portrait').length }; }
    rPerso(); const cv = document.querySelector('#pe-cara'); o.peCara = cv ? [cv.width, cv.height] : null;
    return o; });
  return [['perso', 'tienda', 'logros', 'stats', 'libre'].every(n => !r[n].portada && r[n].ficha === 0) && r.peCara && r.peCara[0] === 64, JSON.stringify(r)];
});

/* ── LAS TRANSICIONES DE LA PORTADA (v32) ──
   Lo que no puede romperse: un grupo de chispas por activación (ratón, toque o teclado), sin
   duplicarse con el de pointerdown; la navegación inmediata y con UNA cortina; la entrada solo
   al llegar; el motor FX de siempre (un lienzo, nada que se acumule); los demás botones del
   juego con su efecto de antes; y nada de esto con "reducir movimiento". */
const TRANS_J = { intro: true, nombre: 'R', pts: 900, xp: 1700, version: 'v32', dias: [3, 2, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
/* pulsa `sel` como pide `modo` y cuenta, en el MISMO instante, cuántas partículas nuevas hay */
const activa = async (pg, sel, modo) => {
  await pg.evaluate(() => FX._vaciar());
  if (modo === 'teclado') { await pg.focus(sel); await pg.evaluate(() => FX._vaciar()); await pg.keyboard.press('Enter'); }
  else if (modo === 'toque') await pg.tap(sel);
  else await pg.click(sel);
  return pg.evaluate(() => ({ n: FX._vivas(), pant: pantallaId }));
};

await caso('transiciones de la portada · la portada entra con fundido solo al llegar, no al repintarla (dificultad, HD, idioma)', TRANS_J, async pg => {
  const lee = () => pg.evaluate(() => { const p = document.querySelector('#screen>.portada'); return { entrada: p.classList.contains('portada-entrada'), anim: getComputedStyle(p).animationName, screen: getComputedStyle(document.getElementById('screen')).animationName }; });
  await pg.evaluate(() => rTienda()); await pausa(100); await pg.evaluate(() => rTitulo()); await pausa(50);
  const llegar = await lee();
  await pg.click('.dif-op[data-dif="2"]'); await pausa(50); const dif = await lee();
  await pg.evaluate(() => document.getElementById('t-modo').click()); await pausa(50); const hd = await lee();
  await pg.evaluate(() => { S.hd = false; aplicarModo(); S.lang = 'en'; rehacerPantalla(); }); await pausa(50); const idioma = await lee();
  await pg.evaluate(() => { S.lang = 'es'; rTienda(); rTitulo(); }); await pausa(50); const volver = await lee();
  const ok = llegar.entrada && llegar.anim === 'portada-entrada' && llegar.screen === 'none' && !dif.entrada && dif.anim === 'none' && dif.screen === 'none' && !hd.entrada && !idioma.entrada && volver.entrada;
  return [ok, JSON.stringify({ llegar, dif, hd, idioma, volver })];
});

await caso('transiciones de la portada · un grupo de chispas por activación: 6 con ratón, toque o teclado (no 12)', TRANS_J, async pg => {
  const r = {};
  for (const modo of ['raton', 'toque', 'teclado']) { await pg.evaluate(() => rTitulo()); await pausa(80); r['dif ' + modo] = (await activa(pg, '.dif-op[data-dif="0"]', modo)).n; }
  for (const modo of ['raton', 'teclado']) { await pg.evaluate(() => rTitulo()); await pausa(80); r['reto ' + modo] = await activa(pg, '#t-reto', modo); }
  const reto = Object.entries(r).filter(([k]) => k.startsWith('reto')).every(([, v]) => v.pant === 'reto' && v.n === 7);
  return [r['dif raton'] === 6 && r['dif toque'] === 6 && r['dif teclado'] === 6 && reto, JSON.stringify(r) + ' (reto: 6 chispas + la cortina del cambio de pantalla)'];
}, { hasTouch: true });

await caso('transiciones de la portada · JUGAR suelta 10 chispas y una onda y entra al instante, con una sola cortina', TRANS_J, async pg => {
  await pg.evaluate(() => rTitulo()); await pausa(100);
  const raton = await activa(pg, '#t-jugar', 'raton');
  await pg.evaluate(() => rTitulo()); await pausa(100);
  const teclado = await activa(pg, '#t-jugar', 'teclado');
  return [raton.pant !== 'titulo' && raton.n === 12 && teclado.pant !== 'titulo' && teclado.n === 12, JSON.stringify({ raton, teclado }) + ' (10 chispas + 1 onda + 1 cortina)'];
});

await caso('transiciones de la portada · JUGAR de primer uso sigue igual: sin nombre → nombre; sin intro → historia', null, async pg => {
  await prep(pg, { nombre: '', intro: false }); await pg.evaluate(() => rTitulo()); await pausa(150);
  await pg.click('#t-jugar'); await pausa(100); const sinNombre = await pg.evaluate(() => pantallaId);
  await pg.evaluate(() => { S.nombre = 'R'; S.intro = false; rTitulo(); }); await pausa(150);
  await pg.click('#t-jugar'); await pausa(100); const sinIntro = await pg.evaluate(() => pantallaId);
  return [sinNombre === 'nombre' && sinIntro === 'cut', JSON.stringify({ sinNombre, sinIntro })];
});

await caso('transiciones de la portada · la dificultad elegida destella en dorado (y el foco del teclado no se pierde)', TRANS_J, async pg => {
  await pg.evaluate(() => rTitulo()); await pausa(100);
  await pg.click('.dif-op[data-dif="2"]'); await pausa(30);
  const r = await pg.evaluate(() => { const e = document.querySelector('.dif-op.sel'); return { dif: e.dataset.dif, conf: e.classList.contains('portada-confirmada'), anim: getComputedStyle(e).animationName, otras: document.querySelectorAll('.portada-confirmada').length }; });
  await pg.focus('.dif-op[data-dif="0"]'); await pg.keyboard.press('Enter'); await pausa(60);
  const foco = await pg.evaluate(() => ({ activo: document.activeElement?.dataset?.dif, conf: document.activeElement?.classList.contains('portada-confirmada') }));
  return [r.dif === '2' && r.conf && r.anim === 'portada-confirmar' && r.otras === 1 && foco.activo === '0' && foco.conf, JSON.stringify({ r, foco })];
});

await caso('transiciones de la portada · los iconos se levantan al pasar el ratón o con el foco del teclado', TRANS_J, async pg => {
  await pg.setViewportSize({ width: 1280, height: 800 }); await pg.evaluate(() => rTitulo()); await pausa(300);
  const tr = s => pg.evaluate(q => getComputedStyle(document.querySelector(q)).transform, s);
  const reposo = await tr('#t-tienda .m-ico');
  await pg.hover('#t-tienda'); await pausa(250); const hover = await tr('#t-tienda .m-ico');
  await pg.mouse.move(1, 1); await pg.focus('#t-logros'); await pg.keyboard.press('Shift+Tab'); await pg.keyboard.press('Tab'); await pausa(250);
  const foco = await tr('#t-logros .m-ico');
  await pg.hover('#t-perso'); await pausa(250); const chev = await tr('#t-perso .m-chev');
  const sube = /matrix\(1, 0, 0, 1, 0, -2\)/;
  return [reposo === 'none' && sube.test(hover) && sube.test(foco) && /matrix\(1, 0, 0, 1, 3, 0\)/.test(chev), JSON.stringify({ reposo, hover, foco, chev })];
});

await caso('transiciones de la portada · con "reducir movimiento": ni chispas, ni fundido, ni destello, ni iconos que se mueven', TRANS_J, async pg => {
  await pg.emulateMedia({ reducedMotion: 'reduce' });
  await pg.setViewportSize({ width: 1280, height: 800 }); await pg.evaluate(() => { rTienda(); rTitulo(); }); await pausa(200);
  const entrada = await pg.evaluate(() => getComputedStyle(document.querySelector('#screen>.portada')).animationName);
  const n = [];
  for (const s of ['.dif-op[data-dif="2"]', '#t-sinfin']) { await pg.evaluate(() => rTitulo()); await pausa(80); n.push((await activa(pg, s, 'raton')).n); }
  await pg.evaluate(() => rTitulo()); await pausa(80); await pg.click('.dif-op[data-dif="1"]'); await pausa(30);
  const conf = await pg.evaluate(() => getComputedStyle(document.querySelector('.dif-op.sel')).animationName);
  await pg.hover('#t-tienda'); await pausa(200);
  const ico = await pg.evaluate(() => ({ t: getComputedStyle(document.querySelector('#t-tienda .m-ico')).transform, tr: getComputedStyle(document.querySelector('#t-tienda')).transitionDuration }));
  await pg.focus('#t-logros'); await pg.keyboard.press('Shift+Tab'); await pg.keyboard.press('Tab'); await pausa(80);
  const foco = await pg.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  await pg.emulateMedia({ reducedMotion: 'no-preference' });
  return [entrada === 'none' && n.every(x => x === 0) && conf === 'none' && ico.t === 'none' && ico.tr === '0s' && foco !== 'none', JSON.stringify({ entrada, n, conf, ico, foco })];
});

await caso('transiciones de la portada · fuera de la portada los botones conservan su efecto de siempre (al apretar)', TRANS_J, async pg => {
  await pg.evaluate(() => rTienda()); await pausa(150);
  const b = await pg.evaluate(() => { const e = [...document.querySelectorAll('#screen button')].find(x => !x.disabled && x.getBoundingClientRect().height > 0); e.id = e.id || 'b-prueba'; return '#' + e.id; });
  await pg.evaluate(() => FX._vaciar());
  const c = await pg.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); return [r.left + 5, r.top + 5]; }, b);
  await pg.mouse.move(c[0], c[1]); await pg.mouse.down();
  const n = await pg.evaluate(() => FX._vivas()); await pg.mouse.up();
  return [n === 6, `${b}: ${n} chispas al apretar`];
});

await caso('transiciones de la portada · el motor FX no se duplica: un lienzo y las partículas se van solas', TRANS_J, async pg => {
  for (let i = 0; i < 8; i++) { await pg.evaluate(() => rTitulo()); await pg.click('.dif-op[data-dif="' + (i % 3) + '"]'); await pg.click('#t-tienda'); }
  await pg.evaluate(() => rTitulo()); await pg.click('#t-jugar');
  const lienzos = await pg.evaluate(() => [...document.body.children].filter(e => e.tagName === 'CANVAS' && e.style.position === 'fixed').length);
  await pausa(1800);
  const quedan = await pg.evaluate(() => FX._vivas());
  return [lienzos === 1 && quedan === 0, `lienzos de efectos: ${lienzos} · partículas vivas tras 1,8 s: ${quedan}`];
});

/* ── EL ARTE NUEVO DEL APRENDIZ (v33) ──
   Lo que no puede romperse: que el jugador salga con el atlas nuevo en TODOS los sitios donde
   sale (portada, pasillo, mapa, runner y jefe) y los personajes del pasillo con el clásico; que
   si el nuevo no carga se vea el clásico; que la portada use sus poses (y solo la de reposo con
   "reducir movimiento"); y que los pies queden donde estaban (mismo contrato que el clásico). */
const HD_J = { intro: true, nombre: 'R', pts: 900, xp: 1700, version: 'v33', t2: true, skin: 2, camisa: 3, dias: [3, 3, 3, 2, 3, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  vistos: ['escribir', 'bugs', 'memoria', 'simon', 'quiz', 'review', 'merge', 'runner', 'sql', 'regex', 'terminal', 'orden', 'jefe'] };
/* Marca cada lienzo recoloreado con el atlas del que salió, y anota qué atlas (y qué columna)
   se pinta en pantalla: window.__atlas = [{o:'hd'|'clasico'|'portada', sx}] */
/* 'hd' y 'portada' = el atlas del jugador: el HD de v33 o, desde v40.1, el masculino premium que lo sustituye */
const espiaAtlas = () => {
  const d = CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage = function (src, ...a) {
    if (src && src.src && /npc\/pasillo\.png/.test(src.src) && a.length >= 8) (window.__atlas = window.__atlas || []).push({ o: 'npc', sx: a[0] });
    else if (src && src.src) { const o = /portada-hd|masculino-premium-portada/.test(src.src) ? 'portada' : /caminar-hd|masculino-premium-caminar/.test(src.src) ? 'hd' : /aprendiz-caminar\.png/.test(src.src) ? 'clasico' : null; if (o && this.canvas) this.canvas.__origen = o; }
    else if (src && src.__origen && a.length >= 8) (window.__atlas = window.__atlas || []).push({ o: src.__origen, sx: a[0] });
    return d.call(this, src, ...a);
  };
};
/* el espía tiene que estar ANTES de que se cree ningún atlas recoloreado (se cachean) */
const conEspia = async pg => { await pg.addInitScript(espiaAtlas); await pg.reload({ waitUntil: 'load' }); await pg.waitForFunction(() => typeof pantallaId !== 'undefined'); };
const atlasEn = async (pg, fn, ms = 700) => { await pg.evaluate(() => { window.__atlas = []; }); await pg.evaluate(fn); await pausa(ms); return pg.evaluate(() => [...new Set(window.__atlas.map(x => x.o))].sort().join(',')); };

await caso('aprendiz nuevo · el jugador sale con el atlas nuevo en portada, pasillo, mapa, runner y jefe; los personajes del pasillo con el clásico', HD_J, async pg => {
  await conEspia(pg); await pg.waitForFunction(() => APRENDIZ.listoPortada); await pausa(300);
  const r = {};
  r.portada = await atlasEn(pg, () => rTitulo());
  r.mapa = await atlasEn(pg, () => rMapaLista());
  r.runner = await atlasEn(pg, () => { diaAct = 4; vidas = 3; nvRunner(4); }, 1500);
  r.jefe = await atlasEn(pg, () => { diaAct = 9; vidas = 3; nvJefe(9, 0); }, 2500);
  await pg.evaluate(() => rPasillo());
  await pausa(300);
  r.pasillo = await atlasEn(pg, () => { const e = document.querySelector('#pasillo-escena'); e.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); }, 600);
  const npc = await pg.evaluate(() => { window.__atlas = []; const k = document.createElement('canvas').getContext('2d'); APRENDIZ.dibujar(k, 22, 73, 71, 0, 0, '#e0b088', '#2c3460'); APRENDIZ.dibujar(k, 22, 73, 71, 0, 0, 2, 3); return window.__atlas.map(x => x.o).join(','); });
  const ok = r.portada === 'portada' && r.mapa === 'hd' && r.runner === 'hd' && r.jefe === 'hd' && r.pasillo.includes('hd') && npc === 'clasico,hd';
  return [ok, JSON.stringify({ ...r, 'NPC,jugador': npc })];
});

/* v38: los personajes del pasillo tienen su propio atlas (img/npc/pasillo.png, js/npc-sprites.js);
   el cuerpo del aprendiz recoloreado (atlas clásico) queda solo de respaldo si ese no carga. */
await caso('aprendiz nuevo · en el pasillo, el jugador con su atlas y los personajes con el suyo (el clásico solo si el de ellos no carga)', HD_J, async pg => {
  await conEspia(pg); await pg.waitForFunction(() => APRENDIZ.listoPortada && NPC_PASILLO.listo);
  const normal = await atlasEn(pg, () => rPasillo(), 1200);
  const npcs = await pg.evaluate(() => document.querySelectorAll('.pasillo-gente').length);
  await pg.route(/img\/npc\/pasillo\.png/, r => r.abort());
  await conEspia(pg); await pg.waitForFunction(() => APRENDIZ.listo); await pausa(400);
  const sinNpc = await atlasEn(pg, () => rPasillo(), 1200);
  return [npcs > 0 && normal === 'hd,npc' && sinNpc.includes('clasico') && sinNpc.includes('hd') && !sinNpc.includes('npc'), `con su atlas: ${normal} · sin él: ${sinNpc} · personajes: ${npcs}`];
});

await caso('aprendiz nuevo · si el atlas nuevo no carga, el jugador sale con el clásico (y la portada con su reposo)', HD_J, async pg => {
  await pg.route(/aprendiz-(caminar|portada)-hd\.png|aprendiz-masculino-premium-/, r => r.abort());
  await conEspia(pg); await pg.waitForFunction(() => APRENDIZ.listo); await pausa(300);
  const portada = await atlasEn(pg, () => rTitulo(), 900);
  const mapa = await atlasEn(pg, () => rMapaLista());
  const poses = await pg.evaluate(() => APRENDIZ.listoPortada);
  return [portada === 'clasico' && mapa === 'clasico' && poses === false, JSON.stringify({ portada, mapa, poses })];
});

await caso('aprendiz nuevo · la portada usa sus poses: reposo, parpadeo y saludo (al pasar por JUGAR)', HD_J, async pg => {
  await conEspia(pg); await pg.waitForFunction(() => APRENDIZ.listoPortada);
  await pg.evaluate(() => { window.__atlas = []; rTitulo(); }); await pausa(400);
  await pg.hover('#t-jugar'); await pausa(500);
  await pg.mouse.move(1, 1); await pausa(4300);                     /* el parpadeo llega a los 3,7 s */
  const poses = await pg.evaluate(() => [...new Set(window.__atlas.filter(x => x.o === 'portada').map(x => x.sx / 44))].sort());
  return [poses.includes(0) && poses.includes(1) && poses.includes(2) && poses.includes(3), `poses vistas: ${poses.join(',')} (0 reposo, 1 parpadeo, 2-3 saludo)`];
});

await caso('aprendiz nuevo · con "reducir movimiento" la portada se queda en la pose de reposo', HD_J, async pg => {
  await pg.emulateMedia({ reducedMotion: 'reduce' });
  await conEspia(pg); await pg.waitForFunction(() => APRENDIZ.listoPortada);
  await pg.evaluate(() => { window.__atlas = []; rTitulo(); }); await pausa(600);
  await pg.hover('#t-jugar'); await pausa(1500);
  const poses = await pg.evaluate(() => [...new Set(window.__atlas.filter(x => x.o === 'portada').map(x => x.sx / 44))]);
  await pg.emulateMedia({ reducedMotion: 'no-preference' });
  return [poses.length === 1 && poses[0] === 0, `poses: ${poses.join(',')}`];
});

await caso('aprendiz nuevo · 16 combinaciones × 8 direcciones × 4 pasos: todas se pintan y los pies quedan donde en el clásico', HD_J, async pg => {
  await pg.waitForFunction(() => APRENDIZ.listoPortada && APRENDIZ.listo);
  const r = await pg.evaluate(async () => {
    const pie = (src, fila, col) => { const k = document.createElement('canvas'); k.width = 44; k.height = 74; const c = k.getContext('2d'); c.drawImage(src, col * 44, fila * 74, 44, 74, 0, 0, 44, 74); const d = c.getImageData(0, 0, 44, 74).data; let b = -1, n = 0; for (let y = 0; y < 74; y++) for (let x = 0; x < 44; x++) if (d[(y * 44 + x) * 4 + 3] > 0) { b = y; n++; } return { b, n }; };
    const carga = u => new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.src = u; });
    const hd = await carga('img/aprendiz-caminar-hd.png'), cl = await carga('img/aprendiz-caminar.png'), po = await carga('img/aprendiz-portada-hd.png');
    const mal = [];
    for (let f = 0; f < 8; f++) for (let p = 0; p < 4; p++) { const a = pie(hd, f, p), b = pie(cl, f, p); if (a.n < 300 || Math.abs(a.b - b.b) > 2) mal.push(`dir ${f} paso ${p}: pie ${a.b} vs ${b.b}, ${a.n} px`); }
    for (let p = 0; p < 4; p++) { const a = pie(po, 0, p), b = pie(cl, 0, 0); if (a.n < 300 || Math.abs(a.b - b.b) > 2) mal.push(`pose ${p}: pie ${a.b} vs ${b.b}`); }
    /* y las 16 × 8 × 4 se recolorean y pintan sin error, con algo dentro */
    let pintadas = 0; const k = document.createElement('canvas'); k.width = 44; k.height = 74; const c = k.getContext('2d', { willReadFrequently: true });
    for (let s = 0; s < 4; s++) for (let m = 0; m < 4; m++) for (let d = 0; d < 8; d++) for (let p = 0; p < 4; p++) { c.clearRect(0, 0, 44, 74); if (APRENDIZ.dibujar(c, 22, 74, 74, d, p, s, m) && c.getImageData(0, 0, 44, 74).data.some((v, i) => i % 4 === 3 && v > 0)) pintadas++; }
    return { mal, pintadas };
  });
  return [r.mal.length === 0 && r.pintadas === 512, r.mal.length ? r.mal.slice(0, 5).join(' · ') : `512 de 512 cuadros pintados; pies a la altura del clásico en las 32 de caminata y las 4 poses`];
});

await caso('aprendiz nuevo · la camisa y la piel elegidas se aplican (el azul y la piel de referencia no quedan)', HD_J, async pg => {
  await pg.waitForFunction(() => APRENDIZ.listo);
  const r = await pg.evaluate(() => {
    const cuenta = (s, m) => { const k = document.createElement('canvas'); k.width = 44; k.height = 74; const c = k.getContext('2d'); APRENDIZ.dibujar(c, 22, 74, 74, 0, 0, s, m); const d = c.getImageData(0, 0, 44, 74).data; let azul = 0, piel = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3]) { const q = (r, g, b) => (d[i] - r) ** 2 + (d[i + 1] - g) ** 2 + (d[i + 2] - b) ** 2 < 300; if (q(23, 104, 157)) azul++; if (q(245, 203, 154)) piel++; } return { azul, piel }; };
    return { verdeOscura: cuenta(3, 0), rojaMedia: cuenta(2, 3) };
  });
  return [r.verdeOscura.azul === 0 && r.verdeOscura.piel === 0 && r.rojaMedia.azul === 0 && r.rojaMedia.piel === 0, JSON.stringify(r)];
});

/* ── LOS ICONOS DE 32×32 DE LA PORTADA (v34) ──
   Lo que no puede romperse: que la portada enseñe los 15 dibujos nuevos (incrustados: ninguna
   petición de red), que el resto del juego siga con los de siempre, que se vean a un tamaño
   legible en móvil y escritorio y que nada desborde. */
const ICONOS_J = { intro: true, nombre: 'R', pts: 900, xp: 1700, version: 'v34', t2: true, dias: [3, 2, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
const clavesPortada = () => pg => pg.evaluate(() => [...document.querySelectorAll('#screen .pxi-portada')].map(i => Object.keys(PXI_PORTADA).find(k => PXI_PORTADA[k] === i.getAttribute('src'))));

await caso('iconos de la portada · salen los 15 dibujos de 32×32 (el joystick, al activar HD o texto pixel), cargados y sin pedir nada a la red', ICONOS_J, async pg => {
  const pedidos = []; pg.on('request', q => { if (/iconos|recursos|\.png/.test(q.url()) && !/aprendiz|titulo|fondo|jefe|retratos|icon-180|img\/portada\/|pasillo-hd/.test(q.url())) pedidos.push(q.url()); });
  const vistas = new Set();
  for (const modo of [{}, { hd: true, legible: true }]) {
    await pg.evaluate(m => { Object.assign(S, { hd: false, legible: false }, m); aplicarModo(); rTitulo(); }, modo); await pausa(400);
    (await clavesPortada()(pg)).forEach(k => vistas.add(k));
  }
  const cargados = await pg.evaluate(() => [...document.querySelectorAll('.pxi-portada')].every(i => i.complete && i.naturalWidth === 32 && i.naturalHeight === 32));
  await pg.evaluate(() => { Object.assign(S, { hd: false, legible: false }); aplicarModo(); });
  const faltan = await pg.evaluate(v => Object.keys(PXI_PORTADA).filter(k => !v.includes(k)), [...vistas]);
  return [faltan.length === 0 && cargados && pedidos.length === 0, `vistos ${vistas.size}/15${faltan.length ? ' · faltan ' + faltan.join(' ') : ''} · cargados a 32×32: ${cargados} · peticiones: ${pedidos.length}`];
});

await caso('iconos de la portada · la llama de la racha y el resto del juego siguen con los iconos de siempre', ICONOS_J, async pg => {
  await pg.evaluate(() => { const d = new Date(); S.reto = { fecha: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, racha: 3 }; rTitulo(); }); await pausa(200);
  const llama = await pg.evaluate(() => { const l = document.querySelector('.r-llama img'); return l ? l.classList.contains('pxi-portada') : null; });
  const otras = await pg.evaluate(() => { const o = {}; for (const [n, f] of [['libre', () => rLibre()], ['tienda', () => rTienda()], ['logros', () => rLogros()], ['pasillo', () => rPasillo()], ['mapa', () => rMapaLista()], ['perso', () => rPerso()], ['stats', () => rStats()]]) { f(); o[n] = { premium: document.querySelectorAll('#screen .pxi-portada').length, clasicos: document.querySelectorAll('#screen img.pxi').length }; } return o; });
  const ok = llama === false && Object.values(otras).every(v => v.premium === 0) && Object.values(otras).some(v => v.clasicos > 0);
  return [ok, JSON.stringify({ llamaPremium: llama, otras })];
});

await caso('iconos de la portada · tamaño legible: tarjetas 32 px en móvil y ≥ 36 en escritorio, dificultad y reto 24, sin desbordar', ICONOS_J, async pg => {
  const mal = [], vistos = {};
  for (const [w, h] of [[320, 568], [390, 760], [844, 390], [820, 1100], [1280, 800], [1920, 1080]]) {
    await pg.setViewportSize({ width: w, height: h }); await pg.evaluate(() => rTitulo()); await pausa(300);
    const r = await pg.evaluate(() => { const t = s => [...new Set([...document.querySelectorAll(s)].map(i => Math.round(i.getBoundingClientRect().width)))];
      const sc = document.querySelector('#screen');
      const fuera = [...document.querySelectorAll('.portada .pxi-portada')].filter(i => { const c = i.closest('button,.tit-id').getBoundingClientRect(), q = i.getBoundingClientRect(); return q.left < c.left - 1 || q.right > c.right + 1 || q.top < c.top - 1 || q.bottom > c.bottom + 1; }).length;
      return { tarjeta: t('.m-ico .pxi-portada'), dif: t('.dif-ico .pxi-portada'), reto: t('.tit-reto>span>.pxi-portada'), ficha: t('.av-rango .pxi-portada'), fuera, scroll: sc.scrollWidth > sc.clientWidth }; });
    vistos[`${w}`] = r.tarjeta.join('/');
    const movil = w <= 560;
    const ok = r.tarjeta.length === 1 && (movil ? r.tarjeta[0] === 32 : r.tarjeta[0] >= 36) && r.dif.every(x => x >= 24) && r.reto.every(x => x >= 24) && r.ficha.every(x => x >= 16) && !r.fuera && !r.scroll;
    if (!ok) mal.push(`${w}×${h}: ${JSON.stringify(r)}`);
  }
  return [mal.length === 0, mal.length ? mal.join(' · ') : 'tarjetas por ancho: ' + JSON.stringify(vistos)];
});

/* ── LAS BARRAS RPG (v35) ──
   Lo que no puede romperse: que las barras digan lo mismo que progresoXp() y progreso() (y el
   HUD lo mismo que la portada), que la XP ganada sea la de siempre, que la animación del
   resultado salga solo una vez (no al cambiar de idioma) y sin retrasar los botones, y que
   con "reducir movimiento" no se anime. */
const BARRAS_J = { intro: true, nombre: 'R', pts: 900, xp: 6200, version: 'v35', t2: true, dias: [3, 3, 3, 2, 3, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  vistos: ['escribir', 'bugs', 'memoria', 'simon', 'quiz', 'review', 'merge', 'runner', 'sql', 'regex', 'terminal', 'orden', 'jefe'] };
const medidor = (pg, sel) => pg.evaluate(s => { const m = document.querySelector(s); if (!m) return null; const cs = getComputedStyle(m);
  return { tipo: m.dataset.tipo, hasta: parseFloat(m.style.getPropertyValue('--rpg-hasta')), desde: parseFloat(m.style.getPropertyValue('--rpg-desde')), animar: m.dataset.animar, completo: m.dataset.completo,
    rol: m.getAttribute('role'), valor: m.getAttribute('aria-valuenow'), oculto: m.getAttribute('aria-hidden'), celda: cs.getPropertyValue('--rpg-celda').trim(), borde: cs.borderTopColor,
    anim: getComputedStyle(m.querySelector('.rpg-relleno')).animationName }; }, sel);

await caso('barras RPG · portada, HUD y ficha dicen lo mismo que progresoXp() y progreso() (10, 6 y 15 divisiones)', BARRAS_J, async pg => {
  await pg.evaluate(() => rTitulo()); await pausa(200);
  const xp = await medidor(pg, '.rpg-xp-bloque .rpg-medidor'), hud = await medidor(pg, '#h-vidas .rpg-medidor'), cam = await medidor(pg, '#t-perso .rpg-medidor');
  const real = await pg.evaluate(() => ({ pc: progresoXp().pc, sig: progresoXp().sig ? tj(progresoXp().sig) : null, dias: progreso(), tot: TOT_DIAS, cab: document.querySelector('.rpg-xp-cab').textContent.replace(/\s+/g, ' ').trim(), botonesDentro: document.querySelectorAll('#t-perso [role]').length }));
  const ok = xp.hasta === real.pc && xp.rol === 'progressbar' && +xp.valor === real.pc && xp.celda === '10%' && hud.hasta === real.pc && hud.celda.startsWith('16.66')
    && Math.abs(cam.hasta - real.dias / real.tot * 100) < 1e-9 && cam.celda.startsWith('6.66') && cam.oculto === 'true' && !cam.rol && real.botonesDentro === 0
    && real.cab.includes(real.pc + '%') && real.cab.includes(real.sig) && xp.animar === 'false';
  return [ok, JSON.stringify({ xp: [xp.hasta, xp.celda], hud: [hud.hasta, hud.celda], campaña: [cam.hasta, cam.celda, cam.oculto], real })];
});

await caso('barras RPG · al completar la campaña y en el rango máximo, borde dorado y "rango máximo"', BARRAS_J, async pg => {
  await pg.evaluate(() => { S.dias = Array(TOT_DIAS).fill(3); S.xp = 999999; rTitulo(); }); await pausa(200);
  const xp = await medidor(pg, '.rpg-xp-bloque .rpg-medidor'), cam = await medidor(pg, '#t-perso .rpg-medidor');
  const cab = await pg.evaluate(() => ({ cab: document.querySelector('.rpg-xp-cab').textContent, max: t('rango_max') }));
  await pg.evaluate(() => { S.dias[14] = 0; rTitulo(); }); await pausa(100);
  const cam14 = await medidor(pg, '#t-perso .rpg-medidor');
  const dorado = c => /rgb\(229, 189, 80\)/.test(c);
  return [xp.completo === 'true' && cam.completo === 'true' && dorado(cam.borde) && dorado(xp.borde) && cab.cab.includes(cab.max) && cam14.completo === 'false' && !dorado(cam14.borde), JSON.stringify({ xp: [xp.completo, xp.borde], cam: [cam.completo, cam.borde], cam14: [cam14.hasta, cam14.borde] })];
});

await caso('barras RPG · el resultado gana la XP de siempre y la barra crece desde donde estaba (o desde 0 al subir de rango)', BARRAS_J, async pg => {
  const juega = (xp, pts) => pg.evaluate(([x, a]) => { S.xp = x; S.dias[7] = 0; const antes = progresoXp().pc, rAntes = rangoDe(S.xp); const esperada = Math.round(a * facPts() * facRepite(S.dias[7]));
    diaAct = 7; vidas = 3; resultado(7, 3, a); const m = document.querySelector('.rpg-resultado .rpg-medidor');
    return { gano: S.xp - x, esperada, antes, desde: parseFloat(m.style.getPropertyValue('--rpg-desde')), hasta: parseFloat(m.style.getPropertyValue('--rpg-hasta')), pc: progresoXp().pc, animar: m.dataset.animar, sube: rangoDe(S.xp) !== rAntes }; }, [xp, pts]);
  const mismo = await juega(6200, 600); await pausa(300);
  const sube = await juega(10800, 600);
  const ok = mismo.gano === mismo.esperada && mismo.desde === mismo.antes && mismo.hasta === mismo.pc && mismo.animar === 'true' && !mismo.sube
    && sube.gano === sube.esperada && sube.sube && sube.desde === 0 && sube.hasta === sube.pc && sube.animar === 'true';
  return [ok, JSON.stringify({ mismo, sube })];
});

await caso('barras RPG · al cambiar de idioma en el resultado no se repite la animación ni el premio; los botones no esperan', BARRAS_J, async pg => {
  const r = await pg.evaluate(() => { diaAct = 7; vidas = 3; resultado(7, 3, 600); const t0 = performance.now(); const foco = document.activeElement?.id; const xp = S.xp, pts = S.pts;
    const m1 = document.querySelector('.rpg-resultado .rpg-medidor').dataset.animar;
    S.lang = 'en'; rehacerPantalla();
    const m2 = document.querySelector('.rpg-resultado .rpg-medidor').dataset.animar;
    return { foco, m1, m2, xpIgual: S.xp === xp, ptsIgual: S.pts === pts, cab: document.querySelector('.rpg-xp-cab b').textContent, ms: performance.now() - t0 }; });
  await pg.evaluate(() => { S.lang = 'es'; });
  await pg.click('#r-sig'); await pausa(150);
  const pant = await pg.evaluate(() => pantallaId);
  return [r.foco === 'r-sig' && r.m1 === 'true' && r.m2 === 'false' && r.xpIgual && r.ptsIgual && pant !== 'resultado', JSON.stringify({ ...r, trasClic: pant })];
});

await caso('barras RPG · con "reducir movimiento" la barra del resultado no se anima', BARRAS_J, async pg => {
  await pg.emulateMedia({ reducedMotion: 'reduce' });
  await pg.evaluate(() => { diaAct = 7; vidas = 3; resultado(7, 3, 600); }); await pausa(50);
  const m = await medidor(pg, '.rpg-resultado .rpg-medidor');
  await pg.emulateMedia({ reducedMotion: 'no-preference' });
  await pg.evaluate(() => { diaAct = 7; vidas = 3; resultado(7, 3, 600); }); await pausa(50);
  const n = await medidor(pg, '.rpg-resultado .rpg-medidor');
  return [m.anim === 'none' && n.anim === 'rpg-ganancia', `reducido: ${m.anim} · normal: ${n.anim}`];
});

await caso('barras RPG · caben en 6 tamaños y con HD y texto legible, sin desbordar', BARRAS_J, async pg => {
  const mal = [];
  for (const modo of [{}, { hd: true, legible: true }]) {
    await pg.evaluate(m => { Object.assign(S, { hd: false, legible: false }, m); aplicarModo(); }, modo);
    for (const [w, h] of [[320, 568], [390, 760], [844, 390], [820, 1100], [1280, 800], [1920, 1080]]) {
      await pg.setViewportSize({ width: w, height: h }); await pg.evaluate(() => rTitulo()); await pausa(250);
      const r = await pg.evaluate(() => { const sc = document.querySelector('#screen'); const cab = document.querySelector('.rpg-xp-cab');
        const ms = [...document.querySelectorAll('.rpg-medidor')].map(m => Math.round(m.getBoundingClientRect().width));
        const hud = document.querySelector('#hud').getBoundingClientRect(), hb = document.querySelector('#h-vidas .rpg-medidor').getBoundingClientRect();
        return { scroll: sc.scrollWidth > sc.clientWidth || document.documentElement.scrollWidth > innerWidth, cabCorta: cab.scrollWidth > cab.clientWidth + 1, anchos: ms, hudFuera: hb.right > hud.right + 1 || hb.left < hud.left - 1 }; });
      if (r.scroll || r.cabCorta || r.hudFuera || r.anchos.some(a => a < 40)) mal.push(`${JSON.stringify(modo)} ${w}×${h}: ${JSON.stringify(r)}`);
    }
  }
  await pg.evaluate(() => { Object.assign(S, { hd: false, legible: false }); aplicarModo(); });
  return [mal.length === 0, mal.length ? mal.slice(0, 3).join(' · ') : '2 modos × 6 tamaños: barras dentro, cabecera sin cortar'];
});

/* ── EL PASILLO HD (v37) ──
   Lo que no puede romperse: que cada zona lleve su ambiente (formación cálida, empresa fría)
   con sus 3 capas y su puerta, que al entrar gire la hoja y no el botón, que con "reducir
   movimiento" no haya giro, que si el arte no carga quede el pasillo de CSS de siempre y todo
   siga funcionando, y que quepa en móvil, escritorio, HD y texto legible. */
const PASILLO_HD = { intro: true, nombre: 'R', pts: 50, xp: 6065, version: 'v37', t2: true, dias: [3, 3, 3, 2, 3, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0] };
const capasPasillo = pg => pg.evaluate(() => { const e = $('#pasillo-escena'); const fondo = s => getComputedStyle($(s), '::after').backgroundImage.match(/pasillo-hd\/([\w-]+)\./)?.[1] || 'ninguna';
  return { clases: e.className.replace('pasillo-escena ', ''), techo: fondo('.pasillo-techo'), muro: fondo('.pasillo-muro'), suelo: fondo('.pasillo-suelo'),
    puerta: getComputedStyle($('.pasillo-hoja'), '::after').backgroundImage.match(/pasillo-hd\/([\w-]+)\./)?.[1], puertas: $$('.pasillo-puerta').length, hojas: $$('.pasillo-puerta .pasillo-marco > .pasillo-hoja').length }; });

await caso('pasillo HD · cada zona con su ambiente: formación (zonas 1 y 2) cálida y empresa (zona 3) fría, con techo, muro, suelo y puerta propios', PASILLO_HD, async pg => {
  const r = [];
  for (const z of [0, 1, 2]) { await pg.evaluate(z => rPasillo(z), z); await pausa(200); r.push(await capasPasillo(pg)); }
  const ok = r.every((x, i) => { const a = i < 2 ? 'formacion' : 'empresa';
    return x.clases.includes('pasillo-hd') && x.clases.includes('pasillo-' + a) && x.techo === a + '-techo' && x.muro === a + '-muro' && x.suelo === a + '-suelo' && x.puerta === a + '-puerta' && x.puertas === 5 && x.hojas === 5; });
  return [ok, JSON.stringify(r.map(x => [x.clases, x.techo, x.muro, x.suelo, x.puerta, x.hojas]))];
});

await caso('pasillo HD · al entrar gira la hoja de la puerta (no el botón ni el marco) y se llega al diálogo de ese día', PASILLO_HD, async pg => {
  await pg.evaluate(() => rPasillo(1)); await pausa(300);
  const antes = await pg.evaluate(() => $('.pasillo-puerta.seleccionada .pasillo-marco').getBoundingClientRect().width);
  const esperado = await pg.evaluate(() => +$('.pasillo-puerta.seleccionada').dataset.dia);
  await pg.click('.pasillo-puerta.seleccionada'); await pausa(180);
  const medio = await pg.evaluate(() => { const d = $('.pasillo-puerta.seleccionada'); return d ? { abriendo: d.classList.contains('abriendo'), marco: getComputedStyle(d.querySelector('.pasillo-marco')).transform, hoja: getComputedStyle(d.querySelector('.pasillo-hoja')).transform, boton: getComputedStyle(d).transform, ancho: d.querySelector('.pasillo-marco').getBoundingClientRect().width } : null; });
  await pausa(900);
  const fin = await pg.evaluate(() => ({ pantalla: pantallaId, dia: diaAct }));
  const ok = medio && medio.abriendo && medio.marco === 'none' && medio.hoja !== 'none' && medio.boton === 'none' && Math.abs(medio.ancho - antes) < 1 && fin.pantalla === 'dialogo' && fin.dia === esperado;
  return [ok, JSON.stringify({ medio, fin, esperado })];
});

await caso('pasillo HD · con "reducir movimiento" la hoja no gira con transición, y se entra igual', PASILLO_HD, async pg => {
  await pg.emulateMedia({ reducedMotion: 'reduce' });
  await pg.evaluate(() => rPasillo(1)); await pausa(300);
  const tr = await pg.evaluate(() => getComputedStyle($('.pasillo-hoja')).transitionDuration);
  const esperado = await pg.evaluate(() => +$('.pasillo-puerta.seleccionada').dataset.dia);
  await pg.click('.pasillo-puerta.seleccionada'); await pausa(900);
  const fin = await pg.evaluate(() => ({ pantalla: pantallaId, dia: diaAct }));
  await pg.emulateMedia({ reducedMotion: 'no-preference' });
  return [tr === '0s' && fin.pantalla === 'dialogo' && fin.dia === esperado, JSON.stringify({ tr, fin, esperado })];
});

await caso('pasillo HD · si el arte no carga, queda el pasillo de CSS de siempre y las puertas siguen entrando', PASILLO_HD, async pg => {
  await pg.route('**/img/pasillo-hd/**', r => r.abort());
  await pg.reload({ waitUntil: 'load' }); await pg.waitForFunction(() => typeof pantallaId !== 'undefined'); await pausa(300);
  await pg.evaluate(() => rPasillo(1)); await pausa(400);
  const r = await pg.evaluate(() => ({ muro: getComputedStyle($('.pasillo-muro')).backgroundImage !== 'none' || getComputedStyle($('.pasillo-muro')).backgroundColor !== 'rgba(0, 0, 0, 0)', puerta: getComputedStyle($('.pasillo-hoja')).backgroundColor, puertas: $$('.pasillo-puerta').length }));
  const esperado = await pg.evaluate(() => +$('.pasillo-puerta.seleccionada').dataset.dia);
  await pg.click('.pasillo-puerta.seleccionada'); await pausa(900);
  const fin = await pg.evaluate(() => ({ pantalla: pantallaId, dia: diaAct }));
  return [r.muro && r.puerta !== 'rgba(0, 0, 0, 0)' && r.puertas === 5 && fin.pantalla === 'dialogo' && fin.dia === esperado, JSON.stringify({ ...r, fin, esperado })];
});

await caso('pasillo HD · cabe en 6 tamaños, con HD y texto legible: puertas, letreros y zonas dentro, sin cortar', PASILLO_HD, async pg => {
  const mal = [];
  for (const modo of [{}, { hd: true, legible: true }]) {
    await pg.evaluate(m => { Object.assign(S, { hd: false, legible: false }, m); aplicarModo(); }, modo);
    for (const [w, h] of [[320, 568], [390, 760], [844, 390], [820, 1100], [1280, 800], [1920, 1080]]) {
      await pg.setViewportSize({ width: w, height: h });
      for (const z of [1, 2]) {
        await pg.evaluate(z => rPasillo(z), z); await pausa(250);
        const r = await pg.evaluate(() => { const sc = $('#screen'), e = $('#pasillo-escena').getBoundingClientRect();
          const fuera = $$('.pasillo-puerta .pasillo-marco, .pasillo-cartel').filter(x => { const q = x.getBoundingClientRect(); return q.left < e.left - 1 || q.right > e.right + 1; }).length;
          const zonas = $$('.pasillo-bloque').filter(b => b.scrollWidth > b.clientWidth + 1 || b.scrollHeight > b.clientHeight + 2).map(b => b.textContent.trim());
          return { scroll: sc.scrollWidth > sc.clientWidth || document.documentElement.scrollWidth > innerWidth, fuera, zonas, alto: Math.round(e.height) }; });
        if (r.scroll || r.fuera || r.zonas.length || r.alto < 120) mal.push(`${JSON.stringify(modo)} ${w}×${h} z${z}: ${JSON.stringify(r)}`);
      }
    }
  }
  await pg.evaluate(() => { Object.assign(S, { hd: false, legible: false }); aplicarModo(); });
  return [mal.length === 0, mal.length ? mal.slice(0, 3).join(' · ') : '2 modos × 6 tamaños × 2 ambientes: todo dentro, sin cortar'];
});

await caso('pasillo HD · navegación completa: zonas, anterior/siguiente, lista de días y vuelta, NPC y menú principal', PASILLO_HD, async pg => {
  const pasos = {};
  await pg.evaluate(() => rPasillo(0)); await pausa(200);
  await pg.evaluate(() => $$('.pasillo-bloque')[2].click()); await pausa(250);
  pasos.zona3 = await pg.evaluate(() => $('#pasillo-escena').classList.contains('pasillo-empresa'));
  await pg.evaluate(() => $$('.pasillo-bloque')[0].click()); await pausa(250);
  pasos.zona1 = await pg.evaluate(() => $('#pasillo-escena').classList.contains('pasillo-formacion'));
  /* «Siguiente» y «Anterior» cambian de zona (y de ambiente al pasar a la empresa) */
  await pg.click('#pasillo-siguiente'); await pausa(200); await pg.click('#pasillo-siguiente'); await pausa(200);
  pasos.sigEmpresa = await pg.evaluate(() => ({ empresa: $('#pasillo-escena').classList.contains('pasillo-empresa'), sigDesactivado: $('#pasillo-siguiente').disabled }));
  await pg.click('#pasillo-anterior'); await pausa(200);
  pasos.antFormacion = await pg.evaluate(() => $('#pasillo-escena').classList.contains('pasillo-formacion'));
  await pg.evaluate(() => [...document.querySelectorAll('#screen button')].find(b => /lista|list/i.test(b.textContent)).click()); await pausa(300);
  pasos.lista = await pg.evaluate(() => ({ p: pantallaId, etapas: $$('.etapa-card').length }));
  await pg.evaluate(() => rPasillo(1)); await pausa(300);
  const gente = await pg.evaluate(() => $$('.pasillo-gente').length);
  /* el consejo de un personaje sale en el propio pasillo: su ficha con el retrato dibujado */
  if (gente) { await pg.click('.pasillo-gente'); await pausa(900); pasos.npc = await pg.evaluate(() => ({ p: pantallaId, ficha: !!$('#pasillo-ficha img.dibujo') })); }
  await pg.evaluate(() => rPasillo(1)); await pausa(200);
  await pg.evaluate(() => [...document.querySelectorAll('#screen button')].find(b => /menú principal|main menu/i.test(b.textContent)).click()); await pausa(300);
  pasos.menu = await pg.evaluate(() => pantallaId);
  const ok = pasos.zona3 && pasos.zona1 && pasos.sigEmpresa.empresa && pasos.sigEmpresa.sigDesactivado && pasos.antFormacion && pasos.lista.etapas === 15 && (!gente || (pasos.npc.p === 'pasillo' && pasos.npc.ficha)) && pasos.menu === 'titulo';
  return [ok, JSON.stringify(pasos)];
});

await caso('pasillo HD · sin conexión: el service worker guarda los 8 recursos y el pasillo se ve sin red', PASILLO_HD, async pg => {
  const { createServer } = await import('node:http');
  const { readFile } = await import('node:fs/promises');
  const tipos = { html: 'text/html', js: 'text/javascript', css: 'text/css', webmanifest: 'application/manifest+json', svg: 'image/svg+xml', png: 'image/png', webp: 'image/webp', woff2: 'font/woff2' };
  const mini = createServer(async (q, r) => {
    try { let ruta = decodeURIComponent(new URL(q.url, 'http://x').pathname); if (ruta.endsWith('/')) ruta += 'index.html';
      const cuerpo = await readFile(join(RAIZ, ruta)); r.writeHead(200, { 'content-type': tipos[ruta.split('.').pop()] || 'application/octet-stream', 'cache-control': 'no-store' }); r.end(cuerpo);
    } catch (e) { r.writeHead(404); r.end(); }
  });
  await new Promise(ok => mini.listen(0, '127.0.0.1', ok));
  try {
    await pg.goto(`http://127.0.0.1:${mini.address().port}/index.html`, { waitUntil: 'load' });
    await pg.waitForFunction(() => typeof pantallaId !== 'undefined');
    await pg.evaluate(() => registrarSW());
    await pg.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 8000 });
    await pausa(1500);
    const rutas = ['formacion', 'empresa'].flatMap(a => ['techo.webp', 'muro.webp', 'suelo.webp', 'puerta.png'].map(p => `img/pasillo-hd/${a}-${p}`));
    const guardadas = await pg.evaluate(async rs => Promise.all(rs.map(async u => !!(await caches.match(u)))), rutas);
    await pg.context().setOffline(true);
    await pg.reload({ waitUntil: 'load' }); await pg.waitForFunction(() => typeof pantallaId !== 'undefined');
    await pg.evaluate(() => rPasillo(2)); await pausa(800);
    const vistas = await pg.evaluate(() => performance.getEntriesByType('resource').filter(e => /pasillo-hd\/empresa/.test(e.name)).length);
    const cargo = await pg.evaluate(async () => { const r = await fetch('img/pasillo-hd/empresa-muro.webp'); return r.ok && (await r.blob()).size > 1000; });
    await pg.context().setOffline(false);
    return [guardadas.every(Boolean) && cargo, `en la caché: ${guardadas.filter(Boolean).length}/8 · empresa sin red: ${cargo} (recursos pedidos: ${vistas})`];
  } finally { mini.close(); }
});

/* ── LOS PERSONAJES DEL PASILLO CON SPRITE PROPIO (v38) ──
   Gustavo, Valentina, Andrés y Don Jairo con su dibujo de cuerpo entero (img/npc/pasillo.png,
   js/npc-sprites.js) en vez del cuerpo del aprendiz recoloreado, que queda de respaldo. Lo que no
   puede romperse: cada uno con SU celda, los pies a la altura de los del aprendiz, sus fichas con
   el retrato y el nombre de siempre, y los mismos sitios en cada zona. */
const NPC_J = { intro: true, nombre: 'R', pts: 900, xp: 6200, version: 'v38', t2: true, dias: [3, 3, 3, 2, 3, 3, 3, 3, 3, 3, 3, 1, 0, 0, 0] };

await caso('personajes con sprite propio · cada uno con su celda del atlas, en los sitios de siempre de cada zona', NPC_J, async pg => {
  await pg.waitForFunction(() => NPC_PASILLO.listo);
  const r = [];
  for (const z of [0, 1, 2]) {
    await pg.evaluate(z => rPasillo(z), z); await pausa(300);
    r.push(await pg.evaluate(() => $$('.pasillo-gente').map(g => {
      /* compara el lienzo con la celda del atlas pintada aparte, píxel a píxel */
      const cv = g.querySelector('canvas'), ref = document.createElement('canvas'); ref.width = 44; ref.height = 74;
      NPC_PASILLO.dibujar(ref.getContext('2d'), g.dataset.p, 22, 74, 74);
      const a = cv.getContext('2d').getImageData(0, 0, 44, 74).data, b = ref.getContext('2d').getImageData(0, 0, 44, 74).data;
      let dif = 0, llenos = 0; for (let i = 0; i < a.length; i += 4) { if (a[i + 3]) llenos++; if (a[i] !== b[i] || a[i + 3] !== b[i + 3]) dif++; }
      return { p: g.dataset.p, hueco: g.dataset.hueco, igual: dif === 0, llenos };
    })));
  }
  const esperado = [['instructor', 'vigilante', 'companera'], ['companera', 'instructor'], ['lider', 'companera', 'instructor']];
  const ok = r.every((z, i) => z.map(g => g.p).join() === esperado[i].join() && z.every(g => g.igual && g.llenos > 500));
  return [ok, JSON.stringify(r.map(z => z.map(g => `${g.p}@${g.hueco}:${g.igual ? 'ok' : 'DISTINTO'}`)))];
});

await caso('personajes con sprite propio · los pies a la altura de los del aprendiz (escritorio y móvil)', NPC_J, async pg => {
  await pg.waitForFunction(() => NPC_PASILLO.listo && APRENDIZ.listo);
  const mal = [];
  for (const [w, h] of [[1280, 800], [390, 760], [320, 568]]) {
    await pg.setViewportSize({ width: w, height: h });
    for (const z of [0, 2]) {
      await pg.evaluate(z => rPasillo(z), z); await pausa(500);
      const r = await pg.evaluate(() => {
        /* el píxel opaco más bajo de un lienzo, en coordenadas de la página */
        const pie = cv => { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let fila = -1;
          for (let y = cv.height - 1; y >= 0 && fila < 0; y--) for (let x = 0; x < cv.width; x++) if (d[(y * cv.width + x) * 4 + 3] > 0) { fila = y; break; }
          const q = cv.getBoundingClientRect(); return fila < 0 ? null : q.top + (fila + 1) * q.height / cv.height; };
        return { jugador: pie($('#pasillo-canvas')), gente: $$('.pasillo-gente canvas').map(pie) };
      });
      const desvio = Math.max(...r.gente.map(y => Math.abs(y - r.jugador)));
      if (!(desvio <= 3)) mal.push(`${w}×${h} z${z + 1}: ${JSON.stringify(r)}`);
    }
  }
  return [mal.length === 0, mal.length ? mal.join(' · ') : '3 tamaños × 2 zonas: pies a ±3 px de los del aprendiz'];
});

await caso('personajes con sprite propio · tocar a cada uno abre su ficha con su retrato dibujado y su nombre', NPC_J, async pg => {
  await pg.waitForFunction(() => NPC_PASILLO.listo);
  const vistos = {};
  for (const z of [0, 2]) {
    await pg.evaluate(z => rPasillo(z), z); await pausa(300);
    for (const id of await pg.evaluate(() => $$('.pasillo-gente').map(g => g.dataset.p))) {
      if (vistos[id]) continue;
      await pg.click(`.pasillo-gente[data-p="${id}"]`); await pausa(1100);
      vistos[id] = await pg.evaluate(id => ({ retrato: ($('#pasillo-ficha img.dibujo')?.getAttribute('src') || '').includes('retratos/' + id), nombre: $('#pasillo-ficha').textContent.includes(PERSONAJES[id].nom), pantalla: pantallaId }), id);
    }
  }
  const ok = ['instructor', 'companera', 'lider', 'vigilante'].every(id => vistos[id]?.retrato && vistos[id].nombre && vistos[id].pantalla === 'pasillo');
  return [ok, JSON.stringify(vistos)];
});

/* ── LOS DIÁLOGOS CINEMATOGRÁFICOS (v39) ──
   Solo cambia cómo se presentan las escenas (js/cinematica.js): ni una frase de la historia.
   Lo que no puede romperse: que cada texto de DIALOGOS y de las 6 escenas salga EXACTO y con su
   personaje y su gesto, que continuar y saltar terminen la escena una sola vez, que el teclado y
   el cambio de idioma sigan funcionando, que con "reducir movimiento" el texto salga entero, y
   que el día siga llevando a su minijuego. */
const CINE_J = { intro: true, nombre: 'R', pts: 900, xp: 6200, version: 'v39', t2: true, dias: [3, 3, 3, 2, 3, 3, 3, 3, 3, 3, 3, 1, 0, 0, 0],
  vistos: ['escribir', 'bugs', 'memoria', 'simon', 'quiz', 'review', 'merge', 'runner', 'sql', 'regex', 'terminal', 'orden', 'jefe'] };
const GUIONES = ['INTRO', 'FINAL', 'T2_INTRO', 'JEFE_INTRO', 'JEFE2_INTRO', 'FINAL2'];

await caso('diálogos cine · los 15 días en ES y EN: el texto exacto de DIALOGOS, su hablante, su retrato con su gesto y su fondo', CINE_J, async pg => {
  const mal = [];
  for (const lang of ['es', 'en']) {
    await pg.evaluate(l => { S.lang = l; }, lang);
    for (let i = 0; i < 15; i++) {
      const r = await pg.evaluate(i => { diaAct = i; rDialogo(i); $('#d-revelar')?.click();
        const [quien, linea] = DIALOGOS[S.lang][i], img = $('.cine-retrato img.dibujo');
        return { texto: $('#d-linea').textContent === linea, lector: ($('.cine-sr')?.textContent ?? linea) === linea, hablante: $('.cine-nombre').textContent === quien,
          retrato: !!img && img.src.endsWith(`retratos/${dibujoDe(quien)}-${GESTO_DIA[i]}.webp`), fondo: !!$(`.cine-fondo-${i < 10 ? 'formacion' : 'empresa'}`) }; }, i);
      if (!Object.values(r).every(Boolean)) mal.push(`${lang} día ${i + 1}: ${JSON.stringify(r)}`);
    }
  }
  await pg.evaluate(() => { S.lang = 'es'; });
  return [mal.length === 0, mal.length ? mal.slice(0, 4).join(' · ') : '30 diálogos (15 días × 2 idiomas): texto, hablante, retrato con gesto y fondo correctos'];
});

await caso('diálogos cine · las 6 escenas en ES y EN: cada página con su texto exacto, en orden, y el fondo de su lugar', CINE_J, async pg => {
  const mal = [];
  for (const lang of ['es', 'en']) for (const g of GUIONES) {
    const r = await pg.evaluate(([g, lang]) => { S.lang = lang; const guion = eval(g), paginas = guion[lang], vistas = [];
      let fin = 0; rCutscene(guion, () => { fin++; });
      for (let k = 0; k < paginas.length; k++) { vistas.push({ t: $('#cut-linea').textContent, n: $('.cine-nombre').textContent, prog: $('.cut-prog').textContent, fondo: [...$('.cine-escena').classList].find(c => c.startsWith('cine-fondo-')) }); if (k < paginas.length - 1) $('#cut-next').click(); }
      $('#cut-next').click();
      return { iguales: vistas.every((v, k) => v.t === paginas[k].t), paginas: paginas.length, vistas: vistas.length, fin, fondos: [...new Set(vistas.map(v => v.fondo))].join(), progreso: vistas.at(-1).prog }; }, [g, lang]);
    const fondo = { INTRO: 'cine-fondo-formacion', FINAL: 'cine-fondo-formacion', T2_INTRO: 'cine-fondo-empresa', FINAL2: 'cine-fondo-empresa', JEFE_INTRO: 'cine-fondo-servidor', JEFE2_INTRO: 'cine-fondo-servidor' }[g];
    if (!(r.iguales && r.vistas === r.paginas && r.fin === 1 && r.fondos === fondo && r.progreso.endsWith(`${r.paginas}/${r.paginas}`))) mal.push(`${lang} ${g}: ${JSON.stringify(r)}`);
  }
  await pg.evaluate(() => { S.lang = 'es'; });
  return [mal.length === 0, mal.length ? mal.slice(0, 4).join(' · ') : '12 escenas (6 × 2 idiomas): todas las páginas exactas y en orden, con su fondo, y el final una sola vez'];
});

await caso('diálogos cine · la aparición del jefe enseña su dibujo (el del Error Evolutivo, fase 1)', CINE_J, async pg => {
  const r = [];
  for (const g of ['JEFE_INTRO', 'JEFE2_INTRO']) {
    await pg.evaluate(g => { const guion = eval(g); rCutscene(guion, () => {}); const k = guion.es.findIndex(p => p.ico === '👾'); for (let j = 0; j < k; j++) $('#cut-next').click(); }, g);
    await pg.waitForFunction(() => { const i = $('.cine-jefe'); return i && i.complete; }, null, { timeout: 4000 }).catch(() => {});
    r.push(await pg.evaluate(() => { const i = $('.cine-jefe'); return { img: !!i && /jefe\/jefe-fase-1\.png$/.test(i.src) && i.naturalWidth > 0 }; }));
  }
  return [r.every(x => x.img), JSON.stringify(r)];
});

await caso('diálogos cine · continuar, saltar y teclado: la escena termina UNA vez (también con doble clic o Enter repetido)', CINE_J, async pg => {
  const r = await pg.evaluate(() => {
    const o = {};
    let fin = 0; rCutscene(INTRO, () => { fin++; }); $('#cut-skip').click(); $('#cut-skip')?.click(); o.saltar = fin;
    fin = 0; rCutscene(INTRO, () => { fin++; }); for (let k = 0; k < 6; k++) $('#cut-next')?.click(); o.continuarDeMas = fin;
    fin = 0; rCutscene(INTRO, () => { fin++; }); const z = $('#cut-zona');
    z.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); o.paginaTrasEnter = $('.cut-prog').textContent;
    $('#cut-zona').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', repeat: true, bubbles: true })); o.paginaTrasRepeat = $('.cut-prog').textContent;
    $('#cut-zona').dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true })); o.paginaTrasEspacio = $('.cut-prog').textContent;
    o.foco = document.activeElement?.id;
    return o; });
  const ok = r.saltar === 1 && r.continuarDeMas === 1 && r.paginaTrasEnter.endsWith('2/3') && r.paginaTrasRepeat.endsWith('2/3') && r.paginaTrasEspacio.endsWith('3/3') && r.foco === 'cut-zona';
  return [ok, JSON.stringify(r)];
});

await caso('diálogos cine · cambiar de idioma no cambia de página, y el texto sale entero en el idioma nuevo', CINE_J, async pg => {
  const r = await pg.evaluate(() => { S.lang = 'es'; rCutscene(INTRO, () => {}); $('#cut-next').click();
    const antes = $('.cut-prog').textContent; S.lang = 'en'; rehacerPantalla();
    const o = { antes, despues: $('.cut-prog').textContent, texto: $('#cut-linea').textContent === INTRO.en[1].t };
    diaAct = 4; S.lang = 'es'; rDialogo(4); S.lang = 'en'; rehacerPantalla(); $('#d-revelar')?.click();
    o.dia = $('#d-linea').textContent === DIALOGOS.en[4][1] && $('.cine-top .cut-prog').textContent.includes('5/15');
    S.lang = 'es'; return o; });
  return [r.antes.endsWith('2/3') && r.despues.endsWith('2/3') && r.texto && r.dia, JSON.stringify(r)];
});

await caso('diálogos cine · el texto del día se escribe solo, "Mostrar texto" lo completa, y al salir no queda nada escribiendo', CINE_J, async pg => {
  await pg.evaluate(() => { diaAct = 2; rDialogo(2); }); await pausa(150);
  const parcial = await pg.evaluate(() => ({ largo: $('#d-linea').textContent.length, total: DIALOGOS[S.lang][2][1].length, boton: !$('#d-revelar').hidden }));
  await pg.click('#d-revelar');
  const completo = await pg.evaluate(() => ({ igual: $('#d-linea').textContent === DIALOGOS[S.lang][2][1], boton: $('#d-revelar').hidden }));
  await pg.evaluate(() => { diaAct = 3; rDialogo(3); }); await pausa(100); await pg.evaluate(() => rTitulo()); await pausa(400);
  const quedan = await pg.evaluate(() => ({ p: pantallaId, linea: !!$('#d-linea') }));
  return [parcial.largo > 0 && parcial.largo < parcial.total && parcial.boton && completo.igual && completo.boton && quedan.p === 'titulo' && !quedan.linea, JSON.stringify({ parcial, completo, quedan })];
});

await caso('diálogos cine · con "reducir movimiento" el texto sale entero al instante y sin botón de mostrar', CINE_J, async pg => {
  await pg.emulateMedia({ reducedMotion: 'reduce' });
  const r = await pg.evaluate(() => { diaAct = 7; rDialogo(7); return { igual: $('#d-linea').textContent === DIALOGOS[S.lang][7][1], boton: $('#d-revelar').hidden }; });
  await pg.emulateMedia({ reducedMotion: 'no-preference' });
  return [r.igual && r.boton, JSON.stringify(r)];
});

await caso('diálogos cine · ¡EMPEZAR! lleva al minijuego del día una sola vez (doble clic incluido)', CINE_J, async pg => {
  const r = await pg.evaluate(() => { const o = jugarNivel; let n = 0, dia = -1; jugarNivel = i => { n++; dia = i; };
    diaAct = 5; rDialogo(5); const b = $('#d-go'); b.click(); b.click(); jugarNivel = o; return { n, dia }; });
  return [r.n === 1 && r.dia === 5, JSON.stringify(r)];
});

await caso('diálogos cine · caben en 6 tamaños y con HD y texto legible: retrato, texto y botones dentro, sin desbordar', CINE_J, async pg => {
  const mal = [];
  for (const modo of [{}, { hd: true, legible: true }]) {
    await pg.evaluate(m => { Object.assign(S, { hd: false, legible: false }, m); aplicarModo(); }, modo);
    for (const [w, h] of [[320, 568], [390, 760], [844, 390], [820, 1100], [1280, 800], [1920, 1080]]) {
      await pg.setViewportSize({ width: w, height: h });
      for (const que of ['dia', 'cut']) {
        await pg.evaluate(q => { if (q === 'dia') { diaAct = 11; rDialogo(11); $('#d-revelar')?.click(); } else rCutscene(T2_INTRO, () => {}); }, que); await pausa(200);
        const r = await pg.evaluate(() => { const sc = $('#screen'), c = $('#screen>.cine').getBoundingClientRect();
          const fuera = [...document.querySelectorAll('.cine-panel button:not([hidden]), .cine-linea, .cine-retrato, .cine-simbolo')].filter(e => { const q = e.getBoundingClientRect(); return q.width && (q.left < c.left - 1 || q.right > c.right + 1); }).map(e => e.id || e.className);
          return { scroll: sc.scrollWidth > sc.clientWidth || document.documentElement.scrollWidth > innerWidth, fuera }; });
        if (r.scroll || r.fuera.length) mal.push(`${JSON.stringify(modo)} ${w}×${h} ${que}: ${JSON.stringify(r)}`);
      }
    }
  }
  await pg.evaluate(() => { Object.assign(S, { hd: false, legible: false }); aplicarModo(); });
  return [mal.length === 0, mal.length ? mal.slice(0, 3).join(' · ') : '2 modos × 6 tamaños × día y escena: todo dentro, sin desbordar'];
});

/* ── IDENTIDAD, PARTE 1 (v40) ──
   Apariencia masculina/femenina en Mi Avatar. Lo que no puede romperse: que elegir guarde y
   sobreviva a recargar sin tocar puntos, accesorios ni progreso; que la apariencia elegida sea
   la que se pinta en la portada, el mapa, el pasillo, el runner y el jefe; que los NPC sigan
   con su propio sprite; que girar y caminar no dejen nada corriendo al salir; y que quepa. */
const ID_J = { intro: true, nombre: 'R', pts: 900, xp: 6200, version: 'v40', t2: true, skin: 1, camisa: 2, accs: ['gafas'], acc: 'gafas',
  dias: [3, 3, 3, 2, 3, 3, 3, 3, 3, 3, 3, 1, 0, 0, 0], logros: ['comprador'],
  vistos: ['escribir', 'bugs', 'memoria', 'simon', 'quiz', 'review', 'merge', 'runner', 'sql', 'regex', 'terminal', 'orden', 'jefe'] };
/* Marca los dos atlas recoloreados del jugador (masculino y femenino) y anota cuál se pinta. */
const espiaAtlasId = pg => pg.evaluate(() => {
  const s = S.apariencia;
  S.apariencia = 'femenina'; const F = APRENDIZ.atlasDe(S.skin, S.camisa);
  S.apariencia = 'masculina'; const M = APRENDIZ.atlasDe(S.skin, S.camisa);
  S.apariencia = s;
  window.__atlas = new Set();
  const o = CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage = function (src, ...a) { if (src === F) __atlas.add('F'); if (src === M) __atlas.add('M'); return o.call(this, src, ...a); };
  return F !== M;
});

await caso('identidad · Mi Avatar abre en APARIENCIA; elegir FEMENINA guarda, marca aria-pressed y sobrevive a recargar sin tocar puntos, accesorios ni progreso', ID_J, async pg => {
  await pg.waitForFunction(() => APRENDIZ.listaFemenina, null, { timeout: 5000 });
  const r = await pg.evaluate(() => { rPerso();
    const o = { tab: $('.pe-tab.act')?.id, panel: !$('#pe-p-apariencia').hidden, antes: S.apariencia };
    $('.pe-apariencia-op[data-apariencia="femenina"]').click();
    o.despues = S.apariencia; o.guardado = JSON.parse(localStorage.getItem('pa3')).apariencia;
    o.aria = $$('.pe-apariencia-op').map(b => b.dataset.apariencia + ':' + b.getAttribute('aria-pressed')).join(',');
    o.sel = $('.pe-apariencia-op.sel')?.dataset.apariencia; return o; });
  await pg.reload({ waitUntil: 'load' }); await pg.waitForFunction(() => typeof pantallaId !== 'undefined'); await pausa(300);
  const tras = await pg.evaluate(() => ({ ap: S.apariencia, pts: S.pts, xp: S.xp, accs: S.accs.join(), acc: S.acc, skin: S.skin, camisa: S.camisa, dias: S.dias.slice(0, 12).join(''), logros: S.logros.join() }));
  const ok = r.tab === 'pe-t-apariencia' && r.panel && r.antes === 'masculina' && r.despues === 'femenina' && r.guardado === 'femenina' && r.aria === 'masculina:false,femenina:true' && r.sel === 'femenina'
    && tras.ap === 'femenina' && tras.pts === 900 && tras.xp === 6200 && tras.accs === 'gafas' && tras.acc === 'gafas' && tras.skin === 1 && tras.camisa === 2 && tras.dias === '333233333331' && tras.logros === 'comprador';
  return [ok, JSON.stringify({ r, tras })];
});

await caso('identidad · la apariencia elegida es la que se pinta en el mapa, el pasillo, el runner y el jefe (y los NPC del pasillo siguen con su sprite)', ID_J, async pg => {
  await pg.waitForFunction(() => APRENDIZ.listaFemenina && APRENDIZ.listoHD && NPC_PASILLO.listo, null, { timeout: 5000 });
  if (!await espiaAtlasId(pg)) return [false, 'los dos atlas son el mismo lienzo'];
  const r = {};
  for (const ap of ['masculina', 'femenina']) {
    const pantallas = { mapa: () => rMapaLista(), pasillo: () => rPasillo(0), runner: () => { diaAct = 9; vidas = 3; nvRunner(9); }, jefe: () => { diaAct = 9; vidas = 3; nvJefe(9, 0); } };
    for (const [n, f] of Object.entries(pantallas)) {
      await pg.evaluate(ap => { S.apariencia = ap; __atlas.clear(); }, ap);
      await pg.evaluate(`(${f})()`); await pausa(n === 'mapa' || n === 'pasillo' ? 500 : 900);
      r[ap[0] + ':' + n] = await pg.evaluate(() => [...__atlas].sort().join(''));
    }
  }
  await pg.evaluate(() => rTitulo());
  const ok = Object.entries(r).every(([k, v]) => v === (k[0] === 'f' ? 'F' : 'M'));
  return [ok, JSON.stringify(r)];
});

await caso('identidad · la portada pinta a la aprendiz con su atlas de portada (y vuelve al masculino al cambiar)', ID_J, async pg => {
  await pg.waitForFunction(() => APRENDIZ.listaFemenina && APRENDIZ.listoHD, null, { timeout: 5000 }); await pausa(600);
  const r = await pg.evaluate(async () => {
    const huella = () => $('#t-aprendiz').toDataURL();
    const ref = ap => { const s = S.apariencia; S.apariencia = ap; const c = document.createElement('canvas'); c.width = 44; c.height = 74; APRENDIZ.dibujarPortada(c.getContext('2d'), 22, 74, 74, 0); S.apariencia = s; return c.toDataURL(); };
    const o = { masc: ref('masculina') !== ref('femenina') };
    S.apariencia = 'femenina'; rTitulo(); await new Promise(r => setTimeout(r, 700)); o.listaPortada = APRENDIZ.listoPortada; const f = huella();
    S.apariencia = 'masculina'; rTitulo(); await new Promise(r => setTimeout(r, 700)); const m = huella();
    o.cambia = f !== m; return o; });
  return [r.masc && r.listaPortada && r.cambia, JSON.stringify(r)];
}, { reducedMotion: 'reduce' });

await caso('identidad · GIRAR recorre las 8 direcciones y vuelve; CAMINAR alterna (aria-pressed) y anima; al salir no queda nada corriendo', ID_J, async pg => {
  await pg.waitForFunction(() => APRENDIZ.listaFemenina, null, { timeout: 5000 });
  const r = await pg.evaluate(async () => { S.apariencia = 'femenina'; rPerso(); await new Promise(r => setTimeout(r, 300));
    const cv = $('#pe-cuerpo-av'), h = () => cv.toDataURL(), vistas = [h()];
    for (let k = 0; k < 8; k++) { $('#pe-girar').click(); await new Promise(r => setTimeout(r, 60)); vistas.push(h()); }
    const o = { distintas: new Set(vistas.slice(0, 8)).size, vuelve: vistas[8] === vistas[0] };
    const b = $('#pe-caminar'); b.click(); o.aria = b.getAttribute('aria-pressed');
    const pasos = new Set(); for (let k = 0; k < 12; k++) { await new Promise(r => setTimeout(r, 140)); pasos.add(h()); } o.cuadros = pasos.size;
    b.click(); o.ariaFin = b.getAttribute('aria-pressed');
    rTitulo(); await new Promise(r => setTimeout(r, 400)); o.p = pantallaId; o.visor = !!$('#pe-cuerpo-av'); return o; });
  return [r.distintas === 8 && r.vuelve && r.aria === 'true' && r.cuadros >= 2 && r.ariaFin === 'false' && r.p === 'titulo' && !r.visor, JSON.stringify(r)];
});

await caso('identidad · con "reducir movimiento" CAMINAR está desactivado y la figura queda quieta', ID_J, async pg => {
  await pg.waitForFunction(() => APRENDIZ.listaFemenina, null, { timeout: 5000 });
  const r = await pg.evaluate(async () => { rPerso(); await new Promise(r => setTimeout(r, 300)); const b = $('#pe-caminar'), cv = $('#pe-cuerpo-av');
    const a = cv.toDataURL(); b.click(); await new Promise(r => setTimeout(r, 600));
    return { desactivado: b.disabled, aria: b.getAttribute('aria-pressed'), quieta: cv.toDataURL() === a }; });
  return [r.desactivado && r.aria === 'false' && r.quieta, JSON.stringify(r)];
}, { reducedMotion: 'reduce' });

await caso('identidad · piel y camisa recolorean a la aprendiz; cambiar de idioma no cambia de pestaña ni de apariencia', ID_J, async pg => {
  await pg.waitForFunction(() => APRENDIZ.listaFemenina, null, { timeout: 5000 });
  const r = await pg.evaluate(async () => { S.apariencia = 'femenina'; pePestana = 'apariencia'; rPerso(); await new Promise(r => setTimeout(r, 300));
    const cv = $('#pe-cuerpo-av'), h0 = cv.toDataURL();
    $('#pe-t-piel').click(); $('.skin-op[data-s="3"]').click(); await new Promise(r => setTimeout(r, 200)); const h1 = $('#pe-cuerpo-av').toDataURL();
    $('#pe-t-camisa').click(); $('.camisa-op[data-c="0"]').click(); await new Promise(r => setTimeout(r, 200)); const h2 = $('#pe-cuerpo-av').toDataURL();
    const o = { colores: new Set([h0, h1, h2]).size, aria: $('.camisa-op[data-c="0"]').getAttribute('aria-pressed') };
    S.lang = 'en'; rehacerPantalla(); o.tab = $('.pe-tab.act')?.id; o.texto = $('#pe-t-apariencia').textContent.trim(); o.ap = S.apariencia;
    S.lang = 'es'; rehacerPantalla(); return o; });
  return [r.colores === 3 && r.aria === 'true' && r.tab === 'pe-t-camisa' && r.texto === 'APPEARANCE' && r.ap === 'femenina', JSON.stringify(r)];
});

await caso('identidad · comprar un accesorio con la confirmación repetida no cobra dos veces', { ...ID_J, accs: [], acc: '' }, async pg => {
  const r = await pg.evaluate(async () => { pePestana = 'acc'; rPerso(); await new Promise(r => setTimeout(r, 200));
    const a = ACCS.find(x => x.precio <= S.pts); const antes = S.pts;
    $(`.acc-op[data-a="${a.id}"]`).click(); await new Promise(r => setTimeout(r, 100));
    const si = $('#pe-si'); if (!si) return { sinConfirmar: true };
    si.click(); si.click();
    return { cobro: antes - S.pts, precio: a.precio, veces: S.accs.filter(x => x === a.id).length }; });
  return [!r.sinConfirmar && r.cobro === r.precio && r.veces === 1, JSON.stringify(r)];
});

await caso('identidad · Mi Avatar con la pestaña APARIENCIA cabe en 6 tamaños, con HD y texto legible, en ES y EN, sin desbordar', ID_J, async pg => {
  const mal = [];
  for (const modo of [{}, { hd: true, legible: true }, { lang: 'en', legible: true }]) {
    await pg.evaluate(m => { Object.assign(S, { hd: false, legible: false, lang: 'es' }, m); aplicarModo(); }, modo);
    for (const [w, h] of [[320, 568], [390, 760], [844, 390], [820, 1100], [1280, 800], [1920, 1080]]) {
      await pg.setViewportSize({ width: w, height: h });
      await pg.evaluate(() => { pePestana = 'apariencia'; rPerso(); }); await pausa(200);
      const r = await pg.evaluate(() => { const sc = $('#screen'), w = $('.pe-wrap').getBoundingClientRect();
        const fuera = [...document.querySelectorAll('.pe-wrap button, .pe-wrap canvas')].filter(e => { const q = e.getBoundingClientRect(); return q.width && (q.left < w.left - 1 || q.right > w.right + 1); }).map(e => e.id || e.className);
        const corta = [...document.querySelectorAll('.pe-tab, .pe-apariencia-op span, .pe-visor-controles button')].filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.id || e.textContent.trim());
        return { scroll: sc.scrollWidth > sc.clientWidth || document.documentElement.scrollWidth > innerWidth, fuera, corta }; });
      if (r.scroll || r.fuera.length || r.corta.length) mal.push(`${JSON.stringify(modo)} ${w}×${h}: ${JSON.stringify(r)}`);
    }
  }
  await pg.evaluate(() => { Object.assign(S, { hd: false, legible: false, lang: 'es' }); aplicarModo(); });
  return [mal.length === 0, mal.length ? mal.slice(0, 3).join(' · ') : '3 modos × 6 tamaños: todo dentro, sin desbordar ni cortar'];
});

/* ── IDENTIDAD, PARTE 2 (v40.1): el protagonista masculino premium ── */
await caso('masculino premium · el jugador masculino se pinta con el atlas premium (caminata y portada) en las 16 combinaciones, y los NPC no lo usan', ID_J, async pg => {
  await pg.waitForFunction(() => APRENDIZ.listoPremium && APRENDIZ.listoPortadaPremium && APRENDIZ.listoHD && NPC_PASILLO.listo, null, { timeout: 5000 });
  const r = await pg.evaluate(() => {
    S.apariencia = 'masculina';
    const lienzo = (f) => { const c = document.createElement('canvas'); c.width = 44; c.height = 74; f(c.getContext('2d')); return c.toDataURL(); };
    const combos = new Set(), portadas = new Set();
    for (let s = 0; s < 4; s++) for (let c = 0; c < 4; c++) {
      combos.add(lienzo(x => APRENDIZ.dibujar(x, 22, 74, 74, 0, 0, s, c)));
      portadas.add(lienzo(x => APRENDIZ.dibujarPortada(x, 22, 74, 74, 2, s, c)));
    }
    const poses = new Set([0, 1, 2, 3].map(p => lienzo(x => APRENDIZ.dibujarPortada(x, 22, 74, 74, p, S.skin, S.camisa, 'masculina', ''))));   /* sin accesorio: desde v40.4 las gafas tapan el parpadeo */
    const npc = lienzo(x => APRENDIZ.dibujar(x, 22, 74, 74, 0, 0, PERSONAJES.companera.piel, PERSONAJES.companera.camisa));
    return { combos: combos.size, portadas: portadas.size, poses: poses.size, npcDistinto: !combos.has(npc), listoPortada: APRENDIZ.listoPortada };
  });
  return [r.combos === 16 && r.portadas === 16 && r.poses === 4 && r.npcDistinto && r.listoPortada, JSON.stringify(r)];
});

/* ── IDENTIDAD, PARTE 3 (v40.2): retratos de los dos protagonistas ──
   Lo que no puede romperse: que el retrato del jugador siga su apariencia, colores y accesorio en
   16 y 32; que las escenas de la historia actual sigan exactamente con sus caras (ninguna página
   cambia a la del protagonista); que una escena futura con el APRENDIZ lo pinte con su gesto y que
   la página siguiente de un NPC vuelva a su retrato ilustrado. */
await caso('retratos protagonistas · 2 apariencias × 16 colores × 16/32 son distintos, y cada uno de los 9 accesorios se ve (también a 16×16)', ID_J, async pg => {
  const r = await pg.evaluate(() => {
    const A = ['gafas', 'gorra', 'cafe', 'audifonos', 'corbata', 'medalla', 'capa', 'corona', 'gato'];
    const h = (o, n) => { const k = document.createElement('canvas'); k.width = k.height = 64; retrato(k, Object.assign(CARAS.yo(false), { acc: '' }, ...A.map(a => ({ [a]: false })), { av32: n === 32 }, o)); return k.toDataURL(); };
    const combos = new Set(); for (const ap of ['masculina', 'femenina']) for (let s = 0; s < 4; s++) for (let c = 0; c < 4; c++) for (const n of [16, 32]) combos.add(h({ apariencia: ap, skin: SKINS[s], camisa: CAMISAS[c] }, n));
    const sinVer = []; for (const ap of ['masculina', 'femenina']) for (const n of [16, 32]) { const base = h({ apariencia: ap }, n); for (const a of A) if (h({ apariencia: ap, [a]: true }, n) === base) sinVer.push(`${ap} ${n} ${a}`); }
    /* gafas a 16: los dos ojos (x 6 y 9, y 7) siguen oscuros y el cristal no es negro */
    const k = document.createElement('canvas'); k.width = k.height = 16; retrato(k, Object.assign(CARAS.yo(false), { apariencia: 'masculina', gafas: true, av32: false }));
    const px = (x, y) => [...k.getContext('2d').getImageData(x, y, 1, 1).data]; const ojo = px(6, 7), ojo2 = px(9, 7), cristal = px(10, 8), suma = p => p[0] + p[1] + p[2]; return { combos: combos.size, sinVer, ojo: ojo.join(), ojo2: ojo2.join(), cristal: cristal.join(), ojos: suma(ojo) < suma(cristal) - 200 && suma(ojo2) < suma(cristal) - 200 };
  });
  return [r.combos === 64 && r.sinVer.length === 0 && r.ojos, JSON.stringify(r)];
});

await caso('retratos protagonistas · la historia actual no cambia de caras: ninguna página de las 6 escenas ni de los 15 días usa el retrato del protagonista', ID_J, async pg => {
  const r = await pg.evaluate(() => { const usos = [];
    for (const lang of ['es', 'en']) { S.lang = lang;
      for (const g of ['INTRO', 'FINAL', 'T2_INTRO', 'JEFE_INTRO', 'JEFE2_INTRO', 'FINAL2']) { const gu = eval(g); rCutscene(gu, () => {}); for (let k = 0; k < gu[lang].length; k++) { if ($('.cine-protagonista')) usos.push(`${lang} ${g} ${k + 1}`); if (k < gu[lang].length - 1) $('#cut-next').click(); } }
      for (let i = 0; i < 15; i++) { diaAct = i; rDialogo(i); if ($('.cine-protagonista') || !$('.cine-retrato img.dibujo')) usos.push(`${lang} día ${i + 1}`); } }
    S.lang = 'es'; return usos; });
  return [r.length === 0, r.length ? r.slice(0, 5).join(' · ') : '6 escenas y 15 días en ES y EN: las mismas caras de antes'];
});

await caso('retratos protagonistas · una escena con el APRENDIZ lo pinta con su apariencia y gesto (96×96, sin fondo), y la página siguiente de Gustavo vuelve a su retrato ilustrado', ID_J, async pg => {
  const r = await pg.evaluate(async () => { const o = {};
    const gu = { es: [{ quien: 'APRENDIZ', gesto: 'preocupado', fondo: 'empresa', t: 'a' }, { quien: 'GUSTAVO · INSTRUCTOR', gesto: 'feliz', fondo: 'formacion', t: 'b' }], en: [{ quien: 'APRENDIZ', gesto: 'preocupado', t: 'a' }, { quien: 'GUSTAVO · INSTRUCTOR', gesto: 'feliz', t: 'b' }] };
    const gestos = new Set();
    for (const ap of ['masculina', 'femenina']) { S.apariencia = ap;
      for (const g of ['normal', 'feliz', 'enojado', 'sorprendido', 'preocupado']) { rCutscene({ es: [{ quien: 'APRENDIZ', gesto: g, t: 'x' }], en: [{ quien: 'APRENDIZ', gesto: g, t: 'x' }] }, () => {}); gestos.add($('#cut-cara').toDataURL()); } }
    o.gestos = gestos.size;
    S.apariencia = 'femenina'; rCutscene(gu, () => {}); const cv = $('#cut-cara');
    o.p1 = { prot: cv.classList.contains('cine-protagonista'), w: cv.width, fondo: [...cv.getContext('2d').getImageData(0, 0, 1, 1).data][3] === 0, dibujo: !!$('.cine-retrato img.dibujo') };
    $('#cut-next').click(); const cv2 = $('#cut-cara'), img = $('.cine-retrato img.dibujo');
    o.p2 = { prot: cv2.classList.contains('cine-protagonista'), dibujo: !!img && /instructor-feliz/.test(img.src) };
    return o; });
  return [r.gestos === 10 && r.p1.prot && r.p1.w === 96 && r.p1.fondo && !r.p1.dibujo && !r.p2.prot && r.p2.dibujo, JSON.stringify(r)];
});

/* ── IDENTIDAD, PARTE 4 (v40.3): tarjetas de piel y camisa ── */
await caso('colores del avatar · 4 tarjetas de piel (retrato) y 4 de camisa (cuerpo), distintas en las dos apariencias; elegir guarda una vez, marca EQUIPADO y no toca puntos ni accesorio', ID_J, async pg => {
  await pg.waitForFunction(() => APRENDIZ.listaFemenina && APRENDIZ.listoPremium, null, { timeout: 5000 });
  const r = await pg.evaluate(async () => { const o = { distintas: {} };
    for (const ap of ['masculina', 'femenina']) { S.apariencia = ap;
      for (const tab of ['piel', 'camisa']) { pePestana = tab; rPerso(); await new Promise(r => setTimeout(r, 250));
        o.distintas[ap + ' ' + tab] = new Set($$(`#pe-p-${tab} .pe-color-op canvas`).map(c => c.toDataURL())).size; } }
    pePestana = 'camisa'; rPerso(); await new Promise(r => setTimeout(r, 200));
    let guardados = 0; const g = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k === 'pa3') guardados++; return g.call(this, k, v); };
    const b = $('.camisa-op[data-c="0"]'); b.click(); b.click(); $('.camisa-op[data-c="0"]').click(); Storage.prototype.setItem = g;
    const sel = $('.camisa-op.sel');
    o.tras = { camisa: S.camisa, guardados, guardado: JSON.parse(localStorage.getItem('pa3')).camisa, sel: sel?.dataset.c, aria: $$('.camisa-op').map(x => x.getAttribute('aria-pressed')).join(),
      estado: sel?.querySelector('.pe-color-estado').textContent, marca: sel?.querySelector('.pe-color-marca').textContent, pts: S.pts, acc: S.acc, accs: S.accs.join() };
    S.lang = 'en'; rehacerPantalla(); o.en = $('.camisa-op[data-c="0"]').getAttribute('aria-label'); S.lang = 'es';
    return o; });
  const d = Object.values(r.distintas), t = r.tras;
  const ok = d.length === 4 && d.every(n => n === 4) && t.camisa === 0 && t.guardados === 1 && t.guardado === 0 && t.sel === '0' && t.aria === 'true,false,false,false' && t.estado === 'EQUIPADO' && t.marca === '✓' && t.pts === 900 && t.acc === 'gafas' && t.accs === 'gafas' && r.en === 'Green';
  return [ok, JSON.stringify(r)];
});

await caso('colores del avatar · las pestañas PIEL y CAMISA caben en 6 tamaños, con HD y texto legible, en ES y EN, sin desbordar ni cortar', ID_J, async pg => {
  const mal = [];
  for (const modo of [{}, { hd: true, legible: true }, { lang: 'en', legible: true }]) {
    await pg.evaluate(m => { Object.assign(S, { hd: false, legible: false, lang: 'es' }, m); aplicarModo(); }, modo);
    for (const [w, h] of [[320, 568], [390, 760], [844, 390], [820, 1100], [1280, 800], [1920, 1080]]) {
      await pg.setViewportSize({ width: w, height: h });
      for (const tab of ['piel', 'camisa']) {
        await pg.evaluate(t => { pePestana = t; rPerso(); }, tab); await pausa(150);
        const r = await pg.evaluate(t => { const sc = $('#screen'), p = $(`#pe-p-${t}`).getBoundingClientRect();
          const fuera = [...document.querySelectorAll(`#pe-p-${t} .pe-color-op`)].filter(e => { const q = e.getBoundingClientRect(); return q.left < p.left - 1 || q.right > p.right + 1; }).length;
          const corta = [...document.querySelectorAll(`#pe-p-${t} .pe-color-nom, #pe-p-${t} .pe-color-estado, #pe-p-${t} h3`)].filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent.trim());
          return { scroll: sc.scrollWidth > sc.clientWidth || document.documentElement.scrollWidth > innerWidth, fuera, corta }; }, tab);
        if (r.scroll || r.fuera || r.corta.length) mal.push(`${JSON.stringify(modo)} ${w}×${h} ${tab}: ${JSON.stringify(r)}`);
      }
    }
  }
  await pg.evaluate(() => { Object.assign(S, { hd: false, legible: false, lang: 'es' }); aplicarModo(); });
  return [mal.length === 0, mal.length ? mal.slice(0, 3).join(' · ') : '3 modos × 6 tamaños × 2 pestañas: todo dentro, sin cortar'];
});

/* ── IDENTIDAD, PARTE 5 (v40.4): accesorios sobre el cuerpo y probador ──
   Lo que no puede romperse: probar es gratis y no toca ni S ni el guardado; solo EQUIPAR o
   COMPRAR Y EQUIPAR cambian algo, y cobran el precio exacto una vez; sigue habiendo un único
   accesorio puesto; el accesorio se ve sobre el jugador en la portada, el mapa, el pasillo, el
   runner y el jefe, nunca sobre los NPC; y la pestaña cabe. */
const ACC_J = { ...ID_J, pts: 400, accs: ['gafas'], acc: 'gafas' };

await caso('accesorios · el probador es gratis: probar uno no comprado lo enseña en el visor sin tocar S ni el guardado; CANCELAR y cambiar de pestaña lo descartan', ACC_J, async pg => {
  await pg.waitForFunction(() => APRENDIZ.listoPremium, null, { timeout: 5000 });
  const r = await pg.evaluate(async () => { pePestana = 'acc'; rPerso(); await new Promise(r => setTimeout(r, 300));
    const visor = () => $('#pe-cuerpo-av').toDataURL(), guardado = () => localStorage.getItem('pa3');
    const v0 = visor(), g0 = guardado(), o = {};
    $('.acc-op[data-a="capa"]').click(); await new Promise(r => setTimeout(r, 300));
    o.prueba = { visorCambia: visor() !== v0, acc: S.acc, pts: S.pts, accs: S.accs.join(), guardadoIgual: guardado() === g0, boton: $('#pe-si').textContent.trim(), aria: $('.acc-op[data-a="capa"]').getAttribute('aria-pressed') };
    $('#pe-no').click(); await new Promise(r => setTimeout(r, 300)); o.cancelar = { visorVuelve: visor() === v0, sel: $('.acc-op.sel')?.dataset.a };
    $('.acc-op[data-a="corona"]').click(); $('#pe-t-piel').click(); $('#pe-t-acc').click(); await new Promise(r => setTimeout(r, 300));
    o.pestana = { sel: $('.acc-op.sel')?.dataset.a, visorVuelve: visor() === v0, acc: S.acc, guardadoIgual: guardado() === g0 };
    return o; });
  const p = r.prueba;
  const ok = p.visorCambia && p.acc === 'gafas' && p.pts === 400 && p.accs === 'gafas' && p.guardadoIgual && p.aria === 'true' && r.cancelar.visorVuelve && r.cancelar.sel === 'gafas' && r.pestana.sel === 'gafas' && r.pestana.visorVuelve && r.pestana.acc === 'gafas' && r.pestana.guardadoIgual;
  return [ok, JSON.stringify(r)];
});

await caso('accesorios · COMPRAR Y EQUIPAR cobra el precio exacto una vez (doble clic incluido); sin puntos no deja; EQUIPAR uno comprado y SIN ACCESORIO no cobran; nunca hay dos puestos', ACC_J, async pg => {
  const r = await pg.evaluate(async () => { pePestana = 'acc'; rPerso(); await new Promise(r => setTimeout(r, 200)); const o = {};
    const precio = id => ACCS.find(a => a.id === id).precio;
    const barato = ACCS.filter(a => a.id !== 'gafas' && a.precio <= S.pts).sort((a, b) => a.precio - b.precio)[0].id;
    const caro = ACCS.filter(a => a.precio > S.pts)[0]?.id;
    let antes = S.pts; $(`.acc-op[data-a="${barato}"]`).click(); const si = $('#pe-si'); si.click(); si.click(); $('#pe-si')?.click();
    o.compra = { id: barato, cobro: antes - S.pts, precio: precio(barato), acc: S.acc, veces: S.accs.filter(x => x === barato).length, guardado: JSON.parse(localStorage.getItem('pa3')).acc };
    await new Promise(r => setTimeout(r, 500));
    if (caro) { antes = S.pts; $(`.acc-op[data-a="${caro}"]`).click(); o.caro = { id: caro, desactivado: $('#pe-si').disabled }; $('#pe-si').click(); o.caro.cobro = antes - S.pts; o.caro.acc = S.acc; $('#pe-no').click(); }
    antes = S.pts; $('.acc-op[data-a="gafas"]').click(); $('#pe-si').click(); o.equipar = { cobro: antes - S.pts, acc: S.acc };
    await new Promise(r => setTimeout(r, 500));
    antes = S.pts; $('.acc-op[data-a=""]').click(); $('#pe-si').click(); o.quitar = { cobro: antes - S.pts, acc: S.acc, guardado: JSON.parse(localStorage.getItem('pa3')).acc };
    o.unico = typeof S.acc === 'string';
    return o; });
  const ok = r.compra.cobro === r.compra.precio && r.compra.acc === r.compra.id && r.compra.veces === 1 && r.compra.guardado === r.compra.id
    && (!r.caro || (r.caro.desactivado && r.caro.cobro === 0 && r.caro.acc === r.compra.id))
    && r.equipar.cobro === 0 && r.equipar.acc === 'gafas' && r.quitar.cobro === 0 && r.quitar.acc === '' && r.quitar.guardado === '' && r.unico;
  return [ok, JSON.stringify(r)];
});

await caso('accesorios · el accesorio puesto se pinta sobre el jugador en la portada, el mapa, el pasillo, el runner y el jefe, con las dos apariencias; los NPC no lo llevan', ACC_J, async pg => {
  await pg.waitForFunction(() => APRENDIZ.listoPremium && APRENDIZ.listaFemenina && NPC_PASILLO.listo, null, { timeout: 5000 });
  const r = {};
  await pg.evaluate(() => { window.__acc = []; window.__gato = 0; const o = ACC_ARTE.encima; ACC_ARTE.encima = function (k, id, ...a) { window.__acc.push(id); return o.call(this, k, id, ...a); };
    const g = GATO.acompanar; GATO.acompanar = function (...a) { const r = g.apply(this, a); if (r) window.__gato++; return r; }; });
  for (const [ap, acc] of [['masculina', 'corona'], ['femenina', 'gato']]) {
    for (const [n, f, ms] of [['portada', 'rTitulo()', 600], ['mapa', 'rMapaLista()', 500], ['pasillo', 'rPasillo(0)', 600], ['runner', 'diaAct = 9; vidas = 3; nvRunner(9)', 900], ['jefe', 'diaAct = 9; vidas = 3; nvJefe(9, 0)', 1200]]) {
      await pg.evaluate(([ap, acc]) => { S.apariencia = ap; S.acc = acc; window.__acc = []; window.__gato = 0; }, [ap, acc]);
      await pg.evaluate(f); await pausa(ms);
      /* el gato ya no es una pieza del cuerpo: es un acompañante con su lienzo propio (portada, mapa, pasillo) o que se pinta con GATO.acompanar (runner, jefe) */
      r[`${ap[0]}:${n}`] = await pg.evaluate(() => { const ids = [...new Set(window.__acc.filter(i => i !== 'gato'))].join(); const visibles = [...document.querySelectorAll('.gato-compa')].filter(e => e.style.display === 'block').length; return ids || (window.__gato > 0 || visibles > 0 ? 'gato' : ''); });
    }
  }
  const npc = await pg.evaluate(() => { const h = acc => { const c = document.createElement('canvas'); c.width = 44; c.height = 74; APRENDIZ.dibujar(c.getContext('2d'), 22, 74, 74, 0, 0, PERSONAJES.lider.piel, PERSONAJES.lider.camisa, 'masculina', acc); return c.toDataURL(); }; return h('corona') === h(''); });
  await pg.evaluate(() => rTitulo());
  const ok = Object.entries(r).every(([k, v]) => v === (k[0] === 'm' ? 'corona' : 'gato')) && npc;
  return [ok, JSON.stringify({ ...r, npcSinAccesorio: npc })];
});

await caso('accesorios · los 8 que van sobre el cuerpo cambian el dibujo en 8 direcciones × 4 pasos × 2 apariencias (las gafas, la corbata y la medalla se esconden de espaldas), el gato es un acompañante aparte y no cambia el cuerpo, y los pies no se mueven', ACC_J, async pg => {
  await pg.waitForFunction(() => APRENDIZ.listoPremium && APRENDIZ.listaFemenina, null, { timeout: 5000 });
  const r = await pg.evaluate(() => {
    const k = document.createElement('canvas'); k.width = 44; k.height = 74; const c = k.getContext('2d', { willReadFrequently: true });
    const pinta = (d, p, ap, acc) => { c.clearRect(0, 0, 44, 74); APRENDIZ.dibujar(c, 22, 74, 74, d, p, 1, 1, ap, acc); return c.getImageData(0, 0, 44, 74).data; };
    const igual = (a, b) => a.every((v, i) => v === b[i]);
    const pie = d => { for (let y = 73; y >= 0; y--) for (let x = 0; x < 44; x++) if (d[(y * 44 + x) * 4 + 3]) return y; return -1; };
    const mal = [], ocultos = { gafas: [3, 4, 5], corbata: [3, 4, 5], medalla: [3, 4, 5], gato: [0, 1, 2, 3, 4, 5, 6, 7] };
    for (const ap of ['masculina', 'femenina']) for (let d = 0; d < 8; d++) for (let p = 0; p < 4; p++) { const base = pinta(d, p, ap, ''), piso = pie(base);
      for (const id of ACC_ARTE.ids) { const con = pinta(d, p, ap, id), oculto = (ocultos[id] || []).includes(d);
        if (oculto !== igual(base, con)) mal.push(`${ap} ${id} dir ${d} paso ${p}: ${oculto ? 'se ve de espaldas' : 'no se ve'}`);
        if (pie(con) !== piso && id !== 'gato') mal.push(`${ap} ${id} dir ${d} paso ${p}: pie ${pie(con)} vs ${piso}`); } }
    return mal; });
  return [r.length === 0, r.length ? r.slice(0, 4).join(' · ') : '8 accesorios × 64 cuadros × 2 apariencias: se ven donde toca, el gato no toca el cuerpo y los pies no se mueven'];
});

await caso('accesorios · la tienda pinta los 9 iconos pixel (distintos) y PROBAR ACCESORIOS abre Mi Avatar en la pestaña de accesorios; la compra de la tienda sigue igual', ACC_J, async pg => {
  const r = await pg.evaluate(async () => { rTienda(); await new Promise(r => setTimeout(r, 200));
    const iconos = [...document.querySelectorAll('.item-tienda canvas.tienda-acc-arte')].map(c => c.toDataURL());
    const vacio = (() => { const c = document.createElement('canvas'); c.width = c.height = 32; return c.toDataURL(); })();
    const o = { iconos: iconos.length, distintos: new Set(iconos).size, vacios: iconos.filter(u => u === vacio).length };
    const barato = ACCS.filter(a => !S.accs.includes(a.id) && a.precio <= S.pts)[0]; const antes = S.pts;
    if (barato) { document.querySelector(`.item-tienda[data-id="${barato.id}"]`).click(); await new Promise(r => setTimeout(r, 100)); o.tiendaCobra = antes - S.pts === barato.precio || !!document.querySelector('#screen [data-id]'); }
    rTienda(); $('#ti-probar').click(); o.pantalla = pantallaId; o.tab = $('.pe-tab.act')?.dataset.tab;
    return o; });
  return [r.iconos === 9 && r.distintos === 9 && r.vacios === 0 && r.pantalla === 'perso' && r.tab === 'acc', JSON.stringify(r)];
});

await caso('accesorios · la pestaña de accesorios cabe en 6 tamaños, con HD y texto legible, en ES y EN, sin desbordar ni cortar', ACC_J, async pg => {
  const mal = [];
  for (const modo of [{}, { hd: true, legible: true }, { lang: 'en', legible: true }]) {
    await pg.evaluate(m => { Object.assign(S, { hd: false, legible: false, lang: 'es' }, m); aplicarModo(); }, modo);
    for (const [w, h] of [[320, 568], [390, 760], [844, 390], [820, 1100], [1280, 800], [1920, 1080]]) {
      await pg.setViewportSize({ width: w, height: h });
      await pg.evaluate(() => { pePestana = 'acc'; rPerso(); $('.acc-op[data-a="capa"]').click(); }); await pausa(150);
      const r = await pg.evaluate(() => { const sc = $('#screen'), p = $('#pe-p-acc').getBoundingClientRect();
        const fuera = [...document.querySelectorAll('#pe-p-acc button')].filter(e => { const q = e.getBoundingClientRect(); return q.width && (q.left < p.left - 1 || q.right > p.right + 1); }).map(e => e.id || e.dataset.a);
        const corta = [...document.querySelectorAll('#pe-p-acc .pe-acc-nom, #pe-p-acc .pe-acc-estado, #pe-p-acc .pe-acc-costo, #pe-p-acc .btn')].filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent.trim());
        return { scroll: sc.scrollWidth > sc.clientWidth || document.documentElement.scrollWidth > innerWidth, fuera, corta }; });
      if (r.scroll || r.fuera.length || r.corta.length) mal.push(`${JSON.stringify(modo)} ${w}×${h}: ${JSON.stringify(r)}`);
    }
  }
  await pg.evaluate(() => { Object.assign(S, { hd: false, legible: false, lang: 'es' }); aplicarModo(); });
  return [mal.length === 0, mal.length ? mal.slice(0, 3).join(' · ') : '3 modos × 6 tamaños: todo dentro, sin cortar'];
});

/* ── IDENTIDAD, PARTE 6 (v40.5): Mi Avatar definitivo ──
   Lo que no puede romperse: que las vistas y el giro no guarden nada; que los selectores rápidos
   hagan lo mismo que las tarjetas (y queden sincronizados con ellas); que el atajo lleve al
   probador; que la colección y los puntos se actualicen al comprar; que todo quepa. */
await caso('vestidor · vistas ambos/retrato/cuerpo y giro en los dos sentidos con el nombre de la dirección; nada se guarda; con RETRATO se para la caminata', ID_J, async pg => {
  await pg.waitForFunction(() => APRENDIZ.listoPremium && APRENDIZ.listaFemenina, null, { timeout: 5000 });
  const r = await pg.evaluate(async () => { rPerso(); await new Promise(r => setTimeout(r, 200)); const g0 = localStorage.getItem('pa3'), o = {};
    const vis = s => { const e = $(s); return !!e && !e.hidden && e.getBoundingClientRect().width > 0; };
    for (const v of ['retrato', 'cuerpo', 'ambos']) { $(`[data-pe-vista="${v}"]`).click(); o[v] = { cara: vis('#pe-cara'), cuerpo: vis('#pe-cuerpo-av'), mov: vis('#pe-movimiento'), det: vis('#pe-resolucion') }; }
    const nombres = [$('#pe-direccion').textContent]; for (let k = 0; k < 8; k++) { $('#pe-girar').click(); nombres.push($('#pe-direccion').textContent); }
    $('#pe-girar-atras').click(); o.atras = $('#pe-direccion').textContent; o.nombres = new Set(nombres.slice(0, 8)).size; o.vuelta = nombres[8] === nombres[0];
    $('#pe-caminar').click(); $('[data-pe-vista="retrato"]').click(); o.caminaTrasRetrato = $('#pe-caminar').getAttribute('aria-pressed');
    o.guardadoIgual = localStorage.getItem('pa3') === g0; $('[data-pe-vista="ambos"]').click(); return o; });
  const ok = r.retrato.cara && !r.retrato.cuerpo && !r.retrato.mov && r.retrato.det && !r.cuerpo.cara && r.cuerpo.cuerpo && r.cuerpo.mov && !r.cuerpo.det && r.ambos.cara && r.ambos.cuerpo
    && r.nombres === 8 && r.vuelta && r.atras !== r.nombres && r.caminaTrasRetrato === 'false' && r.guardadoIgual;
  return [ok, JSON.stringify(r)];
});

await caso('vestidor · los selectores rápidos de piel y camisa cambian y guardan como las tarjetas, y las dos quedan marcadas igual; el atajo del accesorio abre el probador', ID_J, async pg => {
  const r = await pg.evaluate(async () => { pePestana = 'apariencia'; rPerso(); await new Promise(r => setTimeout(r, 200)); const o = {};
    $('[data-pe-quick="piel"][data-indice="3"]').click(); $('[data-pe-quick="camisa"][data-indice="0"]').click();
    const g = JSON.parse(localStorage.getItem('pa3'));
    o.s = { skin: S.skin, camisa: S.camisa, gSkin: g.skin, gCamisa: g.camisa };
    o.rapidos = $$('[data-pe-quick]').filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.dataset.peQuick + b.dataset.indice).join();
    o.tarjetas = $$('.pe-color-op.sel').map(b => (b.dataset.s !== undefined ? 'piel' + b.dataset.s : 'camisa' + b.dataset.c)).join();
    o.nombres = $('#pe-resumen-piel').textContent + '|' + $('#pe-resumen-camisa').textContent;
    $('#pe-atajo-acc').click(); o.tab = $('.pe-tab.act')?.dataset.tab; o.panel = !$('#pe-p-acc').hidden; o.acc = $('#pe-acc-actual').textContent === t('acc_gafas');
    return o; });
  const ok = r.s.skin === 3 && r.s.camisa === 0 && r.s.gSkin === 3 && r.s.gCamisa === 0 && r.rapidos === 'piel3,camisa0' && r.tarjetas === 'piel3,camisa0' && r.nombres === 'Oscuro|Verde' && r.tab === 'acc' && r.panel && r.acc;
  return [ok, JSON.stringify(r)];
});

await caso('vestidor · al comprar y equipar, puntos, colección (2/9) y su barra, el HUD y el atajo se actualizan; antes de confirmar el visor dice PROBADOR', { ...ID_J, pts: 400 }, async pg => {
  const r = await pg.evaluate(async () => { pePestana = 'acc'; rPerso(); await new Promise(r => setTimeout(r, 200)); const o = {};
    const a = ACCS.filter(x => !S.accs.includes(x.id) && x.precio <= S.pts).sort((x, y) => x.precio - y.precio)[0];
    $(`.acc-op[data-a="${a.id}"]`).click(); o.tag = $('#pe-escena-tag').textContent; o.enPrueba = $('#pe-escena-av').classList.contains('pe-en-prueba');
    $('#pe-si').click(); await new Promise(r => setTimeout(r, 100));
    o.tras = { pts: S.pts, esperado: 400 - a.precio, ptsTxt: $('#pe-st-pts').textContent, col: $('#pe-st-acc').textContent, barra: $('#pe-coleccion-bar').getAttribute('aria-valuenow'), tag: $('#pe-escena-tag').textContent, atajo: $('#pe-acc-actual').textContent, nombre: t('acc_' + a.id), hud: document.body.textContent.includes(String(S.pts).padStart(4, '0')) };
    return o; });
  const t2 = r.tras;
  const ok = r.tag === 'PROBADOR' && r.enPrueba && t2.pts === t2.esperado && t2.ptsTxt === String(t2.esperado) && t2.col === '2/9' && t2.barra === '2' && t2.tag !== 'PROBADOR' && t2.atajo === t2.nombre && t2.hud;
  return [ok, JSON.stringify(r)];
});

await caso('vestidor · Mi Avatar entero cabe en 7 tamaños × 4 pestañas × 3 vistas, con HD y texto legible, en ES y EN, sin desbordar ni cortar', ID_J, async pg => {
  const mal = [];
  for (const modo of [{}, { hd: true, legible: true }, { lang: 'en' }]) {
    await pg.evaluate(m => { Object.assign(S, { hd: false, legible: false, lang: 'es' }, m); aplicarModo(); }, modo);
    for (const [w, h] of [[320, 568], [360, 640], [390, 760], [844, 390], [820, 1100], [1280, 800], [1920, 1080]]) {
      await pg.setViewportSize({ width: w, height: h });
      for (const tab of ['apariencia', 'piel', 'camisa', 'acc']) for (const vista of ['ambos', 'retrato', 'cuerpo']) {
        const r = await pg.evaluate(([tab, vista]) => { pePestana = tab; rPerso(); $(`[data-pe-vista="${vista}"]`).click();
          const sc = $('#screen'), w = $('.pe-wrap').getBoundingClientRect();
          const fuera = [...document.querySelectorAll('.pe-wrap button, .pe-wrap canvas')].filter(e => { const q = e.getBoundingClientRect(); return q.width && (q.left < w.left - 1 || q.right > w.right + 1); }).map(e => e.id || e.className);
          const corta = [...document.querySelectorAll('.pe-wrap .rec-chip, .pe-wrap .pe-tab, .pe-wrap .pe-direccion, .pe-wrap .pe-stats dt, .pe-wrap .pe-resumen-bloque h4, .pe-wrap .pe-atajo-acc strong')].filter(e => e.getBoundingClientRect().width && e.scrollWidth > e.clientWidth + 1).map(e => e.id || e.textContent.trim());
          return { scroll: sc.scrollWidth > sc.clientWidth || document.documentElement.scrollWidth > innerWidth, fuera, corta }; }, [tab, vista]);
        if (r.scroll || r.fuera.length || r.corta.length) mal.push(`${JSON.stringify(modo)} ${w}×${h} ${tab}/${vista}: ${JSON.stringify(r)}`);
      }
    }
  }
  await pg.evaluate(() => { Object.assign(S, { hd: false, legible: false, lang: 'es' }); aplicarModo(); $('[data-pe-vista="ambos"]')?.click(); });
  return [mal.length === 0, mal.length ? mal.slice(0, 3).join(' · ') : '3 modos × 7 tamaños × 4 pestañas × 3 vistas: todo dentro, sin cortar'];
});

/* ── Retoques al integrar las seis partes (v40.5) ── */
await caso('retratos protagonistas · la gorra del retrato es azul como la del cuerpo y la tienda, y a 16×16 los dos ojos de las dos apariencias se ven limpios (abiertos y en parpadeo), con piel alrededor', ID_J, async pg => {
  const r = await pg.evaluate(() => {
    const sin = Object.fromEntries(ACC_ARTE.ids.map(i => [i, false]));
    const lienzo = (o, n) => { const k = document.createElement('canvas'); k.width = k.height = n; retrato(k, Object.assign(CARAS.yo(false), sin, o)); return k.getContext('2d'); };
    /* la gorra: el color dominante de la franja de arriba, a 32 */
    const c = lienzo({ apariencia: 'masculina', av32: true, gorra: true }, 32), d = c.getImageData(8, 1, 16, 3).data; let azul = 0, verde = 0;
    for (let i = 0; i < d.length; i += 4) { if (d[i + 2] > d[i + 1] + 30 && d[i + 2] > d[i] + 60) azul++; if (d[i + 1] > d[i] + 40 && d[i + 1] > d[i + 2] + 40) verde++; }
    /* a 16 los ojos están en las columnas 5-6 y 9-10 (fila 7: la que queda al parpadear): oscuros, con piel en 4, 7, 8 y 11 */
    const o = { azul, verde };
    const lum = p => .3 * p[0] + .59 * p[1] + .11 * p[2];
    for (const ap of ['masculina', 'femenina']) for (const parpadeo of [false, true]) { const k = lienzo({ apariencia: ap, av32: false, skin: SKINS[0], parpadeo }, 16);
      const L = x => Math.round(lum([...k.getImageData(x, 7, 1, 1).data]));
      o[ap + (parpadeo ? '-parpadeo' : '')] = { ojos: [5, 6, 9, 10].map(L).every(v => v < 60), piel: [4, 7, 8, 11].map(L).every(v => v > 120) }; }
    return o; });
  const ojosBien = Object.entries(r).filter(([k]) => k !== 'azul' && k !== 'verde').every(([, v]) => v.ojos && v.piel);
  return [r.azul > 10 && r.verde === 0 && ojosBien, JSON.stringify(r)];
});

await nav.close();
if (srv) srv.kill();
console.log(`\n${total - fallos}/${total} regresiones en verde`);
process.exit(fallos ? 1 : 0);
