import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createContext,runInContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url));
const male='img/aprendiz-masculino-premium-caminar.png',menu='img/aprendiz-masculino-premium-portada.png',hd='img/aprendiz-caminar-hd.png',classic='img/aprendiz-caminar.png',female='img/aprendiz-femenina-caminar.png',femaleMenu='img/aprendiz-femenina-portada.png';
function setup(pixels=[]){
 const images=new Map(),used=[],coords=[],recolors=[];
 const env=createContext({Image:class{set src(u){this.url=u;images.set(u,this)}},document:{createElement:()=>({getContext:()=>({drawImage(i){used.push(i.url)},getImageData(){return {data:new Uint8ClampedArray(pixels)}},putImageData(d){recolors.push([...d.data])}})})},SKINS:['#f4c898','#d99b66','#a86a3c','#6f4526'],CAMISAS:['#39a900','#13648c','#8c3df0','#c22e44'],S:{skin:0,camisa:0,apariencia:'masculina'}});
 runInContext(read('js/sprite.js').toString(),env);const A=runInContext('APRENDIZ',env),ctx={imageSmoothingEnabled:true,drawImage(...a){coords.push(a.slice(1,9))}};
 return {A,ctx,images,used,coords,recolors,env};
}
test('atlas masculino premium respeta dimensiones, alpha y caché, recursos antiguos intactos',()=>{
 for(const [f,w,h] of [[male,176,592],[menu,176,74]]){
  const a=read(f);assert.equal(a.readUInt32BE(16),w);assert.equal(a.readUInt32BE(20),h);assert.equal(a[25],6);assert.ok(read('sw.js').toString().includes(`'./${f}'`));
 }
 for(const f of [hd,classic,female,femaleMenu])assert.ok(read('sw.js').toString().includes(`'./${f}'`));
});
test('selección premium, respaldo HD, femenina y NPC clásico sin contaminación de caché',()=>{
 const {A,ctx,images,used,coords,env}=setup();
 assert.equal(A.dibujar(ctx,50,100,74,0),false);
 images.get(classic).onload();A.dibujar(ctx,50,100,74,0);assert.equal(used.at(-1),classic);
 images.get(hd).onload();A.dibujar(ctx,50,100,74,0);assert.equal(used.at(-1),hd);
 images.get(male).onload();A.dibujar(ctx,50,100,74,A.idx.west,3);assert.equal(used.at(-1),male);assert.deepEqual(coords.at(-1),[132,444,44,74,28,26,44,74]);
 A.dibujarPortada(ctx,50,100,74,3);assert.deepEqual(coords.at(-1).slice(0,4),[0,0,44,74]);
 images.get(menu).onload();A.dibujarPortada(ctx,50,100,74,3);assert.equal(used.at(-1),menu);assert.deepEqual(coords.at(-1).slice(0,4),[132,0,44,74]);
 images.get(female).onload();images.get(femaleMenu).onload();runInContext("S.apariencia='femenina'",env);
 A.dibujar(ctx,50,100,74,0);assert.equal(used.at(-1),female);A.dibujarPortada(ctx,50,100,74,1);assert.equal(used.at(-1),femaleMenu);
 A.dibujar(ctx,50,100,74,0,0,'#f4c898','#2c3460');assert.equal(used.at(-1),classic);assert.equal(ctx.imageSmoothingEnabled,true);
});
test('las 16 combinaciones recolorean materiales exactos, no ojos, pelo, jeans, cinturón ni botas',()=>{
 const original=[32,110,171,255,250,204,153,255,247,244,233,255,99,54,32,255,52,64,91,255,91,52,35,255,169,101,53,255];
 const {A,images,recolors}=setup(original);images.get(male).onload();
 const skins=[[244,200,152],[217,155,102],[168,106,60],[111,69,38]],shirts=[[57,169,0],[19,100,140],[140,61,240],[194,46,68]];
 for(let s=0;s<4;s++)for(let c=0;c<4;c++){
  A.atlasDe(s,c);const result=recolors.at(-1);assert.deepEqual(result.slice(0,4),[...shirts[c],255]);assert.deepEqual(result.slice(4,8),[...skins[s],255]);assert.deepEqual(result.slice(8),original.slice(8));
 }
 assert.equal(recolors.length,16);A.atlasDe(0,0);assert.equal(recolors.length,16);
});
