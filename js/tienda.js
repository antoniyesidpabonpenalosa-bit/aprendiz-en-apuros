'use strict';
/* Tienda y personalizar el avatar (ver la lista en menus.js). */
/* ── TIENDA ── */
/* Un doble toque en el celular: el primero compra y equipa, y como la tienda se
   redibuja al instante, el segundo caía en el MISMO botón ya comprado y lo
   desequipaba: se pagaba y no se veía puesto. Tras una compra se ignoran los
   toques sobre accesorios durante un instante. */
let compraReciente=0;
const aTiempo=()=>Date.now()-compraReciente>450;
function rTienda(){
  const nAcc=id=>t('acc_'+id);
  const nMej={vida:t('mejvida'),tiempo:t('mejtiempo'),doble:t('mejdoble'),iman:t('mejiman'),escudo:t('mejescudo')};
  pantalla('tienda',`
  <div class="centro">
    <h2>🛒 ${t('tienda')}</h2>
    <span class="moneda">⛁ ${S.pts} PTS</span>
   <div class="col2">
    <div class="col">
    <div class="tienda-grid">
      ${ACCS.map(a=>{
        const tiene=S.accs.includes(a.id);
        const puede=S.pts>=a.precio;
        /* Botón de verdad, no un div: así se alcanza con el tabulador y un
           lector de pantalla lo anuncia. El que no alcanzas a pagar va
           `disabled`, que además lo saca del recorrido del teclado. */
        return `<button class="item-tienda ${tiene?'activa':(puede?'':'sin-pts')}" data-id="${a.id}"
          type="button" ${tiene||puede?'':'disabled'}>
          <span class="ico-t">${a.ico}</span>
          <span class="nom-t">${nAcc(a.id)}</span>
          <span class="precio">${tiene?(S.acc===a.id?'✔ '+t('equipado'):'✔'):'⛁'+a.precio}</span>
        </button>`}).join('')}
    </div>
    </div>
    <div class="col">
    <p class="mej-titulo">⚙ ${t('mejoras')}</p>
    <div class="mejoras-tienda">
      ${MEJORAS.map(m=>{
        const tiene=S.mejoras.includes(m.id);
        const puede=S.pts>=m.precio;
        /* Una mejora ya comprada no se puede volver a tocar, así que va
           `disabled` igual que la que no alcanzas a pagar. */
        return `<button class="item-tienda ${tiene?'activa':(puede?'':'sin-pts')}" data-mej="${m.id}"
          type="button" ${tiene||!puede?'disabled':''}
          style="flex-direction:row;justify-content:space-between;width:100%">
          <span class="ico-t">${m.ico}</span>
          <span class="mej-info">
            <span class="nom-t" style="text-align:left">${nMej[m.id]}</span>
            <span class="mej-desc">${t('d_'+m.id)}</span>
          </span>
          <span class="precio">${tiene?'✔':'⛁'+m.precio}</span>
        </button>`}).join('')}
    </div>
    </div>
   </div>
    <button class="btn btn2" id="ti-volver" type="button">${t('volver')}</button>
  </div>`,rTienda);
  $$('[data-id]').forEach(el=>el.onclick=()=>{
    if(!aTiempo())return;
    const a=ACCS.find(x=>x.id===el.dataset.id);
    if(S.accs.includes(a.id)){S.acc=S.acc===a.id?'':a.id;guardar();SFX.click();rTienda();return}
    if(S.pts<a.precio){SFX.mal();return}
    S.pts-=a.precio;S.accs.push(a.id);S.acc=a.id;guardar();compraReciente=Date.now();
    SFX.moneda();darLogro('comprador');
    if(ACCS.every(x=>S.accs.includes(x.id)))darLogro('coleccionista');
    rTienda();
  });
  $$('[data-mej]').forEach(el=>el.onclick=()=>{
    const m=MEJORAS.find(x=>x.id===el.dataset.mej);
    if(S.mejoras.includes(m.id))return;
    if(S.pts<m.precio){SFX.mal();return}
    S.pts-=m.precio;S.mejoras.push(m.id);guardar();
    SFX.moneda();darLogro('comprador');rTienda();
  });
  $('#ti-volver').onclick=()=>{SFX.click();rTitulo()};
}


/* ── PERSONALIZAR ── */
/* Pestaña abierta. Vive fuera de rPerso() porque la pantalla se repinta al
   comprar, y volver siempre a PIEL después de comprar un accesorio sería
   exasperante. */
let pePestana='piel';

