import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createContext,runInContext} from 'node:vm';
const read=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
const vm=createContext({Image:class{set src(_){}},document:{},SKINS:[],CAMISAS:[]});
runInContext(read('js/accesorios-cuerpo-arte.js'),vm);runInContext(read('js/sprite.js'),vm);
const arte=runInContext('ARTE_ACC_CUERPO',vm),gorra=runInContext('ACC_GORRA',vm),corbata=runInContext('ACC_CORBATA',vm);
const OJOS_M=new Set(['171420','33263a','f7f4e9']);
const pix=filas=>{const s=new Map();for(const [y,x0,t] of filas)for(let i=0;i<t.length;i++)if(t[i]!=='.')s.set(`${x0+i}:${y}`,t[i]);return s};

test('gorra: el arte generado sale tal cual de scripts/build-accesorios-cuerpo.mjs',async()=>{
 const {generaJS}=await import('../scripts/build-accesorios-cuerpo.mjs');
 assert.equal(generaJS(),read('js/accesorios-cuerpo-arte.js'),'ejecuta node scripts/build-accesorios-cuerpo.mjs y vuelve a comprometer');
});
test('gorra: hay una copa para cada dirección y cuadro de las dos apariencias y para cada pose de portada',()=>{
 for(let d=0;d<8;d++){assert.ok(arte.gorra.masculina.caminar[d][0],`masculina ${d}`);for(const c of [1,2,3])assert.ok(arte.gorra.femenina.caminar[d][c],`femenina ${d} ${c}`)}
 for(const ap of ['masculina','femenina'])for(let p=0;p<4;p++)assert.ok(arte.gorra[ap].portada[p],`${ap} portada ${p}`);
 // el cuadro 0 femenino usa la copa del 2 (misma pose)
 for(let d=0;d<8;d++)assert.equal(gorra.celda('femenina',d,0),gorra.celda('femenina',d,2));
});
test('gorra: la paleta es válida y cada celda cabe en 44 px, por encima de los ojos y sin tocar el cuerpo',()=>{
 for(const ap of ['masculina','femenina'])for(const tipo of ['caminar','portada']){
  const celdas=tipo==='portada'?Object.values(arte.gorra[ap].portada):Object.values(arte.gorra[ap].caminar).flatMap(o=>Object.values(o));
  for(const f of celdas){
   for(const [y,x0,t] of f){assert.ok(Number.isInteger(y)&&y>=0&&y<=17,`${ap} fila ${y}`);assert.ok(x0>=0&&x0+t.length<=44);
    for(const ch of t)assert.ok(ch==='.'||ch in arte.paleta,`color ${ch}`)}
   const sin=[...pix(f)].filter(([,c])=>c!=='Z');assert.ok(sin.length>60,'la copa se dibuja');
   // por encima de los ojos: la copa y la visera acaban en la fila 12 (él) o 15 (ella); la sombra, una más abajo
   assert.ok(Math.max(...sin.map(([k])=>+k.split(':')[1]))<=(ap==='masculina'?12:15),`${ap}: la gorra baja demasiado`);
  }
 }
});
test('gorra: la copa nunca tapa los ojos del atlas masculino',async()=>{
 const {decodificarPNG}=await import('../scripts/lib-pixel.mjs');
 const {w,rgba}=decodificarPNG(readFileSync(new URL('../img/aprendiz-masculino-premium-caminar.png',import.meta.url)));
 for(let d=0;d<8;d++){
  const p=pix(gorra.celda('masculina',d,0));
  for(let y=8;y<30;y++)for(let x=0;x<44;x++){const i=((d*74+y)*w+x)*4;if(rgba[i+3]&&OJOS_M.has([0,1,2].map(k=>rgba[i+k].toString(16).padStart(2,'0')).join('')))assert.ok(!p.has(`${x}:${y}`)||p.get(`${x}:${y}`)==='Z',`dir ${d}: la gorra tapa un ojo en ${x},${y}`)}
 }
});
test('gorra: cada dirección tiene su propia forma (no hay arte volteado) y la visera solo se ve de frente, 3/4 y perfil',()=>{
 const forma=d=>JSON.stringify(gorra.celda('masculina',d,0));
 assert.equal(new Set([0,1,2,3,4,5,6,7].map(forma)).size,8);
 const espejo=f=>f.map(([y,x0,t])=>[y,44-x0-t.length,[...t].reverse().join('')]);
 for(const [a,b] of [[1,7],[2,6],[3,5]])assert.notEqual(JSON.stringify(espejo(gorra.celda('masculina',a,0))),JSON.stringify(gorra.celda('masculina',b,0)),`dir ${a} no es el espejo de ${b}`);
 const T=d=>[...pix(gorra.celda('masculina',d,0)).values()].filter(c=>c==='T').length;
 for(const d of [0,1,2,6,7])assert.ok(T(d)>=6,`visera visible en ${d}`);
 assert.equal(T(4),0,'de espaldas no hay visera');
});
test('corbata: sigue el pecho en cada celda, no se ve por detrás y la femenina comparte reposo y cuadro 2',()=>{
 for(const ap of ['masculina','femenina'])for(let d=0;d<8;d++)for(let f=0;f<4;f++){
  const a=corbata.ancla(ap,d,f);assert.equal(Boolean(a),![3,4,5].includes(d),`${ap} ${d} ${f}`);
 }
 for(let d=0;d<8;d++)assert.deepEqual(corbata.ancla('femenina',d,0),corbata.ancla('femenina',d,2));
 const marca=(ap,d,f,pose=-1)=>{const px=new Set(),c={fillRect(x,y,w,h){assert.ok([x,y,w,h].every(Number.isInteger)&&x>=0&&x+w<=44&&y>=28&&y+h<=50&&w>0&&h>0,`${ap} ${d} ${f}: ${[x,y,w,h]}`);for(let i=x;i<x+w;i++)px.add(i+':'+y)}};corbata.dibujar(c,ap,d,f,pose);return [...px].sort().join('|')};
 for(const ap of ['masculina','femenina']){const v=new Set([0,1,2,6,7].map(d=>marca(ap,d,1)));assert.equal(v.size,5,`${ap}: cinco formas distintas`);for(let p=0;p<4;p++)assert.ok(marca(ap,0,0,p))}
});
test('corbata: la pala va por el eje del pecho de cada dirección: inclinada en 3/4, estrecha en perfil',()=>{
 const ancho=(ap,d)=>{const filas=new Map();const c={fillRect(x,y,w){const r=filas.get(y)||new Set();for(let i=x;i<x+w;i++)r.add(i);filas.set(y,r)}};corbata.dibujar(c,ap,d,1);return Math.max(...[...filas.values()].map(r=>r.size))};
 for(const ap of ['masculina','femenina']){assert.ok(ancho(ap,0)>ancho(ap,1)&&ancho(ap,1)>=ancho(ap,2),ap)}
 assert.ok(corbata.ancla('masculina',1,0).p[2]>0&&corbata.ancla('masculina',7,0).p[2]<0,'inclinadas hacia el lado al que mira');
});
test('gorra y corbata: los scripts están en orden y en la caché sin cambiar el resto',()=>{
 const html=read('index.html'),sw=read('sw.js');
 assert.ok(html.includes('js/accesorios-cuerpo-arte.js')&&sw.includes('./js/accesorios-cuerpo-arte.js'));
 assert.ok(html.indexOf('js/accesorios-cuerpo-arte.js')<html.indexOf('js/sprite.js'));
});

