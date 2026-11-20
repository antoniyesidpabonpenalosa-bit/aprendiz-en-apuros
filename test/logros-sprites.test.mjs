import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const ids=['primer', 'perfecto', 'mitad', 'comprador', 'veloz', 'cerebro', 'gitmaster', 'revisor', 'resolutor', 'jefe', 'titulado', 'intacto', 'combo', 'coleccionista', 'pesadilla', 'maraton', 'sql', 'regex', 'contrato', 's10', 's6', 's7', 's4', 's3', 's5', 's9', 's1', 's8', 's2', 'secreto'];
test('los 30 sprites de LOGROS existen y están disponibles sin conexión',()=>{
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 for(const id of ids){
  const ruta=`img/logros/${id}.png`;
  const png=readFileSync(new URL('../'+ruta,import.meta.url));
  assert.equal(png.readUInt32BE(16),40,`${id}: ancho`);
  assert.equal(png.readUInt32BE(20),40,`${id}: alto`);
  assert.ok(sw.includes(`'./${ruta}'`),`${id}: caché offline`);
 }
  assert.ok(sw.includes("'./img/logros/sala-logros.webp'"),'fondo disponible sin conexión');
});
test('las tarjetas usan el sprite pertinente y conservan el icono de respaldo',()=>{
 const codigo=readFileSync(new URL('../js/records.js',import.meta.url),'utf8');
 const icono=runInNewContext(codigo+';iconoLogro');
 assert.match(icono('primer','🌱'),/img\/logros\/primer.png/);
 assert.match(icono('s10','?',true),/img\/logros\/secreto.png/);
 for(const id of ids.filter(x=>x!=='secreto'))assert.match(icono(id,'?'),new RegExp(`img/logros/${id}\\.png`));
 assert.match(icono('jefe','👾'),/img\/logros\/jefe.png/);
 assert.match(icono('s4','🌟'),/img\/logros\/s4.png/);
 assert.match(icono('otro','?'),/ico-lg/);
});
