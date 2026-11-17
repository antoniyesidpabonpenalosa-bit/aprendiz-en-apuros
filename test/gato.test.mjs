import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createContext,runInContext} from 'node:vm';
const read=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
const ctx=createContext({S:{acc:'gato',pts:123,accs:['gato']},quieto:()=>false,document:{createElement:()=>({getContext:()=>({})})}});
runInContext(read('js/gato-arte.js'),ctx);runInContext(read('js/gato.js'),ctx);
const arte=runInContext('ARTE_GATO',ctx),gato=runInContext('GATO',ctx);
const filas=f=>f.split('/');
const cuenta=(f,ch)=>filas(f).join('').split(ch).length-1;

test('gato: el arte generado sale tal cual de scripts/build-gato.mjs',async()=>{
 const {generaJS}=await import('../scripts/build-gato.mjs');
 assert.equal(generaJS(),read('js/gato-arte.js'),'ejecuta node scripts/build-gato.mjs y vuelve a comprometer');
});
test('gato: reposo, reposo con parpadeo y caminata en las 8 orientaciones con 4 cuadros, con la paleta y el tamaño de celda',()=>{
 for(const clave of ['reposo','reposoParpadeo','camina']){
  assert.equal(arte[clave].length,8,clave);
  for(let d=0;d<8;d++){assert.equal(arte[clave][d].length,4,`${clave} ${d}`);
   for(const f of arte[clave][d]){const fs=filas(f);assert.ok(fs.length<=arte.h&&fs.every(r=>r.length<=arte.w),`${clave} ${d}: cabe en ${arte.w}×${arte.h}`);
    for(const ch of f.replace(/\//g,''))assert.ok(ch==='.'||ch in arte.paleta,`color ${ch}`);
    assert.ok(cuenta(f,'K')>20&&(cuenta(f,'O')+cuenta(f,'L')+cuenta(f,'o'))>25,`${clave} ${d}: contorno y pelo`);
    assert.ok(!fs[0].replace(/\./g,'')&&fs.every(r=>r[0]==='.'||r[0]===undefined)&&fs.every(r=>r[arte.w-1]==='.'||r[arte.w-1]===undefined),`${clave} ${d}: no toca el borde de la celda (no se recorta)`)}}
 }
});
test('gato: la cara solo se ve cuando la cabeza mira al espectador y el parpadeo cierra los ojos',()=>{
 for(let d=0;d<8;d++){
  const ojos=cuenta(arte.reposo[d][0],'E'),brillo=cuenta(arte.reposo[d][0],'e'),cerrados=cuenta(arte.reposoParpadeo[d][0],'e');
  if([3,4,5].includes(d))assert.equal(ojos,0,`dir ${d}: de espaldas no hay ojos`);
  else{assert.ok(ojos>0&&brillo>0,`dir ${d}: se ven los ojos`);assert.notEqual(arte.reposo[d][0],arte.reposoParpadeo[d][0],`dir ${d}: parpadeo distinto`);assert.equal(cerrados,0,`dir ${d}: cerrados sin brillo`)}
 }
 // de frente se ven dos ojos y de perfil uno
 assert.ok(cuenta(arte.reposo[0][0],'E')>=2*cuenta(arte.reposo[2][0],'E')-1,'de frente más ojos que de perfil');
});
test('gato: la cola se mueve en reposo y las patas en la caminata (cuadros distintos), y ninguna vista es el espejo de otra',()=>{
 for(let d=0;d<8;d++){
  if(d!==3)assert.notEqual(arte.reposo[d][0],arte.reposo[d][2],`dir ${d}: cola`);   // en NE la cola queda tapada por el cuerpo
  assert.equal(new Set(arte.camina[d]).size,4,`dir ${d}: 4 cuadros de caminata distintos`);
 }
 const espejo=f=>filas(f).map(r=>r.padEnd(arte.w,'.')).map(r=>[...r].reverse().join('').replace(/\.+$/,'')).join('/');
 for(const clave of ['reposo','camina'])for(const [a,b] of [[1,7],[2,6],[3,5]])assert.notEqual(espejo(arte[clave][a][0]),arte[clave][b][0],`${clave}: ${a} no es el espejo de ${b}`);
 assert.equal(new Set([0,1,2,3,4,5,6,7].map(d=>arte.reposo[d][0])).size,8,'ocho orientaciones distintas');
});
test('gato: junto al protagonista, camina cuando se mueve y se detiene cuando él se detiene',()=>{
 const st=gato.nuevo();let ms=0,hx=100,vivo=(dx)=>{hx+=dx;ms+=16;gato.avanza(st,hx,100,1,2,false,ms)};
 for(let i=0;i<20;i++)vivo(0);
 assert.equal(st.anda,false,'parado en su sitio');assert.equal(gato.elige(st,ms).estado,'reposo');
 const t0=[st.x,st.y];                                                  // detrás de él (mira al este): a su izquierda
 assert.ok(t0[0]<hx,'detrás cuando mira al este');
 let maxd=0,anduvo=0;
 for(let i=0;i<90;i++){vivo(2.4);maxd=Math.max(maxd,Math.hypot(st.x-hx,st.y-100));if(st.anda)anduvo++}
 assert.ok(anduvo>60,`camina mientras él camina (${anduvo}/90)`);assert.ok(maxd<40,`no se queda atrás (${maxd.toFixed(1)})`);
 assert.equal(st.dir,2,'mira hacia donde van (este)');assert.equal(gato.elige(st,ms).estado,'camina');
 for(let i=0;i<80;i++)vivo(0);
 assert.equal(st.anda,false,'se detiene al detenerse él');assert.equal(gato.elige(st,ms).estado,'reposo');
 assert.ok(Math.abs(st.x-(hx+gato.POS[2][0]))<0.6,'se queda en su sitio junto a él');
});
test('gato: se coloca según hacia dónde mira el protagonista, se sienta a su lado y no se queda lejos aunque él salte',()=>{
 for(let d=0;d<8;d++){const st=gato.nuevo();gato.avanza(st,50,80,1,d,false,0);assert.deepEqual([st.x,st.y],[50+gato.POS[d][0],80+gato.POS[d][1]],`dir ${d}`);assert.equal(st.dir,d,'mira como él')}
 const st=gato.nuevo();gato.avanza(st,50,80,1,0,false,0);gato.avanza(st,400,80,1,0,false,16);
 assert.ok(Math.abs(st.x-(400+gato.POS[0][0]))<0.01,'si él se teletransporta, no lo persigue');
 // con «reducir movimiento»: sentado, sin cola ni parpadeo ni retraso
 const q=createContext({S:{acc:'gato'},quieto:()=>true,document:{}});runInContext(read('js/gato-arte.js'),q);runInContext(read('js/gato.js'),q);
 const g2=runInContext('GATO',q),s2=g2.nuevo();for(let i=0;i<10;i++)g2.avanza(s2,100+i*5,100,1,2,true,i*16);
 assert.equal(s2.anda,false);const e=g2.elige(s2,123456);assert.deepEqual([e.estado,e.f,e.parpadeo],['reposo',0,false]);
});
test('gato: es solo visual (no toca el estado del juego) y solo aparece con el accesorio puesto',()=>{
 const antes=JSON.stringify(runInContext('S',ctx));
 const st=gato.nuevo();for(let i=0;i<50;i++)gato.avanza(st,100+i,100,1,2,true,i*16);
 assert.equal(JSON.stringify(runInContext('S',ctx)),antes,'no cambia S');
 const src=read('js/gato.js').replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');   // sin comentarios
 for(const prohibido of ['vidas','colision','hitbox','S.pts','guardar(','SFX','sala'])assert.ok(!src.includes(prohibido),`gato.js no usa ${prohibido}`);
 const q=createContext({S:{acc:'corona'},quieto:()=>false,document:{}});runInContext(read('js/gato-arte.js'),q);runInContext(read('js/gato.js'),q);
 assert.equal(runInContext('GATO.acompanar({canvas:{}},10,10,30,2,true,0)',q),false,'sin el gato puesto no se pinta');
});
test('gato: los dos scripts están en orden y en la caché, y ya no se pinta sobre el cuerpo',()=>{
 const html=read('index.html'),sw=read('sw.js');
 for(const f of ['js/gato-arte.js','js/gato.js'])assert.ok(html.includes(f)&&sw.includes('./'+f),f);
 assert.ok(html.indexOf('js/gato-arte.js')<html.indexOf('js/gato.js')&&html.indexOf('js/sprite.js')<html.indexOf('js/gato.js'));
 assert.ok(!/if\(id==='gato'\)pieza\(/.test(read('js/sprite.js')),'el gato ya no va sobre el cuerpo');
});
