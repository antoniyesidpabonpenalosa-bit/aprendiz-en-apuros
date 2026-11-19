import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createContext,runInContext} from 'node:vm';
import {cargarJuego} from './ayuda.mjs';

const fuente=readFileSync(new URL('../js/nucleo.js',import.meta.url),'utf8');

function juego(dias=Array(15).fill(-1)){
  const avisos=[], popup={hidden:true,querySelector:selector=>selector==='p'?{set textContent(v){avisos.push(v)}}:{set textContent(_) {}}};
  const ctx=createContext({localStorage:{getItem:()=>JSON.stringify({dias}),setItem(){}},
    document:{querySelector:()=>popup}, setTimeout:()=>0, clearTimeout(){}, SFX:{logro(){},win(){throw Error('resultado registrado')}},
    retoActivo:false,libreActivo:false,sinFinActivo:false,salaActiva:false,
    rangoDe:()=>({}),progresoXp:()=>({pc:0}),
    Date, console});
  for(const f of ['datos','estado','nucleo'])runInContext(readFileSync(new URL(`../js/${f}.js`,import.meta.url),'utf8'),ctx);
  return {ctx,avisos,eval:codigo=>runInContext(codigo,ctx)};
}

test('los secretos no alteran el contador de 19 y una partida antigua no obtiene la campaña limpia',()=>{
  const g=cargarJuego({guardado:{dias:Array(15).fill(3),limpio:true,camisa:8}});
  assert.equal(g.S.limpio,false);
  assert.equal(g.S.camisa,0);
  assert.equal(g.LOGROS.length,19);
  assert.equal(g.S.dias.length,15);
});

test('las camisas solo se conservan si el logro está presente en una partida importada',()=>{
  for(let i=0;i<5;i++){
    const sin=cargarJuego({guardado:{camisa:4+i}});
    const con=cargarJuego({guardado:{camisa:4+i,logros:[['s10','s6','s7','s4','s3'][i]]}});
    assert.equal(sin.S.camisa,0);
    assert.equal(con.S.camisa,4+i);
  }
});

test('el logro de tres estrellas se concede con la última primera marca y no se duplica',()=>{
  const g=juego([...Array(14).fill(3),-1]);
  g.eval('S.fallosDia=Array(15).fill(0); S.limpio=false;');
  assert.throws(()=>g.eval('resultado(14,3,100)'),/resultado registrado/);
  assert.equal(g.eval("S.logros.filter(x=>x==='s4').length"),1);
  assert.throws(()=>g.eval('resultado(14,3,100)'),/resultado registrado/);
  assert.equal(g.eval("S.logros.filter(x=>x==='s4').length"),1);
});

test('la campaña limpia exige un inicio nuevo y pierde su condición en el primer fallo',()=>{
  const g=juego([...Array(14).fill(1),-1]);
  g.eval('S.campanaIniciada=true; S.limpio=true; S.fallosDia=Array(15).fill(0);');
  assert.throws(()=>g.eval('resultado(14,1,100)'),/resultado registrado/);
  assert.equal(g.eval("S.logros.includes('s3')"),true);
  const h=juego([...Array(14).fill(1),-1]);
  h.eval('S.campanaIniciada=true; S.limpio=false; S.fallosDia=Array(15).fill(0);');
  assert.throws(()=>h.eval('resultado(14,1,100)'),/resultado registrado/);
  assert.equal(h.eval("S.logros.includes('s3')"),false);
});

test('TERCO necesita tres fallos acumulados del mismo día antes de aprobarlo',()=>{
  for(const n of [2,3]){
    const g=juego();g.eval(`S.fallosDia[2]=${n};`);
    assert.throws(()=>g.eval('resultado(2,1,100)'),/resultado registrado/);
    assert.equal(g.eval("S.logros.includes('s7')"),n===3);
    assert.equal(g.eval('S.fallosDia[2]'),0);
  }
});
