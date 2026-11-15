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
    <button type="button" class="btn btn2 tienda-probar" id="ti-probar">${t('pe_probar_acc')}</button>
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
          <span class="ico-t"><canvas class="tienda-acc-arte" width="32" height="32" aria-hidden="true"></canvas></span>
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
  $$('[data-id]').forEach(el=>ACC_ARTE.icono(el.querySelector('canvas'),el.dataset.id));
  $('#ti-probar').onclick=()=>{SFX.click();pePestana='acc';rPerso()};
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
let pePestana='apariencia';
// Preferencia de vista de esta sesión; no es parte de la partida.
let peVista='ambos';
const PE_DIRECCIONES=['sur','sureste','este','noreste','norte','noroeste','oeste','suroeste'];

/* Las muestras conservan los índices de las paletas originales: nunca crean
   una segunda preferencia ni alteran inventario. El color es una pista extra,
   no el único identificador de cada tarjeta. */
function peTarjetasColor(tipo){
  const piel=tipo==='piel', paleta=piel?SKINS:CAMISAS, elegido=piel?S.skin:S.camisa;
  return `<div class="pe-color-cab"><h3>${t(piel?'pe_tonos':'pe_colores')}</h3><span class="pe-gratis">${t('pe_gratis')}</span></div>
    <p class="pe-color-ayuda">${t(piel?'pe_ayuda_piel':'pe_ayuda_camisa')}</p>
    <div class="pe-color-grid" role="group" aria-label="${t(piel?'pe_tonos':'pe_colores')}">
      ${paleta.map((color,i)=>`<button type="button" class="pe-color-op ${piel?'skin-op':'camisa-op'} ${elegido===i?'sel':''}" ${piel?'data-s':'data-c'}="${i}" aria-pressed="${elegido===i}" aria-label="${t('pe_'+tipo+'_'+i)}" style="--muestra:${color}">
        <span class="pe-color-arte"><canvas width="${piel?32:44}" height="${piel?32:74}" aria-hidden="true"></canvas></span>
        <span class="pe-color-info"><i class="pe-muestra" aria-hidden="true"></i><span class="pe-color-nom">${t('pe_'+tipo+'_'+i)}</span></span>
        <span class="pe-color-marca" aria-hidden="true">${elegido===i?'✓':''}</span>
        <span class="pe-color-estado" aria-hidden="true">${t(elegido===i?'pe_elegido':'pe_elegir')}</span>
      </button>`).join('')}
    </div>`;
}

