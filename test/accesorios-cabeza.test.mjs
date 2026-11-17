import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createContext,runInContext} from 'node:vm';
const src=readFileSync(new URL('../js/sprite.js',import.meta.url),'utf8');
const vm=createContext({Image:class{set src(_){}},document:{},SKINS:[],CAMISAS:[]});
runInContext(src,vm);
const art=runInContext('ACC_CABEZA',vm);
const sexes=['masculina','femenina'];
const mask=(id,sex,d,f,pose=-1)=>{
 const px=new Set(),ctx={fillRect(x,y,w,h){assert.ok([x,y,w,h].every(Number.isInteger));assert.ok(x>=0&&y>=0&&x+w<=44&&y+h<=32&&w>0&&h>0,`${id} ${sex} ${d} ${f} ${pose}: ${[x,y,w,h]}`);for(let i=x;i<x+w;i++)for(let j=y;j<y+h;j++)px.add(`${i}:${j}`);}};
 art.dibujar(ctx,id,sex,d,f,pose);return [...px].sort().join('|');
};
test('gafas: 2 lentes de frente/diagonal, una de perfil y ninguna hacia atrás',()=>{
 for(const s of sexes)for(let d=0;d<8;d++)for(let f=0;f<4;f++){
  const a=art.ancla(s,d,f);assert.equal(a.lentes.length,[2,2,1,0,0,0,1,2][d]);
  assert.equal(Boolean(mask('gafas',s,d,f)),a.lentes.length>0);
 }
});
test('audífonos: una almohadilla en perfil y diagonales, dos frente/espalda, arco por orientación',()=>{
 for(const s of sexes)for(let f=0;f<4;f++){
  const variantes=new Set();for(let d=0;d<8;d++){
   const a=art.ancla(s,d,f);assert.equal(a.copas.length,[2,1,1,1,2,1,1,1][d]);assert.ok(a.arco.length>=5);variantes.add(mask('audifonos',s,d,f));
  }assert.equal(variantes.size,8);
 }
});
test('el anclaje femenino cambia de reposo a caminata y las poses de portada están calibradas',()=>{
 for(const id of ['gafas','audifonos']){
  // las lentes cambian con el cuadro; las copas y el arco de los audífonos comparten medidas en los cuadros de paso (cabezas de igual tamaño)
  if(id==='gafas')assert.notEqual(mask(id,'femenina',0,0),mask(id,'femenina',0,1));
  assert.notEqual(mask(id,'femenina',0,0,0),mask(id,'femenina',0,0,3));
  for(const s of sexes)for(let p=0;p<4;p++)assert.ok(mask(id,s,0,0,p));
 }
});
test('femenina: el reposo (cuadro 0) y el cuadro 2 son la misma pose desde v40.6 y comparten anclaje',()=>{
 for(const id of ['gafas','audifonos'])for(let d=0;d<8;d++)assert.equal(mask(id,'femenina',d,0),mask(id,'femenina',d,2),`${id} dir ${d}`);
});
test('masculino: cada ojo del atlas queda dentro de una lente y las copas apoyan sobre la cabeza',async()=>{
 const {decodificarPNG}=await import('../scripts/lib-pixel.mjs');
 const {w,rgba}=decodificarPNG(readFileSync(new URL('../img/aprendiz-masculino-premium-caminar.png',import.meta.url)));
 const OJ=new Set(['171420','33263a','f7f4e9']);
 for(let d=0;d<8;d++){
  const lentes=art.ancla('masculina',d,0).lentes,a=art.ancla('masculina',d,0);
  for(let y=8;y<30;y++)for(let x=0;x<44;x++){
   const i=((d*74+y)*w+x)*4;if(!rgba[i+3]||!OJ.has([0,1,2].map(k=>rgba[i+k].toString(16).padStart(2,'0')).join('')))continue;
   assert.ok(lentes.some(([lx,ly,lw,lh])=>x>=lx&&x<lx+lw&&y>=ly&&y<ly+lh),`dir ${d}: el ojo en ${x},${y} queda fuera de las lentes`);
  }
  for(const [cx,cy,cw,ch] of a.copas){const i=((d*74+cy)*w+cx)*4;assert.ok(rgba[i+3],`dir ${d}: la copa en ${cx},${cy} cae sobre la cabeza`);}
 }
});

test('audífonos de perfil: la diadema visible termina arriba, sin una segunda rama sobre el pelo',()=>{
 for(const s of sexes)for(const d of [2,6])for(let f=0;f<4;f++){
  const {arco}=art.ancla(s,d,f);assert.equal(arco.at(-1)[1],Math.min(...arco.map(p=>p[1])));
 }
});
