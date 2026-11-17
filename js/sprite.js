'use strict';
/* ── SPRITE DEL APRENDIZ (cuerpo entero) ──
   Un atlas (img/aprendiz-caminar.png) con el aprendiz en pixel art: una FILA
   por dirección (las 8 de DIRS, en ese orden) y 4 COLUMNAS de caminata
   (0 reposo, 1 paso izquierdo, 2 transición, 3 paso derecho). Si el PNG no
   carga (sin conexión la primera vez, o bloqueado) todo lo que usa el sprite
   cae a su dibujo de respaldo y el juego funciona igual.

   La columna 0 es, píxel a píxel, el atlas de reposo que genera
   scripts/build-sprite.py desde arte/aprendiz/idle/; la caminata (fuente en
   arte/aprendiz/caminar/) se hizo encima, con la misma paleta de 23 colores,
   así que el recoloreo de piel y camisa sirve para todos los cuadros.

   Recoloreado: el sprite viene con una piel y una camisa fijas; aquí se
   remapean a las que eligió el jugador (SKINS[S.skin]/CAMISAS[S.camisa]), para
   no perder la personalización que ya tienen el runner y el jefe. Se cachea por
   combinación (solo hay 4×4), calculando cada una una sola vez.

   v33 · ARTE NUEVO DEL PROTAGONISTA: img/aprendiz-caminar-hd.png (mismo contrato:
   8 filas × 4 columnas de 44×74, pies en la base) y img/aprendiz-portada-hd.png
   (1 fila: 0 reposo, 1 parpadeo, 2-3 saludo, para la portada). Se usa para el JUGADOR
   (piel y camisa por índice); los personajes del pasillo (colores "#rrggbb") siguen con
   el atlas clásico, que además es el respaldo si el nuevo no carga. Fuentes y notas en
   arte/aprendiz-hd/. */

/* Fase 1 · composición de cabeza calibrada contra los atlas de 44×74.
   DIRS: S, SE, E, NE, N, NO, O, SO. No hay volteo de arte.
   Lentes [x,y,w,h], patilla [[x,y],...], almohadillas [cx,cy,w,h],
   diadema [[x,y],...]. Coordenadas de píxel nativas, no relativas al CSS.
   El atlas femenino cambia la escala de la cabeza entre reposo y marcha:
   cada cuadro tiene calibración propia. Las poses de portada son otra fuente. */