function rPerso(){
  const nAcc=id=>t('acc_'+id);
  const pestanas=[['apariencia',t('pe_apariencia')],['piel',t('piel')],['camisa',t('camisa')],['acc',t('accesorio')]];
  // La prueba vive solo en esta pantalla; nunca se escribe en S ni en localStorage.
  let prueba=S.acc;
  const htmlAccs=()=>`<div class="pe-acc-grid" role="group" aria-label="${t('accesorio')}">
    ${[{id:'',precio:0},...ACCS].map(a=>{
      const tiene=!a.id||S.accs.includes(a.id),puesto=S.acc===a.id,seleccion=prueba===a.id;
      const nombre=a.id?nAcc(a.id):t('pe_ninguno');
      const estado=puesto?t('equipado'):tiene?t('pe_comprado'):t('pe_bloqueado');
      return `<button class="acc-op pe-acc-card ${seleccion?'sel':''} ${tiene?'comprado':'bloq'}" data-a="${a.id}" type="button" aria-pressed="${seleccion}" aria-label="${nombre}, ${estado}${tiene?'':', '+a.precio+' PTS'}">
        <canvas width="32" height="32" aria-hidden="true"></canvas><span class="pe-acc-nom">${nombre}</span>
        <span class="pe-acc-estado">${puesto?'✓ ':''}${estado}</span>${tiene?'':`<span class="pe-acc-costo">⛁ ${a.precio} PTS</span>`}
      </button>`}).join('')}</div>`;
  const htmlConfirma=()=>{
    const a=ACCS.find(x=>x.id===prueba),tiene=!a||S.accs.includes(a.id),puesto=prueba===S.acc,puede=tiene||S.pts>=a.precio;
    return `<div class="pe-confirma pe-probador" role="group" aria-label="${t('pe_prueba')}">
      <p class="pe-prueba-tit">${t('pe_prueba')} · ${a?nAcc(a.id):t('pe_ninguno')}</p>
      <p>${puesto?t('pe_activo'):tiene?t('pe_prueba_gratis'):puede?t('pe_confirma').replace('{n}',nAcc(a.id)).replace('{p}',a.precio):t('pe_faltan').replace('{p}',a.precio-S.pts)}</p>
      <div class="pe-confirma-btns">
        <button class="btn" id="pe-si" type="button" ${puesto||!puede?'disabled':''}>${t(tiene?'pe_equipar':'pe_comprar_equipar')}</button>
        <button class="btn btn2" id="pe-no" type="button" ${puesto?'disabled':''}>${t('cancelar')}</button>
      </div></div>`;
  };

  const resumenColor=tipo=>`<div class="pe-resumen-bloque"><h4>${t(tipo==='piel'?'pe_tonos':'pe_colores')}</h4>
    <div class="pe-rapidos" role="group" aria-label="${t(tipo==='piel'?'pe_tonos':'pe_colores')}">
      ${(tipo==='piel'?SKINS:CAMISAS).map((color,i)=>`<button type="button" class="pe-rapido" data-pe-quick="${tipo}" data-indice="${i}" style="--muestra:${color}" aria-label="${t('pe_'+tipo+'_'+i)}" aria-pressed="${(tipo==='piel'?S.skin:S.camisa)===i}"><span aria-hidden="true">${(tipo==='piel'?S.skin:S.camisa)===i?'✓':''}</span></button>`).join('')}
    </div><p class="pe-resumen-nom" id="pe-resumen-${tipo}"></p></div>`;
  pantalla('perso',`
  <div class="pe-wrap pe-definitivo">
    <div class="pe-cab">
      <div class="pe-cab-titulo"><span class="pe-cab-kicker">${t('pe_vestidor')}</span><h2>${t('perso')}</h2></div>
      <span class="moneda" id="pe-pts">⛁ ${S.pts} PTS</span>
    </div>

    <div class="pe-cuerpo">
      <section class="pe-lado">
        <div class="pe-lado-preview">
        <div class="pe-lado-cab"><p class="pe-cap">${t('personaje')}</p><span id="pe-etiqueta-apariencia">${t('pe_'+S.apariencia)}</span></div>
        <div class="pe-escena pe-visor" id="pe-escena-av" data-vista="${peVista}">
          <div class="pe-mini-retrato"><canvas class="pe-av" id="pe-cara" width="64" height="64" aria-label="${t('pe_retrato')}"></canvas><span>${t('pe_retrato')}</span></div>
          <div class="pe-plataforma"><canvas id="pe-cuerpo-av" width="44" height="74" aria-label="${t('pe_cuerpo')}"></canvas></div>
          <span class="pe-escena-tag" id="pe-escena-tag">${t('pe_equipado_actual')}</span>
        </div>
        <div class="pe-vistas" role="group" aria-label="${t('pe_vista')}">
          ${[['ambos','pe_ambos'],['retrato','pe_retrato'],['cuerpo','pe_cuerpo']].map(([id,k])=>`<button class="rec-chip ${peVista===id?'act':''}" type="button" data-pe-vista="${id}" aria-pressed="${peVista===id}">${t(k)}</button>`).join('')}
        </div>
        <div class="pe-visor-controles" id="pe-movimiento" role="group" aria-label="${t('pe_vista')}" ${peVista==='retrato'?'hidden':''}>
          <button class="rec-chip" id="pe-girar-atras" type="button" aria-label="${t('pe_girar_atras')}">↶</button>
          <span class="pe-direccion" id="pe-direccion" aria-live="polite">${t('pe_dir_sur')}</span>
          <button class="rec-chip" id="pe-girar" type="button" aria-label="${t('pe_girar')}">↻</button>
          <button class="rec-chip" id="pe-caminar" type="button" aria-pressed="false">▶ ${t('pe_caminar')}</button>
        </div>
        <div class="pe-detalle" id="pe-resolucion" role="group" aria-label="${t('pe_detalle')}" ${peVista==='cuerpo'?'hidden':''}>
          <span>${t('pe_detalle')}</span>
          <button class="rec-chip ${!S.av32?'act':''}" id="pe-d16" type="button" aria-pressed="${!S.av32}">16×16</button>
          <button class="rec-chip ${S.av32?'act':''}" id="pe-d32" type="button" aria-pressed="${!!S.av32}">32×32</button>
        </div>
        </div>
        <div class="pe-perfil">
        <div class="pe-identidad"><p class="pe-nombre">${esc(S.nombre||t('tu'))}</p><p class="pe-rango">${rangoNom()}</p></div>
        <dl class="pe-stats">
          <div><dt>${t('pe_saldo')}</dt><dd id="pe-st-pts">${S.pts}</dd></div>
          <div><dt>XP</dt><dd>${S.xp}</dd></div>
          <div><dt>${t('pe_coleccion')}</dt><dd id="pe-st-acc">${S.accs.length}/${ACCS.length}</dd></div>
        </dl>
        <div class="pe-coleccion-bar" id="pe-coleccion-bar" role="progressbar" aria-label="${t('pe_coleccion')}" aria-valuemin="0" aria-valuemax="${ACCS.length}" aria-valuenow="${S.accs.length}" style="--pe-coleccion:${S.accs.length/ACCS.length*100}%"><span></span></div>
        </div>
      </section>

      <section class="pe-custom">
        <div class="pe-tabs" role="tablist" aria-label="${t('perso')}">
          ${pestanas.map(([id,txt])=>`<button class="pe-tab${pePestana===id?' act':''}" type="button"
            role="tab" id="pe-t-${id}" data-tab="${id}" aria-controls="pe-p-${id}"
            aria-selected="${pePestana===id}" tabindex="${pePestana===id?0:-1}">${txt}</button>`).join('')}
        </div>

        <div class="pe-panel pe-apariencias" id="pe-p-apariencia" role="tabpanel" aria-labelledby="pe-t-apariencia" ${pePestana==='apariencia'?'':'hidden'}>
          <div class="pe-apariencia-cab"><h3>${t('pe_elegir_apariencia')}</h3><span class="pe-gratis">${t('pe_gratis')}</span></div>
          <div class="pe-overview">
            <div class="pe-apariencia-grid">
              ${['masculina','femenina'].map(id=>`<button type="button" class="pe-apariencia-op ${S.apariencia===id?'sel':''}" data-apariencia="${id}" aria-pressed="${S.apariencia===id}">
                <span class="pe-apariencia-marca" aria-hidden="true">${S.apariencia===id?'✓':''}</span><canvas width="44" height="74" aria-hidden="true"></canvas><span class="pe-apariencia-nom">${t('pe_'+id)}</span>
              </button>`).join('')}
            </div>
            <div class="pe-resumen">${resumenColor('piel')}${resumenColor('camisa')}
              <div class="pe-resumen-bloque"><h4>${t('accesorio')}</h4><button class="pe-atajo-acc" id="pe-atajo-acc" type="button"><canvas width="32" height="32" aria-hidden="true"></canvas><span><strong id="pe-acc-actual"></strong><small>${t('pe_probar_acc')}</small></span><span aria-hidden="true">›</span></button></div>
            </div>
          </div>
        </div>

        <div class="pe-panel" id="pe-p-piel" role="tabpanel" aria-labelledby="pe-t-piel" ${pePestana==='piel'?'':'hidden'}>
          ${peTarjetasColor('piel')}
        </div>

        <div class="pe-panel" id="pe-p-camisa" role="tabpanel" aria-labelledby="pe-t-camisa" ${pePestana==='camisa'?'':'hidden'}>
          ${peTarjetasColor('camisa')}
        </div>

        <div class="pe-panel" id="pe-p-acc" role="tabpanel" aria-labelledby="pe-t-acc" ${pePestana==='acc'?'':'hidden'}>
          <div class="pe-apariencia-cab"><h3>${t('pe_coleccion')}</h3><span class="pe-gratis">${t('pe_prueba')}</span></div>
          <p class="pe-color-ayuda">${t('pe_prueba_gratis')}</p>
          <div class="accs-tienda" id="pe-accs">${htmlAccs()}</div>
          <div id="pe-conf">${htmlConfirma()}</div>
        </div>

      </section>
      <div class="pe-pie">
        <span class="pe-estado" id="pe-estado" role="status" aria-live="polite">${t('pe_guardado')}</span>
        <button class="btn btn2 pe-volver" id="pe-volver" type="button">${t('volver')}</button>
      </div>
    </div>
  </div>`,rPerso);

  let orientacion=0, andando=false, ultimoVisor='';
  const pintaCuerpo=()=>{
    const cv=$('#pe-cuerpo-av');if(!cv||pantallaId!=='perso'||peVista==='retrato')return;
    const paso=APRENDIZ.pasoDe(andando&&!quieto()), clave=[S.apariencia,S.skin,S.camisa,prueba,orientacion,paso,APRENDIZ.listaFemenina,APRENDIZ.listo,APRENDIZ.listoHD,APRENDIZ.listoPremium,APRENDIZ.listoPortada].join('|');
    if(clave===ultimoVisor)return;
    const c=cv.getContext('2d');c.clearRect(0,0,44,74);
    if(!APRENDIZ.dibujar(c,22,74,74,orientacion,paso,S.skin,S.camisa,S.apariencia,prueba))return;
    ultimoVisor=clave;
  };
  const pintaOpciones=()=>$$('.pe-apariencia-op').forEach(b=>{
    const id=b.dataset.apariencia,cv=b.querySelector('canvas'),c=cv.getContext('2d');
    c.clearRect(0,0,44,74);
    b.classList.toggle('sel',S.apariencia===id);b.setAttribute('aria-pressed',String(S.apariencia===id));
    b.querySelector('.pe-apariencia-marca').textContent=S.apariencia===id?'✓':'';
    if(id==='femenina'&&!APRENDIZ.listaFemenina)return;
    APRENDIZ.dibujar(c,22,74,74,0,0,S.skin,S.camisa,id);
  });
  const pintaColores=()=>$$('.pe-color-op').forEach(b=>{
    const piel=b.dataset.s!==undefined, i=Number(piel?b.dataset.s:b.dataset.c),
      cv=b.querySelector('canvas'), elegido=(piel?S.skin:S.camisa)===i;
    b.classList.toggle('sel',elegido);b.setAttribute('aria-pressed',String(elegido));
    b.querySelector('.pe-color-marca').textContent=elegido?'✓':'';
    b.querySelector('.pe-color-estado').textContent=t(elegido?'pe_elegido':'pe_elegir');
    if(piel){retrato(cv,{...CARAS.yo(false),skin:SKINS[i],av32:true});return}
    const c=cv.getContext('2d');c.clearRect(0,0,44,74);
    APRENDIZ.dibujar(c,22,74,74,0,0,S.skin,i,S.apariencia);
  });
  const pintaResumen=()=>{
    $('#pe-etiqueta-apariencia').textContent=t('pe_'+S.apariencia);
    $('#pe-escena-tag').textContent=t(prueba===S.acc?'pe_equipado_actual':'pe_prueba');
    $('#pe-escena-av').classList.toggle('pe-en-prueba',prueba!==S.acc);
    $$('[data-pe-quick]').forEach(b=>{
      const elegido=Number(b.dataset.indice)===(b.dataset.peQuick==='piel'?S.skin:S.camisa);
      b.setAttribute('aria-pressed',String(elegido));b.querySelector('span').textContent=elegido?'✓':'';
    });
    $('#pe-resumen-piel').textContent=t('pe_piel_'+S.skin);
    $('#pe-resumen-camisa').textContent=t('pe_camisa_'+S.camisa);
    $('#pe-acc-actual').textContent=S.acc?nAcc(S.acc):t('pe_ninguno');
    ACC_ARTE.icono($('#pe-atajo-acc canvas'),S.acc);
    const barra=$('#pe-coleccion-bar');barra.setAttribute('aria-valuenow',String(S.accs.length));barra.style.setProperty('--pe-coleccion',S.accs.length/ACCS.length*100+'%');
  };
  const pinta=()=>{const cara=CARAS.yo(true);for(const id of ACC_ARTE.ids)cara[id]=prueba===id;retratoVivo($('#pe-cara'),cara);ultimoVisor='';pintaCuerpo();pintaOpciones();pintaColores();pintaResumen()};
  $$('.pe-apariencia-op').forEach(b=>b.onclick=()=>{
    const id=b.dataset.apariencia;if((id!=='masculina'&&id!=='femenina')||S.apariencia===id)return;
    S.apariencia=id;guardar();SFX.click();pinta();avisar(t('pe_guardado'));
  });
  const gira=delta=>{orientacion=(orientacion+delta+8)%8;$('#pe-direccion').textContent=t('pe_dir_'+PE_DIRECCIONES[orientacion]);SFX.click();pintaCuerpo()};
  $('#pe-girar').onclick=()=>gira(1);
  $('#pe-girar-atras').onclick=()=>gira(-1);
  const botonCaminar=$('#pe-caminar');
  botonCaminar.disabled=quieto();
  botonCaminar.onclick=()=>{andando=!andando&&!quieto();botonCaminar.setAttribute('aria-pressed',String(andando));botonCaminar.textContent=andando?'■ '+t('pe_detener'):'▶ '+t('pe_caminar');pintaCuerpo()};
  $$('[data-pe-vista]').forEach(b=>b.onclick=()=>{
    peVista=b.dataset.peVista;$('#pe-escena-av').dataset.vista=peVista;
    $$('[data-pe-vista]').forEach(x=>{const on=x.dataset.peVista===peVista;x.classList.toggle('act',on);x.setAttribute('aria-pressed',String(on))});
    $('#pe-movimiento').hidden=peVista==='retrato';$('#pe-resolucion').hidden=peVista==='cuerpo';
    if(peVista==='retrato'&&andando){andando=false;botonCaminar.setAttribute('aria-pressed','false');botonCaminar.textContent='▶ '+t('pe_caminar')}
    SFX.click();pintaCuerpo();
  });
  // Solo durante esta pantalla. limpiarT() elimina el intervalo al navegar.
  let cargaAnterior='';
  tcada(()=>{
    if(document.hidden||pausado)return;
    const carga=[APRENDIZ.listaFemenina,APRENDIZ.listo,APRENDIZ.listoHD,APRENDIZ.listoPremium,APRENDIZ.listoPortada].join('|');
    if(carga!==cargaAnterior){cargaAnterior=carga;pintaOpciones();pintaColores()}
    pintaCuerpo();
  },135);
  const avisar=(txt,cls)=>{const e=$('#pe-estado');if(!e)return;e.textContent=txt;e.className='pe-estado'+(cls?' '+cls:'')};
  const latido=()=>{const a=$('#pe-escena-av')||$('#pe-cara');if(quieto())return;a.classList.remove('pe-pum');void a.offsetWidth;a.classList.add('pe-pum')};

  /* ── detalle del retrato: 16 de siempre / 32 más fino ──
     Es aparte de S.hd (la piel retro/OLED): los dos se combinan, no se
     excluyen. Cambia aquí mismo y no en el título porque este es el sitio
     donde se ve el avatar grande, así el cambio se nota al instante. */
  $('#pe-d16').onclick=()=>{
    if(!S.av32)return;
    S.av32=false;guardar();aplicarModo();SFX.click();
    $('#pe-d16').classList.add('act');$('#pe-d32').classList.remove('act');$('#pe-d16').setAttribute('aria-pressed','true');$('#pe-d32').setAttribute('aria-pressed','false');
    pinta();latido();
  };
  $('#pe-d32').onclick=()=>{
    if(S.av32)return;
    S.av32=true;guardar();aplicarModo();SFX.click();
    $('#pe-d32').classList.add('act');$('#pe-d16').classList.remove('act');$('#pe-d32').setAttribute('aria-pressed','true');$('#pe-d16').setAttribute('aria-pressed','false');
    pinta();latido();
  };

  /* ── pestañas ── */
  const abrir=id=>{
    if(id!=='acc'&&prueba!==S.acc){prueba=S.acc;refrescar();avisar(t('pe_guardado'))}
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

  $('#pe-atajo-acc').onclick=()=>{SFX.click();abrir('acc');$('#pe-t-acc').focus()};
  // Los accesos rápidos usan los mismos botones/handlers de las paletas.
  $$('[data-pe-quick]').forEach(b=>b.onclick=()=>{
    const i=Number(b.dataset.indice),campo=b.dataset.peQuick==='piel'?'s':'c';
    $(`.pe-color-op[data-${campo}="${i}"]`)?.click();
  });
  /* ── piel y camisa ── */
  $$('.pe-color-op').forEach(b=>b.onclick=()=>{
    const piel=b.dataset.s!==undefined, i=Number(piel?b.dataset.s:b.dataset.c),
      paleta=piel?SKINS:CAMISAS, campo=piel?'skin':'camisa';
    if(!Number.isInteger(i)||i<0||i>=paleta.length||S[campo]===i)return;
    S[campo]=i;guardar();SFX.click();
    pinta();if(!quieto())latido();avisar(t('pe_guardado'),'verde');
  });

  /* ── accesorios ── */
  function refrescar(){
    $('#pe-accs').innerHTML=htmlAccs();
    $('#pe-conf').innerHTML=htmlConfirma();
    $('#pe-pts').textContent='⛁ '+S.pts+' PTS';
    $('#pe-st-pts').textContent=S.pts;
    $('#pe-st-acc').textContent=S.accs.length+'/'+ACCS.length;
    enlazarAccs();
    pinta();hud();
  }
  function comprar(){
    if(prueba===S.acc||!aTiempo())return;
    const a=ACCS.find(x=>x.id===prueba);
    if(!a&&prueba!=='')return;
    const nueva=!!a&&!S.accs.includes(a.id);
    if(nueva&&S.pts<a.precio){avisar(t('pe_faltan').replace('{p}',a.precio-S.pts),'rojo');refrescar();return}
    if(nueva){S.pts-=a.precio;S.accs.push(a.id);compraReciente=Date.now()}
    S.acc=prueba;guardar();
    if(nueva){SFX.moneda();darLogro('comprador');if(ACCS.every(x=>S.accs.includes(x.id)))darLogro('coleccionista');if(!quieto())confeti()}
    else SFX.click();
    refrescar();if(!quieto())latido();avisar(t('pe_guardado'),'verde');
    $('#pe-accs .acc-op.sel')?.focus();
  }
  function enlazarAccs(){
    $$('#pe-accs .acc-op').forEach(b=>{
      const id=b.dataset.a;ACC_ARTE.icono(b.querySelector('canvas'),id);
      b.onclick=()=>{
        if(!aTiempo()|| (id!==''&&!ACCS.some(a=>a.id===id)))return;
        prueba=id;SFX.click();refrescar();
        avisar(prueba===S.acc?t('pe_guardado'):t('pe_prueba_gratis'));
        $('#pe-accs .acc-op.sel')?.focus();
      };
    });
    const si=$('#pe-si'),no=$('#pe-no');
    if(si)si.onclick=comprar;
    if(no)no.onclick=()=>{SFX.click();prueba=S.acc;refrescar();avisar(t('pe_guardado'));$('#pe-accs .acc-op.sel')?.focus()};
  }
  enlazarAccs();
  pinta();
  $('#pe-volver').onclick=()=>{SFX.click();rTitulo()};
}
