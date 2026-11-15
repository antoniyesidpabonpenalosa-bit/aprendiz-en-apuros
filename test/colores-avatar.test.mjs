import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createContext,runInContext} from 'node:vm';
import {cargarJuego} from './ayuda.mjs';
const source=readFileSync(new URL('../js/tienda.js',import.meta.url),'utf8');
test('tarjetas: índices originales, nombre localizado y exactamente un estado seleccionado',()=>{
 const g=cargarJuego();
 for(const lang of ['es','en'])for(const tipo of ['piel','camisa'])for(let selected=0;selected<4;selected++){
  const campo=tipo==='piel'?'skin':'camisa';g.S.lang=lang;g.S[campo]=selected;
  const env=createContext({S:g.S,SKINS:g.SKINS,CAMISAS:g.CAMISAS,t:k=>g.TXT[lang][k]||k});
  runInContext(source,env);
  const html=runInContext(`peTarjetasColor('${tipo}')`,env);
  assert.equal((html.match(/aria-pressed="true"/g)||[]).length,1);
  assert.equal((html.match(/<canvas /g)||[]).length,4);
  for(let i=0;i<4;i++){
   assert.ok(html.includes(`data-${tipo==='piel'?'s':'c'}="${i}" aria-pressed="${i===selected}"`));
   assert.ok(g.TXT[lang][`pe_${tipo}_${i}`]);
   assert.ok(html.includes(`aria-label="${g.TXT[lang][`pe_${tipo}_${i}`]}"`));
  }
 }
});
test('los colores se conservan al guardar y recuperar ambas apariencias sin tocar inventario',()=>{
 for(const apariencia of ['masculina','femenina'])for(let skin=0;skin<4;skin++)for(let camisa=0;camisa<4;camisa++){
  const a=cargarJuego({guardado:{apariencia,skin,camisa,pts:900,xp:6200,accs:['gafas'],acc:'gafas'}});a.guardar();
  const b=cargarJuego({guardado:JSON.parse(a._localStorage.getItem('pa3'))});
  assert.deepEqual([b.S.apariencia,b.S.skin,b.S.camisa,b.S.pts,b.S.xp,b.S.acc],[apariencia,skin,camisa,900,6200,'gafas']);
 }
});
