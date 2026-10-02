'use strict';
/* Minijuegos 9-12: SQL, ordena, regex y terminal (ver la lista en minijuegos.js). */
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
        /* La opción equivocada se queda en rojo y desactivada, igual que las
           buenas se quedan en verde. Antes el rojo se iba a los 350 ms y el
           botón seguía activo: un doble toque sobre la MISMA opción contaba dos
           errores, y en PESADILLA, con tope de 2, una sola decisión mala tocada
           dos veces sacaba del nivel. */
        b.disabled=true;
        errores++;falloAqui=true;SFX.mal();b.classList.add('mal');
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
    /* El elemento se guarda ANTES del temporizador: volver a buscarlo 260 ms
       después fallaba si en ese rato se salía del nivel (pausa → salir), porque
       #tm-tarea ya no existía. Quitarle la clase a un nodo suelto no hace daño. */
    const tarea=$('#tm-tarea');
    tarea.classList.add('shake');
    setTimeout(()=>tarea.classList.remove('shake'),260);
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
