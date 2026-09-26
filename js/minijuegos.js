'use strict';
/* ══════════ MINIJUEGO 1 · ESCRIBIR ══════════ */
function nvEscribir(dia){
  const dif=dia>=5?1:0;
  /* Las palabras salen sesgadas hacia las que has fallado antes, igual que las
     preguntas del quiz. Antes era un az() a secas y lo que no te salía no
     volvía nunca. */
  const nPal=cuantos(8,4);
  const idxs=RETO.elegir('palabras',PALABRAS.length,nPal,RETO.rngPara(':pal'));
  const lista=idxs.map(i=>PALABRAS[i]);
  const tickMax=Math.round((dif?52:70)*facTiempo());
  let w=0,ticks=tickMax,fallas=0,pts=0,perfecto=true;
  pantalla('nivel',`
  <div class="l1">
    <div class="tope"><span>${t('dia')} ${dia+1}</span><span id="e-prog">1/${nPal}</span></div>
    <div class="term">
      <div class="term-bar"><i style="background:#ff5468"></i><i style="background:#ffcf3f"></i><i style="background:#54c41a"></i>
        <span class="term-line" style="margin-left:6px">practicante@sena:~$</span></div>
      <div class="term-cuerpo">
        <p class="term-line">&gt; ${S.lang==='es'?'escribe el comando:':'type the command:'}</p>
        <p class="palabra" id="e-palabra"></p>
        <div class="barra"><div class="barra-fill" id="e-barra"></div></div>
      </div>
    </div>
    <input class="entrada" id="e-in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${t('escribeaqui')}">
  </div>`);
  const inp=$('#e-in'),pal=$('#e-palabra'),bar=$('#e-barra');
  function pinta(){
    const obj=lista[w],val=inp.value;
    let h='';
    for(let k=0;k<obj.length;k++){
      const ch=obj[k]===' '?'·':obj[k];
      if(k<val.length)h+='<span class="'+(val[k]===obj[k]?'ok':'mal')+'">'+ch+'</span>';
      else h+=ch;
    }
    pal.innerHTML=h;
    $('#e-prog').textContent=(w+1)+'/'+nPal;
  }
  function sigPal(gano){
    RETO.marcar('palabras',idxs[w],gano);      // antes de mover w
    if(gano){pts+=60+Math.round(ticks*2);sumaStat('palabras');SFX.ok()}
    else{fallas++;perfecto=false;SFX.mal();pal.classList.add('shake');setTimeout(()=>pal.classList.remove('shake'),250);
      if(fallas>=maxErr())return fallo(dia)}
    w++;
    if(w>=lista.length){
      if(perfecto)darLogro('veloz');
      return resultado(dia,fallas===0?3:fallas===1?2:1,pts+150);
    }
    ticks=tickMax;inp.value='';pinta();
  }
  inp.oninput=()=>{
    if(pausado){return}
    pinta();
    const obj=lista[w];
    if(inp.value===obj)sigPal(true);
    else if(!obj.startsWith(inp.value))beep(200,.03,'sawtooth',.06);
  };
  tcada(()=>{
    if(pausado)return;
    ticks--;
    bar.style.width=Math.max(0,ticks/tickMax*100)+'%';
    bar.classList.toggle('peligro',ticks<tickMax*.3);
    if(ticks<=0)sigPal(false);
  },100);
  pinta();inp.focus();
  programarInterrupcion();
}

/* ══════════ MINIJUEGO 2 · CAZA-BUGS ══════════ */
function nvBugs(dia){
  const t2=dia>=10; /* nivel 2: más rápido y con bombas falsas */
  const dif=dia>=5?1:0;
  const meta=cuantos(t2?20:dif?18:12,6), dur=Math.round((t2?30:dif?28:32)*facTiempo());
  let hits=0,escapes=0,pts=0,seg=dur,activa=-1,esCafe=false,esBomba=false,combo=0;
  pantalla('nivel',`
  <div class="l3">
    <div class="tope"><span>${t('meta')}: <b id="b-hits">0</b>/${meta} 🐛</span><span>🔥<b id="b-combo" class="combo-txt">0</b></span><span>${t('tiempo')}: <b id="b-seg">${dur}</b>s</span></div>
    <div class="barra" style="width:100%"><div class="barra-fill" id="b-barra"></div></div>
    <div class="grilla" id="b-grilla">${Array(9).fill(0).map((_,k)=>`<button class="celda" data-k="${k}" type="button" aria-label="${t('casilla')} ${k+1}"><span class="px"></span></button>`).join('')}</div>
    <p class="mini">🐛 = +pts · ☕ = bonus</p>
    <p class="mini">${t('bugs_teclas')}</p>
  </div>`);
  const celdas=$$('#b-grilla .celda');
  function apagar(){if(activa>=0){celdas[activa].classList.remove('on');activa=-1}}
  function brotar(){
    if(pausado)return;
    if(activa>=0){if(!esCafe&&!esBomba){escapes++;combo=0;$('#b-combo').textContent=combo}apagar()}
    activa=Math.floor(Math.random()*9);
    esCafe=Math.random()<.18;
    esBomba=!esCafe&&t2&&Math.random()<.25;
    celdas[activa].querySelector('.px').textContent=esBomba?'💣':esCafe?'☕':'🐛';
    celdas[activa].classList.add('on');
  }
  function golpear(c){
    if(pausado)return;
    const k=+c.dataset.k;
    if(k!==activa)return;
    /* ¡bomba! tocarla cuesta puntos y rompe la racha */
    if(esBomba){
      pts=Math.max(0,pts-80);combo=0;$('#b-combo').textContent=combo;
      SFX.mal();sacudir();apagar();return;
    }
    c.classList.add('plaf');const px=c.querySelector('.px');px.textContent='✨';
    setTimeout(()=>{c.classList.remove('plaf');},180);
    if(esCafe){pts+=80+(S.mejoras.includes('iman')?40:0);SFX.moneda()}
    else{hits++;combo++;sumaStat('bugs');pts+=40+(combo>=3?combo*5:0);SFX.pop();
      if(combo>0&&combo%5===0)SFX.moneda()}
    $('#b-hits').textContent=hits;
    $('#b-combo').textContent=combo;
    apagar();
    if(hits>=meta){
      const stars=escapes<=2?3:escapes<=5?2:1;
      return resultado(dia,stars,pts+120);
    }
  }
  celdas.forEach(c=>c.onclick=()=>golpear(c));
  /* Teclas 1-9 sobre la cuadrícula del teclado numérico: tabular entre nueve
     casillas mientras el bug se mueve cada medio segundo es imposible, así que
     el teclado necesita su propio atajo, no solo poder llegar a la casilla. */
  const kd=e=>{
    const n=Number(e.key);
    if(!Number.isInteger(n)||n<1||n>9)return;
    e.preventDefault();
    golpear(celdas[n-1]);
  };
  document.addEventListener('keydown',kd);
  alLimpiar.push(()=>document.removeEventListener('keydown',kd));
  const paso=alRitmo(t2?540:dif?650:850);
  tcada(brotar,paso);
  tcada(()=>{
    if(pausado)return;
    seg--;$('#b-seg').textContent=seg;
    $('#b-barra').style.width=(seg/dur*100)+'%';
    $('#b-barra').classList.toggle('peligro',seg<dur*.3);
    if(seg<=0)fallo(dia);
  },1000);
  programarInterrupcion();
}

