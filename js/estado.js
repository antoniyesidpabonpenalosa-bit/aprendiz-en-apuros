'use strict';
/* ── ESTADO ── */
const STATS0={bugs:0,cafes:0,palabras:0,jefes:0,perfectos:0,racha:0,partidas:0,retos:0};
const TOT_DIAS=NIVELES.length; /* 15: etapa productiva (10) + el contrato (5) */
const DEF={pts:0,xp:0,dias:Array(TOT_DIAS).fill(-1),logros:[],accs:[],acc:'',skin:0,camisa:0,
  mejoras:[],records:[],lang:'es',snd:true,mus:true,intro:false,t2:false,nombre:'',hd:false,legible:false,grupo:'',dif:1,
  /* av32: el detalle del RETRATO (16×16 de siempre / 32×32 más fino), independiente
     de hd, que es la piel de la interfaz (retro CRT / OLED). Los dos se pueden
     combinar: no son un selector de tres, son dos interruptores. */
  av32:false,stats:Object.assign({},STATS0)};
let S;
try{S=Object.assign({},DEF,JSON.parse(localStorage.getItem('pa3')||'{}'))}catch(e){S=Object.assign({},DEF)}
/* migración: partidas viejas de 10 días se extienden a 15 */
if(!Array.isArray(S.dias))S.dias=Array(TOT_DIAS).fill(-1);
while(S.dias.length<TOT_DIAS)S.dias.push(-1);
S.dias=S.dias.slice(0,TOT_DIAS);
if(typeof S.dif!=='number'||S.dif<0||S.dif>2)S.dif=1;
if(typeof S.mus!=='boolean')S.mus=true;
if(typeof S.t2!=='boolean')S.t2=false;
if(typeof S.legible!=='boolean')S.legible=false;
if(typeof S.av32!=='boolean')S.av32=false;
/* No va en DEF a propósito: los arrays de DEF se copian por referencia y
   S.vistos.push() acabaría escribiendo dentro de DEF. Aquí nace uno nuevo
   en cada carga. */
if(!Array.isArray(S.vistos))S.vistos=[];
/* Marcas del modo libre, por minijuego y dificultad. Tampoco va en DEF:
   Object.assign copia el objeto por referencia y escribir una marca
   acabaría dentro de DEF. */
if(!S.mejores||typeof S.mejores!=='object')S.mejores={};
if(typeof S.mejorSinFin!=='number'||!(S.mejorSinFin>=0))S.mejorSinFin=0;
/* Código de aula: mayúsculas, dígitos, 3 a 8 caracteres. Se sanea aquí
   porque puede venir de un código de guardado escrito a mano. */
S.grupo=String(S.grupo||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);
if(!S.stats||typeof S.stats!=='object')S.stats={};
S.stats=Object.assign({},STATS0,S.stats);
const guardar=()=>{try{localStorage.setItem('pa3',JSON.stringify(S))}catch(e){}};
const t=k=>TXT[S.lang][k]||k;
const tj=o=>o[S.lang]||o.es;
/* Pista de un logro en el idioma activo (campos pes/pen de LOGROS). */
const tp=o=>(S.lang==='en'?o.pen:o.pes)||o.pes||'';
/* Escapa texto que no controlamos (nombres del marcador global) antes de
   meterlo en innerHTML. Sin esto, un nombre con HTML se ejecutaría. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

let diaAct=0, vidas=3, pausado=false, raf=0, pantallaId='titulo';
let tms=[], alLimpiar=[];
const tvez=(f,ms)=>{const i=setTimeout(f,ms);tms.push(i);return i};
const tcada=(f,ms)=>{const i=setInterval(f,ms);tms.push(i);return i};
function limpiarT(){tms.forEach(i=>{clearTimeout(i);clearInterval(i)});tms=[];
  if(raf){cancelAnimationFrame(raf);raf=0}
  alLimpiar.forEach(f=>{try{f()}catch(e){}});alLimpiar=[];}

const aplicarModo=()=>{
  document.documentElement.classList.toggle('hd',!!S.hd);
  /* Modo de texto legible: cambia la tipografía de píxeles por VT323 en el
     texto pequeño (nombres de logro, niveles, artículos de la tienda). La
     prosa larga —diálogos, preguntas, opciones— ya iba en VT323. */
  document.documentElement.classList.toggle('legible',!!S.legible);
  /* Detalle del retrato. Por ahora es solo la marca: cara32() y el CSS que
     la use llegan en una fase posterior, ya aprobada aparte. */
  document.documentElement.classList.toggle('av32',!!S.av32);
};
/* El <html lang> tiene que seguir al idioma elegido. Si se queda en "es"
   con el juego en inglés, un lector de pantalla lee el texto inglés con
   fonética española. Se aplica también al arrancar, no solo al cambiar:
   una partida guardada en inglés vuelve a cargar en inglés. */
