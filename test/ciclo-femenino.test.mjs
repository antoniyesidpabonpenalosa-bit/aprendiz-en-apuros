/* Ciclo de caminata de ella (v40.15): el paso del cuadro 0 es el del OTRO pie, sin tocar cabeza ni hombros, y todo sale tal cual
   de scripts/build-ciclo-femenino.mjs. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {decodificarPNG} from '../scripts/lib-pixel.mjs';
import {aplica,RECETAS} from '../scripts/build-ciclo-femenino.mjs';
const RAIZ=new URL('../',import.meta.url);
const atlas=()=>decodificarPNG(readFileSync(new URL('img/aprendiz-femenina-caminar.png',RAIZ)));
const FW=44,FH=74;
const px=(a,f,c,x,y)=>{const i=((f*FH+y)*a.w+c*FW+x)*4;return a.rgba[i+3]?[a.rgba[i],a.rgba[i+1],a.rgba[i+2]].join():''};
const difiere=(a,f,c1,c2,y0,y1)=>{let n=0;for(let y=y0;y<y1;y++)for(let x=0;x<FW;x++)if(px(a,f,c1,x,y)!==px(a,f,c2,x,y))n++;return n};

test('ciclo femenino: el atlas sale tal cual del script y volver a correrlo no cambia nada',()=>{
 const a=atlas(),antes=Buffer.from(a.rgba);aplica(a);
 assert.ok(antes.equals(Buffer.from(a.rgba)),'ejecuta node scripts/build-ciclo-femenino.mjs y vuelve a comprometer el atlas');
});

test('ciclo femenino: cabeza y hombros del cuadro 0 son los del 2 (sin salto de cabeza); de frente, de espaldas y en tres cuartos el paso es otro; el perfil no cambia',()=>{
 const a=atlas();
 for(let f=0;f<8;f++){
  assert.equal(difiere(a,f,0,2,0,34),0,`fila ${f}: arriba del pecho, iguales`);
  const abajo=difiere(a,f,0,2,34,FH);
  if(f===2||f===6)assert.equal(abajo,0,`fila ${f} (perfil): se queda como estaba`);
  else assert.ok(abajo>=60,`fila ${f}: el paso del cuadro 0 se distingue del 2 (${abajo} píxeles distintos)`);
 }
});

test('ciclo femenino: la mitad de abajo del nuevo paso es el espejo de la pose de paso de su vista (la espalda no sale de un frente)',()=>{
 const a=atlas();
 for(const [fd,cd,base,fuente,yc] of RECETAS){
  assert.ok(yc>=34&&yc<=44);
  /* la fila de arriba es la del cuadro base, tal cual */
  for(let y=0;y<yc;y++)for(let x=0;x<FW;x++)assert.equal(px(a,fd,cd,x,y),px(a,base[0],base[1],x,y),`fila ${fd} col ${cd} y=${y}`);
  /* y la de abajo viene de la fuente: mismo conjunto de colores, reflejado */
  const bajo=(f,c)=>{const m=new Map();for(let y=yc;y<FH;y++)for(let x=0;x<FW;x++){const k=px(a,f,c,x,y);if(k)m.set(k,(m.get(k)||0)+1)}return m};
  const d=bajo(fd,cd),o=bajo(fuente[0],fuente[1]);let comunes=0,total=0;
  for(const [k,v] of d){total+=v;comunes+=Math.min(v,o.get(k)||0)}
  assert.ok(comunes/total>0.95,`fila ${fd} col ${cd}: la mitad de abajo es la de la fuente (${(100*comunes/total).toFixed(1)} % de píxeles coinciden en color)`);
 }
});

test('ciclo femenino: de frente y de espaldas el pie que sube cambia de un paso al siguiente (ya no cojea)',()=>{
 const a=atlas();
 /* fila más baja de cada pie, a ±5 columnas del eje: la menor es la del pie levantado (+1 = sube el izquierdo, -1 = el derecho) */
 const bajo=(f,c,x0,x1)=>{let m=-1;for(let x=x0;x<x1;x++)for(let y=FH-1;y>=0;y--)if(px(a,f,c,x,y)){m=Math.max(m,y);break}return m};
 const sube=(f,c)=>Math.sign(bajo(f,c,24,30)-bajo(f,c,14,20));
 for(const f of [0,4])assert.equal(sube(f,0),-sube(f,2),`fila ${f}: los dos pasos levantan pies distintos`);
 assert.equal(sube(0,1),-sube(0,3),'de frente, las dos zancadas levantan pies distintos');
 assert.ok(sube(0,0)!==0&&sube(0,2)!==0&&sube(0,1)!==0&&sube(0,3)!==0);
});

test('ciclo femenino: la taza se sujeta de la mano de cada cuadro del atlas, también del 0',()=>{
 const vm={};
 const src=readFileSync(new URL('js/sprite.js',RAIZ),'utf8');
 const m=src.match(/const ACC_CAFE = \(\(\)=>\{[\s\S]*?const T=(\{.*\});/);
 const T=JSON.parse(m[1]),a=atlas();
 const piel=new Set(['145,82,49','187,116,72','217,150,99','239,182,125','250,204,153','255,225,183']);
 assert.equal(T.femenina.caminar.length,8);
 for(let d=0;d<8;d++){
  assert.equal(T.femenina.caminar[d].length,4,`dirección ${d}: cuatro cuadros`);
  for(let c=0;c<4;c++){
   const [,x0,x1,y1]=T.femenina.caminar[d][c];let n=0;
   for(let x=x0;x<=x1;x++)if(piel.has(px(a,d,c,x,y1)))n++;
   assert.ok(n>0,`dirección ${d} cuadro ${c}: hay piel (la mano) bajo el anclaje de la taza`);
  }
 }
});