/* ══════════ MINIJUEGO 3 · MEMORIA ══════════ */
function nvMemoria(dia){
  const dif=dia>=5?1:0;
  /* Cuántas parejas hay en la mesa lo decide la dificultad: 6 / 8 / 10.
     Antes eran siempre las mismas 8 de un banco de 8, así que el contenido
     no cambiaba nunca. Ahora se sortean del banco con el sesgo del repaso:
     las que se te resisten vuelven más. */
  const nPares=cuantos(8,4);
  const idxs=RETO.elegir('parejas',PAREJAS.length,nPares,RETO.rngPara(':par'));
  const valores=idxs.map(i=>PAREJAS[i]);
  const mazo=az([...valores,...valores]);
  const dur=Math.round((dif?45:60)*facTiempo());
  /* Empezar a ciegas es adivinar: los primeros giros son azar puro porque
     todavía no hay nada que recordar. Con la ojeada el minijuego pasa a ser
     de memoria de verdad, y cuánto dura es otra palanca de dificultad
     (5 s en práctica, 2 s en pesadilla, con 20 cartas). */
  const mira=ojeada();
  /* El óptimo es girar cada carta una vez. Los cortes de estrella van en
     proporción a eso y no en números fijos, que con 6 o 10 parejas dejarían
     de tener sentido. */
  const optimo=nPares*2;
  let vistaA=-1,bloq=true,pares=0,flips=0,seg=dur,pts=0,jugando=false;
  const falloDe={};   /* parejas falladas al menos una vez, para el repaso */
  pantalla('nivel',`
  <div class="l4">
    <div class="tope"><span>${t('pares')}: <b id="m-par">0</b>/${nPares}</span><span>${t('tiempo')}: <b id="m-seg">${dur}</b>s</span></div>
    <div class="barra" style="width:100%"><div class="barra-fill" id="m-barra"></div></div>
    <p class="mini memo-aviso" id="m-msg">${t('memoriza')} ${mira}</p>
    <div class="memo" id="m-memo">${mazo.map((v,k)=>`<button class="carta vista" data-k="${k}" type="button">${v}</button>`).join('')}</div>
  </div>`);
  const cartas=$$('#m-memo .carta');
  function empezar(){
    cartas.forEach(c=>{c.classList.remove('vista');c.textContent='?'});
    $('#m-msg').textContent=t('memo_ya');
    $('#m-msg').classList.remove('memo-aviso');
    bloq=false;jugando=true;
    tcada(()=>{
      if(pausado)return;
      seg--;$('#m-seg').textContent=seg;
      $('#m-barra').style.width=(seg/dur*100)+'%';
      $('#m-barra').classList.toggle('peligro',seg<dur*.3);
      if(seg<=0)fallo(dia);
    },1000);
    /* La interrupción se programa al empezar, no antes: si cayera durante la
       ojeada se comería justo los segundos para los que sirve. */
    programarInterrupcion();
  }
  let cuenta=mira;
  const ticOjeada=tcada(()=>{
    if(pausado)return;                       /* la pausa congela la ojeada */
    cuenta--;
    if(cuenta>0){$('#m-msg').textContent=t('memoriza')+' '+cuenta;return}
    clearInterval(ticOjeada);
    empezar();
  },1000);
  cartas.forEach(c=>c.onclick=()=>{
    if(pausado||bloq||!jugando)return;
    const k=+c.dataset.k;
    if(c.classList.contains('fija')||c.classList.contains('vista'))return;
    c.classList.add('vista');c.textContent=mazo[k];flips++;SFX.click();
    if(vistaA<0){vistaA=k;return}
    const a=cartas[vistaA],ka=vistaA;vistaA=-1;
    if(mazo[ka]===mazo[k]){
      a.classList.replace('vista','fija');c.classList.replace('vista','fija');
      pares++;pts+=90;SFX.ok();
      RETO.marcar('parejas',PAREJAS.indexOf(mazo[k]),!falloDe[mazo[k]]);
      $('#m-par').textContent=pares;
      if(pares>=nPares){
        if(flips<=Math.round(optimo*1.375))darLogro('cerebro');
        const stars=flips<=Math.round(optimo*1.25)?3:flips<=Math.round(optimo*1.65)?2:1;
        resultado(dia,stars,pts+Math.max(0,seg*5)+100);
      }
    }else{
      falloDe[mazo[ka]]=true;falloDe[mazo[k]]=true;
      bloq=true;SFX.mal();
      tvez(()=>{a.classList.remove('vista');c.classList.remove('vista');a.textContent='?';c.textContent='?';bloq=false},650);
    }
  });
}

