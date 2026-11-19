import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

const script=new URL('../scripts/limpiar-azules-femenina.mjs',import.meta.url).pathname;

test('la camisa de la protagonista no tiene azules sueltos fuera de la paleta (se verían como puntitos con cualquier otra camisa)',()=>{
  const r=spawnSync(process.execPath,[script,'--check'],{encoding:'utf8'});
  assert.equal(r.status,0,r.stdout+r.stderr);
});

test('la camisa secreta Terminal es un negro neutro: sin tinte azul que convierta el sombreado en puntitos azules',()=>{
  const fuente=readFileSync(new URL('../js/datos.js',import.meta.url),'utf8');
  const color=/\{logro:'s10',id:'terminal',color:'(#[0-9a-f]{6})'\}/.exec(fuente)?.[1];
  assert.ok(color,'no encuentro el color de la camisa Terminal');
  const [r,g,b]=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
  assert.ok(b-r<=8,`Terminal demasiado azul: ${color}`);
});