const ACC_CABEZA = (()=>{
  const oscuro='#111526', borde='#303e5d', metal='#718bad', brillo='#b4d6eb', cian='#69c9e9';
  // Lentes y patillas explícitos. Las vistas posteriores no muestran cristales.
  // Masculino: marcos medidos sobre los ojos reales del atlas v40.6 (cuadro de 6×4 px por ojo, ver scripts/build-caras-cuerpo.mjs),
  // con un píxel de margen; así el aro rodea los ojos y se apoya sobre la barba, sin taparla. La cabeza es idéntica en los 4 cuadros.
  const mL=[
    [[13,16,8,6],[24,16,8,6]], [[19,16,7,6],[26,16,7,6]], [[27,16,6,6]], [], [], [], [[11,16,6,6]], [[11,16,7,6],[18,16,7,6]]
  ];
  const fL=[
    [[[14,17,7,8],[25,17,6,8]],[[14,19,8,9],[26,19,7,9]],[[13,19,8,9],[25,19,7,9]],[[14,19,8,9],[25,19,7,9]]],
    [[[19,17,7,8],[29,17,5,8]],[[19,20,8,8],[31,20,6,8]],[[18,20,8,8],[30,20,6,8]],[[19,20,8,8],[31,20,6,8]]],
    [[[25,18,6,7]],[[26,19,7,9]],[[25,19,8,9]],[[25,19,7,9]]],
    [[],[],[],[]],[[],[],[],[]],[[],[],[],[]],
    [[[13,18,6,7]],[[12,19,7,9]],[[12,19,7,9]],[[12,19,7,9]]],
    [[[11,17,6,8],[21,17,7,8]],[[9,20,6,8],[22,20,8,8]],[[10,20,6,8],[22,20,7,8]],[[10,20,6,8],[22,20,7,8]]]
  ];
  // Puntos de apoyo de cada dirección; en perfil una sola almohadilla visible.
  // [copa(s), recorrido de la diadema]. No se dibuja la copa oculta. Los arcos de mH y fHM son semielipses que calcula
  // scripts/calcula-arcos-cabeza.mjs: del borde superior de la copa al vértice, un píxel por dentro del borde del pelo de cada atlas.
  const mH=[
    [[[8,20,5,10],[35,20,5,10]],[[8,15],[8,13],[9,11],[10,9],[11,7],[13,5],[15,4],[17,3],[19,2],[22,2],[24,2],[26,3],[28,4],[30,5],[32,7],[33,9],[34,11],[35,13],[35,15]]],
    [[[12,21,7,10]],[[12,16],[12,14],[13,11],[13,9],[14,7],[16,5],[17,4],[19,3],[20,2],[22,2],[24,2],[25,3],[27,4],[28,5],[30,7],[31,9],[31,11]]],
    [[[18,21,7,10]],[[18,16],[18,14],[18,11],[18,9],[17,7],[17,5],[17,4],[16,3],[16,2],[15,2],[14,2],[14,3],[14,4],[13,5],[13,7],[12,9],[12,11]]],
    [[[29,21,7,10]],[[29,16],[29,14],[28,11],[28,9],[27,7],[25,5],[24,4],[22,3],[21,2],[19,2],[17,2],[16,3],[14,4],[13,5],[11,7],[10,9],[10,11]]],
    [[[8,21,5,10],[35,21,5,10]],[[8,16],[8,14],[9,11],[10,9],[11,7],[13,5],[15,4],[17,3],[19,2],[22,2],[24,2],[26,3],[28,4],[30,5],[32,7],[33,9],[34,11],[35,14],[35,16]]],
    [[[14,21,7,10]],[[14,16],[14,14],[15,11],[15,9],[16,7],[17,5],[19,4],[20,3],[22,2],[24,2],[25,2],[27,3],[28,4],[30,5],[31,7],[32,9],[32,11]]],
    [[[26,21,7,10]],[[26,16],[26,14],[26,11],[26,9],[27,7],[27,5],[28,4],[28,3],[28,2],[29,2],[30,2],[30,3],[31,4],[31,5],[31,7],[32,9],[32,11]]],
    [[[32,21,7,10]],[[32,16],[32,14],[31,11],[31,9],[29,7],[28,5],[27,4],[25,3],[23,2],[21,2],[19,2],[17,3],[15,4],[14,5],[13,7],[11,9],[11,11]]]
  ];
  const fH0=[
    [[[10,22,5,9],[33,22,5,9]],[[10,18],[10,12],[14,7],[19,3],[25,3],[30,6],[33,12],[33,18]]],
    [[[13,22,6,9]],[[13,18],[12,12],[16,6],[22,3],[29,4],[33,8]]],
    [[[20,22,6,9]],[[20,18],[19,12],[21,7],[26,3],[30,5]]],
    [[[30,23,6,9]],[[30,19],[31,12],[28,6],[23,3],[17,5]]],
    [[[11,22,5,9],[32,22,5,9]],[[11,18],[11,12],[15,6],[20,3],[26,3],[31,7],[32,12],[32,18]]],
    [[[13,23,6,9]],[[13,19],[12,12],[15,6],[20,3],[26,5]]],
    [[[25,22,6,9]],[[25,18],[26,12],[23,7],[18,3],[14,5]]],
    [[[32,22,6,9]],[[32,18],[33,12],[29,6],[23,3],[16,4],[11,8]]]
  ];
  // Caminata femenina: medidas individuales para las cabezas más anchas.
  // Las copas y el arco siguen la cabeza, no el centro fijo del personaje.
  const fHM=[
    [[[9,25,6,10],[35,25,6,10]],[[9,20],[9,17],[10,15],[11,12],[12,10],[14,8],[16,6],[18,5],[20,4],[22,4],[24,4],[26,5],[29,6],[30,8],[32,10],[33,12],[34,15],[35,17],[35,20]]],
    [[[12,25,7,10]],[[12,20],[12,17],[13,15],[14,12],[15,10],[16,8],[18,6],[20,5],[22,4],[24,4],[26,4],[28,5],[30,6],[32,8],[33,10],[34,12]]],
    [[[19,25,7,10]],[[19,20],[19,17],[19,15],[19,12],[18,10],[18,8],[18,6],[17,5],[17,4],[16,4],[15,4],[15,5],[15,6],[14,8],[14,10],[13,12],[13,15]]],
    [[[29,26,7,10]],[[29,21],[29,18],[28,15],[28,13],[27,10],[25,8],[24,6],[22,5],[21,4],[19,4],[17,4],[16,5],[14,6],[13,8],[11,10],[10,13],[10,15]]],
    [[[9,25,6,10],[34,25,6,10]],[[9,20],[9,17],[10,15],[11,12],[12,10],[13,8],[15,6],[17,5],[19,4],[22,4],[24,4],[26,5],[28,6],[30,8],[31,10],[32,12],[33,15],[34,17],[34,20]]],
    [[[14,26,7,10]],[[14,21],[14,18],[15,15],[15,13],[16,10],[18,8],[19,6],[21,5],[22,4],[24,4],[26,4],[27,5],[29,6],[30,8],[32,10],[33,13],[33,15]]],
    [[[25,25,7,10]],[[25,20],[25,17],[25,15],[25,12],[26,10],[26,8],[27,6],[27,5],[27,4],[28,4],[29,4],[29,5],[30,6],[30,8],[30,10],[31,12],[31,15]]],
    [[[33,25,7,10]],[[33,20],[33,17],[32,15],[31,12],[30,10],[29,8],[27,6],[25,5],[23,4],[21,4],[18,4],[16,5],[14,6],[12,8],[11,10],[10,12]]]
  ];
  // Portada femenina: el saludo gira la cabeza hacia la izquierda del lienzo.
  const fPL=[[[15,18,7,8],[26,18,6,8]],[[15,18,7,8],[26,18,6,8]],[[15,16,7,8],[25,16,7,8]],[[12,17,7,8],[22,17,7,8]]];
  const fPH=[fH0[0],fH0[0],fH0[0],[[[9,22,5,9],[31,22,5,9]],[[9,18],[9,12],[13,7],[18,3],[24,3],[29,6],[31,12],[31,18]]]];
  const temple=(dir,lenses)=>{
    if(!lenses.length)return [];
    const [x,y,,h]=lenses[0], yy=y+Math.floor(h/2);
    if(dir===1||dir===2)return [[x,yy],[x-4,yy],[dir===2?18:13,yy+2]];
    if(dir===6||dir===7){const [a,b,c,d]=lenses[lenses.length-1],v=b+Math.floor(d/2);return [[a+c-1,v],[a+c+3,v],[dir===6?26:32,v+2]];}
    return [];
  };
  function ancla(apariencia,dir,paso=0,pose=-1){
    const p=((pose%4)+4)%4,d=((dir%8)+8)%8;
    const fem=apariencia==='femenina';
    // Femenina: desde v40.6 el cuadro 0 (reposo) es la misma pose que el cuadro 2 (reparación del salto de cabeza): comparten anclaje.
    let f=((paso%4)+4)%4;if(fem&&f===0)f=2;
    const lentes=fem?(pose>=0?fPL[p]:fL[d][f]):mL[pose>=0?0:d];
    const [copas,arco]=fem?(pose>=0?fPH[p]:fHM[d]):mH[pose>=0?0:d];
    // En perfil puro la mitad lejana del arco queda ocluida por el cráneo.
    // Conservar la rama que sale de la copa hasta el punto superior, sin la falsa segunda varilla.
    const perfil=pose<0&&(d===2||d===6);
    const cima=perfil?Math.min(...arco.map(q=>q[1])):0;
    const visible=perfil?arco.slice(0,arco.map(q=>q[1]).lastIndexOf(cima)+1):arco;
    return {lentes,copas,arco:visible,patilla:temple(pose>=0?0:d,lentes)};
  }
  function rect(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(x,y,w,h)}
  // Bresenham entero para que los arcos sean verdaderos escalones de píxel.
  function trazo(c,pts,g,col){
    const radio=Math.floor(g/2);
    for(let i=1;i<pts.length;i++){
      let [x,y]=pts[i-1];const [xf,yf]=pts[i],dx=Math.abs(xf-x),dy=-Math.abs(yf-y),sx=x<xf?1:-1,sy=y<yf?1:-1;let e=dx+dy;
      while(true){rect(c,x-radio,y-radio,g,g,col);if(x===xf&&y===yf)break;const e2=2*e;if(e2>=dy){e+=dy;x+=sx}if(e2<=dx){e+=dx;y+=sy}}
    }
  }
  function lente(c,x,y,w,h){
    rect(c,x+1,y,w-2,1,oscuro);rect(c,x,y+1,1,h-2,oscuro);rect(c,x+w-1,y+1,1,h-2,oscuro);rect(c,x+1,y+h-1,w-2,1,oscuro);
    // Cristal translúcido: conserva los ojos y su expresión; nunca un bloque opaco.
    rect(c,x+1,y+1,w-2,h-2,'rgba(80,186,215,0.24)');rect(c,x+1,y+1,1,1,brillo);rect(c,x+1,y+h-2,w-2,1,'rgba(105,201,233,0.30)');
  }
  function copa(c,cx,cy,w,h){
    const x=cx-Math.floor(w/2),y=cy-Math.floor(h/2);
    rect(c,x+1,y,w-2,h,oscuro);rect(c,x,y+1,w,h-2,oscuro);
    rect(c,x+1,y+2,w-2,h-4,borde);rect(c,x+1,y+2,1,h-4,metal);rect(c,x+w-2,y+2,1,h-4,'#24324e');
    if(w>=6){rect(c,x+2,y+2,w-4,1,brillo);rect(c,x+2,y+3,1,h-6,cian)}
    else rect(c,x+1,y+3,1,h-6,cian);
  }
  function dibujar(c,id,apariencia,dir,paso,pose=-1){
    const a=ancla(apariencia,dir,paso,pose);
    if(id==='gafas'){
      if(!a.lentes.length)return;
      trazo(c,a.patilla,1,oscuro);
      if(a.lentes.length===2){const [x,y,w,h]=a.lentes[0],q=a.lentes[1];rect(c,x+w-1,y+Math.floor(h/2)-1,q[0]-x-w+2,1,oscuro);}
      for(const l of a.lentes)lente(c,...l);
    }else if(id==='audifonos'){
      trazo(c,a.arco,3,oscuro);trazo(c,a.arco,1,metal);
      for(const [x,y,w,h] of a.copas)copa(c,x,y,w,h);
    }
  }
  return {ancla,dibujar};
})();

/* Fase 2 · gorra a medida de cada celda (js/accesorios-cuerpo-arte.js, generado por scripts/build-accesorios-cuerpo.mjs).
   Cada dirección, cada cuadro de marcha y cada pose de portada tienen su propia copa, visera y banda; la copa sale de la
   silueta real de la cabeza. Sin volteo de arte. Filas [y, x, texto] con la paleta ARTE_ACC_CUERPO.paleta. */
const ACC_GORRA = (()=>{
  /** @type {any} */
  const A = (typeof ARTE_ACC_CUERPO!=='undefined')?ARTE_ACC_CUERPO:null;
  function celda(apariencia,dir,paso,pose=-1){
    if(!A)return null;
    const g=A.gorra[apariencia==='femenina'?'femenina':'masculina'];
    if(pose>=0)return g.portada[((pose%4)+4)%4]||null;
    const d=((dir%8)+8)%8,c=apariencia==='femenina'?((((paso%4)+4)%4)||2):0;
    return (g.caminar[d]&&g.caminar[d][c])||null;
  }
  function dibujar(ctx,apariencia,dir,paso,pose=-1){
    const f=celda(apariencia,dir,paso,pose);if(!f)return false;
    const pal=A.paleta;
    for(const [y,x0,t] of f){
      for(let i=0;i<t.length;){
        const ch=t[i];let j=i;while(j<t.length&&t[j]===ch)j++;
        if(ch!=='.'){ctx.fillStyle=pal[ch];ctx.fillRect(x0+i,y,j-i,1)}
        i=j;
      }
    }
    return true;
  }
  // icono de la tienda (32×32): la misma gorra de perfil sobre una cabeza pequeña
  function icono(ctx,dx=0,dy=0){
    if(!A||!A.icono)return false;const pal=A.paleta;
    for(const [y,x0,tx] of A.icono.gorra){for(let i=0;i<tx.length;){const ch=tx[i];let j=i;while(j<tx.length&&tx[j]===ch)j++;if(ch!=='.'){ctx.fillStyle=pal[ch];ctx.fillRect(x0+i+dx,y+dy,j-i,1)}i=j}}
    return true;
  }
  return {celda,dibujar,icono};
})();

