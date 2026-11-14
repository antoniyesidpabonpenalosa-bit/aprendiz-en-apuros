import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
const E=runInNewContext(read('js/iconos.js')+'\n({PXI_PORTADA,pxiPortada,pxi,pxiTam})',{encodeURIComponent});
const claves=['🎮','♾️','🏫','🌱','⚔️','💀','🛒','🏆','📊','📈','✨','🔤','🎓','🗓','🕹'];
test('portada: 15 PNG RGBA de 32×32 y alternativa clásica intacta',()=>{
 assert.deepEqual(Object.keys(E.PXI_PORTADA).sort(),claves.slice().sort());
 for(const clave of claves){
  const data=E.PXI_PORTADA[clave];
  assert.match(data,/^data:image\/png;base64,/);
  const png=Buffer.from(data.split(',')[1],'base64');
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16),32);assert.equal(png.readUInt32BE(20),32);
  assert.equal(png[25],6);
  assert.match(E.pxiPortada(clave),/class="pxi pxi-portada"/);
  assert.match(E.pxiPortada(clave),/alt="" aria-hidden="true"/);
  assert.match(E.pxi(clave),/data:image\/svg\+xml,/);
  assert.equal(E.pxiTam(clave).w,12);
 }
});
test('portada: claves no rediseñadas mantienen el icono clásico o emoji',()=>{
 for(const clave of ['🔥','☕','jefe1','🦄','constructor','toString']) assert.equal(E.pxiPortada(clave),E.pxi(clave));
});
test('portada: helper nuevo solo se usa en rTitulo y cubre los iconos dinámicos',()=>{
 const s=read('js/menus.js');const end=s.indexOf('/* ── BORRAR PROGRESO ── */');
 assert.ok(end>0);assert.ok(!s.slice(end).includes('pxiPortada('));
 for(const key of ['ico',"'🎓'","'🗓'",'d.ico']) assert.ok(s.slice(0,end).includes(`pxiPortada(${key})`));
});
