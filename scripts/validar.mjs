/* Validación sin dependencias para CI y uso local.
   1) Comprueba la sintaxis de cada archivo .js con node --check.
   2) Verifica que todo archivo local referenciado por index.html exista.
   Uso:  node scripts/validar.mjs   (se ejecuta desde la raíz del repo) */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
let errores = 0;
const fallo = m => { console.error('✗ ' + m); errores++; };
const ok = m => console.log('✓ ' + m);

/* 1 · sintaxis de todos los .js del proyecto (js/ y sw.js) */
const jsFiles = [
  ...readdirSync(join(raiz, 'js')).filter(f => f.endsWith('.js')).map(f => join('js', f)),
  'sw.js',
];
for (const rel of jsFiles) {
  const abs = join(raiz, rel);
  if (!existsSync(abs)) { fallo(`falta el archivo ${rel}`); continue; }
  try {
    execFileSync(process.execPath, ['--check', abs], { stdio: 'pipe' });
    ok(`sintaxis OK · ${rel}`);
  } catch (e) {
    fallo(`error de sintaxis en ${rel}\n${e.stderr?.toString() || e.message}`);
  }
}

/* 2 · referencias locales de index.html */
const html = readFileSync(join(raiz, 'index.html'), 'utf8');
const refs = [...html.matchAll(/(?:src|href)\s*=\s*"([^"]+)"/g)]
  .map(m => m[1])
  .filter(u => !/^https?:|^data:|^#|^\/\//.test(u));
for (const ref of refs) {
  const clean = ref.replace(/^\.?\//, '').split(/[?#]/)[0];
  if (existsSync(join(raiz, clean))) ok(`referencia OK · ${ref}`);
  else fallo(`index.html referencia un archivo inexistente: ${ref}`);
}

if (errores) { console.error(`\n${errores} problema(s) encontrado(s).`); process.exit(1); }
console.log('\nTodo en orden ✅');