/* ───────── fase 3: capa y medalla ───────── */
const capa=runInContext('ACC_CAPA',vm),medalla=runInContext('ACC_MEDALLA',vm);
const grab=(fn)=>{const rs=[];const c={set fillStyle(v){this._f=v},get fillStyle(){return this._f},fillRect(x,y,w,h){rs.push([x,y,w,h,this._f])}};fn(c);return rs};
const huella=rs=>rs.map(r=>r.join(',')).join('|');
test('capa: por detrás de frente, perfil y 3/4; por encima en las tres vistas de espaldas; hombreras y broche solo delante',()=>{
 for(const ap of ['masculina','femenina'])for(let d=0;d<8;d++){
  const atras=grab(c=>capa.detras(c,ap,d,0)),encima=grab(c=>capa.encima(c,ap,d,0)),espalda=[3,4,5].includes(d);
  assert.equal(atras.length>0,!espalda,`${ap} ${d}: manto por detrás`);
  assert.ok(encima.length>0,`${ap} ${d}: algo por encima`);
  for(const [x,y,w,h] of [...atras,...encima]){assert.ok([x,y,w,h].every(Number.isInteger)&&w>0&&h>0,`${ap} ${d}`);assert.ok(x>=0&&x+w<=44&&y>=28&&y+h<=66,`${ap} ${d}: fuera de la celda o sobre la cabeza ${[x,y,w,h]}`)}
 }
});
test('capa: cada dirección tiene su forma y el vuelo cambia con el paso de la marcha (sin arte volteado)',()=>{
 for(const ap of ['masculina','femenina']){
  const forma=d=>huella([...grab(c=>capa.detras(c,ap,d,0)),...grab(c=>capa.encima(c,ap,d,0))]);
  assert.equal(new Set([0,1,2,3,4,5,6,7].map(forma)).size,8,`${ap}: 8 formas distintas`);
  for(const d of [0,2,4,6])assert.notEqual(huella([...grab(c=>capa.detras(c,ap,d,1)),...grab(c=>capa.encima(c,ap,d,1))]),huella([...grab(c=>capa.detras(c,ap,d,3)),...grab(c=>capa.encima(c,ap,d,3))]),`${ap} ${d}: vuelo distinto en los pasos 1 y 3`);
 }
});
test('capa: el manto llega a la altura del borde y es más ancho abajo que arriba (cae con vuelo)',()=>{
 for(const ap of ['masculina','femenina'])for(let d=0;d<8;d++){
  const [y0,y1,xl0,xr0,xl1,xr1]=capa.MA[ap][d];
  assert.ok(y1-y0>=25,`${ap} ${d}: largo`);assert.ok((xr1-xl1)>=(xr0-xl0),`${ap} ${d}: vuelo`);
 }
});
test('medalla: cinta en V y disco dorado de frente y 3/4, tira estrecha de perfil y nada de espaldas',()=>{
 for(const ap of ['masculina','femenina'])for(let d=0;d<8;d++){
  const rs=grab(c=>medalla.dibujar(c,ap,d,1));
  if([3,4,5].includes(d)){assert.equal(rs.length,0,`${ap} ${d}`);continue}
  assert.ok(rs.length>10,`${ap} ${d}`);
  for(const [x,y,w,h] of rs)assert.ok(Number.isInteger(x)&&x>=0&&x+w<=44&&y>=28&&y+h<=52,`${ap} ${d}: ${[x,y,w,h]}`);
  assert.ok(rs.some(r=>r[4]==='#ffcf3f'),`${ap} ${d}: disco dorado`);
 }
 const ancho=(ap,d)=>{const px=new Set();for(const [x,y,w] of grab(c=>medalla.dibujar(c,ap,d,1)))for(let i=0;i<w;i++)px.add(x+i);return px.size};
 for(const ap of ['masculina','femenina'])assert.ok(ancho(ap,0)>ancho(ap,1)&&ancho(ap,1)>ancho(ap,2),`${ap}: más ancha de frente que de 3/4 y de perfil`);
});
test('capa y medalla: la capa se dibuja bajo el cuerpo en la caché del atlas y no hay arte antiguo en las dos',()=>{
 const src=read('js/sprite.js');
 assert.ok(src.includes("calibrado&&id==='capa'")&&src.includes("calibrado&&id==='medalla'"));
});

