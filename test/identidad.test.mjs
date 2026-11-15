import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createContext,runInContext} from 'node:vm';
import {cargarJuego} from './ayuda.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url));
test('partida anterior e identidad inválida migran sin perder inventario',()=>{
 for(const apariencia of [undefined,null,'otro',3]){
  const g=cargarJuego({guardado:{apariencia,pts:900,xp:6200,skin:2,camisa:3,accs:['gafas'],acc:'gafas',dias:[3,2]}});
  assert.equal(g.S.apariencia,'masculina');assert.equal(g.S.pts,900);assert.equal(g.S.xp,6200);assert.equal(g.S.skin,2);assert.equal(g.S.camisa,3);assert.equal(g.S.acc,'gafas');assert.deepEqual([...g.S.dias].slice(0,2),[3,2]);
 }
});
test('la apariencia femenina sobrevive guardado, recarga e importación',()=>{
 const a=cargarJuego();a.S.apariencia='femenina';a.S.pts=901;a.S.accs=['gafas'];a.S.acc='gafas';a.guardar();
 const b=cargarJuego({guardado:JSON.parse(a._localStorage.getItem('pa3'))});assert.equal(b.S.apariencia,'femenina');
 const c=cargarJuego();assert.equal(c.importarCodigo(a.exportarCodigo()),true);assert.equal(c.S.apariencia,'femenina');assert.equal(c.S.pts,901);assert.equal(c.S.acc,'gafas');
});
test('atlas femenino: 32 cuadros y 4 poses; cache offline y clásico intacto',()=>{
 for(const [f,w,h] of [['img/aprendiz-femenina-caminar.png',176,592],['img/aprendiz-femenina-portada.png',176,74]]){const a=read(f);assert.equal(a.readUInt32BE(16),w);assert.equal(a.readUInt32BE(20),h);assert.ok(read('sw.js').toString().includes(`'./${f}'`));}
});
test('selector de atlas, respaldo, dirección y separación de NPC',()=>{
 const images=new Map(),used=[],coords=[];
 const env=createContext({Image:class{set src(u){this.url=u;images.set(u,this)}},document:{createElement:()=>({getContext:()=>({drawImage(i){used.push(i.url)},getImageData(){throw Error('mock')}})})},SKINS:['#f4c898'],CAMISAS:['#13648c'],S:{skin:0,camisa:0,apariencia:'femenina'}});
 runInContext(read('js/sprite.js').toString(),env);const A=runInContext('APRENDIZ',env),ctx={imageSmoothingEnabled:true,drawImage(...a){coords.push(a.slice(1,5))}};
 const male='img/aprendiz-caminar-hd.png',female='img/aprendiz-femenina-caminar.png',classic='img/aprendiz-caminar.png',port='img/aprendiz-femenina-portada.png';
 assert.equal(A.dibujar(ctx,50,100,74,0),false);images.get(classic).onload();images.get(male).onload();A.dibujar(ctx,50,100,74,0);assert.equal(used.at(-1),male);
 images.get(female).onload();A.dibujar(ctx,50,100,74,A.idx.west,3);assert.equal(used.at(-1),female);assert.deepEqual(coords.at(-1),[132,444,44,74]);
 A.dibujar(ctx,50,100,74,0,0,'#f4c898','#2c3460');assert.equal(used.at(-1),classic);
 A.dibujarPortada(ctx,50,100,74,3);assert.deepEqual(coords.at(-1),[0,0,44,74]);images.get(port).onload();A.dibujarPortada(ctx,50,100,74,3);assert.equal(used.at(-1),port);assert.deepEqual(coords.at(-1),[132,0,44,74]);
 A.dibujar(ctx,50,100,74,0,0,1,0,'masculina');assert.equal(used.at(-1),male);
 assert.equal(ctx.imageSmoothingEnabled,true);
});
test('recoloreo femenino respeta las paletas y deja pelo y pantalón intactos',()=>{
 const images=new Map();let result;const original=[32,110,171,255,250,204,153,255,99,49,24,255,30,35,55,255];
 const env=createContext({Image:class{set src(u){this.url=u;images.set(u,this)}},document:{createElement:()=>({getContext:()=>({drawImage(){},getImageData(){return {data:new Uint8ClampedArray(original)}},putImageData(d){result=[...d.data]}})})},SKINS:['#6f4526'],CAMISAS:['#39a900'],S:{skin:0,camisa:0,apariencia:'femenina'}});
 runInContext(read('js/sprite.js').toString(),env);images.get('img/aprendiz-femenina-caminar.png').onload();runInContext('APRENDIZ.atlasDe(0,0)',env);
 assert.deepEqual(result.slice(0,4),[57,169,0,255]);assert.deepEqual(result.slice(4,8),[111,69,38,255]);assert.deepEqual(result.slice(8),original.slice(8));
});