/* ══════════ MINIJUEGO 4 · SIMON GIT ══════════ */
function nvSimon(dia){
  const t2=dia>=10; /* git avanzado: 6 comandos y más rondas */
  const dif=dia>=5?1:0;
  const metaRondas=cuantos(t2?8:dif?7:5,3);
  const topeErr=maxErr();
  /* El tablero se sortea en vez de ser siempre los cuatro primeros: con 12
     comandos y 4 o 6 botones, dos partidas del mismo día ya no se parecen.
     Hasta GIT AVANZADO solo entran los básicos (nv:0). Va por el sorteo con
     pesos, así que los comandos que fallas aparecen más, y con la semilla
     del día el reto diario sale igual para todo el mundo. */
  const banco=CMDS.map((c,i)=>i).filter(i=>t2||CMDS[i].nv===0);
  const permitidos=RETO.elegirDe('git',banco,t2?6:4,RETO.rngPara(':gitset'));
  const cmds=permitidos.map(i=>CMDS[i]);
  /* Índices en CMDS (no en cmds) para que el peso de GIT PUSH sea el mismo el
     día 4, con cuatro comandos, y el 14, con seis. El generador se crea UNA
     vez: rngPara() devuelve uno nuevo en cada llamada y dentro del reto
     diario eso daría siempre el mismo comando. */
  const rndGit=RETO.rngPara(':git');
  let sec=[],pos=0,errores=0,pts=0,fase='muestra';
  pantalla('nivel',`
  <div class="l3">
    <div class="tope"><span>${t('ronda')}: <b id="s-ronda">1</b>/${metaRondas}</span><span>${t('errores')}: <b id="s-err">0</b>/${topeErr}</span></div>
    <p class="mini" id="s-msg">${t('observa')}</p>
    <div class="simon muestra" id="s-simon">
      ${cmds.map(c=>`<button class="cmd ${c.cls}" data-id="${c.id}" type="button">${c.txt}</button>`).join('')}
    </div>
  </div>`);
  const cont=$('#s-simon');
  const botones={};$$('#s-simon .cmd').forEach(b=>botones[b.dataset.id]=b);
  function ilumina(id,ms=alRitmo(420)){
    const b=botones[id],c=CMDS.find(x=>x.id===id);
    b.classList.add('activo');beep(c.f,.25,'square',.14);
    tvez(()=>b.classList.remove('activo'),ms-80);
  }
  function muestra(){
    fase='muestra';cont.classList.add('muestra');
    $('#s-msg').textContent=t('observa');
    sec.push(CMDS[RETO.unoDe('git',permitidos,rndGit)].id);
    $('#s-ronda').textContent=sec.length;
    let k=0;
    const vel=t2?430:dif?470:580;
    tcada(function paso(){
      if(pausado)return;
      if(k<sec.length){ilumina(sec[k],vel);k++}
      else{
        tms.forEach(clearInterval);
        fase='jugador';pos=0;cont.classList.remove('muestra');
        $('#s-msg').textContent=t('turno');
      }
    },vel);
  }
  Object.values(botones).forEach(b=>b.onclick=()=>{
    if(pausado||fase!=='jugador')return;
    const id=b.dataset.id;
    ilumina(id,300);
    /* Se anota contra el comando que TOCABA, que es lo que se está evaluando */
    RETO.marcar('git',CMDS.findIndex(x=>x.id===sec[pos]),id===sec[pos]);
    if(id===sec[pos]){
      pos++;pts+=25;
      if(pos>=sec.length){
        if(sec.length>=metaRondas){
          if(errores===0)darLogro('gitmaster');
          const stars=errores===0?3:errores===1?2:1;
          return resultado(dia,stars,pts+200);
        }
        SFX.ok();tvez(muestra,700);
      }
    }else{
      errores++;SFX.mal();$('#s-err').textContent=errores;
      if(errores>=topeErr)return fallo(dia);
      fase='muestra';cont.classList.add('muestra');
      $('#s-msg').textContent=t('observa');
      /* repite la misma secuencia */
      tvez(()=>{
        let k=0;const vel=t2?430:dif?470:580;
        tcada(()=>{
          if(pausado)return;
          if(k<sec.length){ilumina(sec[k],vel);k++}
          else{tms.forEach(clearInterval);fase='jugador';pos=0;cont.classList.remove('muestra');$('#s-msg').textContent=t('turno')}
        },vel);
      },800);
    }
  });
  muestra();
}

/* ══════════ MINIJUEGO 5 · QUIZ ══════════ */
function nvQuiz(dia){
  const nPreg=cuantos(6,4);
  const pregs=RETO.elegir('quiz',QUIZ[S.lang].length,nPreg,RETO.rngPara(':quiz'));
  let i=0,buenas=0,malas=0,pts=0;
  pantalla('nivel',`
  <div class="quiz">
    <div class="tope" style="width:100%"><span>${t('dia')} ${dia+1}</span><span id="q-prog">1/${nPreg}</span></div>
    <div class="jurado">
      <canvas id="j1" width="48" height="48"></canvas>
      <canvas id="j2" width="48" height="48"></canvas>
      <canvas id="j3" width="48" height="48"></canvas>
    </div>
    <p class="pregunta" id="q-preg"></p>
    <div class="opciones" id="q-ops"></div>
    <p class="mini">${t('quiznec')}</p>
  </div>`);
  retratoVivo($('#j1'),CARAS.instructor());
  retratoVivo($('#j2'),CARAS.lider());
  retratoVivo($('#j3'),CARAS.compa());
  function pinta(){
    const Q=QUIZ[S.lang][pregs[i]];
    $('#q-prog').textContent=(i+1)+'/'+nPreg;
    $('#q-preg').textContent=Q.q;
    $('#q-ops').innerHTML=Q.o.map((o,k)=>`<button class="op" data-k="${k}" type="button">${String.fromCharCode(65+k)}) ${o}</button>`).join('');
    $$('#q-ops .op').forEach(b=>b.onclick=()=>{
      if(pausado)return;
      const k=+b.dataset.k;
      $$('#q-ops .op').forEach(x=>x.onclick=null);
      RETO.marcar('quiz',pregs[i],k===Q.r);
      if(k===Q.r){b.classList.add('bien');buenas++;pts+=120;SFX.ok()}
      else{
        b.classList.add('mal');malas++;SFX.mal();
        $$('#q-ops .op')[Q.r].classList.add('bien');
      }
      tvez(()=>{
        i++;
        if(i>=6){
          if(buenas>=4)resultado(dia,buenas===6?3:buenas===5?2:1,pts+100);
          else fallo(dia);
        }else pinta();
      },900);
    });
  }
  pinta();
}

