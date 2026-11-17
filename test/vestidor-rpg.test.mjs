import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createContext,runInContext} from 'node:vm';
import {cargarJuego} from './ayuda.mjs';
const tienda=readFileSync(new URL('../js/tienda.js',import.meta.url),'utf8');
const sprite=readFileSync(new URL('../js/sprite.js',import.meta.url),'utf8');
test('las ocho etiquetas de giro siguen el orden real del motor y tienen traducción',()=>{
 const ctx=createContext({Image:class{set src(_){}},document:{},SKINS:[],CAMISAS:[]});
 runInContext(sprite,ctx);runInContext(tienda,ctx);
 const dir=[...runInContext('APRENDIZ.DIRS',ctx)],pe=[...runInContext('PE_DIRECCIONES',ctx)];
 assert.deepEqual(dir.map(d=>({'south':'sur','south-east':'sureste','east':'este','north-east':'noreste','north':'norte','north-west':'noroeste','west':'oeste','south-west':'suroeste'})[d]),pe);
 const g=cargarJuego();
 for(const lang of ['es','en'])for(const k of [...pe.map(d=>'pe_dir_'+d),'pe_vestidor','pe_ambos','pe_elegir_apariencia','pe_equipado_actual','pe_saldo','pe_coleccion','pe_girar_atras'])assert.ok(g.TXT[lang][k],`${lang} ${k}`);
});

test('vestidor: el frente quieto usa la pose de portada; la marcha y demás direcciones usan el atlas de marcha',()=>{
 const calls=[],APRENDIZ={dibujarPortada:(...args)=>{calls.push(['portada',...args]);return true},dibujar:(...args)=>{calls.push(['marcha',...args]);return true}};
 const ctx=createContext({APRENDIZ});runInContext(tienda,ctx);
 for(const ap of ['masculina','femenina'])for(const dir of Array.from({length:8},(_,i)=>i))for(const mueve of [false,true]){
  calls.length=0;assert.equal(runInContext(`peDibujaCuerpo(null,${dir},2,${mueve},1,3,'${ap}','audifonos')`,ctx),true);
  assert.equal(calls.length,1);assert.equal(calls[0][0],dir===0&&!mueve?'portada':'marcha');assert.deepEqual(calls[0].slice(-5),[1,3,ap,'audifonos',0],'sin alza por defecto');
  /* v40.16: el alza (balanceo y respiración) llega hasta el dibujo */
  calls.length=0;runInContext(`peDibujaCuerpo(null,${dir},2,${mueve},1,3,'${ap}','audifonos',1)`,ctx);
  assert.deepEqual(calls[0].slice(-5),[1,3,ap,'audifonos',1],'con alza 1');
 }
});
