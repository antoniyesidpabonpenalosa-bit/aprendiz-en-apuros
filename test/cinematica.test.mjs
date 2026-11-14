import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createContext,runInContext} from 'node:vm';
const ctx=createContext({console});
for(const f of ['datos.js','iconos.js'])runInContext(readFileSync(new URL('../js/'+f,import.meta.url),'utf8'),ctx);
runInContext(`const S={lang:'es'};const GESTOS=['normal','feliz','enojado','sorprendido','preocupado'];const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));const t=s=>s;const idDe=s=>/INSTRUCTOR/.test(s)?'instructor':'';`,ctx);
runInContext(readFileSync(new URL('../js/cinematica.js',import.meta.url),'utf8'),ctx);
const run=s=>runInContext(s,ctx);
test('cine conserva todos los diálogos diarios y los dos idiomas',()=>{
 assert.equal(run(`['es','en'].every(l=>DIALOGOS[l].length===15&&DIALOGOS[l].every(([quien,t],i)=>{const p=CINE.pagina({quien,t,gesto:GESTO_DIA[i]},{fondo:i<10?'formacion':'empresa'});return p.quien===quien&&p.texto===t&&p.gesto===GESTO_DIA[i]}))`),true);
});
test('cine adapta las seis escenas existentes sin alterar textos ni orden',()=>{
 assert.equal(run(`[INTRO,FINAL,T2_INTRO,FINAL2,JEFE_INTRO,JEFE2_INTRO].every(g=>['es','en'].every(l=>g[l].every(p=>CINE.pagina(p,{fondo:CINE.contexto(g)}).texto===p.t)))`),true);
});
test('cine permite gesto, personaje y fondo por página y ofrece valores seguros',()=>{
 assert.equal(run(`CINE.pagina({t:'a',quien:'GUSTAVO · INSTRUCTOR',gesto:'feliz',fondo:'empresa'}).gesto`),'feliz');
 assert.equal(run(`CINE.pagina({t:'a',gesto:'otro',fondo:'otro'}).fondo`),'neutro');
 assert.equal(run(`CINE.pagina({t:'a',gesto:'otro'}).gesto`),'normal');
});
test('el adaptador de días acepta tanto un diálogo antiguo como páginas alternadas',()=>{
 assert.equal(run(`CINE.dia(DIALOGOS.es[0],0)[0].texto===DIALOGOS.es[0][1]`),true);
 assert.equal(run(`CINE.dia([{quien:'GUSTAVO',t:'a'},{quien:'VALENTINA',t:'b',gesto:'feliz'}],10).map(p=>p.quien+':'+p.fondo).join(',')`),'GUSTAVO:empresa,VALENTINA:empresa');
});
