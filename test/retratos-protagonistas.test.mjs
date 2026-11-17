import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createContext,runInContext} from 'node:vm';
const read=f=>readFileSync(new URL('../'+f,import.meta.url));
const env=createContext({});
runInContext(read('js/retratos-aprendiz-arte.js').toString(),env);
const art=runInContext('ARTE_RETRATOS_APRENDIZ',env);
const gestures=['normal','feliz','enojado','sorprendido','preocupado'];
const OJOS={masculina:'#171420',femenina:'#1b1118'};
const pixeles=(seq,n)=>{const out=new Array(n*n).fill(0);let p=0;for(let i=0;i<seq.length;i+=2){for(let k=0;k<seq[i];k++)out[p++]=seq[i+1];}return out;};

test('retratos: dos apariencias × tres tamaños × cinco gestos con su parpadeo; datos íntegros',()=>{
 assert.deepEqual([...art.tamanos],[16,32,48]);
 for(const sex of ['masculina','femenina'])for(const n of [16,32,48]){
  const f=art.frames[sex][n];assert.equal(Object.keys(f).length,10,`${sex} ${n}`);
  assert.equal(new Set(Object.values(f).map(x=>JSON.stringify(x))).size,10,`${sex} ${n}: los 10 dibujos son distintos`);
  for(const [name,seq] of Object.entries(f)){
   assert.equal(seq.length%2,0,name);let count=0;
   for(let i=0;i<seq.length;i+=2){assert.ok(seq[i]>0);assert.ok(seq[i+1]>=0&&seq[i+1]<art.palette.length);count+=seq[i];}
   assert.equal(count,n*n,`${sex} ${n} ${name}`);
  }
 }
 for(const n of [16,32,48])assert.notDeepEqual(art.frames.masculina[n].normal,art.frames.femenina[n].normal);
 assert.ok(art.palette.filter(p=>p[1]===1).length>=4,'rampa de piel');
 assert.ok(art.palette.filter(p=>p[1]===2).length>=4,'rampa de camisa');
});

test('retratos: los ojos son simétricos y están abiertos o cerrados según el gesto (nada de ojos deformados)',()=>{
 const idx=(sex)=>art.palette.findIndex(p=>p[0]===OJOS[sex]);
 for(const sex of ['masculina','femenina'])for(const n of [16,32,48]){
  const ojo=idx(sex);assert.ok(ojo>0);
  for(const g of gestures)for(const blink of [false,true]){
   const px=pixeles(art.frames[sex][n][g+(blink?'-blink':'')],n);let izq=0,der=0;
   for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(px[y*n+x]===ojo){if(x<n/2)izq++;else der++;}
   assert.ok(izq>0,`${sex} ${n} ${g} ${blink}: hay ojos`);
   /* el ojo derecho es el espejo del izquierdo; las cejas y el pasador no usan este color */
   assert.equal(izq,der,`${sex} ${n} ${g} ${blink}: ojos parejos (${izq} y ${der})`);
  }
  /* abiertos tienen más píxeles de ojo (o blancos) que el parpadeo del mismo gesto */
  const cuenta=(g,b)=>pixeles(art.frames[sex][n][g+(b?'-blink':'')],n).filter(v=>v===ojo).length;
  assert.ok(cuenta('normal',false)>=cuenta('normal',true),`${sex} ${n}: abierto ≥ cerrado`);
 }
});

test('retratos: el generador es reproducible: js/retratos-aprendiz-arte.js sale tal cual de scripts/build-retratos-protagonistas.mjs',async()=>{
 const {generaJS}=await import('../scripts/build-retratos-protagonistas.mjs');
 assert.equal(generaJS().js,read('js/retratos-aprendiz-arte.js').toString(),'ejecuta node scripts/build-retratos-protagonistas.mjs y vuelve a comprometer');
});

test('accesorios: el cuerpo (ACC_ARTE) y el retrato usan los mismos colores',async()=>{
 const sprite=createContext({Image:class{set src(u){}},document:{createElement:()=>({getContext:()=>({})})},S:{apariencia:'masculina',acc:''}});
 runInContext(read('js/sprite.js').toString(),sprite);
 const cuerpo=runInContext('ACC_ARTE.colores',sprite);
 const {COL}=await import('../scripts/lib-accesorios-retrato.mjs');
 for(const k of ['oscuro','oro','luz','sombra','azul','acero'])assert.equal(cuerpo[k],COL[k],`color ${k}`);
 const gato={K:'gContorno',O:'gNaranja',o:'gSombra',L:'gLuz',W:'gCrema',E:'gOjo',N:'gNariz'};
 for(const [letra,clave] of Object.entries(gato))assert.equal(cuerpo.gato[letra],COL[clave],`gato ${clave}`);
 const {GATO_RETRATO}=await import('../scripts/lib-accesorios-retrato.mjs');
 // el gato del retrato es el del acompañante (reposo de frente): entero a 48, reducido a 32 y una cabecita a 16
 const {datos}=await import('../scripts/build-gato.mjs'),sin=m=>m.join('').replace(/\./g,'');
 assert.equal(sin(GATO_RETRATO[48]),sin(datos().reposo[0][0]),'a 48 es el sprite del acompañante, recortado');
 const ancho=m=>new Set(m.map(f=>f.length)).size===1;
 assert.ok(ancho(GATO_RETRATO[48])&&ancho(GATO_RETRATO[32])&&ancho(GATO_RETRATO[16]));
 assert.ok(GATO_RETRATO[48].length>GATO_RETRATO[32].length&&GATO_RETRATO[32].length>=GATO_RETRATO[16].length&&GATO_RETRATO[16].every(f=>f.length===6));
});