/* ══════════ MINIJUEGO 6 · CODE REVIEW ══════════ */
function nvReview(dia){
  const nLin=cuantos(10,6), topeErr=maxErr();
  const idxs=RETO.elegir('review',CODIGO.length,nLin,RETO.rngPara(':rev'));
  const lista=idxs.map(i=>CODIGO[i]);
  const tickMax=Math.round(45*facTiempo());
  let i=0,ticks=tickMax,errores=0,pts=0;
  pantalla('nivel',`
  <div class="l1">
    <div class="tope"><span>${t('lineasrev')}: <b id="v-prog">1</b>/${nLin}</span><span>${t('errores')}: <b id="v-err">0</b>/${topeErr}</span></div>
    <div class="term">
      <div class="term-bar"><i style="background:#ff5468"></i><i style="background:#ffcf3f"></i><i style="background:#54c41a"></i>
        <span class="term-line" style="margin-left:6px">pull-request #${dia+1}0${Math.floor(Math.random()*9)}</span></div>
      <div class="term-cuerpo">
        <p class="code-line" id="v-code"></p>
        <div class="barra"><div class="barra-fill" id="v-barra"></div></div>
      </div>
    </div>
    <div class="rev-botones">
      <button class="btn-r" id="v-no" type="button">${t('rechazar')}</button>
      <button class="btn" id="v-si" type="button">${t('aprobar')}</button>
    </div>
  </div>`);
  const code=$('#v-code'),bar=$('#v-barra');
  function pinta(){code.textContent=lista[i].c;$('#v-prog').textContent=i+1}
  function responde(aprueba){
    if(pausado)return;
    const bien=aprueba===!!lista[i].ok;
    RETO.marcar('review',idxs[i],bien);
    if(bien){pts+=50+Math.round(ticks*1.5);SFX.pop()}
    else{
      errores++;$('#v-err').textContent=errores;SFX.mal();
      code.classList.add('shake');setTimeout(()=>code.classList.remove('shake'),250);
      if(errores>=topeErr)return fallo(dia);
    }
    i++;
    if(i>=lista.length){
      if(errores===0)darLogro('revisor');
      return resultado(dia,errores===0?3:errores===1?2:1,pts+150);
    }
    ticks=tickMax;pinta();
  }
  $('#v-si').onclick=()=>responde(true);
  $('#v-no').onclick=()=>responde(false);
  const kd=e=>{if(e.code==='ArrowRight')responde(true);if(e.code==='ArrowLeft')responde(false)};
  document.addEventListener('keydown',kd);
  alLimpiar.push(()=>document.removeEventListener('keydown',kd));
  tcada(()=>{
    if(pausado)return;
    ticks--;
    bar.style.width=Math.max(0,ticks/tickMax*100)+'%';
    bar.classList.toggle('peligro',ticks<tickMax*.3);
    /* tiempo agotado cuenta como respuesta equivocada */
    if(ticks<=0)responde(!lista[i].ok);
  },100);
  pinta();
  programarInterrupcion();
}

/* ══════════ MINIJUEGO 7 · MERGE CONFLICT ══════════ */
function nvMerge(dia){
  const nRon=cuantos(6,4), topeErr=maxErr();
  const idxs=RETO.elegir('merge',CONFLICTOS.length,nRon,RETO.rngPara(':merge'));
  const rondas=idxs.map(i=>CONFLICTOS[i]);
  const dur=Math.round(60*facTiempo());
  let i=0,errores=0,pts=0,seg=dur,bloq=false;
  pantalla('nivel',`
  <div class="l1">
    <div class="tope"><span>${t('ronda')}: <b id="g-prog">1</b>/${nRon}</span><span>${t('tiempo')}: <b id="g-seg">${dur}</b>s</span></div>
    <div class="barra"><div class="barra-fill" id="g-barra"></div></div>
    <p class="mini">${t('eligebuena')}</p>
    <div class="term">
      <div class="term-bar"><i style="background:#ff5468"></i><i style="background:#ffcf3f"></i><i style="background:#54c41a"></i>
        <span class="term-line" style="margin-left:6px">app.js — merge</span></div>
      <div class="term-cuerpo">
        <p class="conflicto-marca">&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD</p>
        <button class="op" id="g-a" type="button"></button>
        <p class="conflicto-marca">=======</p>
        <button class="op" id="g-b" type="button"></button>
        <p class="conflicto-marca">&gt;&gt;&gt;&gt;&gt;&gt;&gt; feature/practicante</p>
      </div>
    </div>
  </div>`);
  const A=$('#g-a'),B=$('#g-b');
  let buenaEs='a';
  function pinta(){
    const [buena,mala]=rondas[i];
    buenaEs=Math.random()<.5?'a':'b';
    A.textContent=buenaEs==='a'?buena:mala;
    B.textContent=buenaEs==='b'?buena:mala;
    A.className='op';B.className='op';
    $('#g-prog').textContent=i+1;
    bloq=false;
  }
  function elige(cual){
    if(pausado||bloq)return;
    bloq=true;
    const el=cual==='a'?A:B, otro=cual==='a'?B:A;
    RETO.marcar('merge',idxs[i],cual===buenaEs);
    if(cual===buenaEs){
      el.classList.add('bien');pts+=100;SFX.ok();
    }else{
      el.classList.add('mal');otro.classList.add('bien');
      errores++;SFX.mal();
      if(errores>=topeErr)return tvez(()=>fallo(dia),600);
    }
    tvez(()=>{
      i++;
      if(i>=rondas.length){
        if(errores===0)darLogro('resolutor');
        return resultado(dia,errores===0?3:errores===1?2:1,pts+seg*4+100);
      }
      pinta();
    },700);
  }
  A.onclick=()=>elige('a');
  B.onclick=()=>elige('b');
  tcada(()=>{
    if(pausado)return;
    seg--;$('#g-seg').textContent=seg;
    $('#g-barra').style.width=(seg/dur*100)+'%';
    $('#g-barra').classList.toggle('peligro',seg<dur*.3);
    if(seg<=0)fallo(dia);
  },1000);
  pinta();
  programarInterrupcion();
}

