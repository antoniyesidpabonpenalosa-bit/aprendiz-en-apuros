'use strict';
/* Presentación independiente del guion. Las escenas actuales se adaptan sin
   cambiar sus frases; un guion futuro puede incluir quien, gesto y fondo. */
const CINE=(()=>{
  const fondos=['formacion','empresa','servidor','neutro'];
  const esEn=(es,en)=>S.lang==='en'?en:es;
  const fondoSeguro=f=>fondos.includes(f)?f:'neutro';
  const pagina=(p,base={})=>({
    texto:String(p.t??''), quien:String(p.quien??''),
    gesto:typeof p.gesto==='string'&&GESTOS.includes(p.gesto)?p.gesto:'normal',
    fondo:fondoSeguro(p.fondo??base.fondo), ico:String(p.ico??''),
    animar:p.animar??base.animar??false
  });
  /* Un día admite el par histórico [quien,texto] o un array de páginas.
     No se cambia DIALOGOS: el adaptador es compatible con ambos formatos. */
  const dia=(entrada,i)=>{
    const base={fondo:i<10?'formacion':'empresa',animar:true};
    const paginas=typeof entrada[0]==='string'?[{quien:entrada[0],t:entrada[1],gesto:GESTO_DIA[i]}]:entrada;
    return paginas.map(p=>pagina(p,base));
  };
  const contexto=guion=>{
    if(guion===INTRO||guion===FINAL)return 'formacion';
    if(guion===T2_INTRO||guion===FINAL2)return 'empresa';
    if(guion===JEFE_INTRO||guion===JEFE2_INTRO)return 'servidor';
    return 'neutro';
  };
  const color=quien=>({instructor:'cian',companera:'rosa',lider:'violeta',vigilante:'oro'}[idDe(quien)]||'oro');
  const etiqueta=f=>({formacion:esEn('CENTRO DE FORMACIÓN','TRAINING CENTRE'),empresa:'TECHNOVA',servidor:esEn('SERVIDOR','SERVER'),neutro:esEn('HISTORIA','STORY')}[fondoSeguro(f)]);
  function escena(p,opts){
    const conCara=!!p.quien, jefe=p.fondo==='servidor'&&p.ico==='👾', esCut=opts.tipo==='cut', id=esCut?'cut-linea':'d-linea';
    return `<section class="cine ${esCut?'cut':''} cine-${color(p.quien)}" ${esCut?'id="cut-zona" tabindex="0" aria-label="'+esc(t('toca'))+'"':''}>
      <div class="cine-top"><span class="cine-etapa">${esc(etiqueta(p.fondo))}</span><span class="cut-prog">${esc(opts.contador)}</span></div>
      <div class="cine-escena cine-fondo-${p.fondo}" aria-hidden="true">
        <div class="cine-vineta"></div><span class="cine-esquina izq"></span><span class="cine-esquina der"></span>
        ${conCara?`<div class="retrato-wrap cine-retrato"><canvas class="retrato" id="${esCut?'cut-cara':'d-cara'}" width="64" height="64"></canvas></div>`:`<div class="cine-simbolo ${jefe?'cine-simbolo-jefe':''}"><span class="cine-icono-respaldo">${pxiSvg(p.ico)?pxi(p.ico):esc(p.ico)}</span>${jefe?'<img class="cine-jefe" src="img/jefe/jefe-fase-1.png" alt="">':''}</div>`}
      </div>
      <div class="cine-panel">
        <div class="cine-cabecera"><p class="hablante cine-nombre">${esc(p.quien||esEn('NARRADOR','NARRATOR'))}</p><span class="cine-marca" aria-hidden="true">◆</span></div>
        ${opts.titulo?`<h2 class="cine-titulo">${opts.titulo}</h2>`:''}
        <p class="linea cine-linea" id="${id}" ${p.animar?'aria-hidden="true"':''}>${p.animar?'':esc(p.texto)}</p>
        ${p.animar?`<p class="cine-sr">${esc(p.texto)}</p>`:''}
        ${opts.sub?`<p class="cine-sub">${esc(opts.sub)}</p>`:''}
        <div class="cine-pie">${opts.progreso?`<div class="cine-puntos" aria-hidden="true">${Array.from({length:opts.progreso.total},(_,n)=>`<i class="${n===opts.progreso.i?'actual':n<opts.progreso.i?'hecho':''}"></i>`).join('')}</div>`:'<span></span>'}
          <div class="cine-acciones">${esCut?`<button class="cut-skip" id="cut-skip" type="button">${esc(t('saltar'))}</button><button class="btn cine-avanzar" id="cut-next" type="button">${esc(t('continuar'))} ▶</button>`:`<button class="cut-skip" id="d-revelar" type="button" ${p.animar?'':'hidden'}>${esc(esEn('Mostrar texto','Show text'))}</button><button class="btn cine-avanzar" id="d-go" type="button">${esc(t(opts.ultimo===false?'continuar':'empezar'))} ▶</button>`}</div>
        </div>
      </div>
    </section>`;
  }
  function montar(p,tipo){
    const jefe=$('.cine-jefe');
    if(jefe){const respaldo=()=>jefe.remove();jefe.onerror=respaldo;if(jefe.complete&&!jefe.naturalWidth)respaldo();}
    const cv=$('#'+(tipo==='cut'?'cut-cara':'d-cara'));
    if(cv){
      const o=quienCara(p.quien);
      if(o.protagonista){cv.width=cv.height=96;cv.classList.add('cine-protagonista');}
      retratoVivo(cv,o.protagonista?Object.assign({},o,{cine:true,gesto:p.gesto}):o);
      retratoDibujo(cv,p.quien,p.gesto);
    }
    const el=$('#'+(tipo==='cut'?'cut-linea':'d-linea')), revelar=$('#d-revelar');
    if(!p.animar||!el)return;
    const letras=Array.from(p.texto);let j=0,reloj=0;
    const terminar=()=>{clearInterval(reloj);el.textContent=p.texto;if(revelar)revelar.hidden=true;};
    if(revelar)revelar.onclick=()=>{if(!pausado)terminar()};
    if(quieto()){terminar();return;}
    reloj=tcada(()=>{if(pausado||document.hidden)return;if(!el.isConnected){clearInterval(reloj);return;}
      el.textContent=letras.slice(0,++j).join('');if(tipo==='dia'&&j%3===0)beep(700+Math.random()*200,.02,'triangle',.05);if(j>=letras.length)terminar();
    },20);
  }
  return {pagina,dia,contexto,escena,montar,color};
})();
