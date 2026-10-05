/* Ronda en vivo + panel de punta a punta: navegadores reales (instructor y dos
   alumnos) contra el Postgres LOCAL con db/*.sql aplicados. Un puente reenvía
   cada petición a Supabase como `select public.<función>(...)` con el rol anon,
   así que se prueba el SQL de verdad, no un simulador.
     pg_ctlcluster 16 main start   (base "prueba" con records, anti-trampas,
     salas y sala-vivo)   y luego:   node db/pruebas/vivo-e2e.mjs  */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs').catch(() => import('playwright'));
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/json' };
const web = createServer(async (q, r) => {
  try { const u = decodeURIComponent(q.url.split('?')[0]); const p = join(RAIZ, u === '/' ? 'index.html' : u);
    r.writeHead(200, { 'content-type': tipos[extname(p)] || 'application/octet-stream' }); r.end(await readFile(p)); }
  catch { r.writeHead(404); r.end(); }
}).listen(8766);

const lit = (k, v, fn) => {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return fn === 'sala_reportar' ? `'${JSON.stringify(v).replace(/'/g, "''")}'` : `'{${v.join(',')}}'`;
  return `'${String(v).replace(/'/g, "''")}'`;
};
function llamar(nombre, args) {
  if (!/^sala_[a-z]+$/.test(nombre)) return { status: 404, cuerpo: { message: 'no' } };
  const a = Object.entries(args).map(([k, v]) => `${k} => ${lit(k, v, nombre)}`).join(', ');
  const sql = `begin; set local role anon; select coalesce(to_json(public.${nombre}(${a}))::text,'null'); commit;`;
  const r = spawnSync('su', ['postgres', '-c', 'psql -d prueba -Atq -v ON_ERROR_STOP=1'], { input: sql, encoding: 'utf8' });
  if (r.status !== 0) { const m = (r.stderr.match(/ERROR:\s*(.*)/) || [, 'error'])[1]; return { status: 400, cuerpo: { message: m } }; }
  const linea = r.stdout.split('\n').filter(Boolean).pop();
  return { status: 200, cuerpo: linea };
}

const VERSION = (await readFile(join(RAIZ, 'js/datos.js'), 'utf8')).match(/VERSION\s*=\s*'([^']+)'/)[1];
const b = await chromium.launch();
const errores = [], espera = ms => new Promise(r => setTimeout(r, ms));
const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) errores.push('FALLO: ' + m); };
async function abrir(nombre, vp, partida, extra = {}) {
  const ctx = await b.newContext({ viewport: vp, ...extra });
  await ctx.route('https://rfrvtuorcdgmlqwqzfqq.supabase.co/**', async route => {
    const q = route.request();
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST,GET,OPTIONS' };
    if (q.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const nombreFn = q.url().split('/rpc/')[1];
    if (!nombreFn) return route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: '[]' });
    const r = llamar(nombreFn, JSON.parse(q.postData() || '{}'));
    if (process.env.DEPURA && nombreFn !== 'sala_estado') console.log('rpc', nombreFn, q.postData(), '→', JSON.stringify(r).slice(0, 150));
    return route.fulfill({ status: r.status, headers: cors, contentType: 'application/json', body: typeof r.cuerpo === 'string' ? r.cuerpo : JSON.stringify(r.cuerpo) });
  });
  await ctx.addInitScript(p => { try { if (!localStorage.getItem('pa3')) localStorage.setItem('pa3', JSON.stringify(p)); } catch (e) {} }, { ...partida, version: VERSION });
  const p = await ctx.newPage();
  p.on('pageerror', e => errores.push(`${nombre}: ${e.message}`));
  await p.goto('http://localhost:8766/'); await p.waitForTimeout(800);
  if (process.env.DEPURA) console.log(nombre, await p.evaluate(() => pantallaId).catch(e => e.message), errores.join('|'));
  return p;
}