/* Fase 2 · corbata a medida: sigue el eje del pecho de cada celda (collar, inclinación y largo) en lugar de un desplazamiento fijo.
   De frente se ve completa; en 3/4 se acorta y se inclina con el cuerpo; en perfil es una banda estrecha al frente del pecho;
   por detrás no se dibuja. Medidas [x del eje, y del nudo, inclinación, largo] sobre los atlas v40.6; la femenina de marcha
   usa los mismos valores en los cuadros 0 y 2 (misma pose). */
const ACC_CORBATA = (()=>{
  const K='#101326', pal={A:'#ff8c99',R:'#ff5468',D:'#b91d46',E:'#7a1236'};
  // [x del eje, y del nudo, inclinación en el largo, largo]; null = no se ve
  const m=[[21.5,32,0,14],[23.5,31,2,14],[25,31,0,14],null,null,null,[19,31,0,14],[19.5,31,-2,14]];
  const f1=[[22.5,34,0,12],[23.5,36,1,10],[25.5,33,0,12],null,null,null,[19,34,0,12],[19.5,34,-1,12]];
  const f=[null,f1,f1,f1];
  const fp=[[22.5,31,0,11],[22.5,31,0,11],[22.5,30,0,11],[22.5,31,0,11]];   // portada femenina (reposo antiguo, torso más corto)
  const TIPO=['frente','tres','perfil',null,null,null,'perfil','tres'];
  const ANCHOS={
    frente:{nudo:[3,4,4,2],pala:[3,4,5,6],punta:[5,4,3,2]},
    tres:{nudo:[2,3,3,2],pala:[2,3,4,4],punta:[3,3,2,1]},
    perfil:{nudo:[2,3,3,2],pala:[2,2,3,3],punta:[3,2,2,1]}
  };
  function filas(tipo,largo){
    const a=ANCHOS[tipo],medio=Math.max(0,largo-a.nudo.length-a.pala.length-a.punta.length);
    const fin=a.pala[a.pala.length-1],w=[...a.nudo,...a.pala,...Array(medio).fill(fin),...a.punta];
    return w.slice(0,Math.max(6,largo));
  }
  function ancla(apariencia,dir,paso,pose=-1){
    if(pose>=0)return apariencia==='femenina'?{p:fp[((pose%4)+4)%4],tipo:'frente'}:{p:m[0],tipo:'frente'};
    const d=((dir%8)+8)%8,t=TIPO[d];if(!t)return null;
    const p=apariencia==='femenina'?(f[((paso%4)+4)%4||2]||f1)[d]:m[d];
    return p?{p,tipo:t}:null;
  }
  function dibujar(c,apariencia,dir,paso,pose=-1){
    const a=ancla(apariencia,dir,paso,pose);if(!a)return false;
    const [kx,ky,lean,largo]=a.p,ws=filas(a.tipo,largo);
    const rect=(x,y,w,col)=>{c.fillStyle=col;c.fillRect(x,y,w,1)};
    ws.forEach((w,i)=>{
      const dx=ws.length>1?Math.round(lean*i/(ws.length-1)):0,W=w+2,x0=Math.round(kx+dx-W/2),y=ky+i;
      rect(x0,y,1,K);rect(x0+W-1,y,1,K);
      for(let j=0;j<w;j++){const col=w===1?'R':j===0?'A':j===w-1?(w>=5?'E':'D'):(w>=4&&j===w-2)?'D':'R';rect(x0+1+j,y,1,pal[col])}
      if(i===0||i===ws.length-1){rect(x0,y,W,K)}                                  // tapa del nudo y punta de la pala
    });
    // sombra del nudo: una fila más oscura bajo el nudo (la pala sale por debajo)
    const wn=ws[ANCHOS[a.tipo].nudo.length-1],dn=Math.round(lean*(ANCHOS[a.tipo].nudo.length-1)/Math.max(1,ws.length-1)),Wn=wn+2;
    rect(Math.round(kx+dn-Wn/2)+1,ky+ANCHOS[a.tipo].nudo.length-1,wn,pal.E);
    return true;
  }
  return {ancla,dibujar,filas};
})();

/* Fase 3 · capa y medalla a medida. Ambas parten del eje del pecho de cada celda (ACC_CORBATA.ancla: eje, y del cuello, inclinación).
   Capa: el manto cuelga por DETRÁS del cuerpo en las vistas de frente, perfil y 3/4 (se ve por los lados y entre las piernas, con
   el forro más oscuro) y se dibuja POR ENCIMA de la espalda en las vistas de espaldas; las hombreras y el broche van sobre el
   pecho. En la marcha el vuelo cambia con el cuadro. Medalla: cinta en V al cuello y disco; de frente, 3/4 y perfil. */