/* ══════════ MINIJUEGO 8 · RUNNER FINAL ══════════ */
function nvRunner(dia){
  const durF=Math.round(40*60*facTiempo());
  const topeGol=maxErr();
  pantalla('nivel',`
  <div class="cv-wrap">
    <div class="tope" style="width:100%">
      <span>${t('golpes')}: <b id="r-gol">0</b>/${topeGol}</span>
      <span>☕ <b id="r-caf">0</b></span>
      <span>${t('tiempo')}: <b id="r-seg">40</b>s</span>
    </div>
    <canvas class="juego" id="r-cv" width="320" height="180"></canvas>
    <p class="cv-msg">${t('runmsg')}</p>
    <div class="fila-cv">
      <div class="dpad">
        <button class="dp dp-arriba" id="r-up" type="button">▲</button>
        <button class="dp dp-abajo" id="r-dn" type="button">▼</button>
      </div>
    </div>
  </div>`);
  const cv=$('#r-cv'),c=cv.getContext('2d');
  const HD=!!S.hd;
  /* El lienzo se dibuja SIEMPRE en el espacio lógico de 320×180: el búfer se
     agranda según la densidad real de la pantalla y el transform lo compensa,
     así que ninguna coordenada del juego cambia. Antes esto era todo o nada
     (solo con el modo HD), y sin HD el navegador estiraba un búfer de 320 px
     en un móvil de alta densidad: borroso. El modo HD sigue sumando nitidez
     encima, ahora como multiplicador. */
  const dpr=densidad()*(HD?1.5:1);
  cv.width=Math.round(320*dpr); cv.height=Math.round(180*dpr);
  c.setTransform(dpr,0,0,dpr,0,0);
  const SUELO=140;
  const p={x:44,y:SUELO,vy:0,duck:0};
  const noche=dia>=10; /* deploy nocturno: más rápido y a oscuras */
  let obs=[],frame=0,golpes=0,cafes=0,pts=0,spawn=0,inv=0,prevA=false,prevAbajo=false,combo=0;
  let escudo=S.mejoras.includes('escudo')?1:0;
  function comboFly(n,txt){
    const w=$('.cv-wrap');if(!w)return;
    const el=document.createElement('span');
    el.className='combo-fly';el.textContent=txt||('🔥 '+t('combo')+' x'+n);
    w.appendChild(el);setTimeout(()=>{el.remove()},700);
  }
  function salta(){if(p.y>=SUELO&&!pausado){p.vy=-8.2;beep(500,.07,'triangle',.1)}}
  function agacha(v){p.duck=v?26:0}
  $('#r-up').onpointerdown=e=>{e.preventDefault();salta()};
  $('#r-dn').onpointerdown=e=>{e.preventDefault();agacha(1)};
  $('#r-dn').onpointerup=()=>agacha(0);
  $('#r-dn').onpointerleave=()=>agacha(0);
  cv.onpointerdown=e=>{e.preventDefault();salta()};
  const kd=e=>{if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();salta()}if(e.code==='ArrowDown'){e.preventDefault();agacha(1)}};
  const ku=e=>{if(e.code==='ArrowDown')agacha(0)};
  document.addEventListener('keydown',kd);document.addEventListener('keyup',ku);
  alLimpiar.push(()=>{document.removeEventListener('keydown',kd);document.removeEventListener('keyup',ku)});
  function loop(){
    raf=requestAnimationFrame(loop);
    if(!$('#r-cv')){cancelAnimationFrame(raf);raf=0;return}
    if(pausado)return;
    frame++;
    /* mando: A o cruceta-arriba salta, cruceta-abajo agacha */
    const mnd=leerMando();
    if(mnd){
      const saltoPad=mnd.a||mnd.arriba;
      if(saltoPad&&!prevA)salta();
      prevA=saltoPad;
      if(mnd.abajo!==prevAbajo){agacha(mnd.abajo);prevAbajo=mnd.abajo}
    }
    const vel=2.4+frame/900+(noche?0.7:0);
    /* física */
    p.vy+=0.42;p.y+=p.vy;
    if(p.y>SUELO){p.y=SUELO;p.vy=0}
    if(inv>0)inv--;
    /* spawns */
    if(--spawn<=0){
      spawn=alRitmo(Math.max(38,90-frame/40)+Math.random()*40);
      const r=Math.random();
      obs.push({x:340,tipo:r<.5?'bug':r<.75?'papel':'cafe'});
    }
    obs.forEach(o=>o.x-=vel);
    obs=obs.filter(o=>o.x>-24);
    /* colisiones */
    const py=p.y-30+p.duck, ph=30-p.duck;
    obs.forEach(o=>{
      const oy=o.tipo==='papel'?SUELO-34:SUELO-14;
      const oh=o.tipo==='papel'?14:14;
      if(o.x<p.x+14&&o.x+16>p.x&&oy<py+ph&&oy+oh>py){
        if(o.tipo==='cafe'){
          cafes++;combo++;sumaStat('cafes');mejorStat('racha',combo);
          pts+=60+(S.mejoras.includes('iman')?40:0)+(combo>=3?combo*15:0);SFX.moneda();
          $('#r-caf').textContent=cafes;o.x=-99;
          if(combo>=3)comboFly(combo);
          if(combo>=5)darLogro('combo');
        }
        else if(inv<=0){
          o.x=-99;
          /* escudo dev: absorbe el primer golpe del nivel */
          if(escudo>0){escudo--;inv=70;SFX.pop();comboFly(0,'🛡');return}
          golpes++;combo=0;inv=60;SFX.mal();sacudir();$('#r-gol').textContent=golpes;
          if(golpes>=topeGol){limpiarRun();return fallo(dia)}}
      }
    });
    /* fin */
    const segRest=Math.max(0,Math.ceil((durF-frame)/60));
    $('#r-seg').textContent=segRest;
    if(frame>=durF){
      limpiarRun();
      const stars=golpes===0?3:golpes===1?2:1;
      /* día final: sobrevivir la oficina era solo la primera fase... */
      if(dia===9)return rCutscene(JEFE_INTRO,()=>nvJefe(dia,pts+400+cafes*20));
      /* deploy nocturno: el BUG FINAL vuelve por venganza */
      if(dia===14)return rCutscene(JEFE2_INTRO,()=>nvJefe(dia,pts+400+cafes*20));
      return resultado(dia,stars,pts+400+cafes*20);
    }
    /* dibujo (paleta nocturna en la etapa productiva) */
    if(HD){
      const g=c.createLinearGradient(0,0,0,180);
      if(noche){g.addColorStop(0,'#0d0620');g.addColorStop(.7,'#050310');g.addColorStop(1,'#020108')}
      else{g.addColorStop(0,'#131c3a');g.addColorStop(.7,'#070a16');g.addColorStop(1,'#03040a')}
      c.fillStyle=g;
    }else c.fillStyle=noche?'#070312':'#0b0e22';
    c.fillRect(0,0,320,180);
    if(noche){ /* estrellas + luna */
      c.fillStyle='#e8e4ff';
      for(let k=0;k<14;k++)c.fillRect((k*53+((k*k)%29))%320,(k*29)%70+6,1,1);
      c.fillStyle='#f4f0d8';c.beginPath();c.arc(276,26,10,0,7);c.fill();
      c.fillStyle=noche&&!HD?'#070312':'#0d0620';c.beginPath();c.arc(280,23,8,0,7);c.fill();
    }
    c.fillStyle=noche?'rgba(120,80,200,.15)':(HD?'rgba(90,110,200,.14)':'#141a38');
    for(let k=0;k<5;k++){const bx=(320-((frame*.5+k*90)%400));c.fillRect(bx,40+k*8%30,34,60)}
    if(HD){c.shadowColor=noche?'#a86bff':'#39a900';c.shadowBlur=10}
    c.fillStyle=noche?'#7a3bd0':'#39a900';c.fillRect(0,SUELO+2,320,3);
    c.shadowBlur=0;
    c.fillStyle=noche?'#0a0518':(HD?'#0a0d1c':'#11152a');c.fillRect(0,SUELO+5,320,40);
    /* jugador · antes era un bloque quieto que solo subía y bajaba. Ahora
       corre con el paso clásico de dos cuadros, que cambia cada 8 fotogramas:
       piernas abiertas (la de atrás apenas levantada) y piernas juntas con
       el cuerpo 1 px arriba, estiradas para que el pie siga en el suelo. En el
       aire las recoge, y agachado va en cuclillas sobre el suelo: antes se
       bajaba el bloque entero 26 px y medio cuerpo quedaba hundido bajo la
       línea del piso. Es solo dibujo: la caja de choque sigue siendo la de
       p.x/p.y. Las zapatillas van claras porque sobre el fondo oscuro el
       pantalón no se distingue, y lo que se ve correr es el ir y venir de los
       pies. */
    if(inv%12<8){
      const enSuelo=p.y>=SUELO,agachado=p.duck>0,paso=(frame>>3)&1;
      const fy=agachado?p.y-20:p.y-30-(enSuelo&&paso?1:0);
      c.fillStyle=CAMISAS[S.camisa];
      if(agachado){
        c.fillRect(p.x,fy+12,14,6);
        c.fillStyle='#d8dce8';c.fillRect(p.x,fy+18,4,2);c.fillRect(p.x+10,fy+18,4,2);
      }else{
        c.fillRect(p.x,fy+12,14,11);
        /* pierna de `alto` px desde la cadera: pantalón y 2 px de zapatilla */
        const pierna=(dx,alto)=>{
          c.fillStyle=noche?'#3a2f6a':'#2e3563';c.fillRect(p.x+dx,fy+23,4,alto-2);
          c.fillStyle='#d8dce8';c.fillRect(p.x+dx,fy+21+alto,4,2);
        };
        if(!enSuelo){pierna(3,5);pierna(7,5)}
        else if(paso){pierna(3,8);pierna(7,8)}
        else{pierna(0,6);pierna(10,7)}
      }
      c.fillStyle=SKINS[S.skin];c.fillRect(p.x+1,fy,12,12);
      c.fillStyle='#101018';c.fillRect(p.x+8,fy+4,2,2);
    }
    /* obstáculos */
    c.font='16px serif';c.textBaseline='top';
    obs.forEach(o=>{
      const oy=o.tipo==='papel'?SUELO-36:SUELO-16;
      c.fillText(o.tipo==='bug'?'🐛':o.tipo==='papel'?'📄':'☕',o.x,oy);
    });
    c.fillStyle='#54c41a';c.font='8px monospace';
  }
  function limpiarRun(){if(raf){cancelAnimationFrame(raf);raf=0}}
  loop();
  programarInterrupcion();
}

