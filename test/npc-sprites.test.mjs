import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
const src=readFileSync(new URL('../js/npc-sprites.js',import.meta.url),'utf8');
function montar(){let img;const c=createContext({Image:class{constructor(){img=this;} set src(v){this.url=v;}}});runInContext(src,c);return {api:runInContext('NPC_PASILLO',c),img};}
function cargar(img,w=176,h=74){img.naturalWidth=w;img.naturalHeight=h;img.onload();}
test('NPC: carga un atlas independiente y conserva el ancla de pies',async()=>{const {api,img}=montar();const calls=[];const ctx={imageSmoothingEnabled:true,drawImage(...args){assert.equal(this.imageSmoothingEnabled,false);calls.push(args.slice(1));}};assert.equal(api.dibujar(ctx,'instructor',22,74,74),false);cargar(img);assert.equal(await api.cargado,true);for(const [i,id] of ['instructor','companera','lider','vigilante'].entries()){assert.equal(api.dibujar(ctx,id,22,74,74),true);assert.deepEqual(calls[i],[44*i,0,44,74,0,0,44,74]);}assert.equal(ctx.imageSmoothingEnabled,true);assert.equal(api.dibujar(ctx,'toString',22,73),false);});
test('NPC: imagen fallida o dimensiones incorrectas devuelven false para el respaldo',async()=>{for(const fallo of [img=>img.onerror(),img=>cargar(img,1,1)]){const {api,img}=montar();fallo(img);assert.equal(await api.cargado,false);assert.equal(api.dibujar({},'lider',22,73),false);}});
test('NPC: atlas PNG y precarga offline tienen las dimensiones y ruta pactadas',()=>{const b=readFileSync(new URL('../img/npc/pasillo.png',import.meta.url));assert.equal(b.readUInt32BE(16),176);assert.equal(b.readUInt32BE(20),74);const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');assert.match(sw,/\.\/img\/npc\/pasillo\.png/);assert.match(sw,/\.\/js\/npc-sprites\.js/);});