const ACC_CAPA = (()=>{
  const K='#101326',C={L:'#ed4763',B:'#bb2450',M:'#9c183e',D:'#741537',E:'#54132f',G:'#ffcf3f',g:'#fff0a1',s:'#ad6a22'};
  // Manto: [y de arriba, y del borde, x izq. arriba, x der. arriba, x izq. borde, x der. borde]
  const MA={
    masculina:{0:[33,61,9,34,3,40],1:[33,61,11,32,4,37],2:[33,61,12,21,2,23],6:[33,61,22,31,20,42],7:[33,61,10,33,7,40],
               3:[31,61,11,31,5,37],4:[31,61,11,32,4,39],5:[31,61,13,33,7,39]},
    femenina:{0:[34,60,11,32,4,39],1:[35,60,10,30,3,35],2:[34,60,10,21,2,23],6:[34,60,22,33,20,42],7:[35,60,12,34,8,40],
              3:[33,60,10,30,4,36],4:[30,60,12,31,5,38],5:[33,60,13,34,7,40]}
  };
  const POR=[false,false,false,true,true,true,false,false];            // true: se dibuja por encima (espaldas)
  const R=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h)};
  function filas(a,dir,paso,pose){
    const [y0,y1,xl0,xr0,xl1,xr1]=a,sw=pose>=0?0:paso===1?1:paso===3?-1:0,n=y1-y0,out=[];
    for(let y=y0;y<=y1;y++){
      const u=(y-y0)/n,e=Math.pow(u,1.35),s=Math.round(sw*u*u*2);
      out.push([y,Math.round(xl0+(xl1-xl0)*e)+s,Math.round(xr0+(xr1-xr0)*e)+s]);
    }
    return out;
  }
  function manto(c,ap,dir,paso,pose,propio){
    const a=propio||(MA[ap]||MA.masculina)[dir];if(!a)return;
    const f=filas(a,dir,paso,pose),forro=propio?false:!POR[dir],n=f.length-1;
    const claro=forro?C.B:C.L,base=forro?C.M:C.B,oscuro=forro?C.D:C.M;
    f.forEach(([y,xl,xr],i)=>{
      const v=i/n,ancho=xr-xl;
      let hasta=xr;if(i===n){/* dobladillo ondulado */}
      for(let x=xl;x<=hasta;x++){
        if(i===n&&((x+paso)&2))continue;                                         // ondas del borde
        const u=(x-xl)/(ancho||1),fase=u+0.035*(paso===1?1:paso===3?-1:0);
        let col=base;
        if(u<0.12)col=claro;
        else if(v>0.08&&(Math.abs(fase-0.36)<0.055||Math.abs(fase-0.68)<0.055))col=oscuro;     // pliegues
        else if(u>0.84)col=oscuro;
        else if(fase>0.36&&fase<0.5)col=claro===C.L&&v<0.7?C.L:base;
        if(v>0.8)col=col===claro?base:col===base?oscuro:C.E;                      // la tela se oscurece hacia el borde
        R(c,x,y,1,1,col);
      }
      R(c,xl-1,y,1,1,K);R(c,xr+1,y,1,1,K);
    });
    const [y,xl,xr]=f[0];R(c,xl-1,y-1,xr-xl+3,1,K);                              // borde superior (cuello/hombros)
    const [yb,bl,br]=f[n];for(let x=bl;x<=br;x++)if(!((x+paso)&2))R(c,x,yb+1,1,1,K);else R(c,x,yb,1,1,K);
  }
  // Hombreras y broche sobre el pecho (vistas de frente, 3/4 y perfil)
  function hombros(c,ap,dir,paso,pose){
    const t=ACC_CORBATA.ancla(ap,dir,paso,pose);if(!t)return;
    const [kx,ky]=t.p,tipo=t.tipo,y=ky-1;
    const pieza=(x0,x1,sig)=>{                                                    // un hombro: tres filas que bajan hacia fuera
      for(let i=0;i<3;i++){
        const a=sig>0?x0:x0-i,b=sig>0?x1+i:x1,col=i===0?C.L:i===1?C.B:C.M;
        R(c,Math.min(a,b),y+i,Math.abs(b-a)+1,1,col);
        R(c,sig>0?b+1:a-1,y+i,1,1,K);
      }
      R(c,Math.min(x0,x1)-(sig>0?0:0),y-1,Math.abs(x1-x0)+1+(sig>0?1:0),1,K);
    };
    const cx=Math.round(kx);
    if(tipo==='frente'){pieza(cx+2,cx+9,1);pieza(cx-3,cx-10,-1)}
    else if(tipo==='tres'){const s=dir===1?1:-1;pieza(cx+2*s,cx+8*s,s);pieza(cx-2*s,cx-5*s,-s)}
    else{const s=dir===2?1:-1;pieza(cx-1*s,cx-8*s,-s)}
    // broche dorado (de frente 4×3; en perfil, 3×3 al borde del pecho)
    const w=tipo==='perfil'?3:4,x=Math.round(kx-w/2);
    R(c,x-1,y,w+2,4,K);R(c,x,y+1,w,2,C.G);R(c,x,y+1,1,1,C.g);R(c,x+w-1,y+2,1,1,C.s);
  }
  // El pelo que cae sobre la espalda (la cola de caballo) va por encima de la capa: se vuelven a pintar solo los píxeles de pelo
  // de la imagen BASE (ni piel ni camisa de rampa exacta ni contorno) en las filas del cuello a la cintura.
  const SK=['915231','bb7448','d99663','efb67d','facc99','ffe1b7'],SH=['102f5b','144374','17578f','206eab','3689c3','56a5d9'],memo=new WeakMap();
  function pelo(k,base,sx,sy){
    let m=memo.get(base);if(!m){m=new Map();memo.set(base,m)}
    const key=sx+','+sy;let tmp=m.get(key);
    if(tmp===undefined){
      tmp=null;
      try{
        if(!m.lienzo){const c0=base.getContext?base:document.createElement('canvas');if(!base.getContext){c0.width=base.width;c0.height=base.height;c0.getContext('2d').drawImage(base,0,0)}m.lienzo=c0}   // el atlas base, una sola vez
        const d=m.lienzo.getContext('2d').getImageData(sx,sy+26,44,15);
        const o=document.createElement('canvas');o.width=44;o.height=15;const g=o.getContext('2d'),out=g.createImageData(44,15);let n=0;
        for(let i=0;i<44*15;i++){
          const r=d.data[i*4],gg=d.data[i*4+1],b=d.data[i*4+2],a=d.data[i*4+3];if(!a)continue;
          const hx=[r,gg,b].map(v=>v.toString(16).padStart(2,'0')).join('');
          if(SK.includes(hx)||SH.includes(hx))continue;
          if(r>b+24&&r>=gg&&r+gg+b>150){out.data[i*4]=r;out.data[i*4+1]=gg;out.data[i*4+2]=b;out.data[i*4+3]=255;n++}
        }
        if(n){g.putImageData(out,0,0);tmp=o}
      }catch(e){tmp=null}
      m.set(key,tmp);
    }
    if(tmp)k.drawImage(tmp,0,26);
  }
  // icono de la tienda (32×32): el manto visto por la espalda con su broche
  function icono(c){
    manto(c,'masculina',4,0,-1,[4,28,8,23,3,28]);
    R(c,12,2,8,1,K);R(c,11,3,10,3,K);R(c,12,3,8,2,C.G);R(c,12,3,3,1,C.g);R(c,18,4,2,1,C.s);
    return true;
  }
  function detras(c,ap,dir,paso,pose=-1){if(POR[dir])return;manto(c,ap,dir,paso,pose)}
  function encima(c,ap,dir,paso,pose=-1){if(POR[dir])manto(c,ap,dir,paso,pose);else hombros(c,ap,dir,paso,pose)}
  return {detras,encima,manto,hombros,filas,MA,pelo,icono};
})();

const ACC_MEDALLA = (()=>{
  const K='#101326',C={G:'#ffcf3f',g:'#fff0a1',s:'#ad6a22',R:'#e05a76',r:'#9c2f4a',A:'#507bdf',a:'#2e4f9c'};
  const R=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h)};
  const DISCO=['..KKKK..','.KggGGK.','KgGGGGsK','KGGssGGK','KGGssGGK','KGGGGGsK','.KsGGsK.','..KKKK..'];
  const COL={K,g:C.g,G:C.G,s:C.s};
  function dibujar(c,ap,dir,paso,pose=-1){
    const t=ACC_CORBATA.ancla(ap,dir,paso,pose);if(!t)return false;
    const [kx,ky,lean]=t.p,tipo=t.tipo,dx=Math.round(lean*0.7);
    if(tipo==='perfil'){
      const x=Math.round(kx);
      for(let i=0;i<6;i++){R(c,x-1+Math.round(i*0.1),ky-1+i,1,1,K);R(c,x+Math.round(i*0.1),ky-1+i,1,1,i<3?C.A:C.R);R(c,x+1+Math.round(i*0.1),ky-1+i,1,1,K)}
      R(c,x-1,ky+6,4,1,K);R(c,x-1,ky+7,4,6,K);R(c,x,ky+7,2,5,C.G);R(c,x,ky+7,1,2,C.g);R(c,x+1,ky+10,1,2,C.s);R(c,x-1,ky+13,4,1,K);
      return true;
    }
    const cx=Math.round(kx+dx),w=tipo==='frente'?4:3;                         // cinta: dos bandas que bajan en V hacia el disco
    for(let i=0;i<6;i++){
      const a=Math.round(kx-w-1+i*(w-0.2)/5),b=Math.round(kx+w+1-i*(w-0.2)/5)-1;
      R(c,a-1,ky-1+i,1,1,K);R(c,a,ky-1+i,2,1,i<3?C.A:C.a);R(c,a+2,ky-1+i,1,1,K);
      R(c,b-2,ky-1+i,1,1,K);R(c,b-1,ky-1+i,2,1,i<3?C.R:C.r);R(c,b+1,ky-1+i,1,1,K);
    }
    const x0=cx-4,y0=ky+5;
    DISCO.forEach((f,j)=>{for(let i=0;i<8;i++)if(f[i]!=='.')R(c,x0+i,y0+j,1,1,COL[f[i]])});
    // aro del que cuelga: dos píxeles oscuros sobre el disco
    R(c,cx-1,y0-1,2,1,K);
    return true;
  }
  return {dibujar};
})();

/* Fase 4 · corona a medida de la cabeza de cada celda. Un aro elíptico (arco cercano grueso y arco lejano fino) de la anchura de la
   cabeza a la altura de la frente, con cinco puntas repartidas a 72° y giradas con la dirección del personaje: las cercanas salen del
   aro cercano y las lejanas asoman por encima, así de frente, 3/4, perfil y espaldas cambian las puntas y la gema delantera.
   Medidas [centro, radio] por celda en T (las calcula scripts/calcula-corona.mjs sobre los atlas v40.6). */