const prof = await abrir('prof', { width: 1280, height: 720 }, { nombre: 'PROFE', intro: true });
await prof.click('#t-sala'); await prof.click('#sa-crear'); await prof.waitForTimeout(200);
await prof.click('#sc-modo [data-vivo="1"]');
ok(await prof.$eval('#sc-ritmo', e => e.hidden), 'en vivo se esconden los minijuegos');
await prof.click('#sc-vn [data-n="5"]'); await prof.click('#sc-vl [data-l="30"]');
await prof.click('#sc-crear'); await prof.waitForTimeout(1200);
const codigo = await prof.$eval('.sp-codigo', e => e.textContent);
ok(/^[A-HJ-NP-Z2-9]{5}$/.test(codigo), `sala en vivo creada ${codigo}`);
ok(!(await prof.$('#sp-jugar-yo')), 'en vivo el instructor no juega (solo presenta)');

const alumnos = [];
for (const nombre of ['ANA', 'BETO']) {
  const a = await abrir(nombre, { width: 390, height: 844 }, { nombre, intro: true }, { isMobile: true, hasTouch: true });
  await a.click('#t-sala'); await a.fill('#sa-cod', codigo); await a.click('#sa-unir'); await a.waitForTimeout(900);
  alumnos.push(a);
}
await espera(3300);
const hasta = (pg, f, arg, ms = 12000) => pg.waitForFunction(f, arg, { timeout: ms }).then(() => true, () => false);
await prof.click('#sp-empezar');
for (const [i, a] of alumnos.entries()) ok(await hasta(a, () => pantallaId === 'sala-vivo'), `alumno ${i + 1} pasó solo a la pantalla en vivo`);
ok(await hasta(prof, () => !!document.querySelector('#sv-proy .sv-caja')), 'el proyector muestra la pregunta');

/* Cada pregunta: Ana siempre acierta, Beto siempre falla. */
for (let q = 1; q <= 5; q++) {
  for (const a of alumnos) await hasta(a, n => document.querySelector('#sv-num').textContent.includes(n) && document.querySelectorAll('#sv-ops .sv-op').length === 4, ` ${q}/5`);
  const [k, nOps] = await alumnos[0].evaluate(() => {
    const txt = document.querySelector('#sv-preg').textContent;
    const Q = QUIZ[S.lang].find(x => x.q === txt); return [Q ? Q.r : -1, Q ? Q.o.length : 0];
  });
  ok(k >= 0, `pregunta ${q}: el alumno encuentra la pregunta en su banco`);
  console.log("  q", q, "k", k);
  await alumnos[0].click(`#sv-ops .sv-op[data-k="${k}"]`);
  await alumnos[1].click(`#sv-ops .sv-op[data-k="${(k + 1) % nOps}"]`);
  const revelo = await hasta(prof, () => !!document.querySelector('#sv-proy .sv-op.bien'));
  if (q === 1) {
    ok(revelo, 'al responder todos, el proyector revela solo (la buena queda marcada)');
    ok(await hasta(alumnos[0], () => !!document.querySelector('#sv-ops .sv-op.bien')), 'el alumno ve la correcta');
    ok((await alumnos[0].$eval('#sv-msg', e => e.textContent)).includes('✔'), 'Ana ve ✔ con sus puntos');
    ok(await hasta(alumnos[1], () => document.querySelector('#sv-msg').textContent.includes('✖')), 'Beto ve ✖');
    ok(await hasta(alumnos[0], () => /1/.test(document.querySelector('#sv-yo').textContent)), 'Ana va en el puesto 1');
    await prof.screenshot({ path: (process.argv[2] || '/tmp') + '/vivo-proyector-revelada.png' });
    await alumnos[0].screenshot({ path: (process.argv[2] || '/tmp') + '/vivo-alumno-revelada.png' });
  }
  await prof.click('#sp-vivo-sig');
}
ok(await hasta(alumnos[0], () => pantallaId === 'sala-tabla', null, 15000), 'al terminar los alumnos ven la tabla final');
ok(await hasta(prof, () => document.querySelectorAll('#sp-podio *').length > 0), 'el proyector enseña el podio');
ok(await hasta(prof, () => /fallaron|missed/.test(document.querySelector('#sp-panel').textContent), null, 15000), 'el panel del instructor lista lo que falló (Beto falló todas)');
console.log('panel:', (await prof.$eval('#sp-panel', e => e.textContent)).replace(/\s+/g, ' ').slice(0, 220));
await prof.screenshot({ path: (process.argv[2] || '/tmp') + '/vivo-proyector-fin.png' });

await b.close(); web.close();
console.log(errores.length ? '\n' + errores.join('\n') : '\nTodo en orden ✅');
process.exit(errores.length ? 1 : 0);
