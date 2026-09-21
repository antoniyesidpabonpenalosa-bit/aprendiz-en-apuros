#!/usr/bin/env node
/* Auditoría de los bancos de contenido de js/datos.js.
   Sin dependencias, como el resto de scripts/.

   Comprueba lo que se puede comprobar de verdad:
   · los patrones del minijuego regex se evalúan con RegExp real y cada ronda
     tiene que tener al menos un acierto y al menos un fallo, o es injugable
   · las consultas SQL llevan las cláusulas en orden legal
   · las líneas de código se parsean de verdad
   · nadie repite y el quiz tiene la misma cantidad en los dos idiomas

   Sobre el código hay una distinción que cuesta cara olvidar: un ok:0 puede
   ser un error de SINTAXIS ("costn b = 2;") o una trampa SEMÁNTICA que parsea
   perfectamente ("if(x = 5)" asigna en vez de comparar, "respuesta.jsno()"
   llama a un método que no existe). Las trampas semánticas son contenido
   bueno y deliberado, no defectos: se listan aparte y no cuentan como fallo.
   Lo que sí es un defecto es un ok:1 que NO parsea. */
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Script } from 'node:vm';
import vm from 'node:vm';

const raiz = new URL('..', import.meta.url).pathname;
const fuente = readFileSync(raiz + 'js/datos.js', 'utf8');

/* Los const de nivel superior de un script de vm viven en el ámbito léxico,
   no como propiedades del contexto: hay que recogerlos desde dentro. */
const ctx = {};
vm.createContext(ctx);
ctx.globalThis = ctx;
vm.runInContext(
  fuente + ';globalThis.__d={PALABRAS,PAREJAS,SQLS,REGEXS,CODIGO,CONFLICTOS,QUIZ,CMDS,NIVELES,LOGROS,AYUDA,TXT};',
  ctx
);
const D = ctx.__d;

const fallos = [];
const notas = [];
const mal = m => fallos.push(m);

/* ── parseo ──────────────────────────────────────────────────────────
   Dentro de una función async valen `return` y `await`, que es lo que hace
   falta para casi todo el banco. Lo que NO vale ahí es `import` y `export`,
   que solo son legales a nivel de módulo: esas pocas líneas se comprueban
   aparte con `node --check`, que sí sabe de módulos y no pide flags
   experimentales como vm.SourceTextModule. */
function parsea(src) {
  try { new Script(`(async function _(){${src}})`); return true; }
  catch {}
  if (!/^\s*(import|export)\b/.test(src)) return false;
  const f = join(tmpdir(), `pa4-audit-${randomUUID()}.mjs`);
  try {
    writeFileSync(f, src);
    execFileSync(process.execPath, ['--check', f], { stdio: 'ignore' });
    return true;
  } catch { return false; }
  finally { try { unlinkSync(f); } catch {} }
}

/* ── regex ── */
D.REGEXS.forEach((r, k) => {
  let re;
  try { re = new RegExp(r.p); }
  catch { return mal(`REGEXS[${k}] el patrón ${r.p} no compila`); }
  const si = r.opts.filter(o => re.test(o));
  const no = r.opts.filter(o => !re.test(o));
  if (!si.length) mal(`REGEXS[${k}] ${r.p}: ninguna opción cumple, ronda imposible`);
  if (!no.length) mal(`REGEXS[${k}] ${r.p}: todas cumplen, ronda regalada`);
  if (r.opts.length !== 6) mal(`REGEXS[${k}] ${r.p}: tiene ${r.opts.length} opciones, no 6`);
  if (!r.des || !r.den) mal(`REGEXS[${k}] ${r.p}: falta la descripción en es o en en`);
});

/* ── SQL: orden de cláusulas ──
   '(' es la lista de columnas de un INSERT, que va entre la tabla y VALUES. */