const ACC_CORONA = (()=>{
  const K='#101326',G='#ffcf3f',g='#fff0a1',s='#ad6a22',RJ='#e43f72',rj='#ff9cb5';
  const YB={masculina:7,femenina:9},YAW=[0,45,90,135,180,-135,-90,-45],RY=2;
  const T={"masculina":{"caminar":[[[21.5,15]],[[20,15.5]],[[21.5,15]],[[22,14.5]],[[20.5,15]],[[20,14.5]],[[21.5,15]],[[22,15.5]]],"portada":[[21.5,15],[21.5,15],[21.5,15],[21.5,15]]},"femenina":{"caminar":[[[21.5,14],[21,13.5],[21.5,14]],[[23,15.5],[22.5,16],[22.5,16]],[[21.5,15],[21,15.5],[20,15.5]],[[21.5,15],[22.5,15],[21.5,15]],[[21.5,14],[21,13.5],[21.5,14]],[[21.5,16],[20.5,15],[21.5,16]],[[22,15.5],[22,15.5],[23,15.5]],[[22,15.5],[21.5,15],[21,15.5]]],"portada":[[21.5,13],[21.5,13],[21.5,12],[19,12.5]]}};
  const R=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h)};
  function ancla(ap,dir,paso,pose=-1){
    const f=ap==='femenina'?'femenina':'masculina',t=T[f];
    if(pose>=0){const [cx,rx]=t.portada[((pose%4)+4)%4];return {cx,rx,yb:YB[f],yaw:0}}
    const d=((dir%8)+8)%8,i=f==='femenina'?((((paso%4)+4)%4)||2)-1:0,[cx,rx]=t.caminar[d][i];
    return {cx,rx,yb:YB[f],yaw:YAW[d]};
  }
  const prof=(u)=>RY*Math.sqrt(Math.max(0,1-u*u));
  // punta triangular: base de ancho bw (impar) que se estrecha hasta una perla; luz a la izquierda, sombra a la derecha
  function punta(c,x,base,h,bw){
    const px=Math.round(x);
    for(let i=0;i<h;i++){
      const w=Math.max(1,2*Math.round((bw*(1-i/h)-1)/2)+1),y=base-i,x0=px-(w-1)/2;
      R(c,x0-1,y,1,1,K);R(c,x0+w,y,1,1,K);
      for(let j=0;j<w;j++)R(c,x0+j,y,1,1,i===h-1?g:j===0&&w>1?g:j===w-1&&w>1?s:G);
    }
    R(c,px-1,base-h,3,1,K);R(c,px,base-h+0,1,1,K);
  }
  function dibujar(c,ap,dir,paso,pose=-1,propio=null){
    const a=propio||ancla(ap,dir,paso,pose),{cx,rx,yb,yaw}=a,rad=Math.PI/180,x0=Math.round(cx-rx),x1=Math.round(cx+rx)-1;
    const pts=[0,1,2,3,4].map(i=>{const q=(yaw+72*i)*rad;return {x:cx+0.88*rx*Math.sin(q),cos:Math.cos(q)}});
    const bw=p=>Math.max(3,Math.round(5.5*Math.abs(p.cos)+0.5)|1);
    // arco lejano: línea fina por dentro de la corona, con sus puntas detrás
    for(const p of pts)if(p.cos<0){const u=(p.x-cx)/rx;punta(c,p.x,Math.round(yb-prof(u))-1,4,bw(p))}
    for(let x=x0;x<=x1;x++){const u=(x+0.5-cx)/rx,y=Math.round(yb-prof(u));R(c,x,y-1,1,1,K);R(c,x,y,1,1,s)}
    // arco cercano: cuatro filas (luz, oro, oro, sombra) con contorno y perlas
    for(let x=x0;x<=x1;x++){
      const u=(x+0.5-cx)/rx,y=yb+Math.round(prof(u));
      R(c,x,y-1,1,1,K);R(c,x,y,1,1,g);R(c,x,y+1,1,1,G);R(c,x,y+2,1,1,G);R(c,x,y+3,1,1,s);R(c,x,y+4,1,1,K);
      if(((x-x0)%6)===3)R(c,x,y+1,1,2,g);
    }
    for(let y=yb-1;y<=yb+RY+4;y++){R(c,x0-1,y,1,1,K);R(c,x1+1,y,1,1,K)}
    // puntas cercanas sobre el arco cercano
    for(const p of pts)if(p.cos>=0){const u=(p.x-cx)/rx;punta(c,p.x,yb+Math.round(prof(u))-2,p.cos>0.9?6:5,bw(p))}
    // gema delantera (solo si el frente mira al espectador)
    const q=yaw*rad;
    if(Math.cos(q)>0.3){const xg=Math.round(cx+0.88*rx*Math.sin(q)),u=(xg-cx)/rx,y=yb+Math.round(prof(u));
      R(c,xg-2,y+1,5,3,K);R(c,xg-1,y+1,3,2,RJ);R(c,xg-1,y+1,1,1,rj);R(c,xg,y+3,1,1,RJ)}
  }
  // icono de la tienda: la corona de frente
  function icono(c){dibujar(c,'masculina',0,0,-1,{cx:16,rx:13,yb:14,yaw:0});return true}
  return {ancla,dibujar,icono,T};
})();

/* Fase 4 · taza de café sujeta por la mano de cada celda. La mano (el puño de la piel de la rampa exacta bajo la cintura) sale de
   scripts/calcula-cafe.mjs: [lado, x izq., x der., y de abajo]; la taza se dibuja POR ENCIMA del cuerpo con el asa sobre la mano y
   sube y baja con ella en la marcha. Lado +1: la taza queda a la derecha de la mano; -1, a la izquierda. El vapor cambia con el paso. */
const ACC_CAFE = (()=>{
  const K='#101326',C={b:'#5a2e1c',h:'#ffead0',c:'#d9a66d',d:'#9c623d',v:'#cfe6f2'};
  const T={"masculina":{"caminar":[[[1,32,36,51]],[[1,32,35,50]],[[1,17,23,52]],[[1,26,33,52]],[[1,31,36,52]],[[-1,9,16,52]],[[-1,20,26,53]],[[-1,7,11,51]]],"portada":[[1,32,36,51],[1,32,36,51],[-1,6,11,51],[-1,6,11,51]]},"femenina":{"caminar":[[[1,30,34,53],[1,31,34,54],[1,30,34,51],[1,29,35,54]],[[1,30,34,51],[1,30,32,50],[1,30,34,51],[1,30,34,50]],[[1,24,31,52],[1,24,30,54],[1,24,31,52],[1,25,32,54]],[[1,27,33,52],[1,28,34,54],[1,28,33,51],[1,27,33,54]],[[1,30,34,50],[1,30,35,53],[1,30,34,51],[1,30,34,52]],[[-1,9,14,51],[-1,9,16,54],[-1,9,15,52],[-1,7,14,54]],[[-1,14,20,53],[-1,22,28,54],[-1,14,20,53],[-1,15,21,53]],[[-1,10,14,51],[-1,8,14,53],[-1,10,14,51],[-1,6,12,53]]],"portada":[[1,30,34,52],[1,30,34,52],[1,30,32,51],[-1,7,11,51]]}};
  // taza de 11×10 con el asa a la izquierda (lado +1) y el hueco del asa abierto para que se vea la mano; el lado -1 la dibuja del otro lado
  const TAZA=['...KKKKKKKK','...KbbbbbbK','...KhccccdK','.KKKhccccdK','.K.KhccccdK','.K.KhccccdK','.K.KhccccdK','.KKKhccccdK','...KccccddK','....KKKKKK.'];
  const VAPOR=[[[5,-1],[5,-2],[8,-2]],[[6,-1],[6,-2],[5,-3]],[[7,-1],[7,-2],[8,-3]],[[5,-1],[6,-2],[6,-3]]];
  function ancla(ap,dir,paso,pose=-1){
    const f=ap==='femenina'?'femenina':'masculina',t=T[f];
    if(pose>=0)return t.portada[((pose%4)+4)%4];
    return t.caminar[((dir%8)+8)%8][f==='femenina'?((paso%4)+4)%4:0];
  }
  function caja(ap,dir,paso,pose=-1){
    const [lado,hx0,hx1,hy1]=ancla(ap,dir,paso,pose),hc=Math.round((hx0+hx1)/2);
    // el asa (columna 2 de la taza) queda sobre el centro de la mano
    const x=lado>0?Math.min(hc-2,44-11):Math.max(hc+2-10,0),y=hy1-7;
    return {lado,x,y};
  }
  function taza(c,x,y,lado,paso){
    const px=(i)=>lado>0?x+i:x+10-i;
    TAZA.forEach((fila,j)=>{for(let i=0;i<11;i++){const ch=fila[i];if(ch==='.')continue;c.fillStyle=ch==='K'?K:C[ch];c.fillRect(px(i),y+j,1,1)}});
    c.fillStyle=C.v;for(const [i,dy] of VAPOR[((paso%4)+4)%4])c.fillRect(px(i),y+dy,1,1);
  }
  function dibujar(c,ap,dir,paso,pose=-1){const {lado,x,y}=caja(ap,dir,paso,pose);taza(c,x,y,lado,paso);return true}
  // icono de la tienda (32×32): la taza al doble de tamaño con su vapor
  function icono(c){c.save();c.translate(5,3);c.scale(2,2);taza(c,0,3,1,0);c.restore();return true}
  return {ancla,caja,dibujar,icono,T,TAZA};
})();

