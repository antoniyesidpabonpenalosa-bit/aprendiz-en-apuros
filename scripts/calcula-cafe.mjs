/* Calcula la tabla de anclaje de la taza de café (ACC_CAFE.T en js/sprite.js): la mano que la sujeta en cada celda de los atlas
   (dirección, cuadro de marcha y pose de portada), como [lado, x izq., x der., y de abajo] del puño (píxeles de piel de la rampa
   exacta por debajo de la cintura). Se sujeta con la mano más a la derecha en S, SE, E, NE y N, y con la más a la izquierda en
   NO, O y SO; el lado (+1 la taza queda a la derecha de la mano, -1 a la izquierda) sale de dónde cae la mano.
   Uso: node scripts/calcula-cafe.mjs   (imprime la tabla para pegarla en js/sprite.js) */
import {readFileSync} from 'node:fs';
import {decodificarPNG} from './lib-pixel.mjs';
const RAIZ=new URL('../',import.meta.url);
const SK=new Set(['915231','bb7448','d99663','efb67d','facc99','ffe1b7']);
function manos(img,fila,col,ymin=42,ymax=64){
  const {w,rgba}=img;
  const es=(x,y)=>{if(x<0||x>=44||y<ymin||y>ymax)return false;const i=((fila*74+y)*w+col*44+x)*4;return rgba[i+3]&&SK.has([0,1,2].map(k=>rgba[i+k].toString(16).padStart(2,'0')).join(''))};
  const vis=new Set(),bl=[];
  for(let y=ymin;y<=ymax;y++)for(let x=0;x<44;x++)if(es(x,y)&&!vis.has(y*50+x)){
    const q=[[x,y]],px=[];vis.add(y*50+x);
    while(q.length){const [a,b]=q.pop();px.push([a,b]);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=a+dx,ny=b+dy;if(es(nx,ny)&&!vis.has(ny*50+nx)){vis.add(ny*50+nx);q.push([nx,ny])}}}
    if(px.length>=6){const xs=px.map(p=>p[0]),ys=px.map(p=>p[1]);bl.push([Math.min(...xs),Math.max(...xs),Math.max(...ys)])}
  }
  return bl.sort((a,b)=>a[0]-b[0]);
}
function elige(bl,dir){
  const b=dir<=4?bl[bl.length-1]:bl[0];
  // la taza queda hacia el lado al que mira (E, SE, NE a la derecha; O, SO, NO a la izquierda); de frente y de espaldas, según caiga la mano
  const lado=[1,2,3].includes(dir)?1:[5,6,7].includes(dir)?-1:((b[0]+b[1])/2>=22?1:-1);
  return [lado,b[0],b[1],b[2]];
}
const A=f=>decodificarPNG(readFileSync(new URL('img/'+f,RAIZ)));
const out={};
for(const [ap,cam,por,cols] of [['masculina',A('aprendiz-masculino-premium-caminar.png'),A('aprendiz-masculino-premium-portada.png'),[0]],['femenina',A('aprendiz-femenina-caminar.png'),A('aprendiz-femenina-portada.png'),[1,2,3]]]){
  out[ap]={caminar:[...Array(8).keys()].map(d=>cols.map(c=>elige(manos(cam,d,c),d))),portada:[0,1,2,3].map(p=>elige(manos(por,0,p),0))};
}
console.log(JSON.stringify(out));
