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