/* Accesorios pixel art: un solo catálogo de arte para las tarjetas y el cuerpo.
   Coordenadas nativas 44×74; no modifican ancla ni caja de colisión. */
const ACC_ARTE = (()=>{
  const oscuro='#101326', oro='#ffcf3f', luz='#fff0a1', sombra='#ad6a22', azul='#4678c2', acero='#a9c4e7';
  const ids=['cafe','gafas','corbata','gorra','audifonos','medalla','capa','gato','corona'];
  /* el gato: sentado de frente (o de espaldas) con la cola en «J». Mismo dibujo, mismos colores y misma cara que en los
     retratos (scripts/lib-accesorios-retrato.mjs): K contorno, O naranja, o rayas, L luz, W crema, E ojo, e brillo, N nariz */
  const GATO_COL={K:'#2a150d',O:'#e99443',o:'#c06a26',L:'#f7b765',W:'#ffe5bd',E:'#101326',e:'#ffffff',N:'#e97a8b'};
  const GATO_COLA=['....','....','....','....','....','.KK.','.KOK','.KOK','.KOK','KOOK','KOK.','KK..','....'];
  const GATO_F=['.KK........KK.','KOOK......KOOK','KOLOKKKKKKOLOK','KOOOOOOOOOOOOK','KOoOOOOOOOOoOK','KOOEeOOOOEeOOK','KOOOOOWWOOOOOK','.KOOOWNNWOOOK.','.KKOOWWWWOOKK.','..KOOOWWOOOK..','.KOOWWWWWWOOK.','.KWWWWWWWWWWK.','.KKKKKKKKKKKK.'];
  const GATO_E=['.KK........KK.','KOOK......KOOK','KOOOKKKKKKOOOK','KOoOOOOOOOOoOK','KOOOOoOOoOOOOK','KOoOOOOOOOOoOK','KOOOOoOOoOOOOK','.KOoOOOOOOoOK.','.KOOOOoOOOOOK.','..KOOOOOOOOK..','.KOOoOOOOoOOK.','.KOOOOOOOOOOK.','.KKKKKKKKKKKK.'];
  function pieza(ctx,id,x,y,lado=0){
    const r=(a,b,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x+a,y+b,w,h)};
    switch(id){
      case 'cafe':
        r(2,0,1,3,'#b8d9ed');r(5,1,1,2,'#b8d9ed');r(0,4,9,9,oscuro);r(8,6,4,5,oscuro);r(9,7,2,3,'#d5ac81');r(1,5,7,7,'#d9a66d');r(1,5,7,2,'#74422c');r(2,7,2,4,'#ffead0');r(2,12,6,1,'#9c623d');break;
      case 'gafas': {
        /* marco fino con el cristal TRANSPARENTE (se ven los ojos). lado: 0 frente de él, 3 frente de ella, ±1 perfil (der/izq),
           4 tres cuartos, 2 icono (con el cristal teñido) */
        const lente='#d6f8ff',tinte=lado===2?'#31728b':null;
        const aro=(a,b,w,h)=>{r(a+1,b,w-2,1,oscuro);r(a+1,b+h-1,w-2,1,oscuro);r(a,b+1,1,h-2,oscuro);r(a+w-1,b+1,1,h-2,oscuro);if(tinte)r(a+1,b+1,w-2,h-2,tinte);r(a+1,b+1,2,1,lente)};
        if(lado===1||lado===-1){aro(0,0,7,6);r(lado>0?-6:7,2,6,1,oscuro)}
        else if(lado===4){aro(0,0,7,6);aro(7,0,7,6);r(-1,2,1,1,oscuro);r(14,2,1,1,oscuro)}
        else if(lado===3){aro(0,0,8,7);aro(15,0,8,7);r(8,2,7,1,oscuro);r(-1,2,1,1,oscuro);r(23,2,1,1,oscuro)}
        else{aro(0,0,8,6);aro(11,0,8,6);r(8,2,3,1,oscuro);r(-1,2,1,1,oscuro);r(19,2,1,1,oscuro)}
        break;
      }
      case 'corbata':
        r(3,0,5,4,oscuro);r(4,1,3,2,'#ff7381');r(3,4,5,9,oscuro);r(2,12,7,3,oscuro);r(3,5,4,8,'#b91d46');r(4,5,2,8,'#ff5468');r(4,15,3,2,oscuro);r(5,14,1,2,'#ff5468');break;
      case 'gorra':
        r(4,0,13,2,oscuro);r(2,2,17,3,oscuro);r(0,5,21,6,oscuro);r(3,2,15,3,azul);r(1,5,19,4,'#27477e');r(5,3,7,2,'#78a7e2');r(9,5,4,3,'#91c9f4');r(lado<0?-3:lado>0?14:2,10,lado?10:17,3,oscuro);r(lado<0?-2:lado>0?15:3,10,lado?8:15,1,azul);break;
      case 'audifonos':
        r(5,0,16,2,oscuro);r(3,2,20,2,oscuro);r(2,4,3,10,oscuro);r(21,4,3,10,oscuro);r(6,1,14,1,acero);r(4,3,3,1,azul);r(20,3,2,1,azul);for(const a of [0,21]){r(a,10,5,9,oscuro);r(a+1,11,3,7,'#486291');r(a+1,12,1,4,'#6fd2f0')}break;
      case 'medalla':
        r(0,0,3,5,'#e05a76');r(7,0,3,5,'#507bdf');r(2,4,6,3,'#aeb7d8');r(2,7,6,1,oscuro);r(1,8,8,6,oscuro);r(2,9,6,4,oro);r(3,9,2,2,luz);r(4,13,3,1,sombra);break;
      case 'capa':
        r(3,0,20,3,oscuro);r(2,3,22,10,oscuro);r(0,13,26,20,oscuro);r(2,14,22,17,'#9c183e');r(4,3,18,14,'#bb2450');r(5,5,4,25,'#ed4763');r(16,5,5,26,'#741537');r(3,31,20,2,'#54132f');break;
      case 'gato': {
        const filas=(lado===1?GATO_E:GATO_F).map((f,j)=>lado===2?f:f+GATO_COLA[j]);   // lado 1: de espaldas, 2: sin cola (icono)
        filas.forEach((f,j)=>{for(let i=0;i<f.length;i++)if(f[i]!=='.')r(i,j,1,1,GATO_COL[f[i]])});break;
      }
      case 'corona':
        r(0,0,4,4,oscuro);r(8,0,4,4,oscuro);r(16,0,4,4,oscuro);r(0,4,20,7,oscuro);r(1,1,2,4,oro);r(9,1,2,4,luz);r(17,1,2,4,oro);r(2,4,16,5,oro);r(3,5,14,1,luz);r(3,9,14,1,sombra);r(9,6,2,2,'#e43f72');r(4,6,2,2,'#6fd2f0');r(14,6,2,2,'#6fd2f0');break;
    }
  }
  // capa frontal por detrás del cuerpo; en vista posterior queda sobre la espalda.
  function detras(ctx,id,dir,paso,apariencia='masculina',pose=-1,calibrado=true){
    if(calibrado&&id==='capa'){ACC_CAPA.detras(ctx,apariencia,dir,paso,pose);return}
    if(id!=='capa'||![0,1,2,6,7].includes(dir))return;
    const d=paso===1?1:paso===3?-1:0;
    // Silueta inclinada en perfil: la tela cae detrás, nunca delante del pecho.
    if(dir===2||dir===6){ctx.save();if(dir===6){ctx.translate(44,0);ctx.scale(-1,1)}
      ctx.fillStyle=oscuro;ctx.fillRect(13,33,10,8);ctx.fillRect(10,40,13,9);ctx.fillRect(6+d,49,17-d,13);ctx.fillRect(4+d,60,18-d,3);
      ctx.fillStyle='#ac2149';ctx.fillRect(14,34,8,7);ctx.fillRect(11,41,11,8);ctx.fillRect(7+d,50,15-d,11);
      ctx.fillStyle='#ef4c67';ctx.fillRect(8+d,51,3,9);ctx.restore();return;
    }
    ctx.fillStyle=oscuro;ctx.fillRect(9,33,26,9);ctx.fillRect(6+d,41,32,12);ctx.fillRect(3+d,52,38,11);
    ctx.fillStyle='#9c183e';ctx.fillRect(10,34,24,8);ctx.fillRect(7+d,42,30,10);ctx.fillRect(4+d,53,36,9);
    ctx.fillStyle='#e24863';ctx.fillRect(7+d,48,3,14);ctx.fillStyle='#641736';ctx.fillRect(34+d,48,4,14);
  }
  function encima(ctx,id,dir,paso,apariencia,pose=-1,calibrado=true){
    if(!ids.includes(id))return;
    if(calibrado&&(id==='gafas'||id==='audifonos')){ACC_CABEZA.dibujar(ctx,id,apariencia,dir,paso,pose);return;}
    if(calibrado&&id==='gorra'&&ACC_GORRA.dibujar(ctx,apariencia,dir,paso,pose))return;
    if(calibrado&&id==='corbata'){ACC_CORBATA.dibujar(ctx,apariencia,dir,paso,pose);return;}
    if(calibrado&&id==='capa'){ACC_CAPA.encima(ctx,apariencia,dir,paso,pose);return;}
    if(calibrado&&id==='medalla'){ACC_MEDALLA.dibujar(ctx,apariencia,dir,paso,pose);return;}
    if(calibrado&&id==='corona'){ACC_CORONA.dibujar(ctx,apariencia,dir,paso,pose);return;}
    if(calibrado&&id==='cafe'){ACC_CAFE.dibujar(ctx,apariencia,dir,paso,pose);return;}
    const frente=[0,1,7].includes(dir), perfil=dir===2||dir===6, espalda=[3,4,5].includes(dir), izq=[5,6,7].includes(dir), der=[1,2,3].includes(dir);
    const dx=der?4:izq?-4:0, femenino=apariencia==='femenina', cuello=femenino?31:32;
    // Ajustes pequeños según orientación; el pie siempre queda en 74.
    if(id==='gafas'&&(frente||perfil)){
      /* dónde están los ojos en cada dirección (medidos en los atlas; los de ella van más bajos y más separados) */
      if(perfil)pieza(ctx,id,izq?11:26,femenino?20:16,izq?-1:1);
      else if(dir===0)femenino?pieza(ctx,id,11,20,3):pieza(ctx,id,13,16,0);
      else if(femenino)pieza(ctx,id,der?14:8,20,4);
      else pieza(ctx,id,der?19:11,16,4);
    }
    if(id==='gorra')pieza(ctx,id,11+dx/2,0,izq?-1:der?1:0);
    if(id==='corona')pieza(ctx,id,12+dx/2,0);
    if(id==='audifonos')pieza(ctx,id,9+dx/2,2);
    if(id==='corbata'&&(frente||perfil))pieza(ctx,id,18+dx,cuello);
    if(id==='medalla'&&(frente||perfil))pieza(ctx,id,17+dx,cuello);
    if(id==='capa'&&espalda)pieza(ctx,id,9+(paso===1?1:paso===3?-1:0),cuello);
    if(id==='capa'&&frente){ctx.fillStyle=oro;ctx.fillRect(11+dx,cuello+2,2,2);ctx.fillRect(30+dx,cuello+2,2,2)}
    if(id==='cafe')pieza(ctx,id,perfil?(izq?5:26):(izq||pose>=2)?3:28,44+(paso===1?-2:paso===3?2:0));
    // el gato de oficina ya no se pinta sobre el cuerpo: es un acompañante independiente (js/gato.js)
  }
  function icono(cv,id){
    const ctx=cv.getContext('2d');ctx.clearRect(0,0,cv.width,cv.height);ctx.save();ctx.imageSmoothingEnabled=false;
    // Icono nativo 32×32; capa en miniatura para caber sin recortar.
    if(id==='gafas'){ctx.translate(-6,-5);ACC_CABEZA.dibujar(ctx,id,'masculina',0,0)}
    else if(id==='audifonos'){ctx.translate(-6,3);ACC_CABEZA.dibujar(ctx,id,'masculina',0,0)}
    else if(id==='gorra'&&ACC_GORRA.icono(ctx,-1,9)){}
    else if(id==='corbata'){ctx.translate(16,16);ctx.scale(2,2);ctx.translate(-21.5,-38.5);ACC_CORBATA.dibujar(ctx,'masculina',0,0)}
    else if(id==='gato'&&typeof GATO!=='undefined'&&GATO.icono(ctx)){}
    else if(id==='capa'&&ACC_CAPA.icono(ctx)){}
    else if(id==='corona'&&ACC_CORONA.icono(ctx)){}
    else if(id==='cafe'&&ACC_CAFE.icono(ctx)){}
    else if(id==='medalla'){ctx.translate(16,16);ctx.scale(2,2);ctx.translate(-21.5,-38);ACC_MEDALLA.dibujar(ctx,'masculina',0,0)}
    else if(id==='capa'){ctx.translate(7,4);ctx.scale(.7,.7);pieza(ctx,id,0,0)}
    else if(id===''){ctx.strokeStyle='#ff5468';ctx.lineWidth=3;ctx.beginPath();ctx.arc(16,16,10,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(9,9);ctx.lineTo(23,23);ctx.stroke()}
    else {const dims={cafe:[12,13],gafas:[19,6],corbata:[11,17],gorra:[21,13],audifonos:[26,19],medalla:[10,15],gato:[14,13],corona:[20,11]};const d=dims[id];if(d){const k=Math.min(2,Math.floor(28/Math.max(...d)));ctx.translate(Math.floor((32-d[0]*k)/2),Math.floor((32-d[1]*k)/2));ctx.scale(k,k);pieza(ctx,id,0,0,id==='gafas'||id==='gato'?2:0)}}
    ctx.restore();
  }
  return {ids,detras,encima,icono,colores:{oscuro,oro,luz,sombra,azul,acero,gato:GATO_COL}};
})();

