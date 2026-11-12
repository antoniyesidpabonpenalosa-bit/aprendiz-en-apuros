/* Genera js/pixelfx.js: el motor de efectos de pixel art de pixelfx y los tres
   efectos que usa el juego, en UN solo script clásico.

   pixelfx (https://github.com/patch-gg/pixelfx, licencia MIT) está escrito con
   módulos ES, y este juego carga <script> clásicos sin dependencias ni paso de
   compilación para jugar. Así que el código de pixelfx se empaqueta UNA vez,
   aquí, y el resultado se guarda en el repositorio: quien juega o edita el
   juego no necesita nada de esto. Solo hace falta cuando se quiere cambiar qué
   efectos van dentro o subir a una versión nueva de pixelfx.

   Uso:   node scripts/build-pixelfx.mjs <carpeta de un clon de pixelfx>
     p. ej.  git clone --depth 1 https://github.com/patch-gg/pixelfx /tmp/pixelfx
             node scripts/build-pixelfx.mjs /tmp/pixelfx
   Necesita Node y acceso a npm (baja esbuild al vuelo con npx; no queda nada
   instalado ni se toca package.json).

   Para añadir un efecto: ponerlo en EFECTOS aquí abajo y usarlo en
   js/pxefectos.js. Para ver cómo se ve antes de elegirlo, en el clon de
   pixelfx:  node tools/render.mjs ui/level-up  (y abrir el PNG que escribe). */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const clon = process.argv[2] && resolve(process.argv[2]);
if (!clon) { console.error('Uso: node scripts/build-pixelfx.mjs <carpeta de un clon de pixelfx>'); process.exit(1); }

/* nombre con el que se usa en el juego → archivo de pixelfx */
const EFECTOS = {
  corazonPerdido: 'ui/heart-lost',
  nivel: 'ui/level-up',
  racha: 'ui/combo-counter',
};

const commit = execFileSync('git', ['-C', clon, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const version = JSON.parse(readFileSync(join(clon, '.claude-plugin/plugin.json'), 'utf8')).version;
const src = f => JSON.stringify(join(clon, f));

const trabajo = mkdtempSync(join(tmpdir(), 'pixelfx-'));
const entrada = join(trabajo, 'entrada.mjs');
const nombres = Object.keys(EFECTOS);
writeFileSync(entrada, [
  `import { createFrame, clearFrame, createFx, composite, FONTS, PAL } from ${src('src/core/index.js')};`,
  ...nombres.map((n, i) => `import * as e${i} from ${src(`src/fx/${EFECTOS[n]}.js`)};`),
  `globalThis.PXFX = { createFrame, clearFrame, createFx, composite, FONTS, PAL,`,
  `  efectos: { ${nombres.map((n, i) => `${n}: e${i}`).join(', ')} } };`,
].join('\n'));

const fuera = join(trabajo, 'pixelfx.js');
/* cwd en el clon: así los comentarios con el origen de cada trozo dicen
   "src/core/…" y no la ruta de esta máquina. */
execFileSync('npx', ['--yes', 'esbuild@0.25.0', entrada, '--bundle', '--format=iife', '--target=es2019',
  '--legal-comments=none', `--outfile=${fuera}`], { cwd: clon, stdio: ['ignore', 'ignore', 'inherit'] });
const cuerpo = readFileSync(fuera, 'utf8').replace(/^(\s*)\/\/ [^\n]*entrada\.mjs$/m, '$1// (entrada generada por build-pixelfx.mjs)');

const cabecera = `// @ts-nocheck
/* ARCHIVO GENERADO — no editar a mano. Se rehace con scripts/build-pixelfx.mjs.

   pixelfx ${version} (${commit.slice(0, 7)}) · https://github.com/patch-gg/pixelfx
   Efectos incluidos: ${nombres.map(n => `${n} (${EFECTOS[n]})`).join(', ')}.
   Define el global PXFX; js/pxefectos.js es quien lo usa en el juego.

   Licencia MIT (la copia completa y los avisos de los autores originales están
   en LICENCIAS.md). Copyright (c) 2026 Patch. Copyright (c) 2026 Hugo Duprez en
   src/core/sim.js y en los efectos que lo dicen (arriba de su archivo). */
`;
writeFileSync(join(RAIZ, 'js/pixelfx.js'), cabecera + cuerpo);
console.log(`js/pixelfx.js · pixelfx ${version} (${commit.slice(0, 7)}) · ${nombres.length} efectos`);