/* ══════════ MINIJUEGO 9 · CONSULTA SQL (etapa productiva) ══════════ */
/* Motor de "piezas en orden": se comparte entre la consulta SQL y ORDENA EL
   ALGORITMO. Son los mismos mandos —tocar las piezas en el orden correcto—
   y lo único que cambia es el banco y el rótulo del terminal, así que
   duplicar cincuenta líneas para el segundo no tenía sentido. */
function juegoOrden(dia,cfg){
  const nRon=cuantos(cfg.rondas,3), topeErr=maxErr();
  const idxs=RETO.elegir(cfg.pool,cfg.banco.length,nRon,RETO.rngPara(':'+cfg.pool));
  const tandas=idxs.map(i=>cfg.banco[i]);
  /* SQL guarda arreglos sueltos; los pasos van traducidos, así que vienen en
     {es:[...],en:[...]} y hay que sacar el idioma activo. */
  const piezasDe=x=>Array.isArray(x)?x:tj(x);
  const rotuloDe=x=>Array.isArray(x)?cfg.cab:(S.lang==='en'?x.ten:x.tes);
  const dur=Math.round(cfg.seg*facTiempo());
  let ronda=0,pos=0,errores=0,pts=0,seg=dur,orden=[],falloAqui=false;
  pantalla('nivel',`
  <div class="l1">
    <div class="tope"><span>${t('ronda')}: <b id="sq-ron">1</b>/${nRon}</span><span>${t('errores')}: <b id="sq-err">0</b>/${topeErr}</span><span>${t('tiempo')}: <b id="sq-seg">${dur}</b>s</span></div>
    <div class="barra" style="width:100%"><div class="barra-fill" id="sq-barra"></div></div>
    <div class="term">
      <div class="term-bar"><i style="background:#ff5468"></i><i style="background:#ffcf3f"></i><i style="background:#54c41a"></i>
        <span class="term-line" style="margin-left:6px" id="sq-cab">${esc(cfg.cab)}</span></div>
      <div class="term-cuerpo"><p class="sql-armada" id="sq-armada">&nbsp;</p></div>
    </div>
    <p class="mini">${cfg.pista}</p>
    <div class="sql-piezas" id="sq-piezas"></div>
  </div>`);
  function nuevaRonda(){orden=az(piezasDe(tandas[ronda]).map((_,i)=>i));pos=0;falloAqui=false;pinta()}
  function pinta(){
    const q=piezasDe(tandas[ronda]);
    $('#sq-ron').textContent=ronda+1;
    $('#sq-cab').textContent=rotuloDe(tandas[ronda]);
    $('#sq-armada').innerHTML=q.slice(0,pos).map(x=>'<span class="sql-ok">'+esc(x)+'</span>').join(' ')+(pos<q.length?' <span class="blink">▌</span>':'');
    $('#sq-piezas').innerHTML=orden.map(i=>`<button class="sql-pieza${i<pos?' usada':''}" data-i="${i}" type="button" ${i<pos?'disabled':''}>${esc(q[i])}</button>`).join('');
    $$('#sq-piezas .sql-pieza:not(.usada)').forEach(b=>b.onclick=()=>{
      if(pausado)return;
      if(+b.dataset.i===pos){
        pos++;pts+=40;SFX.pop();
        if(pos>=q.length){
          RETO.marcar(cfg.pool,idxs[ronda],!falloAqui);
          pts+=80;SFX.ok();ronda++;
          if(ronda>=tandas.length){
            if(errores===0&&cfg.logro)darLogro(cfg.logro);
            const stars=errores===0?3:errores<=1?2:1;
            return resultado(dia,stars,pts+150);
          }
          return nuevaRonda();
        }
        pinta();
      }else{
        errores++;falloAqui=true;SFX.mal();$('#sq-err').textContent=errores;
        b.classList.add('shake');setTimeout(()=>b.classList.remove('shake'),260);
        if(errores>=topeErr)return fallo(dia);
      }
    });
  }
  tcada(()=>{
    if(pausado)return;
    seg--;$('#sq-seg').textContent=seg;
    $('#sq-barra').style.width=(seg/dur*100)+'%';
    $('#sq-barra').classList.toggle('peligro',seg<dur*.3);
    if(seg<=0)fallo(dia);
  },1000);
  nuevaRonda();
  programarInterrupcion();
}

