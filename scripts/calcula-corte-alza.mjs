/* Calcula la fila de corte del «alza» (CORTE_ALZA en js/sprite.js): para el balanceo al caminar y la respiración, el tronco y la
   cabeza suben 1 px con los pies y las manos fijos. Se pinta la celda en dos trozos: de la fila de corte hacia abajo tal cual y de
   la fila de corte hacia arriba 1 px más arriba, de modo que la fila c-1 se repite una vez (un estirón de 1 px, en píxeles
   enteros). Esa repetición no se nota cuando la fila c-1 es igual a la c-2 o a la c, así que el corte es la fila entre 40 y 46 (la
   cadera, por encima de las manos y de las piernas) donde mejor se cumple eso en los cuadros de la celda.
   Uso: node scripts/calcula-corte-alza.mjs   (imprime la tabla para pegarla en js/sprite.js)
   Exporta calcula() para que la prueba compruebe que la tabla del juego es la que sale de los atlas. */
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {decodificarPNG} from './lib-pixel.mjs';
const RAIZ=new URL('../',import.meta.url);
const FW=44,FH=74,MIN=40,MAX=46,PREF=43;
const atlas=f=>decodificarPNG(readFileSync(new URL('img/'+f,RAIZ)));
function mejor(a,fila,cols){
  const px=(c,x,y)=>{const i=((fila*FH+y)*a.w+c*FW+x)*4;return a.rgba[i+3]?[a.rgba[i],a.rgba[i+1],a.rgba[i+2]].join():''};
  /* cuánto cambia la fila r respecto de la r-1 en todos los cuadros */
  const sal=r=>{let n=0;for(const c of cols)for(let x=0;x<FW;x++)if(px(c,x,r)!==px(c,x,r-1))n++;return n};
  let m=[Infinity,PREF];
  for(let c=MIN;c<=MAX;c++){const d=Math.min(sal(c-1),sal(c))*10+Math.abs(c-PREF);if(d<m[0])m=[d,c]}
  return m[1];
}
export function calcula(){
  const out={};
  for(const [ap,cam,por] of [['masculina','aprendiz-masculino-premium-caminar.png','aprendiz-masculino-premium-portada.png'],['femenina','aprendiz-femenina-caminar.png','aprendiz-femenina-portada.png']]){
    const c=atlas(cam),p=atlas(por);
    out[ap]={caminar:[...Array(8).keys()].map(d=>mejor(c,d,[0,1,2,3])),portada:mejor(p,0,[0,1,2,3])};
  }
  return out;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])console.log(JSON.stringify(calcula()));
