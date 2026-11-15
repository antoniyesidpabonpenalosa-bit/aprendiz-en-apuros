import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createContext,runInContext} from 'node:vm';
const read=f=>readFileSync(new URL('../'+f,import.meta.url));
const env=createContext({});
runInContext(read('js/retratos-aprendiz-arte.js').toString(),env);
const art=runInContext('ARTE_RETRATOS_APRENDIZ',env);
const gestures=['normal','feliz','enojado','sorprendido','preocupado'];
test('retratos: dos apariencias, cinco expresiones y sus parpadeos; datos íntegros',()=>{
 assert.equal(art.size,48);
 for(const sex of ['masculina','femenina']){
  const f=art.frames[sex];assert.equal(Object.keys(f).length,10);
  assert.equal(new Set(Object.values(f).map(x=>JSON.stringify(x))).size,10);
  for(const [name,seq] of Object.entries(f)){
   assert.equal(seq.length%2,0,name);let count=0;
   for(let i=0;i<seq.length;i+=2){assert.ok(seq[i]>0);assert.ok(seq[i+1]>=0&&seq[i+1]<art.palette.length);count+=seq[i];}
   assert.equal(count,48*48,name);
  }
  for(const g of gestures)assert.ok(read(`arte/retratos-protagonistas/${sex}-${g}-cine.png`).length>100);
  for(const n of [16,32]){const png=read(`arte/retratos-protagonistas/${sex}-${n}.png`);assert.equal(png.readUInt32BE(16),n);assert.equal(png.readUInt32BE(20),n);}
 }
 assert.notDeepEqual(art.frames.masculina.normal,art.frames.femenina.normal);
 assert.equal(art.palette.filter(p=>p[1]===1).length>=4,true);
 assert.equal(art.palette.filter(p=>p[1]===2).length>=4,true);
});
test('retratos: jugador local marcado, NPC y clase no cambian',()=>{
 const ctx=createContext({S:{skin:0,camisa:1,apariencia:'femenina',acc:'corona'},SKINS:['#f4c898'],CAMISAS:['#13648c']});
 runInContext(read('js/graficos.js').toString(),ctx);
 assert.equal(runInContext('CARAS.yo(true).protagonista',ctx),true);
 assert.equal(runInContext('CARAS.yo(true).apariencia',ctx),'femenina');
 assert.equal(runInContext('CARAS.yo(true).corona',ctx),true);
 for(const who of ['instructor','lider','compa','vigilante'])assert.equal(runInContext(`CARAS.${who}().protagonista`,ctx),undefined);
 assert.ok(!read('js/sala.js').toString().includes('protagonista:true'));
});
test('retratos: los dos scripts están en orden y en la caché',()=>{
 const html=read('index.html').toString(),sw=read('sw.js').toString();
 const files=['js/retratos-aprendiz-arte.js','js/retratos-aprendiz.js','js/graficos.js'];
 assert.ok(files.every(f=>html.includes(f)&&sw.includes('./'+f)));
 assert.ok(html.indexOf(files[0])<html.indexOf(files[1])&&html.indexOf(files[1])<html.indexOf(files[2]));
});