function nvSQL(dia){
  return juegoOrden(dia,{pool:'sql',banco:SQLS,cab:'mysql> practicante',
    pista:t('sqlmsg'),logro:'sql',rondas:5,seg:75});
}

/* ══════════ MINIJUEGO 11 · ORDENA EL ALGORITMO ══════════ */
function nvOrden(dia){
  return juegoOrden(dia,{pool:'orden',banco:PASOS,cab:'algoritmo',
    pista:t('ordenmsg'),logro:null,rondas:5,seg:80});
}

/* ══════════ MINIJUEGO 10 · CAZA PATRONES · REGEX (etapa productiva) ══════════ */
function nvRegex(dia){
  const nRon=cuantos(5,3), topeErr=maxErr();
  const idxs=RETO.elegir('regex',REGEXS.length,nRon,RETO.rngPara(':regex'));
  const rondas=idxs.map(i=>REGEXS[i]);
  const dur=Math.round(70*facTiempo());
  let r=0,errores=0,pts=0,seg=dur,quedan=0,falloAqui=false;
  pantalla('nivel',`
  <div class="l3">
    <div class="tope"><span>${t('ronda')}: <b id="rx-ron">1</b>/${nRon}</span><span>${t('errores')}: <b id="rx-err">0</b>/${topeErr}</span><span>${t('tiempo')}: <b id="rx-seg">${dur}</b>s</span></div>
    <div class="barra" style="width:100%"><div class="barra-fill" id="rx-barra"></div></div>
    <div class="rx-patron"><span class="rx-re" id="rx-re"></span><span class="rx-desc" id="rx-desc"></span></div>
    <p class="mini">${t('regexmsg')}</p>
    <div class="rx-grid" id="rx-grid"></div>
  </div>`);
  function finRonda(){
    RETO.marcar('regex',idxs[r],!falloAqui);
    pts+=60;SFX.ok();r++;
    if(r>=rondas.length){
      if(errores===0)darLogro('regex');
      const stars=errores===0?3:errores<=1?2:1;
      return resultado(dia,stars,pts+150);
    }
    /* congela la ronda resuelta para que ningún clic cuente mientras entra la siguiente */
    $$('#rx-grid .rx-op').forEach(x=>x.disabled=true);
    tvez(pinta,450);
  }
  function pinta(){
    falloAqui=false;
    const R=rondas[r],re=new RegExp(R.p);
    $('#rx-ron').textContent=r+1;
    $('#rx-re').textContent='/'+R.p+'/';
    $('#rx-desc').textContent=S.lang==='es'?R.des:R.den;
    const ops=az(R.opts);
    quedan=ops.filter(o=>re.test(o)).length;
    $('#rx-grid').innerHTML=ops.map(o=>`<button class="op rx-op" data-t="${o}" type="button">${o}</button>`).join('');
    /* salvaguarda: una ronda sin coincidencias dejaría el nivel imposible de superar */
    if(quedan===0)return finRonda();
    $$('#rx-grid .rx-op').forEach(b=>b.onclick=()=>{
      if(pausado||b.disabled)return;
      if(re.test(b.dataset.t)){
        b.disabled=true;b.classList.add('bien');pts+=60;SFX.pop();quedan--;
        if(quedan<=0)return finRonda();
      }else{
        errores++;falloAqui=true;SFX.mal();b.classList.add('mal');
        tvez(()=>b.classList.remove('mal'),350);
        $('#rx-err').textContent=errores;
        if(errores>=topeErr)return fallo(dia);
      }
    });
  }
  tcada(()=>{
    if(pausado)return;
    seg--;$('#rx-seg').textContent=seg;
    $('#rx-barra').style.width=(seg/dur*100)+'%';
    $('#rx-barra').classList.toggle('peligro',seg<dur*.3);
    if(seg<=0)fallo(dia);
  },1000);
  pinta();
  programarInterrupcion();
}

