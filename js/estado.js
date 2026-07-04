'use strict';
/* ── ESTADO ── */
const DEF={pts:0,xp:0,dias:Array(10).fill(-1),logros:[],accs:[],acc:'',skin:0,camisa:0,
  mejoras:[],records:[],lang:'es',snd:true,intro:false,nombre:'',hd:false};
let S;
try{S=Object.assign({},DEF,JSON.parse(localStorage.getItem('pa3')||'{}'))}catch(e){S=Object.assign({},DEF)}
if(!Array.isArray(S.dias)||S.dias.length!==10)S.dias=Array(10).fill(-1);
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
const maxVidas=()=>3+(S.mejoras.includes('vida')?1:0);
const facTiempo=()=>S.mejoras.includes('tiempo')?1.2:1;
const facPts=()=>S.mejoras.includes('doble')?2:1;
const progreso=()=>{let p=0;while(p<10&&S.dias[p]>=1)p++;return p};
const totalStars=()=>S.dias.reduce((a,b)=>a+Math.max(0,b),0);
const rangoDe=xp=>{let r=RANGOS[0];for(const x of RANGOS)if(xp>=x.xp)r=x;return r};
const rangoNom=()=>tj(rangoDe(S.xp));
