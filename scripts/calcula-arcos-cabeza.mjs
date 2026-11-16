/* Calcula los arcos de la diadema de los audífonos (ACC_CABEZA.mH y fHM en js/sprite.js) a partir del contorno real del pelo
   de cada atlas de caminata: semielipse del borde superior de la copa al vértice, un píxel por dentro del borde.
   Las copas (almohadillas) y las lentes de las gafas son medidas a mano / sobre los ojos del atlas y NO se calculan aquí.
   Uso: node scripts/calcula-arcos-cabeza.mjs   (imprime las dos tablas para pegarlas en js/sprite.js) */
import {readFileSync} from 'node:fs';
import {createContext,runInContext} from 'node:vm';
import {decodificarPNG} from './lib-pixel.mjs';
const RAIZ=new URL('../',import.meta.url);
const A={m:decodificarPNG(readFileSync(new URL('img/aprendiz-masculino-premium-caminar.png',RAIZ))),f:decodificarPNG(readFileSync(new URL('img/aprendiz-femenina-caminar.png',RAIZ)))};
const top=(a,fila,col)=>{const {w,rgba}=A[a];const t=[];for(let x=0;x<44;x++){t[x]=null;for(let y=0;y<44;y++){if(rgba[((fila*74+y)*w+col*44+x)*4+3]){t[x]=y;break}}}return t};
const vm=createContext({Image:class{set src(_){}},document:{},SKINS:[],CAMISAS:[]});
runInContext(readFileSync(new URL('js/sprite.js',RAIZ),'utf8'),vm);
const ancla=(s,d,f)=>runInContext(`ACC_CABEZA.ancla('${s}',${d},${f})`,vm);
const SIGNO=[0,1,1,-1,0,1,-1,-1];
function arco(a,fila,col,copas,d){
  const t=top(a,fila,col);const xs=t.map((v,x)=>v==null?null:x).filter(v=>v!=null);const x0=xs[0],x1=xs[xs.length-1];
  const cima=Math.min(...t.filter(v=>v!=null))+1;           // la diadema pasa un píxel por dentro del borde del pelo
  const sup=c=>c[1]-Math.floor(c[3]/2);
  const elipse=(xa,xb,ya,corte)=>{                           // semielipse de (xa,ya) a (xb,ya) con vértice en `cima`; corte = fracción de la altura donde se oculta tras la cabeza
    const cx=(xa+xb)/2,rx=Math.abs(xb-xa)/2,ry=ya-cima,s=xb>=xa?1:-1,r=[];
    for(let g=180;g>=0;g-=10){const q=g*Math.PI/180,x=Math.round(cx-s*rx*Math.cos(Math.PI-q)*-1),y=Math.round(ya-ry*Math.sin(q));
      if(g<180&&(ya-y)<ry*corte&&g<90)break;r.push([Math.round(xa+s*rx*(1-Math.cos(Math.PI-q))),y]);}
    return r;};
  let pts;
  if(copas.length===2){
    const [L,R]=copas[0][0]<copas[1][0]?[copas[0],copas[1]]:[copas[1],copas[0]];
    pts=elipse(L[0],R[0],sup(L),0);pts.push([R[0],sup(R)]);
  }else{
    const c=copas[0],s=SIGNO[d],perfil=d===2||d===6,xa=c[0],xf=perfil?xa+s*8:(s>0?x1-3:x0+3);
    pts=elipse(xa,xf,sup(c),perfil?.7:.35);
  }
  return pts.filter((p,i)=>!i||p[0]!==pts[i-1][0]||p[1]!==pts[i-1][1]);
}
for(const [sx,a,f] of [['masculina','m',0],['femenina','f',2]]){
  const out=[];
  for(let d=0;d<8;d++){const c=ancla(sx,d,f).copas;out.push([c,arco(a,d,f,c,d)])}
  console.log(`// ${sx}\n[\n`+out.map(([c,p])=>`    [${JSON.stringify(c)},${JSON.stringify(p)}]`).join(',\n')+'\n]');
}