const ORDEN = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', '(', 'FROM', 'SET',
  'VALUES', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT'];
D.SQLS.forEach((q, k) => {
  if (q.length < 2) return mal(`SQLS[${k}] tiene una sola pieza, no hay nada que ordenar`);
  const ix = q.map(p => ORDEN.findIndex(o => p.toUpperCase().startsWith(o)));
  const rara = ix.indexOf(-1);
  if (rara >= 0) return mal(`SQLS[${k}] pieza no reconocida: "${q[rara]}"`);
  for (let i = 1; i < ix.length; i++) {
    if (ix[i] <= ix[i - 1]) return mal(`SQLS[${k}] cláusulas fuera de orden: ${q.join(' | ')}`);
  }
});

/* ── código ── */
D.CODIGO.forEach((x, k) => {
  const ok = parsea(x.c);
  if (x.ok && !ok) mal(`CODIGO[${k}] marcada como buena pero NO parsea: ${x.c}`);
  if (!x.ok && ok) notas.push(`CODIGO[${k}] trampa semántica (parsea, pero está mal): ${x.c}`);
});
D.CONFLICTOS.forEach((par, k) => {
  if (par.length !== 2) return mal(`CONFLICTOS[${k}] no es una pareja`);
  if (par[0] === par[1]) return mal(`CONFLICTOS[${k}] las dos opciones son idénticas`);
  if (!parsea(par[0])) mal(`CONFLICTOS[${k}] la opción BUENA no parsea: ${par[0]}`);
  if (parsea(par[1])) notas.push(`CONFLICTOS[${k}] la mala es trampa semántica: ${par[1]}`);
});

/* ── repetidos ── */
for (const [nom, arr] of Object.entries({
  PALABRAS: D.PALABRAS, PAREJAS: D.PAREJAS, SQLS: D.SQLS,
  REGEXS: D.REGEXS, CODIGO: D.CODIGO, CONFLICTOS: D.CONFLICTOS, CMDS: D.CMDS,
})) {
  const vistos = arr.map(x => JSON.stringify(x));
  const rep = vistos.filter((v, i) => vistos.indexOf(v) !== i);
  if (rep.length) mal(`${nom} tiene ${rep.length} repetido(s): ${rep[0]}`);
}

/* ── quiz: misma cantidad en los dos idiomas y respuesta dentro de rango ── */
if (D.QUIZ.es.length !== D.QUIZ.en.length) {
  mal(`QUIZ descuadrado: ${D.QUIZ.es.length} en español y ${D.QUIZ.en.length} en inglés`);
}
for (const idioma of ['es', 'en']) {
  const enunciados = D.QUIZ[idioma].map(q => q.q);
  enunciados.forEach((e, k) => {
    if (enunciados.indexOf(e) !== k) mal(`QUIZ.${idioma}[${k}] pregunta repetida: ${e}`);
  });
  D.QUIZ[idioma].forEach((q, k) => {
    if (!q.q || !Array.isArray(q.o) || q.o.length < 2) mal(`QUIZ.${idioma}[${k}] mal formada`);
    else if (!(q.r >= 0 && q.r < q.o.length)) mal(`QUIZ.${idioma}[${k}] r=${q.r} fuera de rango`);
    else if (new Set(q.o).size !== q.o.length) mal(`QUIZ.${idioma}[${k}] tiene opciones repetidas`);
  });
}

/* ── parejas: cabe en la carta ── */
D.PAREJAS.forEach(p => {
  if (p.length > 5) mal(`PAREJAS "${p}" tiene ${p.length} caracteres y no cabe en la carta`);
});
/* ── palabras: sin tildes, que el juego compara carácter a carácter ── */
D.PALABRAS.forEach(w => {
  if (/[áéíóúñü]/i.test(w)) mal(`PALABRAS "${w}" lleva tilde o ñ y no todos los teclados la dan`);
});

/* ── informe ── */
const tam = {
  PALABRAS: D.PALABRAS.length, PAREJAS: D.PAREJAS.length, SQLS: D.SQLS.length,
  REGEXS: D.REGEXS.length, CODIGO: D.CODIGO.length, CONFLICTOS: D.CONFLICTOS.length,
  CMDS: D.CMDS.length, 'QUIZ es/en': `${D.QUIZ.es.length}/${D.QUIZ.en.length}`,
};
for (const [k, v] of Object.entries(tam)) console.log(`  ${k.padEnd(12)}${v}`);
if (notas.length) {
  console.log(`\n  ${notas.length} trampa(s) semántica(s) — contenido deliberado, no defectos`);
}
if (fallos.length) {
  console.log('\n' + fallos.map(f => '✗ ' + f).join('\n'));
  console.log(`\n${fallos.length} fallo(s) en los bancos de contenido ❌`);
  process.exit(1);
}
console.log('\nBancos de contenido en orden ✅');
