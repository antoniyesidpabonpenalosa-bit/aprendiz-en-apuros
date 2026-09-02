/* Generador del UI Kit (design-system/) sin dependencias.
   Lee css/estilos.css EN VIVO (nunca se desincroniza del juego real) y los
   fragmentos de design-system/src/ para producir tarjetas de componente
   listas para el design system de claude.ai/design y una galería local.
   Uso:
     node scripts/build-ui-kit.mjs          regenera design-system/dist/
     node scripts/build-ui-kit.mjs --check  regenera en un directorio temporal
                                             y falla si difiere de lo comprometido
                                             (detecta un dist/ desincronizado) */
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const CHECK = process.argv.includes('--check');
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(RAIZ, 'design-system', 'src');
const DIST_COMMIT = join(RAIZ, 'design-system', 'dist');
const DIST = CHECK ? mkdtempSync(join(tmpdir(), 'ui-kit-check-')) : DIST_COMMIT;
/* En --check el temporal debe borrarse pase lo que pase, no solo si el build
   termina bien: si algo lanza a mitad, el handler de salida igual lo limpia. */
if (CHECK) process.on('exit', () => rmSync(DIST, { recursive: true, force: true }));
const escritos = [];

const estilos = readFileSync(join(RAIZ, 'css', 'estilos.css'), 'utf8');

/* ── 1 · paleta de color extraída en vivo de :root ── */
const raiz = estilos.match(/:root\s*\{([^}]*)\}/);
if (!raiz) throw new Error('css/estilos.css no tiene un bloque :root { ... }');

/* La galería reusa el bloque del tema OLED del juego. Se valida aquí, antes de
   escribir nada, para no dejar dist/ a medio regenerar si el comentario cambia. */
const MARCA_OLED = 'MODO ✨';
const bloqueOled = estilos.split(MARCA_OLED)[1];
if (bloqueOled === undefined)
  throw new Error(`css/estilos.css no contiene el marcador "${MARCA_OLED}" que delimita el tema OLED.\n` +
    'Si renombraste ese comentario, actualiza MARCA_OLED en scripts/build-ui-kit.mjs.');
const tokens = [...raiz[1].matchAll(/--([a-z0-9]+)\s*:\s*([^;]+);/gi)]
  .map(m => ({ nombre: m[1] }));

const GRUPOS = {
  void: 'Paneles / fondo', pan: 'Paneles / fondo', bl: 'Paneles / fondo', bd: 'Paneles / fondo',
  g: 'Verde SENA', y: 'Amarillo / dorado', v: 'Violeta (jefe / XP)',
  o: 'Naranja', b: 'Azul', r: 'Rojo (peligro)', tx: 'Texto',
};
const claveDe = nombre => nombre.replace(/[0-9]+$/, '');
const porGrupo = new Map();
for (const tk of tokens) {
  const g = GRUPOS[claveDe(tk.nombre)] || claveDe(tk.nombre).toUpperCase();
  if (!porGrupo.has(g)) porGrupo.set(g, []);
  porGrupo.get(g).push(tk);
}
function paginaColores() {
  let html = '<h1 class="pv-h">🎨 Paleta · Tokens de color</h1>\n' +
    '<p class="pv-note">Variables CSS extraídas en vivo de <code>css/estilos.css</code> — nunca se desincronizan del juego. El verde SENA es protagonista; violeta para el jefe y la XP; rojo para peligro.</p>\n';
  for (const [grupo, toks] of porGrupo) {
    html += `<p class="pv-lbl">${grupo}</p>\n<div class="pv-row">\n`;
    for (const tk of toks) {
      html += `  <div style="display:flex;flex-direction:column;gap:4px;align-items:center;width:78px">` +
        `<span style="width:64px;height:44px;background:var(--${tk.nombre});border:2px solid var(--bd);box-shadow:0 3px 0 var(--bd)"></span>` +
        `<code style="font-family:'VT323',monospace;font-size:14px;color:var(--tx3)">--${tk.nombre}</code></div>\n`;
    }
    html += '</div>\n';
  }
  return html;
}

