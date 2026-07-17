'use strict';
/* ══════════════════════════════════════════
   PRACTICANTE EN APUROS 3 · SENA 32-BIT
   10 días de etapa productiva · 5 minijuegos
   ══════════════════════════════════════════ */
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const az=a=>a.map(x=>[Math.random(),x]).sort((p,q)=>p[0]-q[0]).map(p=>p[1]);

/* ── DATOS ── */
const SKINS=['#f4c898','#d99b66','#a86a3c','#6f4526'];
const CAMISAS=['#39a900','#13648c','#8c3df0','#c22e44'];
const ACCS=[
  {id:'cafe',    ico:'☕', precio:150},
  {id:'gafas',   ico:'🤓', precio:250},
  {id:'corbata', ico:'👔', precio:350},
  {id:'gorra',   ico:'🧢', precio:400},
  {id:'audifonos',ico:'🎧',precio:500},
  {id:'medalla', ico:'🏅', precio:800},
  {id:'capa',    ico:'🦸', precio:1200},
  {id:'gato',    ico:'🐱', precio:1500},
  {id:'corona',  ico:'👑', precio:2500},
];
const MEJORAS=[
  {id:'vida',  ico:'💖', precio:600},
  {id:'tiempo',ico:'⏰', precio:700},
  {id:'iman',  ico:'🧲', precio:900},
  {id:'doble', ico:'💰', precio:1000},
  {id:'escudo',ico:'🛡️', precio:1200},
];
/* Dificultad: vida = vidas extra/menos · tiempo = factor de tiempo · jefe = factor de agresividad */
const DIFS=[
  {id:0, ico:'🌱', es:'PRÁCTICA',  en:'PRACTICE',  vida:1,  tiempo:1.3, jefe:0.75},
  {id:1, ico:'⚔️', es:'NORMAL',    en:'NORMAL',    vida:0,  tiempo:1,   jefe:1},
  {id:2, ico:'💀', es:'PESADILLA', en:'NIGHTMARE', vida:-1, tiempo:0.8, jefe:1.35},
];
const RANGOS=[
  {xp:0,   es:'ASPIRANTE',   en:'APPLICANT'},
  {xp:400, es:'APRENDIZ',    en:'APPRENTICE'},
  {xp:1000,es:'PRACTICANTE', en:'INTERN'},
  {xp:1800,es:'DEV JUNIOR',  en:'JUNIOR DEV'},
  {xp:2800,es:'TITULADO SENA',en:'SENA GRADUATE'},
  {xp:4500,es:'DEV SENIOR',  en:'SENIOR DEV'},
];
const NIVELES=[
  {ico:'☕', tipo:'escribir', es:'PRIMER DÍA',        en:'FIRST DAY',        ses:'Configura tu terminal',      sen:'Set up your terminal'},
  {ico:'🐛', tipo:'bugs',     es:'CAZA-BUGS',          en:'BUG HUNT',         ses:'Aplasta los bugs',           sen:'Squash the bugs'},
  {ico:'🧠', tipo:'memoria',  es:'MEMORIA TÉCNICA',    en:'TECH MEMORY',      ses:'Empareja tecnologías',       sen:'Match the tech pairs'},
  {ico:'🔀', tipo:'simon',    es:'FLUJO GIT',          en:'GIT FLOW',         ses:'Repite la secuencia',        sen:'Repeat the sequence'},
  {ico:'📋', tipo:'quiz',     es:'SUSTENTACIÓN',       en:'ORAL EXAM',        ses:'Responde al jurado',         sen:'Answer the panel'},
  {ico:'🔍', tipo:'review',   es:'CODE REVIEW',        en:'CODE REVIEW',      ses:'Aprueba o rechaza',          sen:'Approve or reject'},
  {ico:'🔥', tipo:'bugs',     es:'BUGS EN PRODUCCIÓN', en:'BUGS IN PROD',     ses:'¡Deploy en viernes!',        sen:'Friday deploy!'},
  {ico:'🧬', tipo:'merge',    es:'CONFLICTO GIT',      en:'MERGE CONFLICT',   ses:'Elige la línea buena',       sen:'Pick the right line'},
  {ico:'🚀', tipo:'simon',    es:'DESPLIEGUE',         en:'DEPLOYMENT',       ses:'Un error y se cae todo',     sen:'One slip and it all falls'},
  {ico:'🎓', tipo:'runner',   es:'EVALUACIÓN FINAL',   en:'FINAL EXAM',       ses:'Sobrevive al último día',    sen:'Survive the last day'},
  /* ── TEMPORADA 2 · EL CONTRATO (días 11-15) ── */
  {ico:'🗄', tipo:'sql',      es:'CONSULTA SQL',       en:'SQL QUERY',        ses:'Arma la consulta en orden',  sen:'Build the query in order'},
  {ico:'🧩', tipo:'regex',    es:'CAZA PATRONES',      en:'PATTERN HUNT',     ses:'Atrapa lo que cumple',       sen:'Catch what matches'},
  {ico:'💣', tipo:'bugs',     es:'BUGS NIVEL 2',       en:'BUGS LEVEL 2',     ses:'Cuidado con las bombas',     sen:'Watch out for bombs'},
  {ico:'🌊', tipo:'simon',    es:'GIT AVANZADO',       en:'ADVANCED GIT',     ses:'Rebase y stash incluidos',   sen:'Rebase and stash included'},
  {ico:'🌙', tipo:'runner',   es:'DEPLOY NOCTURNO',    en:'NIGHT DEPLOY',     ses:'La última prueba',           sen:'The final trial'},
];
/* piezas de consulta en orden correcto (minijuego SQL) */
const SQLS=[
 ['SELECT nombre','FROM aprendices','WHERE nota >= 3','ORDER BY nombre'],
 ['SELECT *','FROM cursos','WHERE activo = 1'],
 ['SELECT email','FROM usuarios','WHERE rol = "admin"','LIMIT 10'],
 ['INSERT INTO logros','(nombre, fecha)','VALUES ("titulado", NOW())'],
 ['UPDATE practicantes','SET contrato = 1','WHERE dias = 10'],
 ['SELECT curso, COUNT(*)','FROM inscritos','GROUP BY curso','HAVING COUNT(*) > 5'],
 ['DELETE FROM bugs','WHERE estado = "resuelto"'],
];
/* rondas del minijuego regex: patrón + descripción + opciones (se evalúan con RegExp real) */
const REGEXS=[
 {p:'^git',    des:'empieza por "git"',     den:'starts with "git"',  opts:['git push','git status','digit','legit','git!','agitar']},
 {p:'[0-9]',   des:'contiene un número',    den:'contains a digit',   opts:['error 404','v2.0','café','deploy','http 500','commit']},
 {p:'\\.js$',  des:'termina en .js',        den:'ends with .js',      opts:['app.js','index.js','main.css','app.json','node.js','estilos.css']},
 {p:'^[A-Z]+$',des:'solo MAYÚSCULAS',       den:'UPPERCASE only',     opts:['SENA','HTML','Sena','css','API','JsOn']},
 {p:'oo',      des:'tiene doble "o"',       den:'has a double "o"',   opts:['google','loop','ping','logo','cool','polo']},
 {p:'^#',      des:'empieza por "#"',       den:'starts with "#"',    opts:['#app','#id-btn','app#','css #','#fff','col#or']},
];
const PALABRAS=['git push','commit','variable','funcion','deploy','servidor','consola','arreglo','objeto','html','css','javascript','python','api rest','frontend','backend','navegador','framework','base de datos','npm install','git status','git clone','console.log','debug','import','export','localhost','software','bucle for','teclado'];
const PAREJAS=['HTML','CSS','JS','SQL','GIT','API','PHP','SENA'];
const CODIGO=[
 {c:'const suma = a + b;',ok:1},
 {c:'console.log("hola mundo");',ok:1},
 {c:'for(let i=0; i<10; i++){ }',ok:1},
 {c:'if(x === 5){ y++; }',ok:1},
 {c:'let lista = [1, 2, 3];',ok:1},
 {c:'function saludar(){ return "hey"; }',ok:1},
 {c:'const PI = 3.1416;',ok:1},
 {c:'document.querySelector("#app");',ok:1},
 {c:'if(x = 5){ y++; }',ok:0},
 {c:'console.log("hola mundo"',ok:0},
 {c:'const 1nombre = "ana";',ok:0},
 {c:'retrun x + 1;',ok:0},
 {c:'let a == 3;',ok:0},
 {c:'if(x > 5 { y--; }',ok:0},
 {c:'costn b = 2;',ok:0},
 {c:'for(let i=0; i<10; i++{ }',ok:0},
];
const CONFLICTOS=[
 ['const total = a + b;','const total = a ++ b;'],
 ['console.log("listo");','console.log("listo);'],
 ['if(edad >= 18){ entrar(); }','if(edad >= 18){ entrar(; }'],
 ['let datos = [];','let datos = ][;'],
 ['function init(){ start(); }','function init(){ start( }'],
 ['const url = "api/v1";','const url = api/v1";'],
 ['for(const x of lista){ usar(x); }','for(const x on lista){ usar(x); }'],
 ['return respuesta.json();','return respuesta.jsno();'],
];
const CMDS=[
  {id:'pull',  cls:'c-pull',  txt:'GIT PULL',  f:330},
  {id:'commit',cls:'c-commit',txt:'GIT COMMIT',f:392},
  {id:'push',  cls:'c-push',  txt:'GIT PUSH',  f:494},
  {id:'deploy',cls:'c-deploy',txt:'DEPLOY',    f:587},
  /* solo en GIT AVANZADO (día 14) */
  {id:'rebase',cls:'c-rebase',txt:'GIT REBASE',f:659},
  {id:'stash', cls:'c-stash', txt:'GIT STASH', f:740},
];
const QUIZ={
 es:[
  {q:'¿Qué significa HTML?',o:['HyperText Markup Language','High Tech Modern Language','Home Tool Markup List'],r:0},
  {q:'¿Qué comando guarda cambios en Git?',o:['git save','git commit','git keep'],r:1},
  {q:'¿Qué es un bug?',o:['Un insecto de oficina','Una función secreta','Un error en el código'],r:2},
  {q:'¿Qué lenguaje da estilos a la web?',o:['CSS','SQL','BIOS'],r:0},
  {q:'¿Qué es una API?',o:['Un tipo de café','Interfaz para comunicar sistemas','Una carpeta oculta'],r:1},
  {q:'¿Qué hace "git push"?',o:['Borra el proyecto','Empuja al practicante','Sube commits al remoto'],r:2},
  {q:'¿Qué es el frontend?',o:['La parte visible de la web','El servidor','El cable de red'],r:0},
  {q:'¿Qué base de datos usa tablas?',o:['MongoDB','MySQL','Excel 97'],r:1},
  {q:'¿Qué es un "commit"?',o:['Una reunión','Un error grave','Una foto de tus cambios'],r:2},
  {q:'¿Para qué sirve CSS Grid?',o:['Maquetar en filas y columnas','Conectar a internet','Comprimir imágenes'],r:0},
  {q:'¿Qué es un pull request?',o:['Un tirón de orejas','Propuesta para integrar cambios','Una petición de vacaciones'],r:1},
  {q:'¿Qué significa "deploy"?',o:['Borrar el código','Renunciar con estilo','Publicar la aplicación'],r:2},
 ],
 en:[
  {q:'What does HTML stand for?',o:['HyperText Markup Language','High Tech Modern Language','Home Tool Markup List'],r:0},
  {q:'Which command saves changes in Git?',o:['git save','git commit','git keep'],r:1},
  {q:'What is a bug?',o:['An office insect','A secret feature','An error in the code'],r:2},
  {q:'Which language styles the web?',o:['CSS','SQL','BIOS'],r:0},
  {q:'What is an API?',o:['A type of coffee','An interface between systems','A hidden folder'],r:1},
  {q:'What does "git push" do?',o:['Deletes the project','Pushes the intern','Uploads commits to the remote'],r:2},
  {q:'What is the frontend?',o:['The visible part of the web','The server','The network cable'],r:0},
  {q:'Which database uses tables?',o:['MongoDB','MySQL','Excel 97'],r:1},
  {q:'What is a "commit"?',o:['A meeting','A serious error','A snapshot of your changes'],r:2},
  {q:'What is CSS Grid for?',o:['Layout in rows and columns','Connecting to the internet','Compressing images'],r:0},
  {q:'What is a pull request?',o:['An ear pull','A proposal to merge changes','A vacation request'],r:1},
  {q:'What does "deploy" mean?',o:['Delete the code','Quit with style','Publish the application'],r:2},
 ]
};
const DIALOGOS={
 es:[
  ['INSTRUCTOR','¡Bienvenido a tu etapa productiva! Primero: configura tu terminal. Escribe rápido y sin errores.'],
  ['LÍDER TÉCNICO','El practicante anterior dejó bugs por TODAS partes. ¡Aplástalos antes de que se reproduzcan!'],
  ['COMPAÑERA','Examen sorpresa del instructor: ¿recuerdas qué tecnologías van en pareja?'],
  ['LÍDER TÉCNICO','Te voy a mostrar el flujo de Git del equipo. Repítelo EXACTAMENTE igual.'],
  ['INSTRUCTOR','Hoy sustentas ante el jurado. Respira. No digas "eeeh". Tú puedes.'],
  ['LÍDER TÉCNICO','Hoy revisas los pull requests del equipo. Aprueba el código bueno, rechaza el malo. RÁPIDO.'],
  ['LÍDER TÉCNICO','¡¿QUIÉN HIZO DEPLOY UN VIERNES?! ¡Hay bugs en producción! ¡CORRE!'],
  ['COMPAÑERA','Dos ramas tocaron el mismo archivo... resuelve los conflictos eligiendo la línea que sí compila.'],
  ['LÍDER TÉCNICO','Despliegue final. Un comando fuera de orden y se cae TODO. Sin presión.'],
  ['INSTRUCTOR','Evaluación final: sobrevive tu último día en la oficina y el contrato es tuyo.'],
  ['LÍDER TÉCNICO','¡Firmaste! Primera tarea como junior: el reporte necesita una consulta SQL. Ármala en orden.'],
  ['COMPAÑERA','Hay que filtrar mil logs. Con expresiones regulares es un momento... si sabes leerlas.'],
  ['LÍDER TÉCNICO','Volvieron los bugs... y trajeron BOMBAS de imitación. ¡No las toques!'],
  ['INSTRUCTOR','Vine de visita. Veamos si ya dominas el Git avanzado: rebase y stash incluidos.'],
  ['LÍDER TÉCNICO','Deploy nocturno de fin de mes. Sobrevive la noche y esta empresa es tu casa.'],
 ],
 en:[
  ['INSTRUCTOR','Welcome to your internship! First: set up your terminal. Type fast and clean.'],
  ['TECH LEAD','The last intern left bugs EVERYWHERE. Squash them before they multiply!'],
  ['COWORKER','Pop quiz from the instructor: do you remember which technologies pair up?'],
  ['TECH LEAD',"I'll show you the team's Git flow. Repeat it EXACTLY as shown."],
  ['INSTRUCTOR',"Today you present to the panel. Breathe. Don't say 'uhh'. You got this."],
  ['TECH LEAD',"Today you review the team's pull requests. Approve the good code, reject the bad. FAST."],
  ['TECH LEAD','WHO DEPLOYED ON A FRIDAY?! Bugs in production! RUN!'],
  ['COWORKER','Two branches touched the same file... resolve the conflicts by picking the line that compiles.'],
  ['TECH LEAD','Final deployment. One command out of order and EVERYTHING falls. No pressure.'],
  ['INSTRUCTOR','Final exam: survive your last day at the office and the contract is yours.'],
  ['TECH LEAD','You signed! First task as a junior: the report needs an SQL query. Build it in order.'],
  ['COWORKER','We must filter a thousand logs. With regular expressions it takes a second... if you can read them.'],
  ['TECH LEAD','The bugs are back... and they brought fake BOMBS. Do NOT touch those!'],
  ['INSTRUCTOR','Just visiting. Let\'s see if you master advanced Git now: rebase and stash included.'],
  ['TECH LEAD','End-of-month night deploy. Survive the night and this company is your home.'],
 ]
};
const INTRO={
 es:[
  {ico:'🏢',t:'AÑO 2026. Después de mil hojas de vida, conseguiste tu etapa productiva en TechNova S.A.S.'},
  {ico:'📅',t:'Tienes 10 días para demostrar que mereces el contrato de aprendizaje.'},
  {ico:'😅',t:'Sin presión... bueno, sí. MUCHA presión. ¡Suerte, practicante!'},
 ],
 en:[
  {ico:'🏢',t:'YEAR 2026. After a thousand résumés, you landed your internship at TechNova Inc.'},
  {ico:'📅',t:'You have 10 days to prove you deserve the apprenticeship contract.'},
  {ico:'😅',t:'No pressure... well, yes. A LOT of pressure. Good luck, intern!'},
 ]
};
const FINAL={
 es:[
  {ico:'🎉',t:'Lo lograste. Diez días de bugs, cafés fríos y reuniones que pudieron ser un correo.'},
  {ico:'🤝',t:'El líder técnico sonríe por primera vez en la historia: "Firma aquí, practicante."'},
 ],
 en:[
  {ico:'🎉',t:'You made it. Ten days of bugs, cold coffee and meetings that could have been an email.'},
  {ico:'🤝',t:'The tech lead smiles for the first time in recorded history: "Sign here, intern."'},
 ]
};
const JEFE_INTRO={
 es:[
  {ico:'⚠️',t:'Un momento... el servidor legado tiembla. Algo ENORME salió del código sin documentar.'},
  {ico:'👾',t:'¡EL BUG FINAL ha despertado! Nadie se gradúa sin vencerlo. ¡Toma el teclado, practicante!'},
 ],
 en:[
  {ico:'⚠️',t:'Wait... the legacy server is shaking. Something HUGE crawled out of the undocumented code.'},
  {ico:'👾',t:'THE FINAL BUG has awakened! Nobody graduates without defeating it. Grab the keyboard, intern!'},
 ]
};
const T2_INTRO={
 es:[
  {ico:'📝',t:'¡Firmaste el contrato! Pero relajarte no es opción: ahora las tareas son DE VERDAD.'},
  {ico:'💼',t:'TEMPORADA 2 · EL CONTRATO: cinco días como dev junior. SQL, regex y deploys nocturnos te esperan.'},
 ],
 en:[
  {ico:'📝',t:'You signed the contract! But relaxing is not an option: now the tasks are REAL.'},
  {ico:'💼',t:'SEASON 2 · THE CONTRACT: five days as a junior dev. SQL, regex and night deploys await.'},
 ]
};
const JEFE2_INTRO={
 es:[
  {ico:'🌙',t:'3:00 AM. El deploy terminó... pero algo se mueve en los logs del servidor.'},
  {ico:'👾',t:'¡EL BUG FINAL volvió con sed de venganza! Termina lo que empezaste, junior.'},
 ],
 en:[
  {ico:'🌙',t:'3:00 AM. The deploy is done... but something is moving in the server logs.'},
  {ico:'👾',t:'THE FINAL BUG is back for revenge! Finish what you started, junior.'},
 ]
};
const FINAL2={
 es:[
  {ico:'🌅',t:'Amanece. El servidor respira tranquilo y el café sabe a victoria.'},
  {ico:'🚀',t:'El líder técnico te da la mano: "Ya no eres el nuevo. Eres del equipo."'},
 ],
 en:[
  {ico:'🌅',t:'Dawn breaks. The server hums peacefully and the coffee tastes like victory.'},
  {ico:'🚀',t:'The tech lead shakes your hand: "You are not the new kid anymore. You are one of us."'},
 ]
};
const INTERRUPCIONES={
 es:['¡SE CAYÓ EL WIFI!','¡REUNIÓN SORPRESA EN 5 MIN!','¡EL LÍDER PASA POR TU PUESTO!','¡WINDOWS SE ESTÁ ACTUALIZANDO!','¡LLEGÓ EL DE CALIDAD!'],
 en:['WIFI IS DOWN!','SURPRISE MEETING IN 5 MIN!','THE LEAD IS WALKING BY!','WINDOWS IS UPDATING!','QA JUST SHOWED UP!']
};
const LOGROS=[
  {id:'primer', ico:'🌱', es:'PRIMER DÍA',   en:'FIRST DAY'},
  {id:'perfecto',ico:'🌟',es:'DÍA PERFECTO', en:'PERFECT DAY'},
  {id:'mitad',  ico:'✅', es:'MEDIA ETAPA',  en:'HALFWAY'},
  {id:'comprador',ico:'🛍️',es:'COMPRADOR',  en:'SHOPPER'},
  {id:'veloz',  ico:'⚡', es:'DEDOS VELOCES',en:'FAST FINGERS'},
  {id:'cerebro',ico:'🧠', es:'MEMORIA ÉLITE',en:'ELITE MEMORY'},
  {id:'gitmaster',ico:'🔀',es:'GIT MASTER',  en:'GIT MASTER'},
  {id:'revisor', ico:'🔍', es:'OJO DE HALCÓN',en:'HAWK EYE'},
  {id:'resolutor',ico:'🧬',es:'SIN CONFLICTOS',en:'NO CONFLICTS'},
  {id:'jefe',   ico:'👾', es:'CAZA JEFES',   en:'BOSS HUNTER'},
  {id:'titulado',ico:'🎓', es:'TITULADO',    en:'GRADUATE'},
  {id:'intacto', ico:'🛡️', es:'INTOCABLE',   en:'UNTOUCHABLE'},
  {id:'combo',   ico:'🔥', es:'EN RACHA',    en:'ON FIRE'},
  {id:'coleccionista',ico:'🎁',es:'COLECCIONISTA',en:'COLLECTOR'},
  {id:'pesadilla',ico:'💀', es:'MODO PESADILLA',en:'NIGHTMARE MODE'},
  {id:'sql',     ico:'🗄', es:'DATA MASTER', en:'DATA MASTER'},
  {id:'regex',   ico:'🧩', es:'REGEX NINJA', en:'REGEX NINJA'},
  {id:'contrato',ico:'📝', es:'CONTRATADO',  en:'HIRED'},
];
const TXT={
 es:{dia:'DÍA',start:'PULSA START',jugar:'▶ JUGAR',tienda:'TIENDA',logros:'LOGROS',records:'RÉCORDS',perso:'AVATAR',
  sub:'LA AVENTURA DEL APRENDIZ · CAPÍTULO 4',mapa:'MAPA DE PRÁCTICA',volver:'← VOLVER',continuar:'CONTINUAR',
  pausa:'PAUSA',salirmapa:'SALIR AL MAPA',empezar:'¡EMPEZAR!',listo:'¿LISTO?',aqui:'AQUÍ',
  aprobado:'¡DÍA SUPERADO!',fallado:'¡DÍA FALLIDO!',reintentar:'REINTENTAR',siguiente:'SIGUIENTE DÍA ▶',
  gameover:'GAME OVER',gameovertxt:'Te quedaste sin vidas. El instructor te manda a tomar aire y volver mañana.',
  ptsgan:'PTS GANADOS',mejor:'MEJOR',bloqueado:'Completa el día anterior',
  tiempo:'TIEMPO',meta:'META',errores:'ERRORES',ronda:'RONDA',pares:'PARES',golpes:'GOLPES',cafes:'CAFÉS',
  escribeaqui:'ESCRIBE AQUÍ',observa:'OBSERVA...',turno:'¡TU TURNO!',
  toca:'TOCA PARA SEGUIR',saltar:'SALTAR ▶▶',pagina:'PÁG',
  runmsg:'▲ SALTA · ▼ AGÁCHATE · esquiva bugs y papeleo, agarra café',
  cert:'CERTIFICADO OFICIAL',certde:'Se certifica que',certtxt:'completó sus 10 días de etapa productiva sin llorar (mucho)',
  firma:'FIRMA: EL INSTRUCTOR',fecha:'FECHA',
  rango:'RANGO',rangos:'ESCALAFÓN',stats:'ESTADÍSTICAS',diascomp:'DÍAS',estrellas:'ESTRELLAS',ptstotal:'PTS TOTALES',
  comprar:'COMPRAR',equipado:'EQUIPADO',mejoras:'MEJORAS DE OFICINA',
  mejvida:'VIDA EXTRA',mejtiempo:'+20% TIEMPO',mejdoble:'PUNTOS ×2',
  acc_cafe:'CAFÉ ETERNO',acc_gafas:'GAFAS DEV',acc_corbata:'CORBATA',acc_gorra:'GORRA',acc_audifonos:'AUDÍFONOS',acc_medalla:'MEDALLA',
  logro:'¡LOGRO DESBLOQUEADO!',sinacc:'SIN ACCESORIO',piel:'PIEL',camisa:'CAMISA',accesorio:'ACCESORIO',
  rec_nom:'NOMBRE',rec_pts:'PTS',rec_rango:'RANGO',tu:'TÚ',
  quiznec:'Necesitas 4 de 6 para aprobar',
  vidas_txt:'VIDAS',
  nombreq:'¿CÓMO TE LLAMAS?',tunombre:'TU NOMBRE',ok:'¡LISTO!',
  combo:'RACHA',
  aprobar:'✔ APROBAR',rechazar:'✘ RECHAZAR',lineasrev:'LÍNEAS',
  eligebuena:'Toca la línea que SÍ compila',
  modo_hd:'✨ MODO 4K HD OLED',modo_retro:'🕹 MODO RETRO 32-BIT',
  borrar:'🗑 BORRAR PROGRESO',seguro:'¿ESTÁS SEGURO?',
  borrartxt:'Se borrará TODO tu progreso: días, estrellas, puntos, logros, compras y récords. El idioma, el sonido y el modo visual se conservan. Esta acción NO se puede deshacer.',
  perderas:'PERDERÁS',sioborrar:'SÍ, BORRAR TODO',cancelar:'CANCELAR',
  borrado:'PROGRESO BORRADO. ¡PARTIDA NUEVA!',
  jefemsg:'◀ ▶ MUÉVETE · disparas solo · esquiva los ❌ · sirve mando 🎮 o inclinar 📱',
  girar:'📱 GIRO',mando:'¡MANDO CONECTADO!',
  jefereplay:'Repetir batalla del jefe',
  dificultad:'DIFICULTAD',estadisticas:'📈 ESTADÍSTICAS',
  st_bugs:'BUGS APLASTADOS',st_cafes:'CAFÉS TOMADOS',st_palabras:'PALABRAS ESCRITAS',
  st_jefes:'JEFES VENCIDOS',st_perfectos:'DÍAS PERFECTOS',st_racha:'MEJOR RACHA',
  st_partidas:'PARTIDAS TERMINADAS',st_sinreg:'Aún no hay datos. ¡A jugar!',
  compartir:'📤 COMPARTIR',copiado:'¡COPIADO AL PORTAPAPELES!',
  compartexto:'Terminé Practicante en Apuros 4 con {p} pts como {r} 🎓 ¡Juégalo!',
  jefefase:'FASE',avisolaser:'¡LÁSER!',
  guardado:'💾 CÓDIGO DE GUARDADO',exportar:'📤 EXPORTAR PARTIDA',importar:'📥 IMPORTAR',
  pegacodigo:'Pega aquí tu código PA4...',impok:'¡PARTIDA IMPORTADA!',impmal:'CÓDIGO INVÁLIDO',
  guardatxt:'Exporta tu partida y pégala en otro dispositivo para continuar allí.',
  t1sec:'🎓 ETAPA PRODUCTIVA',t2sec:'📝 EL CONTRATO',
  sqlmsg:'Toca las piezas en ORDEN para armar la consulta',objetivo:'OBJETIVO',
  regexmsg:'Toca TODO lo que cumpla el patrón',patron:'PATRÓN',
  acc_capa:'CAPA DE HÉROE',acc_gato:'GATO DE OFICINA',acc_corona:'CORONA DEV',
  mejiman:'CAFÉ PREMIUM',mejescudo:'ESCUDO DEV',
  d_vida:'Una vida extra cada día',d_tiempo:'+20% de tiempo en los retos',
  d_doble:'Ganas el doble de puntos',d_iman:'Los cafés valen más puntos',
  d_escudo:'Anula tu primer golpe en el runner y el jefe',
  ascenso:'¡CONTRATO INDEFINIDO!',ascensode:'La empresa confirma que',
  ascensotxt:'sobrevivió sus primeros 5 días como dev junior y ya es parte del equipo',
 },
 en:{dia:'DAY',start:'PRESS START',jugar:'▶ PLAY',tienda:'SHOP',logros:'AWARDS',records:'RECORDS',perso:'AVATAR',
  sub:'THE APPRENTICE ADVENTURE · CHAPTER 4',mapa:'INTERNSHIP MAP',volver:'← BACK',continuar:'CONTINUE',
  pausa:'PAUSED',salirmapa:'EXIT TO MAP',empezar:'START!',listo:'READY?',aqui:'HERE',
  aprobado:'DAY CLEARED!',fallado:'DAY FAILED!',reintentar:'RETRY',siguiente:'NEXT DAY ▶',
  gameover:'GAME OVER',gameovertxt:'You ran out of lives. The instructor sends you home to try again tomorrow.',
  ptsgan:'PTS EARNED',mejor:'BEST',bloqueado:'Clear the previous day',
  tiempo:'TIME',meta:'GOAL',errores:'ERRORS',ronda:'ROUND',pares:'PAIRS',golpes:'HITS',cafes:'COFFEES',
  escribeaqui:'TYPE HERE',observa:'WATCH...',turno:'YOUR TURN!',
  toca:'TAP TO CONTINUE',saltar:'SKIP ▶▶',pagina:'PAGE',
  runmsg:'▲ JUMP · ▼ DUCK · dodge bugs and paperwork, grab coffee',
  cert:'OFFICIAL CERTIFICATE',certde:'This certifies that',certtxt:'completed 10 days of internship without crying (much)',
  firma:'SIGNED: THE INSTRUCTOR',fecha:'DATE',
  rango:'RANK',rangos:'RANKS',stats:'STATS',diascomp:'DAYS',estrellas:'STARS',ptstotal:'TOTAL PTS',
  comprar:'BUY',equipado:'EQUIPPED',mejoras:'OFFICE UPGRADES',
  mejvida:'EXTRA LIFE',mejtiempo:'+20% TIME',mejdoble:'POINTS ×2',
  acc_cafe:'ETERNAL COFFEE',acc_gafas:'DEV GLASSES',acc_corbata:'TIE',acc_gorra:'CAP',acc_audifonos:'HEADPHONES',acc_medalla:'MEDAL',
  logro:'ACHIEVEMENT UNLOCKED!',sinacc:'NO ACCESSORY',piel:'SKIN',camisa:'SHIRT',accesorio:'ACCESSORY',
  rec_nom:'NAME',rec_pts:'PTS',rec_rango:'RANK',tu:'YOU',
  quiznec:'You need 4 of 6 to pass',
  vidas_txt:'LIVES',
  nombreq:'WHAT IS YOUR NAME?',tunombre:'YOUR NAME',ok:'DONE!',
  combo:'STREAK',
  aprobar:'✔ APPROVE',rechazar:'✘ REJECT',lineasrev:'LINES',
  eligebuena:'Tap the line that DOES compile',
  modo_hd:'✨ 4K HD OLED MODE',modo_retro:'🕹 RETRO 32-BIT MODE',
  borrar:'🗑 DELETE PROGRESS',seguro:'ARE YOU SURE?',
  borrartxt:'ALL your progress will be deleted: days, stars, points, achievements, purchases and records. Language, sound and visual mode are kept. This CANNOT be undone.',
  perderas:'YOU WILL LOSE',sioborrar:'YES, DELETE EVERYTHING',cancelar:'CANCEL',
  borrado:'PROGRESS DELETED. FRESH START!',
  jefemsg:'◀ ▶ MOVE · auto-fire · dodge the ❌ · gamepad 🎮 or tilt 📱 works',
  girar:'📱 TILT',mando:'GAMEPAD CONNECTED!',
  jefereplay:'Replay the final boss',
  dificultad:'DIFFICULTY',estadisticas:'📈 STATISTICS',
  st_bugs:'BUGS SQUASHED',st_cafes:'COFFEES DRUNK',st_palabras:'WORDS TYPED',
  st_jefes:'BOSSES BEATEN',st_perfectos:'PERFECT DAYS',st_racha:'BEST STREAK',
  st_partidas:'GAMES FINISHED',st_sinreg:'No data yet. Go play!',
  compartir:'📤 SHARE',copiado:'COPIED TO CLIPBOARD!',
  compartexto:'I finished Intern in Trouble 4 with {p} pts as {r} 🎓 Play it!',
  jefefase:'PHASE',avisolaser:'LASER!',
  guardado:'💾 SAVE CODE',exportar:'📤 EXPORT SAVE',importar:'📥 IMPORT',
  pegacodigo:'Paste your PA4 code here...',impok:'SAVE IMPORTED!',impmal:'INVALID CODE',
  guardatxt:'Export your save and paste it on another device to continue there.',
  t1sec:'🎓 INTERNSHIP',t2sec:'📝 THE CONTRACT',
  sqlmsg:'Tap the pieces IN ORDER to build the query',objetivo:'GOAL',
  regexmsg:'Tap EVERYTHING that matches the pattern',patron:'PATTERN',
  acc_capa:'HERO CAPE',acc_gato:'OFFICE CAT',acc_corona:'DEV CROWN',
  mejiman:'PREMIUM COFFEE',mejescudo:'DEV SHIELD',
  d_vida:'One extra life each day',d_tiempo:'+20% time on challenges',
  d_doble:'Earn double points',d_iman:'Coffees are worth more points',
  d_escudo:'Blocks your first hit in the runner and boss',
  ascenso:'PERMANENT CONTRACT!',ascensode:'The company confirms that',
  ascensotxt:'survived their first 5 days as a junior dev and is now part of the team',
 }
};