/* ───────── fase 4: corona y café ───────── */
import {execFileSync} from 'node:child_process';
const corona=runInContext('ACC_CORONA',vm),cafe=runInContext('ACC_CAFE',vm);
test('corona y café: las tablas de anclaje salen tal cual de scripts/calcula-corona.mjs y scripts/calcula-cafe.mjs',()=>{
 const sal=f=>JSON.parse(execFileSync(process.execPath,[new URL('../scripts/'+f,import.meta.url).pathname],{encoding:'utf8'}));
 assert.deepEqual(JSON.parse(JSON.stringify(corona.T)),sal('calcula-corona.mjs'),'ejecuta node scripts/calcula-corona.mjs y pega la tabla en ACC_CORONA');
 assert.deepEqual(JSON.parse(JSON.stringify(cafe.T)),sal('calcula-cafe.mjs'),'ejecuta node scripts/calcula-cafe.mjs y pega la tabla en ACC_CAFE');
});
test('corona: sigue la cabeza de cada celda, queda sobre las cejas y cambia con la dirección (puntas giradas, sin arte volteado)',()=>{
 for(const ap of ['masculina','femenina']){
  const huellas=new Set();
  for(let d=0;d<8;d++){
   const rs=grab(c=>corona.dibujar(c,ap,d,0));assert.ok(rs.length>40,`${ap} ${d}`);
   for(const [x,y,w,h] of rs){assert.ok([x,y,w,h].every(Number.isInteger)&&w>0&&h>0&&x>=0&&x+w<=44&&y>=0&&y+h<=24,`${ap} ${d}: ${[x,y,w,h]}`)}
   assert.ok(Math.max(...rs.map(([,y,,h])=>y+h))<=(ap==='masculina'?15:17),`${ap} ${d}: la corona baja demasiado`);
   huellas.add(huella(rs));
  }
  assert.equal(huellas.size,8,`${ap}: 8 coronas distintas`);
  for(let p=0;p<4;p++)assert.ok(grab(c=>corona.dibujar(c,ap,0,0,p)).length>40);
  // la gema delantera solo se ve cuando el frente mira al espectador (S, SE, SO)
  const gema=d=>grab(c=>corona.dibujar(c,ap,d,0)).some(r=>r[4]==='#e43f72');
  for(let d=0;d<8;d++)assert.equal(gema(d),[0,1,7].includes(d),`${ap} ${d}: gema`);
 }
 for(let d=0;d<8;d++)for(let f=0;f<4;f++){const a=corona.ancla('femenina',d,f);assert.ok(a.rx>10&&a.cx>15&&a.cx<28)}
});
test('corona: no tapa los ojos del atlas masculino',async()=>{
 const {decodificarPNG}=await import('../scripts/lib-pixel.mjs');
 const {w,rgba}=decodificarPNG(readFileSync(new URL('../img/aprendiz-masculino-premium-caminar.png',import.meta.url)));
 for(let d=0;d<8;d++){const px=new Set();for(const [x,y,ww,h] of grab(c=>corona.dibujar(c,'masculina',d,0)))for(let i=0;i<ww;i++)for(let j=0;j<h;j++)px.add(`${x+i}:${y+j}`);
  for(let y=8;y<30;y++)for(let x=0;x<44;x++){const i=((d*74+y)*w+x)*4;if(rgba[i+3]&&OJOS_M.has([0,1,2].map(k=>rgba[i+k].toString(16).padStart(2,'0')).join('')))assert.ok(!px.has(`${x}:${y}`),`dir ${d}: tapa un ojo en ${x},${y}`)}}
});
test('café: la taza la sujeta la mano de cada celda (asa sobre la mano), del lado al que mira, y se mueve con la marcha',()=>{
 for(const ap of ['masculina','femenina'])for(let d=0;d<8;d++)for(let f=0;f<4;f++){
  const [lado,hx0,hx1,hy1]=cafe.ancla(ap,d,f),{x,y,lado:l2}=cafe.caja(ap,d,f);
  assert.equal(l2,lado);
  if([1,2,3].includes(d))assert.equal(lado,1,`${ap} ${d}: a la derecha`);if([5,6,7].includes(d))assert.equal(lado,-1,`${ap} ${d}: a la izquierda`);
  const asa=lado>0?x+2:x+8;assert.ok(asa>=hx0-3&&asa<=hx1+3,`${ap} ${d} ${f}: el asa (${asa}) cae sobre la mano ${hx0}-${hx1}`);
  assert.ok(x>=0&&x+11<=44&&y>=36&&y+10<=66,`${ap} ${d} ${f}: la taza se sale ${x},${y}`);
  for(const [rx,ry,w,h] of grab(c=>cafe.dibujar(c,ap,d,f)))assert.ok(Number.isInteger(rx)&&rx>=0&&rx+w<=44&&ry>=30&&ry+h<=70);
 }
 const pos=new Set([1,2,3].map(f=>JSON.stringify(cafe.caja('femenina',0,f))));assert.ok(pos.size>1,'la taza se mueve con la mano en la marcha');
 const vap=p=>huella(grab(c=>cafe.dibujar(c,'masculina',0,p)).filter(r=>r[4]==='#cfe6f2'));assert.notEqual(vap(0),vap(1),'el vapor cambia con el paso');
});
test('corona y café: no hay arte antiguo en las dos',()=>{
 const src=read('js/sprite.js');assert.ok(src.includes("calibrado&&id==='corona'")&&src.includes("calibrado&&id==='cafe'"));
});