/* ── 2 · base.css: CSS real del juego + armónico de previsualización ── */
const ARMONICO = `
/* ═══ ARMÓNICO DE PREVISUALIZACIÓN (solo para el design system, no afecta al juego) ═══ */
html,body{height:auto!important;overflow:visible!important}
body{display:block!important;padding:26px!important;background:var(--void)!important;align-items:stretch!important;justify-content:flex-start!important}
html.hd body{background:radial-gradient(130% 120% at 50% -10%,#131b38 0%,#04050c 68%,#000 100%)!important}
.pv-h{font-family:'Press Start 2P',monospace;font-size:12px;color:var(--y2);margin:0 0 6px;letter-spacing:1px;text-shadow:2px 2px 0 var(--bd)}
.pv-note{font-family:'VT323',monospace;font-size:16px;color:var(--tx2);margin:0 0 20px;line-height:1.3}
.pv-lbl{font-family:'VT323',monospace;font-size:15px;color:var(--tx1);width:100%;margin:16px 0 6px;letter-spacing:1px;text-transform:uppercase}
.pv-row{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:6px}
.pv-grid{display:grid;gap:10px}
`;
const BASE_CSS = estilos + '\n' + ARMONICO;

function doc(titulo, bodyHtml, { hd = false } = {}) {
  return `<!doctype html>
<html lang="es"${hd ? ' class="hd"' : ''}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${titulo} · Aprendiz en Apuros UI</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap');
${BASE_CSS}
</style>
</head>
<body>
${bodyHtml}
</body>
</html>
`;
}

const leer = rel => readFileSync(join(SRC, rel), 'utf8');
/* rutas relativas de todos los archivos bajo dir (para detectar sobrantes) */
function listarArchivos(dir, base = dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const abs = join(dir, e.name);
    return e.isDirectory() ? listarArchivos(abs, base) : [relative(base, abs).split(sep).join('/')];
  });
}
function escribir(relDist, contenido) {
  const abs = join(DIST, relDist);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, contenido);
  escritos.push(relDist);
}

/* ── 3 · manifiesto de tarjetas del componente ── */
const TARJETAS = [
  { out: 'foundations/colores.html', titulo: 'Paleta de color', grupo: 'Fundamentos', body: paginaColores() },
  { out: 'foundations/tipografia.html', titulo: 'Tipografía', grupo: 'Fundamentos', src: 'foundations/tipografia.html' },
  { out: 'components/botones.html', titulo: 'Botones', grupo: 'Componentes', src: 'components/botones.html' },
  { out: 'components/hud.html', titulo: 'HUD', grupo: 'Componentes', src: 'components/hud.html' },
  { out: 'components/mapa-etapas.html', titulo: 'Tarjetas de etapa', grupo: 'Componentes', src: 'components/mapa-etapas.html' },
  { out: 'components/terminal-sql.html', titulo: 'Terminal y SQL', grupo: 'Componentes', src: 'components/terminal-sql.html' },
  { out: 'components/regex.html', titulo: 'Caza patrones (Regex)', grupo: 'Componentes', src: 'components/regex.html' },
  { out: 'components/dialogo.html', titulo: 'Diálogo y cutscene', grupo: 'Componentes', src: 'components/dialogo.html' },
  { out: 'components/tienda.html', titulo: 'Tienda', grupo: 'Componentes', src: 'components/tienda.html' },
  { out: 'components/feedback.html', titulo: 'Feedback y progreso', grupo: 'Componentes', src: 'components/feedback.html' },
  { out: 'components/caza-bugs.html', titulo: 'Caza-bugs', grupo: 'Componentes', src: 'components/caza-bugs.html' },
  { out: 'components/memoria.html', titulo: 'Memoria', grupo: 'Componentes', src: 'components/memoria.html' },
  { out: 'components/quiz-jurado.html', titulo: 'Quiz con jurado', grupo: 'Componentes', src: 'components/quiz-jurado.html' },
  { out: 'components/code-review.html', titulo: 'Code review y merge', grupo: 'Componentes', src: 'components/code-review.html' },
  { out: 'components/runner-jefe.html', titulo: 'Runner y jefe final', grupo: 'Componentes', src: 'components/runner-jefe.html' },
  { out: 'components/certificado-records.html', titulo: 'Certificado y récords', grupo: 'Componentes', src: 'components/certificado-records.html' },
  { out: 'components/personalizacion.html', titulo: 'Personalización y dificultad', grupo: 'Componentes', src: 'components/personalizacion.html' },
  { out: 'temas/retro-vs-oled.html', titulo: 'Temas RETRO vs OLED', grupo: 'Temas', src: 'temas/temas.html' },
];

