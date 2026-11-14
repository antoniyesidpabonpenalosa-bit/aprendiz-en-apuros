import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createContext,runInContext} from 'node:vm';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const urls=[];const images=new Map();
const env=createContext({Image:class {set src(u){this.url=u;images.set(u,this);}},document:{createElement:()=>({getContext:()=>({drawImage(i){urls.push(i.url)},getImageData(){throw Error('mock')}})})},SKINS:['#f4c898'],CAMISAS:['#13648c'],S:{skin:0,camisa:0}});
runInContext(readFileSync(join(root,'js/sprite.js'),'utf8'),env);
const A=runInContext('APRENDIZ',env);const draws=[];const ctx={imageSmoothingEnabled:true,drawImage(...a){draws.push(a.slice(1,5));}};
const classic='img/aprendiz-caminar.png',hd='img/aprendiz-caminar-hd.png',menu='img/aprendiz-portada-hd.png';
test('fallback clásico, protagonista HD, NPC clásico, portada y ancla',()=>{
 assert.equal(A.dibujar(ctx,50,100,74,0),false);
 images.get(classic).onload();assert.equal(A.dibujar(ctx,50,100,74,0),true);assert.equal(urls.at(-1),classic);
 images.get(hd).onload();assert.equal(A.dibujar(ctx,50,100,74,A.idx.east,3),true);assert.equal(urls.at(-1),hd);assert.deepEqual(draws.at(-1),[132,148,44,74]);
 A.dibujar(ctx,50,100,74,0,0,'#f4c898','#2c3460');assert.equal(urls.at(-1),classic);
 A.dibujarPortada(ctx,50,100,74,3);assert.deepEqual(draws.at(-1),[0,0,44,74]); // no atlas portada todavía
 images.get(menu).onload();A.dibujarPortada(ctx,50,100,74,3);assert.equal(urls.at(-1),menu);assert.deepEqual(draws.at(-1),[132,0,44,74]);assert.equal(ctx.imageSmoothingEnabled,true);
});
test('atlas PNG con dimensiones exactas',()=>{
 for(const [name,w,h] of [[hd,176,592],[menu,176,74]]){const b=readFileSync(join(root,name));assert.equal(b.readUInt32BE(16),w);assert.equal(b.readUInt32BE(20),h);}
});
test('los dos atlas nuevos están en la caché sin conexión del service worker (y el clásico sigue)',()=>{
 const sw=readFileSync(join(root,'sw.js'),'utf8');
 for(const f of [classic,hd,menu])assert.ok(sw.includes(`'./${f}'`),f);
});
