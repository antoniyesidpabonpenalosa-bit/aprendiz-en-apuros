'use strict';
/* ── ESTADO ── */
const STATS0={bugs:0,cafes:0,palabras:0,jefes:0,perfectos:0,racha:0,partidas:0};
const TOT_DIAS=NIVELES.length; /* 15: etapa productiva (10) + el contrato (5) */
const DEF={pts:0,xp:0,dias:Array(TOT_DIAS).fill(-1),logros:[],accs:[],acc:'',skin:0,camisa:0,
  mejoras:[],records:[],lang:'es',snd:true,mus:true,intro:false,t2:false,nombre:'',hd:false,dif:1,stats:Object.assign({},STATS0)};
let S;
try{S=Object.assign({},DEF,JSON.parse(localStorage.getItem('pa3')||'{}'))}catch(e){S=Object.assign({},DEF)}
/* migración: partidas viejas de 10 días se extienden a 15 */
if(!Array.isArray(S.dias))S.dias=Array(TOT_DIAS).fill(-1);
while(S.dias.length<TOT_DIAS)S.dias.push(-1);
S.dias=S.dias.slice(0,TOT_DIAS);
if(typeof S.dif!=='number'||S.dif<0||S.dif>2)S.dif=1;
if(typeof S.mus!=='boolean')S.mus=true;
if(typeof S.t2!=='boolean')S.t2=false;
if(!S.stats||typeof S.stats!=='object')S.stats={};
S.stats=Object.assign({},STATS0,S.stats);
const guardar=()=>{try{localStorage.setItem('pa3',JSON.stringify(S))}catch(e){}};
const t=k=>TXT[S.lang][k]||k;
const tj=o=>o[S.lang]||o.es;

let diaAct=0, vidas=3, pausado=false, raf=0, pantallaId='titulo';
let tms=[], alLimpiar=[];
const tvez=(f,ms)=>{const i=setTimeout(f,ms);tms.push(i);return i};
const tcada=(f,ms)=>{const i=setInterval(f,ms);tms.push(i);return i};
function limpiarT(){tms.forEach(i=>{clearTimeout(i);clearInterval(i)});tms=[];
  if(raf){cancelAnimationFrame(raf);raf=0}
  alLimpiar.forEach(f=>{try{f()}catch(e){}});alLimpiar=[];}

const aplicarModo=()=>document.documentElement.classList.toggle('hd',!!S.hd);
const difActual=()=>DIFS[S.dif]||DIFS[1];
const maxVidas=()=>Math.max(1,3+(S.mejoras.includes('vida')?1:0)+difActual().vida);
const facTiempo=()=>(S.mejoras.includes('tiempo')?1.2:1)*difActual().tiempo;
const facPts=()=>S.mejoras.includes('doble')?2:1;
const facJefe=()=>difActual().jefe;
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