/* Se vacía primero para que un componente renombrado o eliminado no deje su
   página huérfana en dist/ (que --check daría por buena al no generarla). */
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
escribir('base.css', BASE_CSS);

for (const t of TARJETAS) {
  const body = t.body ?? leer(t.src);
  const marcador = `<!-- @dsCard group="${t.grupo}" title="${t.titulo}" -->\n`;
  escribir(t.out, marcador + doc(t.titulo, body));
}

/* frames de tema (sin tarjeta propia, los usan retro-vs-oled.html y la galería) */
const demoTema = leer('temas/theme-demo.html');
escribir('temas/_retro.html', doc('Demo retro', demoTema));
escribir('temas/_oled.html', doc('Demo OLED', demoTema, { hd: true }));

/* ── 4 · index.html: galería de una sola página con todas las tarjetas ── */
const CSS_GALERIA = `
body{background:#080a15!important;padding:0!important}
.gal{max-width:1120px;margin:0 auto;padding:30px 18px 60px}
.gal-hd{border:3px solid var(--bl);background:linear-gradient(160deg,var(--pan2),var(--void2));
  padding:26px 22px;box-shadow:0 0 0 2px var(--bd),0 8px 0 rgba(0,0,0,.45);margin-bottom:26px}
.gal-hd h1{font-size:clamp(15px,3.6vw,24px);color:var(--y2);text-shadow:3px 3px 0 var(--g0);line-height:1.5;text-wrap:balance}
.gal-hd .k{font-family:'VT323','Courier New',monospace;font-size:19px;color:var(--tx3);line-height:1.35;margin-top:12px;max-width:62ch}
.gal-hd .tags{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}
.gal-hd .tags span{font-size:8px;letter-spacing:1px;color:var(--g3);background:var(--void2);border:2px solid var(--g1);padding:6px 9px}
.gal-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:20px;align-items:start}
.spec{border:3px solid var(--bl);background:var(--pan);box-shadow:0 0 0 2px var(--bd),0 6px 0 rgba(0,0,0,.4);
  padding:18px 16px;position:relative;overflow:hidden}
.spec.wide{grid-column:1/-1}
.spec::before{content:attr(data-n);position:absolute;top:10px;right:12px;font-family:'VT323','Courier New',monospace;
  font-size:16px;color:var(--tx1);letter-spacing:1px}
.themes-2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:640px){.themes-2{grid-template-columns:1fr}}
.themes-2 .cap{font-size:9px;letter-spacing:1px;color:var(--tx2);margin-bottom:10px}
.gal-foot{margin-top:30px;font-family:'VT323','Courier New',monospace;font-size:16px;color:var(--tx1);text-align:center;line-height:1.5}
`;
const OLED_SCOPE = bloqueOled.replace(/html\.hd/g, '.oled-scope');

const noTemas = TARJETAS.filter(t => t.grupo !== 'Temas');
/* Las etiquetas de la cabecera se cuentan por grupo real: antes decían
   "17 COMPONENTES" incluyendo las dos tarjetas de Fundamentos. */
