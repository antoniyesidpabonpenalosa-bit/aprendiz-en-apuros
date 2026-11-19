/* Vigilante de nombres globales (v40.18): el lector de declaraciones del nivel superior y el cruce entre scripts. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { declaraciones, analiza, limpia, NOMBRES_DEL_NAVEGADOR } from '../scripts/lib-globales.mjs';
const RAIZ = new URL('../', import.meta.url);
const nombres = src => declaraciones(src).map(d => `${d.tipo} ${d.nombre}`);

test('lector: lee function, async function, class, const, let y var del nivel superior', () => {
  assert.deepEqual(nombres(`function a(){}\nasync function b(){}\nfunction* g(){}\nclass C{}\nconst d=1;\nlet e;\nvar f=2;`),
    ['function a', 'function b', 'function g', 'class C', 'const d', 'let e', 'var f']);
});

test('lector: una lista de declaradores da todos los nombres, también con inicializadores largos', () => {
  assert.deepEqual(nombres(`let a=1,b=[1,2,{x:3}],c=(()=>{ return 4; })(),\n    d;\nconst e='x';`),
    ['let a', 'let b', 'let c', 'let d', 'const e']);
});

test('lector: lo de dentro de funciones, bloques y objetos es local y no cuenta', () => {
  assert.deepEqual(nombres(`function a(){ const x=1; function y(){} }\nif(1){ const z=2; }\nconst o={ f(){ var w; }, g:function h(){} };\n(function(){ const i=3; })();\nconst arrow=()=>{ let j; };`),
    ['function a', 'const o', 'const arrow']);
});

test('lector: comentarios, textos, plantillas y expresiones regulares no inventan declaraciones ni descuadran las llaves', () => {
  const src = [
    '// const falso=1;', '/* function falsa(){} */',
    "const t1='function f1(){ { ';", 'const t2="const f2=1; }";',
    'const t3=`const f3=${ {a:1}.a } function f4(){`;',
    'const r1=/[{]\\//g, r2=a/2/b;',
    "const r3=/'/;",
    'function real(){ return /}/.test("x") }',
    'const ultimo=1;',
  ].join('\n');
  assert.deepEqual(nombres(src), ['const t1', 'const t2', 'const t3', 'const r1', 'const r2', 'const r3', 'function real', 'const ultimo']);
});

test('lector: una expresión de función con nombre no es una declaración, y sin «;» una sentencia nueva empieza en la línea de abajo', () => {
  assert.deepEqual(nombres(`const a = function interna(){}\nconst b = 1\nfunction c(){}\nlet d = foo\n  .bar()\nlet e = 2`),
    ['const a', 'const b', 'function c', 'let d', 'let e']);
});

test('limpia: conserva el largo y los saltos de línea', () => {
  const src = "a // x\n/* y\nz */ 'q' `w\ne` /r/";
  const l = limpia(src);
  assert.equal(l.length, src.length);
  assert.equal([...l].filter(c => c === '\n').length, [...src].filter(c => c === '\n').length);
});

test('cruce: una function repetida entre archivos se avisa como «el segundo pisa al primero»', () => {
  const r = analiza([{ archivo: 'a.js', src: 'function pinta(){}' }, { archivo: 'b.js', src: 'function pinta(){ return 2 }' }]);
  assert.equal(r.repetidos.length, 1);
  assert.equal(r.repetidos[0].nombre, 'pinta');
  assert.match(r.repetidos[0].efecto, /pisa/);
  assert.deepEqual(r.repetidos[0].sitios.map(s => s.archivo), ['a.js', 'b.js']);
});

test('cruce: un const o let repetido se avisa como «un archivo no carga», y mezclado con function también', () => {
  assert.match(analiza([{ archivo: 'a.js', src: 'const X=1;' }, { archivo: 'b.js', src: 'let X=2;' }]).repetidos[0].efecto, /no carga/);
  assert.match(analiza([{ archivo: 'a.js', src: 'function X(){}' }, { archivo: 'b.js', src: 'const X=2;' }]).repetidos[0].efecto, /no carga/);
});

test('cruce: un nombre local repetido en dos archivos no es un problema', () => {
  assert.equal(analiza([{ archivo: 'a.js', src: 'function f(){ const x=1; }' }, { archivo: 'b.js', src: 'function g(){ const x=2; }' }]).repetidos.length, 0);
});

test('cruce: un nombre del navegador declarado al nivel superior se avisa, y PERMITIDOS lo deja pasar', () => {
  const sc = [{ archivo: 'a.js', src: 'let status = 1;\nfunction open(){}' }];
  assert.deepEqual(analiza(sc).delNavegador.map(d => d.nombre), ['status', 'open']);
  assert.equal(analiza(sc, { permitidos: ['status', 'open'] }).delNavegador.length, 0);
  assert.ok(NOMBRES_DEL_NAVEGADOR.has('name') && NOMBRES_DEL_NAVEGADOR.has('event'));
});

/* ── el juego de verdad ── */
const html = readFileSync(new URL('index.html', RAIZ), 'utf8');
const refs = [...html.matchAll(/<script\b[^>]*\ssrc\s*=\s*"([^"]+)"/g)].map(m => m[1]).filter(r => !/^https?:/.test(r));
const scripts = refs.map(r => ({ archivo: r, src: readFileSync(new URL(r, RAIZ), 'utf8') }));

test('el juego: ningún nombre global repetido entre los scripts de index.html y ninguno es del navegador', () => {
  const r = analiza(scripts);
  assert.deepEqual(r.repetidos, [], 'nombres repetidos');
  assert.deepEqual(r.delNavegador, [], 'nombres del navegador');
  assert.ok(r.total > 300, `lee las declaraciones del juego (${r.total})`);
  assert.equal(r.nombres, r.total, 'cada declaración es de un nombre distinto');
});

test('el juego: todo archivo de js/ está en index.html', () => {
  const enJs = readdirSync(new URL('js/', RAIZ)).filter(f => f.endsWith('.js')).map(f => 'js/' + f);
  assert.deepEqual(enJs.filter(f => !refs.includes(f)), []);
});

test('el juego: si se añade a mano un duplicado de verdad, el vigilante lo encuentra (una function y una const)', () => {
  const real = scripts.flatMap(s => declaraciones(s.src).filter(d => d.tipo === 'function').map(d => d.nombre))[0];
  const otro = scripts.flatMap(s => declaraciones(s.src).filter(d => d.tipo === 'const').map(d => d.nombre))[0];
  const r = analiza([...scripts, { archivo: 'nuevo.js', src: `function ${real}(){}\nlet ${otro}=1;` }]);
  assert.deepEqual(r.repetidos.map(d => d.nombre).sort(), [real, otro].sort());
});