function rPerso(){
  const nAcc=id=>t('acc_'+id);
  const pestanas=[['piel',t('piel')],['camisa',t('camisa')],['acc',t('accesorio')]];
  /* Accesorio pendiente de confirmar la compra. Se compra aquí y no solo en
     la tienda: tocar uno bloqueado y que se sacudiera sin decir nada ni
     ofrecerte comprarlo era un callejón sin salida. */
  let pendiente=null;

  const htmlAccs=()=>`
    <button class="acc-op ${S.acc===''?'sel':''}" data-a="" type="button"
      title="${t('pe_ninguno')}" aria-label="${t('pe_ninguno')}"><span class="acc-ico">🚫</span></button>
    ${ACCS.map(a=>{
      const tiene=S.accs.includes(a.id);
      const puesto=S.acc===a.id;
      const estado=puesto?t('equipado'):tiene?t('pe_comprado'):t('pe_bloqueado');
      return `<button class="acc-op ${puesto?'sel':''} ${tiene?'comprado':'bloq'}" data-a="${a.id}"
        type="button" title="${nAcc(a.id)} · ${estado}" aria-label="${nAcc(a.id)}, ${estado}">
        <span class="acc-ico">${a.ico}</span>
        ${puesto?'<span class="acc-eq">✔</span>':''}
        ${tiene?'':`<span class="acc-precio">⛁${a.precio}</span>`}
      </button>`}).join('')}`;

  const htmlConfirma=()=>pendiente?`
    <div class="pe-confirma" role="group">
      <p>${t('pe_confirma').replace('{n}',nAcc(pendiente.id)).replace('{p}',pendiente.precio)}</p>
      <div class="pe-confirma-btns">
        <button class="btn" id="pe-si" type="button">${t('pe_comprar')}</button>
        <button class="btn btn2" id="pe-no" type="button">${t('cancelar')}</button>
      </div>
    </div>`:'';

  pantalla('perso',`
  <div class="pe-wrap">
    <div class="pe-cab">
      <h2>🎨 ${t('perso')}</h2>
      <span class="moneda" id="pe-pts">⛁ ${S.pts} PTS</span>
    </div>

    <div class="pe-cuerpo">
      <section class="pe-lado">
        <p class="pe-cap">${t('personaje')}</p>
        <div class="pe-escena">
          <canvas class="pe-av" id="pe-cara" width="64" height="64"></canvas>
        </div>
        <div class="pe-detalle" role="group" aria-label="${t('pe_detalle')}">
          <button class="rec-chip ${!S.av32?'act':''}" id="pe-d16" type="button">${t('pe_detalle16')}</button>
          <button class="rec-chip ${S.av32?'act':''}" id="pe-d32" type="button">${t('pe_detalle32')}</button>
        </div>
        <p class="pe-nombre">${esc(S.nombre||t('tu'))}</p>
        <p class="pe-rango">${rangoNom()}</p>
        <dl class="pe-stats">
          <div><dt>⛁</dt><dd id="pe-st-pts">${S.pts}</dd></div>
          <div><dt>★</dt><dd>${S.xp} XP</dd></div>
          <div><dt>🎁</dt><dd id="pe-st-acc">${S.accs.length}/${ACCS.length}</dd></div>
        </dl>
      </section>

      <section class="pe-custom">
        <div class="pe-tabs" role="tablist" aria-label="${t('perso')}">
          ${pestanas.map(([id,txt])=>`<button class="pe-tab${pePestana===id?' act':''}" type="button"
            role="tab" id="pe-t-${id}" data-tab="${id}" aria-controls="pe-p-${id}"
            aria-selected="${pePestana===id}" tabindex="${pePestana===id?0:-1}">${txt}</button>`).join('')}
        </div>

        <div class="pe-panel" id="pe-p-piel" role="tabpanel" aria-labelledby="pe-t-piel" ${pePestana==='piel'?'':'hidden'}>
          <div class="custom-fila">
            ${SKINS.map((c,i)=>`<button class="skin-op ${S.skin===i?'sel':''}" data-s="${i}"
              style="background:${c}" type="button" aria-label="${t('piel')} ${i+1}"></button>`).join('')}
          </div>
        </div>

        <div class="pe-panel" id="pe-p-camisa" role="tabpanel" aria-labelledby="pe-t-camisa" ${pePestana==='camisa'?'':'hidden'}>
          <div class="custom-fila">
            ${CAMISAS.map((c,i)=>`<button class="camisa-op ${S.camisa===i?'sel':''}" data-c="${i}"
              style="background:${c}" type="button" aria-label="${t('camisa')} ${i+1}"></button>`).join('')}
          </div>
        </div>

        <div class="pe-panel" id="pe-p-acc" role="tabpanel" aria-labelledby="pe-t-acc" ${pePestana==='acc'?'':'hidden'}>
          <div class="accs-tienda" id="pe-accs">${htmlAccs()}</div>
          <div id="pe-conf">${htmlConfirma()}</div>
        </div>

        <div class="pe-pie">
          <span class="pe-estado" id="pe-estado" role="status" aria-live="polite">${t('pe_guardado')}</span>
          <button class="btn btn2 pe-volver" id="pe-volver" type="button">${t('volver')}</button>
        </div>
      </section>
    </div>
  </div>`,rPerso);

  const pinta=()=>retratoVivo($('#pe-cara'),CARAS.yo(true));
  const avisar=(txt,cls)=>{const e=$('#pe-estado');if(!e)return;e.textContent=txt;e.className='pe-estado'+(cls?' '+cls:'')};
  const latido=()=>{const a=$('#pe-escena-av')||$('#pe-cara');a.classList.remove('pe-pum');void a.offsetWidth;a.classList.add('pe-pum')};

  /* ── detalle del retrato: 16 de siempre / 32 más fino ──
     Es aparte de S.hd (la piel retro/OLED): los dos se combinan, no se
     excluyen. Cambia aquí mismo y no en el título porque este es el sitio
     donde se ve el avatar grande, así el cambio se nota al instante. */
  $('#pe-d16').onclick=()=>{
    if(!S.av32)return;
    S.av32=false;guardar();aplicarModo();SFX.click();
    $('#pe-d16').classList.add('act');$('#pe-d32').classList.remove('act');
    pinta();latido();
  };
  $('#pe-d32').onclick=()=>{
    if(S.av32)return;
    S.av32=true;guardar();aplicarModo();SFX.click();
    $('#pe-d32').classList.add('act');$('#pe-d16').classList.remove('act');
    pinta();latido();
  };

  /* ── pestañas ── */
  const abrir=id=>{
    pePestana=id;
    $$('.pe-tab').forEach(x=>{const on=x.dataset.tab===id;
      x.classList.toggle('act',on);x.setAttribute('aria-selected',on);x.tabIndex=on?0:-1});
    $$('.pe-panel').forEach(pn=>{pn.hidden=pn.id!=='pe-p-'+id});
  };
  $$('.pe-tab').forEach(b=>{
    b.onclick=()=>{SFX.click();abrir(b.dataset.tab)};
    /* Un role="tablist" se recorre con las flechas, no con el tabulador. */
    b.onkeydown=e=>{
      const k=e.key;
      if(k!=='ArrowRight'&&k!=='ArrowLeft')return;
      e.preventDefault();
      const ids=pestanas.map(x=>x[0]);
      const n=(ids.indexOf(pePestana)+(k==='ArrowRight'?1:ids.length-1))%ids.length;
      abrir(ids[n]);$('#pe-t-'+ids[n]).focus();SFX.click();
    };
  });

  /* ── piel y camisa ── */
  $$('.skin-op').forEach(b=>b.onclick=()=>{
    S.skin=+b.dataset.s;guardar();SFX.click();
    $$('.skin-op').forEach(x=>x.classList.toggle('sel',x===b));
    pinta();latido();avisar(t('pe_guardado'));
  });
  $$('.camisa-op').forEach(b=>b.onclick=()=>{
    S.camisa=+b.dataset.c;guardar();SFX.click();
    $$('.camisa-op').forEach(x=>x.classList.toggle('sel',x===b));
    pinta();latido();avisar(t('pe_guardado'));
  });

  /* ── accesorios ── */
  function refrescar(){
    $('#pe-accs').innerHTML=htmlAccs();
    $('#pe-conf').innerHTML=htmlConfirma();
    $('#pe-pts').textContent='⛁ '+S.pts+' PTS';
    $('#pe-st-pts').textContent=S.pts;
    $('#pe-st-acc').textContent=S.accs.length+'/'+ACCS.length;
    enlazarAccs();
    pinta();
  }
  function comprar(){
    const a=pendiente;pendiente=null;
    if(!a||S.pts<a.precio)return refrescar();
    S.pts-=a.precio;S.accs.push(a.id);S.acc=a.id;guardar();compraReciente=Date.now();
    SFX.moneda();darLogro('comprador');
    if(ACCS.every(x=>S.accs.includes(x.id)))darLogro('coleccionista');
    refrescar();latido();confeti();
    avisar(t('pe_comprado')+': '+nAcc(a.id),'verde');
  }
  function enlazarAccs(){
    $$('#pe-accs .acc-op').forEach(b=>b.onclick=()=>{
      if(!aTiempo())return;
      const id=b.dataset.a;
      if(!id){S.acc='';guardar();SFX.click();pendiente=null;refrescar();latido();avisar(t('pe_guardado'));return}
      const a=ACCS.find(x=>x.id===id);
      if(S.accs.includes(id)){
        S.acc=S.acc===id?'':id;guardar();SFX.click();pendiente=null;refrescar();latido();
        avisar(S.acc===id?t('equipado')+': '+nAcc(id):t('pe_guardado'));
        return;
      }
      if(S.pts<a.precio){
        SFX.mal();b.classList.add('shake');setTimeout(()=>b.classList.remove('shake'),320);
        avisar(t('pe_faltan').replace('{p}',a.precio-S.pts),'rojo');
        return;
      }
      pendiente=a;SFX.click();refrescar();
      avisar(t('pe_confirma').replace('{n}',nAcc(a.id)).replace('{p}',a.precio));
    });
    const si=$('#pe-si'),no=$('#pe-no');
    if(si)si.onclick=()=>{SFX.click();comprar()};
    if(no)no.onclick=()=>{SFX.click();pendiente=null;refrescar();avisar(t('pe_guardado'))};
  }
  enlazarAccs();
  pinta();
  $('#pe-volver').onclick=()=>{SFX.click();rTitulo()};
}