const cuenta = g => TARJETAS.filter(t => t.grupo === g).length;
let n = 1;
const specs = noTemas.map(t => {
  const body = t.body ?? leer(t.src);
  return `    <div class="spec" data-n="${String(n++).padStart(2, '0')}">\n${body}\n    </div>`;
}).join('\n');

const specTemas = `    <div class="spec wide" data-n="${String(n++).padStart(2, '0')}">
      <h1 class="pv-h">🎛 Temas · RETRO vs 4K OLED</h1>
      <p class="pv-note">El mismo componente en las dos pieles. RETRO: pixel, bordes duros, sombras sólidas. OLED: negros profundos, degradados, esquinas redondeadas y neón.</p>
      <div class="themes-2">
        <div><p class="cap">🕹 RETRO 32-BIT</p>${demoTema}</div>
        <div class="oled-scope"><p class="cap" style="color:#9fb0d8">✨ 4K HD PRO OLED</p>${demoTema}</div>
      </div>
    </div>`;

const galeriaBody = `<div class="gal">
  <header class="gal-hd">
    <h1>🎮 APRENDIZ EN APUROS · UI KIT</h1>
    <p class="k">Sistema de diseño extraído del juego: los mismos tokens, tipografías y componentes que ves en pantalla, catalogados y generados directamente desde <code>css/estilos.css</code>. Un solo mundo arcade — pixel, verde SENA y alto contraste — en sus dos pieles: RETRO 32-BIT y 4K HD PRO OLED.</p>
    <div class="tags"><span>${cuenta('Fundamentos')} FUNDAMENTOS</span><span>${cuenta('Componentes')} COMPONENTES</span><span>2 TEMAS</span><span>HTML/CSS PURO</span><span>GENERADO CON scripts/build-ui-kit.mjs</span></div>
  </header>
  <section class="gal-grid">
${specs}
${specTemas}
  </section>
  <p class="gal-foot">Generado desde css/estilos.css · node scripts/build-ui-kit.mjs · Practicante en Apuros 4 · SENA</p>
</div>`;

const galeriaCss = `@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap');
${BASE_CSS}
${CSS_GALERIA}
.oled-scope{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;
  background:radial-gradient(130% 120% at 50% -10%,#131b38 0%,#04050c 68%,#000 100%);
  border-radius:20px;padding:18px}
${OLED_SCOPE}`;

escribir('index.html', `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Aprendiz en Apuros · UI Kit</title>
<style>
${galeriaCss}
</style>
</head>
<body>
${galeriaBody}
</body>
</html>
`);

if (CHECK) {
  const diffs = [];
  for (const rel of escritos) {
    const generado = readFileSync(join(DIST, rel), 'utf8');
    const comprometidoAbs = join(DIST_COMMIT, rel);
    if (!existsSync(comprometidoAbs)) { diffs.push(`falta ${rel} en design-system/dist/`); continue; }
    if (readFileSync(comprometidoAbs, 'utf8') !== generado) diffs.push(`desactualizado: ${rel}`);
  }
  /* Sobrantes: comparar solo lo generado dejaría pasar páginas de componentes
     renombrados o borrados, que seguirían vivas en dist/ y en la galería. */
  const esperados = new Set(escritos);
  for (const rel of listarArchivos(DIST_COMMIT))
    if (!esperados.has(rel)) diffs.push(`sobra (ya no se genera): ${rel}`);
  rmSync(DIST, { recursive: true, force: true });
  if (diffs.length) {
    console.error('✗ design-system/dist/ está desincronizado de src/ y/o css/estilos.css:');
    diffs.forEach(d => console.error('  - ' + d));
    console.error('\nEjecuta `node scripts/build-ui-kit.mjs` y vuelve a comprometer los cambios.');
    process.exit(1);
  }
  console.log('✓ design-system/dist/ está sincronizado con src/ y css/estilos.css');
} else {
  console.log(`✓ ${TARJETAS.length} tarjetas de componente generadas en design-system/dist/`);
  console.log('✓ 2 frames de tema (_retro.html, _oled.html)');
  console.log('✓ Galería local en design-system/dist/index.html');
}
