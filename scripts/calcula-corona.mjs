/* Calcula la tabla de anclaje de la corona (ACC_CORONA.T en js/sprite.js): para cada dirección y cuadro de las dos apariencias y para
   cada pose de portada, el centro y el radio de la cabeza en las filas del aro (donde se asienta la corona).
   Uso: node scripts/calcula-corona.mjs   (imprime las dos tablas para pegarlas en js/sprite.js) */
import {readFileSync} from 'node:fs';
import {decodificarPNG} from './lib-pixel.mjs';
const RAIZ=new URL('../',import.meta.url);
const A=f=>decodificarPNG(readFileSync(new URL('img/'+f,RAIZ)));
const YB={masculina:7,femenina:9};
function medida(img,ap,fila,col){
  const {w,rgba}=img;let x0=99,x1=-1;
  for(let y=YB[ap];y<=YB[ap]+2;y++)for(let x=0;x<44;x++)if(rgba[((fila*74+y)*w+col*44+x)*4+3]){x0=Math.min(x0,x);x1=Math.max(x1,x)}
  return [(x0+x1)/2,(x1-x0)/2+0.5];
}
const f=(v)=>Math.round(v*2)/2;
const out={};
for(const [ap,cam,por,cols] of [['masculina',A('aprendiz-masculino-premium-caminar.png'),A('aprendiz-masculino-premium-portada.png'),[0]],['femenina',A('aprendiz-femenina-caminar.png'),A('aprendiz-femenina-portada.png'),[1,2,3]]]){
  const t=[];for(let d=0;d<8;d++)t.push(cols.map(c=>medida(cam,ap,d,c).map(f)));
  out[ap]={caminar:t,portada:[0,1,2,3].map(p=>medida(por,ap,0,p).map(f))};
}
console.log(JSON.stringify(out));
