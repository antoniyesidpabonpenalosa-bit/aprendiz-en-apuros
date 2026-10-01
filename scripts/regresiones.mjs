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

await nav.close();
if (srv) srv.kill();
console.log(`\n${total - fallos}/${total} regresiones en verde`);
process.exit(fallos ? 1 : 0);
