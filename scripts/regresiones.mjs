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
async function caso(nombre, guardado, fn) {
  /* SOLO=texto: corre solo los casos cuyo nombre lo contenga (para iterar rápido) */
  if (process.env.SOLO && !nombre.includes(process.env.SOLO)) return;
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

/* ── EL FONDO DE LA PORTADA (v27) ──
   Una ciudad nocturna animada, solo en el menú principal; las montañas de siempre en
   el resto y si la imagen falla. Lo que no puede romperse: que no corran dos fondos a
   la vez, que cubra sin deformarse, que respete "reducir movimiento" y la pestaña
   oculta, que el texto siga leyéndose y que funcione sin conexión. */
const FONDO = { intro: true, nombre: 'R', pts: 900, xp: 1700, version: 'v27', dias: [3, 2, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
/* cuántas animaciones de CSS hay en marcha en las capas del fondo */
const animFondo = () => ({
  ciudad: document.getAnimations().filter(a => a.effect?.target?.classList?.contains('ciudad') && a.playState === 'running').length,
  montanas: document.getAnimations().filter(a => a.effect?.target?.classList?.contains('mte') && a.playState === 'running').length,
});
/* las funciones de node no existen en la página: se instala animFondo como global de la página */
const instalaAnim = pg => pg.evaluate(f => { window.animFondo = eval('(' + f + ')'); }, animFondo.toString());

await caso('fondo del menú · la ciudad solo está en el menú principal y nunca corren dos fondos a la vez', FONDO, async pg => {
  await pg.evaluate(() => rTitulo()); await pg.waitForFunction(() => document.querySelector('#app').classList.contains('fondo-ciudad'), null, { timeout: 5000 });
  const pasos = [];
  const foto = async nombre => pasos.push({ nombre, clase: await pg.evaluate(() => document.querySelector('#app').classList.contains('fondo-ciudad')),
    display: await pg.evaluate(() => getComputedStyle(document.querySelector('.ciudad')).display), ...(await pg.evaluate(animFondo)) });
  await foto('menú');
  for (const [nombre, js] of [['pasillo', () => rPasillo()], ['lista', () => rMapaLista()], ['tienda', () => rTienda()], ['logros', () => rLogros()],
                              ['récords', () => rRecords()], ['minijuego', () => { diaAct = 1; vidas = 3; nvBugs(1); }], ['jefe', () => { diaAct = 9; vidas = 3; nvJefe(9, 0); }]]) {
    await pg.evaluate(js); await pausa(350); await foto(nombre);
    await pg.evaluate(() => rTitulo()); await pausa(350);
    await foto('menú tras ' + nombre);
  }
  const mal = pasos.filter(p => p.nombre.startsWith('menú') ? !(p.clase && p.display === 'block' && p.ciudad === 1 && p.montanas === 0)
                                                           : !(!p.clase && p.display === 'none' && p.ciudad === 0));
  return [mal.length === 0, mal.length ? 'mal: ' + JSON.stringify(mal) : `${pasos.length} pantallas: la ciudad solo en el menú (1 animación) y fuera, 0`];
});

await caso('fondo del menú · fuera del menú siguen las montañas (con su animación) y se esconden en el menú', FONDO, async pg => {
  await instalaAnim(pg);
  await pg.evaluate(() => rTitulo()); await pausa(600);
  const menu = await pg.evaluate(() => ({ mte: getComputedStyle(document.querySelector('.mte.m1')).display, niebla: getComputedStyle(document.querySelector('.niebla')).display }));
  await pg.evaluate(() => rPasillo()); await pausa(400);
  const fuera = await pg.evaluate(() => ({ mte: getComputedStyle(document.querySelector('.mte.m1')).display, niebla: getComputedStyle(document.querySelector('.niebla')).display, ...animFondo() }));
  return [menu.mte === 'none' && menu.niebla === 'none' && fuera.mte === 'block' && fuera.niebla === 'block' && fuera.montanas === 3 && fuera.ciudad === 0, JSON.stringify({ menu, fuera })];
});

await caso('fondo del menú · cubre sin deformar en móvil, móvil chico, tablet y escritorio (relación 549:466)', FONDO, async pg => {
  const sal = [];
  for (const [w, h] of [[390, 760], [320, 568], [820, 1100], [1280, 800], [1920, 1080], [360, 640]]) {
    await pg.setViewportSize({ width: w, height: h }); await pg.evaluate(() => rTitulo()); await pausa(450);
    const r = await pg.evaluate(() => {
      const a = document.querySelector('.ciudad').getBoundingClientRect(), f = document.querySelector('#fondo').getBoundingClientRect();
      return { ratio: a.width / a.height, cubre: a.left <= f.left + 1 && a.right >= f.right - 1 && a.top <= f.top + 1 && a.bottom >= f.bottom - 1,
               detras: getComputedStyle(document.querySelector('.ciudad')).pointerEvents === 'none' && getComputedStyle(document.querySelector('#fondo')).zIndex === '0' };
    });
    if (!r.cubre || Math.abs(r.ratio - 549 / 466) > .005 || !r.detras) sal.push(`${w}×${h}: ${JSON.stringify(r)}`);
  }
  return [sal.length === 0, sal.length ? sal.join(' · ') : '6 tamaños: cubre, sin deformar, detrás de todo y sin interceptar toques'];
});

await caso('fondo del menú · la animación recorre 6 cuadros distintos, de ~800 ms cada uno', FONDO, async pg => {
  await pg.evaluate(() => rTitulo()); await pg.waitForFunction(() => document.querySelector('#app').classList.contains('fondo-ciudad'), null, { timeout: 5000 });
  const m = await pg.evaluate(async () => {
    const t0 = performance.now(), v = [];
    while (performance.now() - t0 < 5600) { v.push([performance.now() - t0, getComputedStyle(document.querySelector('.ciudad')).backgroundPosition]); await new Promise(r => setTimeout(r, 40)); }
    return v;
  });
  const cambios = m.filter((x, i) => i && x[1] !== m[i - 1][1]).map(x => Math.round(x[0]));
  const dist = [...new Set(m.map(x => x[1]))];
  const gaps = cambios.slice(1).map((c, i) => c - cambios[i]);
  return [dist.length === 6 && gaps.length >= 4 && gaps.every(g => g > 600 && g < 1000), `${dist.length} posiciones, cambios a ${cambios}, intervalos ${gaps}`];
});

await caso('fondo del menú · con "reducir movimiento": imagen estática y ninguna animación', FONDO, async pg => {
  await pg.emulateMedia({ reducedMotion: 'reduce' }); await pg.reload({ waitUntil: 'load' });
  await pg.waitForFunction(() => typeof pantallaId !== 'undefined'); await pausa(300);
  await instalaAnim(pg);
  await pg.evaluate(() => rTitulo()); await pg.waitForFunction(() => document.querySelector('#app').classList.contains('fondo-ciudad'), null, { timeout: 5000 });
  const r = await pg.evaluate(() => { const e = getComputedStyle(document.querySelector('.ciudad')); return { anim: e.animationName, img: e.backgroundImage, tam: e.backgroundSize, corre: animFondo().ciudad,
    pedidas: performance.getEntriesByType('resource').map(x => x.name.split('/').pop()).filter(n => n.startsWith('ciudad')) }; });
  return [r.anim === 'none' && /ciudad-estatica\.png/.test(r.img) && r.corre === 0 && r.pedidas.join() === 'ciudad-estatica.png', JSON.stringify(r)];
});

await caso('fondo del menú · con la pestaña oculta la animación se pausa y al volver sigue', FONDO, async pg => {
  await instalaAnim(pg);
  await pg.evaluate(() => rTitulo()); await pg.waitForFunction(() => document.querySelector('#app').classList.contains('fondo-ciudad'), null, { timeout: 5000 });
  const estado = () => pg.evaluate(() => ({ marca: document.documentElement.classList.contains('pestana-oculta'), play: getComputedStyle(document.querySelector('.ciudad')).animationPlayState, corre: animFondo().ciudad }));
  const visible = await estado();
  await pg.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  const oculta = await estado();
  await pg.evaluate(() => { Object.defineProperty(document, 'hidden', { value: false, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  const vuelve = await estado();
  return [!visible.marca && visible.play === 'running' && oculta.marca && oculta.play === 'paused' && oculta.corre === 0 && !vuelve.marca && vuelve.play === 'running' && vuelve.corre === 1, JSON.stringify({ visible, oculta, vuelve })];
});

await caso('fondo del menú · si la imagen no carga, el menú se queda con las montañas de siempre', FONDO, async pg => {
  await pg.route('**/img/fondo/**', r => r.abort());
  await pg.reload({ waitUntil: 'load' }); await pg.waitForFunction(() => typeof pantallaId !== 'undefined'); await pausa(300);
  await instalaAnim(pg);
  await pg.evaluate(() => rTitulo()); await pausa(900);
  const r = await pg.evaluate(() => ({ clase: document.querySelector('#app').classList.contains('fondo-ciudad'), mte: getComputedStyle(document.querySelector('.mte.m1')).display, capa: getComputedStyle(document.querySelector('.ciudad')).display, ...animFondo() }));
  return [!r.clase && r.mte === 'block' && r.capa === 'none' && r.montanas === 3 && r.ciudad === 0, JSON.stringify(r)];
});

await caso('fondo del menú · el texto suelto sobre el fondo sigue leyéndose (contraste ≥ 4,5 en móvil, móvil chico y escritorio)', FONDO, async pg => {
  const lum = (r, g, b) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
  const sal = [];
  for (const [w, h] of [[390, 760], [320, 568], [1280, 800]]) {
    await pg.setViewportSize({ width: w, height: h }); await pg.evaluate(() => rTitulo()); await pausa(500);
    /* se mide el fondo SIN el texto (transparente) justo detrás de cada línea: el 95 % más claro de sus píxeles manda */
    for (const sel of ['.sub', '.xp-txt', '.tit-h1 .l1', '.tit-h1 .l2', '.dif-cap']) {
      const el = await pg.$(sel); if (!el) continue;
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

await caso('fondo del menú · sin conexión: el service worker guarda las dos imágenes y la ciudad se sirve de su caché', FONDO, async pg => {
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
    const rutas = ['img/fondo/ciudad-atlas.png', 'img/fondo/ciudad-estatica.png', 'js/fondo.js'];
    const guardadas = await pg.evaluate(async rs => Promise.all(rs.map(async u => !!(await caches.match(u)))), rutas);
    await pg.context().setOffline(true);
    const sinRed = await pg.evaluate(async () => { const r = await fetch('img/fondo/ciudad-atlas.png', { cache: 'reload' }); return { ok: r.ok, bytes: (await r.blob()).size }; });
    await pg.context().setOffline(false);
    return [guardadas.every(Boolean) && sinRed.ok && sinRed.bytes > 200000, `en la caché: ${guardadas}, hoja sin red: ${JSON.stringify(sinRed)}`];
  } finally { mini.close(); }
});

await caso('fondo del menú · con la ciudad, el menú se ve y los botones responden (JUGAR → pasillo, y volver)', FONDO, async pg => {
  await pg.evaluate(() => rTitulo()); await pg.waitForFunction(() => document.querySelector('#app').classList.contains('fondo-ciudad'), null, { timeout: 5000 });
  await pg.click('#t-jugar'); await pausa(500);
  const en = await pg.evaluate(() => ({ p: pantallaId, clase: document.querySelector('#app').classList.contains('fondo-ciudad') }));
  await pg.evaluate(() => rTitulo()); await pausa(500);
  const vuelve = await pg.evaluate(() => document.querySelector('#app').classList.contains('fondo-ciudad'));
  return [en.p === 'pasillo' && !en.clase && vuelve, JSON.stringify({ en, vuelve })];
});

await nav.close();
if (srv) srv.kill();
console.log(`\n${total - fallos}/${total} regresiones en verde`);
process.exit(fallos ? 1 : 0);