/* ══════════ MINIJUEGO 12 · TERMINAL ══════════
   Se describe la tarea y hay que escribir el comando. Es el que más enseña
   de todos: no hay opciones donde adivinar, o te sabes el comando o no. Por
   eso al fallar SIEMPRE se muestra cuál era —fallar sin enterarte de la
   respuesta no enseña nada— y en PRÁCTICA aparece una pista a mitad de
   tiempo con la primera palabra. */
function nvTerminal(dia){
  const nTar=cuantos(6,4), topeErr=maxErr();
  const idxs=RETO.elegir('terminal',TERMINALES.length,nTar,RETO.rngPara(':term'));
  const lista=idxs.map(i=>TERMINALES[i]);
  const tickMax=Math.round(120*facTiempo());   /* décimas de segundo */
  const hayPista=difActual().pista;
  let w=0,ticks=tickMax,errores=0,pts=0,bloq=false;
  const limpia=x=>String(x).toLowerCase().trim().replace(/\s+/g,' ');
  pantalla('nivel',`
  <div class="l1">
    <div class="tope"><span>${t('tarea')}: <b id="tm-prog">1</b>/${nTar}</span><span>${t('errores')}: <b id="tm-err">0</b>/${topeErr}</span></div>
    <div class="term">
      <div class="term-bar"><i style="background:#ff5468"></i><i style="background:#ffcf3f"></i><i style="background:#54c41a"></i>
        <span class="term-line" style="margin-left:6px">practicante@sena:~$</span></div>
      <div class="term-cuerpo">
        <p class="term-line">&gt; ${t('term_tarea')}</p>
        <p class="tm-tarea" id="tm-tarea"></p>
        <p class="mini tm-pista" id="tm-pista">&nbsp;</p>
        <div class="barra"><div class="barra-fill" id="tm-barra"></div></div>
      </div>
    </div>
    <input class="entrada" id="tm-in" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="${t('escribeaqui')}">
    <button class="btn" id="tm-ok" type="button">${t('term_enviar')}</button>
  </div>`);
  const inp=$('#tm-in');
  function pinta(){
    $('#tm-prog').textContent=w+1;
    $('#tm-tarea').textContent=tj(lista[w]);
    $('#tm-pista').innerHTML='&nbsp;';
  }
  function pista(){
    const p=lista[w].cmd.split(' ');
    /* la primera palabra entera y el resto en puntos: orienta sin regalarlo */
    $('#tm-pista').textContent='💡 '+p[0]+p.slice(1).map(x=>' '+'·'.repeat(x.length)).join('');
  }
  function siguiente(espera){
    bloq=true;
    tvez(()=>{
      w++;
      if(w>=lista.length){
        const stars=errores===0?3:errores<=1?2:1;
        return resultado(dia,stars,pts+150);
      }
      ticks=tickMax;inp.value='';bloq=false;pinta();inp.focus();
    },espera);
  }
  function responder(texto){
    if(pausado||bloq)return;
    const T=lista[w];
    const ok=limpia(texto)===limpia(T.cmd);
    RETO.marcar('terminal',idxs[w],ok);
    if(ok){
      pts+=70+Math.round(ticks*1.2);sumaStat('palabras');SFX.ok();
      $('#tm-pista').textContent='✔ '+T.cmd;
      return siguiente(420);
    }
    errores++;SFX.mal();$('#tm-err').textContent=errores;
    $('#tm-tarea').classList.add('shake');
    setTimeout(()=>$('#tm-tarea').classList.remove('shake'),260);
    $('#tm-pista').textContent='✖ '+t('term_era')+' '+T.cmd;
    if(errores>=topeErr){bloq=true;return tvez(()=>fallo(dia),1200)}
    siguiente(1200);
  }
  $('#tm-ok').onclick=()=>responder(inp.value);
  inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();responder(inp.value)}};
  tcada(()=>{
    if(pausado||bloq)return;
    ticks--;
    $('#tm-barra').style.width=Math.max(0,ticks/tickMax*100)+'%';
    $('#tm-barra').classList.toggle('peligro',ticks<tickMax*.3);
    if(hayPista&&ticks===Math.round(tickMax*.5))pista();
    if(ticks<=0)responder('');
  },100);
  pinta();inp.focus();
  programarInterrupcion();
}