const aplicarIdioma=()=>{document.documentElement.lang=S.lang};
/* -1 = la que eligió el jugador. El modo sin fin la sube por rondas sin
   tocar S.dif, que es un ajuste del jugador y no debe cambiarlo el juego. */
let difForzada=-1;
const difActual=()=>DIFS[difForzada>=0?difForzada:S.dif]||DIFS[1];
const maxVidas=()=>Math.max(1,3+(S.mejoras.includes('vida')?1:0)+difActual().vida);
const facTiempo=()=>(S.mejoras.includes('tiempo')?1.2:1)*difActual().tiempo;
const facPts=()=>S.mejoras.includes('doble')?2:1;
const facJefe=()=>difActual().jefe;
/* Palancas de dificultad dentro de los minijuegos.
   cuantos() redondea y nunca baja del mínimo: con cant 0.75 una tanda de
   5 rondas se queda en 4, no en 3,75 ni en 0. */
const facCant=()=>difActual().cant;
const facRitmo=()=>difActual().ritmo;
const maxErr=()=>difActual().err;
const ojeada=()=>difActual().ojeada;
const cuantos=(base,min=2)=>Math.max(min,Math.round(base*facCant()));
const alRitmo=ms=>Math.round(ms*facRitmo());
const sumaStat=(k,n)=>{S.stats[k]=(S.stats[k]||0)+(n||1);guardar()};
const mejorStat=(k,n)=>{if(n>(S.stats[k]||0)){S.stats[k]=n;guardar()}};

/* ── CÓDIGO DE GUARDADO (exportar/importar entre dispositivos) ── */
function sumaCod(b64){let s=0;for(let i=0;i<b64.length;i++)s=(s+b64.charCodeAt(i)*(i+1))%9973;return s.toString(36).toUpperCase()}
function exportarCodigo(){
  const b64=btoa(unescape(encodeURIComponent(JSON.stringify(S))));
  return 'PA4.'+sumaCod(b64)+'.'+b64;
}
function importarCodigo(cod){
  try{
    const p=String(cod||'').trim().split('.');
    if(p.length!==3||p[0]!=='PA4')return false;
    if(sumaCod(p[2])!==p[1])return false;
    const d=JSON.parse(decodeURIComponent(escape(atob(p[2]))));
    if(!d||typeof d!=='object'||!Array.isArray(d.dias))return false;
    S=Object.assign({},DEF,d);
    while(S.dias.length<TOT_DIAS)S.dias.push(-1);
    S.dias=S.dias.slice(0,TOT_DIAS);
    if(typeof S.dif!=='number'||S.dif<0||S.dif>2)S.dif=1;
    S.stats=Object.assign({},STATS0,(S.stats&&typeof S.stats==='object')?S.stats:{});
    guardar();vidas=maxVidas();aplicarModo();
    return true;
  }catch(e){return false}
}
const progreso=()=>{let p=0;while(p<TOT_DIAS&&S.dias[p]>=1)p++;return p};
const totalStars=()=>S.dias.reduce((a,b)=>a+Math.max(0,b),0);
const rangoDe=xp=>{let r=RANGOS[0];for(const x of RANGOS)if(xp>=x.xp)r=x;return r};
const rangoNom=()=>tj(rangoDe(S.xp));
/* Progreso hacia el siguiente rango. Lo usan la portada y la pantalla de
   resultado: el cálculo vive en un solo sitio para que no se separen. */
function progresoXp(xp=S.xp){
  const rango=rangoDe(xp);
  const sig=RANGOS[RANGOS.indexOf(rango)+1];
  const pc=sig?Math.min(100,Math.max(0,Math.round((xp-rango.xp)/(sig.xp-rango.xp)*100))):100;
  return {rango,sig,pc};
}
