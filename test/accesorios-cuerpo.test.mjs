import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createContext,runInContext} from 'node:vm';
import {cargarJuego} from './ayuda.mjs';
const src=readFileSync(new URL('../js/sprite.js',import.meta.url),'utf8');
const vm=createContext({Image:class{set src(_){}},document:{},SKINS:[],CAMISAS:[]});
runInContext(src,vm);
const art=runInContext('ACC_ARTE',vm);
const ids=['cafe','gafas','corbata','gorra','audifonos','medalla','capa','gato','corona'];
test('arte de accesorios: catálogo completo y visible donde corresponde, sin pintar sin accesorio',()=>{
 assert.deepEqual([...art.ids],ids);
 for(const apariencia of ['masculina','femenina'])for(let d=0;d<8;d++)for(let f=0;f<4;f++)for(const id of [...ids,'']){
  let n=0;const k={fillRect(){n++},save(){},restore(){},translate(){},scale(){}};
  art.detras(k,id,d,f);art.encima(k,id,d,f,apariencia);
  assert.equal(n>0,id!==''&&(!['gafas','corbata','medalla'].includes(id)||[0,1,2,6,7].includes(d)),`${apariencia} ${id} ${d} ${f}`);
 }
});
test('todos los accesorios existentes persisten con ambas apariencias sin cambio de saldo ni inventario',()=>{
 for(const apariencia of ['masculina','femenina'])for(const acc of ids){
  const a=cargarJuego({guardado:{apariencia,acc,accs:ids,pts:1200,xp:6200}});a.guardar();
  const b=cargarJuego({guardado:JSON.parse(a._localStorage.getItem('pa3'))});
  assert.equal(b.S.acc,acc);assert.equal(b.S.apariencia,apariencia);assert.equal(b.S.pts,1200);assert.deepEqual([...b.S.accs],ids);
 }
});