const APRENDIZ = (() => {
  const DIRS = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'];
  const FW = 44, FH = 74;                       // tamaño de cada cuadro en el atlas
  const idx = {}; DIRS.forEach((d, i) => idx[d] = i);

  /* Colores base del sprite (paleta del atlas): la camisa azul y la piel clara.
     El recoloreo toca solo los píxeles cercanos a estos, así el pelo, los
     jeans y el contorno se quedan como están. */
  const SHIRT = [0x17, 0x68, 0x9d], SKIN = [0xf5, 0xcb, 0x9a];
  const TOL2 = 70 * 70;                          // radio² de color para considerar "camisa"/"piel"
  const lum = (r, g, b) => 0.3 * r + 0.59 * g + 0.11 * b;
  const LSHIRT = lum(...SHIRT), LSKIN = lum(...SKIN);
  const dist2 = (r, g, b, c) => { const a = r - c[0], d = g - c[1], e = b - c[2]; return a * a + d * d + e * e; };
  const hexRGB = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

  let listo = false;
  const img = new Image();
  img.onload = () => { listo = true; };
  img.src = 'img/aprendiz-caminar.png';
  // Nuevo arte opcional del protagonista. No sustituye el atlas de los NPC.
  let listoHD = false, listoPortada = false;
  const imgHD = new Image(), imgPortada = new Image();
  imgHD.onload = () => { listoHD = true; };
  imgPortada.onload = () => { listoPortada = true; };
  imgHD.src = 'img/aprendiz-caminar-hd.png';
  imgPortada.src = 'img/aprendiz-portada-hd.png';
  let listaFemenina=false, listaPortadaFemenina=false;
  const imgFemenina=new Image(), imgPortadaFemenina=new Image();
  imgFemenina.onload=()=>{listaFemenina=true};
  imgPortadaFemenina.onload=()=>{listaPortadaFemenina=true};
  imgFemenina.src='img/aprendiz-femenina-caminar.png';
  imgPortadaFemenina.src='img/aprendiz-femenina-portada.png';
  // Masculino premium: atlas independiente. Los HD anteriores siguen como respaldo.
  let listoPremium=false, listoPortadaPremium=false;
  const imgPremium=new Image(), imgPortadaPremium=new Image();
  imgPremium.onload=()=>{listoPremium=true};
  imgPortadaPremium.onload=()=>{listoPortadaPremium=true};
  imgPremium.src='img/aprendiz-masculino-premium-caminar.png';
  imgPortadaPremium.src='img/aprendiz-masculino-premium-portada.png';
  const esJugador=(s,c)=>typeof s!=='string'&&typeof c!=='string';
  const origenDe=(s,c,apariencia=S.apariencia)=>esJugador(s,c) ? (apariencia==='femenina'&&listaFemenina?imgFemenina:listoPremium?imgPremium:listoHD?imgHD:img) : img;
  const listaOrigen=o=>o===img?listo:o===imgHD?listoHD:o===imgPortada?listoPortada:o===imgFemenina?listaFemenina:o===imgPortadaFemenina?listaPortadaFemenina:o===imgPremium?listoPremium:listoPortadaPremium;
  const paletaExacta=o=>o===imgFemenina||o===imgPortadaFemenina||o===imgPremium||o===imgPortadaPremium;
  const claveRGB=(r,g,b)=>(r<<16)|(g<<8)|b;
  const palCamisa=new Set([[16,47,91],[20,67,116],[23,87,143],[32,110,171],[54,137,195],[86,165,217]].map(p=>claveRGB(...p)));
  const palPiel=new Set([[145,82,49],[187,116,72],[217,150,99],[239,182,125],[250,204,153],[255,225,183]].map(p=>claveRGB(...p)));
  const PASOS = 4;                               // columnas de la caminata

  /* Atlas recoloreado a (skin,camisa). Multiplica el color destino por el brillo
     relativo de cada píxel, así conserva el sombreado del sprite. */
  const cache = new Map();
  function atlasDe(s, c, origen = origenDe(s,c)) {
    const clave = (origen===imgPremium?'masculino-premium:':origen===imgPortadaPremium?'masculino-premium-portada:':origen === imgPortadaFemenina?'femenina-portada:':origen===imgFemenina?'femenina:':origen === imgPortada ? 'portada:' : origen === imgHD ? 'hd:' : 'clasico:') + s + ':' + c;
    let cv = cache.get(clave);
    if (cv) return cv;
    cv = document.createElement('canvas');
    cv.width = origen.width; cv.height = origen.height;
    const cx = cv.getContext('2d');
    cx.drawImage(origen, 0, 0);
    /* Al abrir con doble clic (file://) el navegador "contamina" el canvas y
       getImageData lanza SecurityError: no se puede recolorear. En ese caso se
       deja el sprite con sus colores originales, sin romper nada. Sobre http/
       https (que es como se juega de verdad) sí recolorea. */
    try {
      /* c y s son el número de la camisa/piel del jugador, o un color "#rrggbb"
         suelto (los personajes del pasillo, js/consejos.js, usan el suyo) */
      const camisa = hexRGB(typeof c === 'string' ? c : (CAMISAS[c] || CAMISAS[0]));
      const piel = hexRGB(typeof s === 'string' ? s : (SKINS[s] || SKINS[0]));
      const d = cx.getImageData(0, 0, cv.width, cv.height), px = d.data;
      for (let i = 0; i < px.length; i += 4) {
        if (px[i + 3] === 0) continue;
        const r = px[i], g = px[i + 1], b = px[i + 2];
        if (paletaExacta(origen)?palCamisa.has(claveRGB(r,g,b)):dist2(r, g, b, SHIRT) < TOL2) { const k = lum(r, g, b) / (paletaExacta(origen)?lum(32,110,171):LSHIRT);
          px[i] = Math.min(255, camisa[0] * k); px[i + 1] = Math.min(255, camisa[1] * k); px[i + 2] = Math.min(255, camisa[2] * k);
        } else if (paletaExacta(origen)?palPiel.has(claveRGB(r,g,b)):dist2(r, g, b, SKIN) < TOL2) { const k = lum(r, g, b) / (paletaExacta(origen)?lum(250,204,153):LSKIN);
          px[i] = Math.min(255, piel[0] * k); px[i + 1] = Math.min(255, piel[1] * k); px[i + 2] = Math.min(255, piel[2] * k);
        }
      }
      cx.putImageData(d, 0, 0);
    } catch (e) { /* file://: sin recoloreo, el sprite sale con sus colores */ }
    cache.set(clave, cv);
    return cv;
  }

  /* Dirección a la que mira según el movimiento (dx,dy en px; dy hacia abajo,
     como el canvas). Sin movimiento mira de frente (sur). */
  function dirDe(dx, dy) {
    if (!dx && !dy) return idx.south;
    const oct = ((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8;
    // 0=E, 1=SE, 2=S, 3=SW, 4=W, 5=NW, 6=N, 7=NE
    return [idx.east, idx['south-east'], idx.south, idx['south-west'], idx.west, idx['north-west'], idx.north, idx['north-east']][oct];
  }

  /* Cuadro de la caminata para quien se está moviendo: avanza cada `cada` ms
     (135 ms ≈ 7 pasos por segundo, lo que pide el arte). Quieto, el 0. */
  const pasoDe = (mueve, ms = performance.now(), cada = 135) => mueve ? Math.floor(ms / cada) % PASOS : 0;

  /* Pinta el cuadro (dir, paso) centrado en x, con el PIE en yPie y ese alto
     lógico. Devuelve false si el atlas aún no cargó (quien llama pinta su
     respaldo). */
  // Lienzo reutilizado: las capas se componen a resolución nativa antes de escalar.
  let compuesto;
  function cuadro(cv, sx, sy, acc, dir, paso, apariencia, pose=-1, calibrado=true, base=null){
    if(!ACC_ARTE.ids.includes(acc))return null;
    if(!compuesto){compuesto=document.createElement('canvas');compuesto.width=FW;compuesto.height=FH}
    const k=compuesto.getContext('2d');k.clearRect(0,0,FW,FH);k.imageSmoothingEnabled=false;
    ACC_ARTE.detras(k,acc,dir,paso,apariencia,pose,calibrado);k.drawImage(cv,sx,sy,FW,FH,0,0,FW,FH);ACC_ARTE.encima(k,acc,dir,paso,apariencia,pose,calibrado);
    if(calibrado&&acc==='capa'&&[3,4,5].includes(dir)&&pose<0&&base)ACC_CAPA.pelo(k,base,sx,sy);
    return compuesto;
  }
  function dibujar(ctx, x, yPie, alto, dir, paso = 0, s = S.skin, c = S.camisa, apariencia = S.apariencia, acc = S.acc) {
    const origen = origenDe(s,c,apariencia);
    if (!listaOrigen(origen)) return false;
    const cv = atlasDe(s, c, origen);
    const w = Math.round(alto * FW / FH);
    const antes = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    const sx=(paso % PASOS)*FW,sy=dir*FH, extra=esJugador(s,c)?cuadro(cv,sx,sy,acc,dir,paso,origen===imgFemenina?'femenina':'masculina',-1,paletaExacta(origen),origen):null;
    ctx.drawImage(extra||cv,extra?0:sx,extra?0:sy,FW,FH,Math.round(x-w/2),Math.round(yPie-alto),w,alto);
    ctx.imageSmoothingEnabled = antes;
    return true;
  }

  // Poses de portada: 0 reposo, 1 parpadeo, 2 y 3 saludo.
  function dibujarPortada(ctx, x, yPie, alto, pose = 0, s = S.skin, c = S.camisa, apariencia = S.apariencia, acc = S.acc) {
    const origen=esJugador(s,c)&&apariencia==='femenina'?imgPortadaFemenina:esJugador(s,c)&&listoPortadaPremium?imgPortadaPremium:imgPortada;
    if (!listaOrigen(origen)) return dibujar(ctx,x,yPie,alto,idx.south,0,s,c,apariencia,acc);
    const cv = atlasDe(s,c,origen), w = Math.round(alto * FW / FH);
    const antes = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    const sx=(pose%4)*FW, extra=esJugador(s,c)?cuadro(cv,sx,0,acc,0,0,origen===imgPortadaFemenina?'femenina':'masculina',pose,paletaExacta(origen),origen):null;
    ctx.drawImage(extra||cv,extra?0:sx,0,FW,FH,Math.round(x-w/2),Math.round(yPie-alto),w,alto);
    ctx.imageSmoothingEnabled = antes;
    return true;
  }
  return { DIRS, idx, FW, FH, PASOS, dirDe, pasoDe, dibujar, dibujarPortada, atlasDe, get listo() { return listo || listoHD || listaFemenina || listoPremium; }, get listoHD(){return listoHD}, get listoPremium(){return listoPremium}, get listoPortadaPremium(){return listoPortadaPremium}, get listaFemenina(){return listaFemenina}, get listoPortada() { return S.apariencia==='femenina'?listaPortadaFemenina:(listoPortadaPremium||listoPortada); } };
})();