test('retratos: nueve accesorios en cada tamaño y apariencia, y los datos del gato y de la gorra son los acordados',()=>{
 assert.deepEqual(Object.keys(art.acc).sort(),['audifonos','cafe','capa','corbata','corona','gafas','gato','gorra','medalla']);
 for(const id of Object.keys(art.acc))for(const sex of ['masculina','femenina'])for(const n of [16,32,48]){
  const d=art.acc[id][sex][n];assert.ok(d&&d.e,`${id} ${sex} ${n}`);
  assert.ok(pixeles(d.e,n).some(v=>v>0),`${id} ${sex} ${n} dibuja algo`);
 }
 const colores=new Set(art.palette.map(p=>p[0]));
 assert.ok(colores.has('#4678c2'),'la gorra es azul como la del cuerpo y la tienda');
 assert.ok(!colores.has('#28791d')&&!colores.has('#54c41a'),'ya no queda la gorra verde antigua');
});

test('cuerpo: la cabeza masculina es idéntica en los 4 cuadros de cada dirección y los pies no se mueven',async()=>{
 const {decodificarPNG}=await import('../scripts/lib-pixel.mjs');
 for(const f of ['img/aprendiz-masculino-premium-caminar.png','img/aprendiz-femenina-caminar.png']){
  const {w,rgba}=decodificarPNG(read(f));assert.equal(w,176);
  const px=(fila,col,x,y)=>{const i=((fila*74+y)*w+col*44+x)*4;return rgba[i+3]?[rgba[i],rgba[i+1],rgba[i+2]].join():'';};
  for(let fila=0;fila<8;fila++)for(let col=0;col<4;col++){
   let pie=-1;for(let y=73;y>=0&&pie<0;y--)for(let x=0;x<44;x++)if(px(fila,col,x,y)){pie=y;break;}
   assert.equal(pie,72,`${f} fila ${fila} col ${col}: los pies siguen en la fila 72`);
  }
  if(f.includes('masculino'))for(let fila=0;fila<8;fila++)for(let col=1;col<4;col++)for(let y=0;y<31;y++)for(let x=0;x<44;x++)assert.equal(px(fila,col,x,y),px(fila,0,x,y),`masculino fila ${fila} col ${col}: misma cabeza`);
  else for(let fila=0;fila<8;fila++)for(let y=0;y<74;y++)for(let x=0;x<44;x++)assert.equal(px(fila,0,x,y),px(fila,2,x,y),`femenina fila ${fila}: el reposo es la pose de paso (sin salto de cabeza)`);
 }
});

test('retratos: jugador local marcado, NPC y clase no cambian',()=>{
 const ctx=createContext({S:{skin:0,camisa:1,apariencia:'femenina',acc:'corona'},SKINS:['#f4c898'],CAMISAS:['#13648c']});
 runInContext(read('js/graficos.js').toString(),ctx);
 assert.equal(runInContext('CARAS.yo(true).protagonista',ctx),true);
 assert.equal(runInContext('CARAS.yo(true).apariencia',ctx),'femenina');
 assert.equal(runInContext('CARAS.yo(true).corona',ctx),true);
 for(const who of ['instructor','lider','compa','vigilante'])assert.equal(runInContext(`CARAS.${who}().protagonista`,ctx),undefined);
 assert.ok(!read('js/sala.js').toString().includes('protagonista:true'));
});

test('retratos: los dos scripts están en orden y en la caché',()=>{
 const html=read('index.html').toString(),sw=read('sw.js').toString();
 const files=['js/retratos-aprendiz-arte.js','js/retratos-aprendiz.js','js/graficos.js'];
 assert.ok(files.every(f=>html.includes(f)&&sw.includes('./'+f)));
 assert.ok(html.indexOf(files[0])<html.indexOf(files[1])&&html.indexOf(files[1])<html.indexOf(files[2]));
});

test('retrato normal de 32: el blanco de los ojos es visible a ambos lados, no solo un reflejo puntual',()=>{
 const blanco=art.palette.findIndex(p=>p[0]==='#f7f4e9');
 for(const sex of ['masculina','femenina']){
  const px=pixeles(art.frames[sex][32].normal,32);
  for(const x of [10,13,18,21])for(const y of [13,14])assert.equal(px[y*32+x],blanco,`${sex} blanco ${x},${y}`);
 }
});
