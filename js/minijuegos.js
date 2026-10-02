'use strict';
/* Los 12 minijuegos se reparten en cuatro archivos por afinidad; todos cuelgan
   de los mismos ayudantes globales (pantalla, resultado, fallo, RETO, facTiempo…)
   y se cargan en este orden desde index.html:
     minijuegos.js           · 1-5 · escribir, caza-bugs, memoria, simon git, quiz
     minijuegos-codigo.js    · 6-7 · code review y conflicto de merge
     minijuegos-runner.js    · 8   · el runner (y su paso al jefe en la campaña)
     minijuegos-avanzados.js · 9-12 · SQL, ordena, regex y terminal */
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
    if(esCafe){pts+=80+(mejora('iman')?40:0);SFX.moneda()}
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
    /* El autorrepetido del teclado manda keydown cada ~30 ms mientras la tecla
       siga abajo: dejando el "5" pulsado se golpeaba solo cada bug que saliera
       en esa casilla, y el minijuego dejaba de ser de reflejos. */
    if(e.repeat)return;
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
  /* Cuántas preguntas se juegan DE VERDAD. No es un 6 fijo: cuantos() lo mueve
     con la dificultad (5 en PRÁCTICA, 6 en NORMAL, 8 en PESADILLA) y el banco
     podría dar menos de las pedidas, así que manda pregs.length y de ahí sale
     todo lo demás: el contador, el corte y las estrellas.

     Antes el bucle cortaba en 6 a secas. En PRÁCTICA solo se sorteaban 5, así
     que tras la quinta pedía una sexta que no existía y el cuestionario se
     quedaba clavado sin avanzar; en PESADILLA se sorteaban 8 y solo se hacían
     6. Es el único minijuego que puntúa contra un total en vez de por errores,
     que es por lo que solo le pasaba a este. */
  const pregs=RETO.elegir('quiz',QUIZ[S.lang].length,cuantos(6,4),RETO.rngPara(':quiz'));
  const nPreg=pregs.length;
  /* Aprobar sigue siendo dos tercios, como los "4 de 6" de siempre:
     4 de 5, 4 de 6, 6 de 8. */
  const necesarias=Math.max(2,Math.ceil(nPreg*2/3));
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
    <p class="mini">${t('quiznec').replace('{a}',necesarias).replace('{t}',nPreg)}</p>
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
        if(i>=nPreg){
          if(buenas>=necesarias)resultado(dia,buenas===nPreg?3:buenas>=nPreg-1?2:1,pts+100);
          else fallo(dia);
        }else pinta();
      },900);
    });
  }
  pinta();
}
