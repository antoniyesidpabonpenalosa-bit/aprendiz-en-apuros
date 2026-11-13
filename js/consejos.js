'use strict';
/* ── PERSONAJES Y CONSEJOS DEL PASILLO ──
   Los personajes de la historia están también en el pasillo: tocas a uno, el
   aprendiz camina hasta él y te aconseja (js/pasillo.js). Aquí van quiénes son,
   dónde están, qué dicen y la regla que elige qué dice cada uno.

   No cambia nada del juego: hablan, no dan puntos ni quitan vidas. Y nada de
   esto se guarda: lo que ya te dijo cada uno es de esta sesión.

   Los consejos de puerta usan lo que el propio juego explica de cada minijuego
   (AYUDA, en js/datos.js); los de tema flojo salen del Repaso (temasRepaso,
   js/modos.js). Las cuentas están aparte de la pantalla para poder probarlas
   (test/consejos.test.mjs). */

/* Quién es cada uno. `piel` y `camisa` recolorean el cuerpo del aprendiz para
   ponerlos en el pasillo (js/sprite.js); son los mismos de CARAS (js/graficos.js).
   La etiqueta "NOMBRE · ROL" es la que sale en los diálogos de cada día
   (DIALOGOS, js/datos.js); idDe() reconoce al personaje por el ROL. */
const PERSONAJES={
  instructor:{nom:'GUSTAVO',    rol:{es:'INSTRUCTOR',    en:'INSTRUCTOR'},piel:'#e0b088',camisa:'#2c3460'},
  companera: {nom:'VALENTINA',  rol:{es:'COMPAÑERA',     en:'COWORKER'},  piel:'#f4c898',camisa:'#c22e44'},
  lider:     {nom:'ANDRÉS',     rol:{es:'LÍDER TÉCNICO', en:'TECH LEAD'}, piel:'#d99b66',camisa:'#5a1bb0'},
  vigilante: {nom:'DON JAIRO',  rol:{es:'VIGILANTE',     en:'GUARD'},     piel:'#a86a3c',camisa:'#9aa0aa'},
};
const etiquetaDe=(id,lang)=>PERSONAJES[id].nom+' · '+(PERSONAJES[id].rol[lang]||PERSONAJES[id].rol.es);

/* Quién está en cada zona del pasillo y entre qué puertas: `hueco` 0 es entre la
   primera y la segunda puerta, 3 entre la cuarta y la quinta. Cada uno está donde
   ya habla en los diálogos de esos días; el vigilante, junto a la entrada. */
const PASILLO_GENTE=[
  [{p:'instructor',hueco:0},{p:'vigilante',hueco:2},{p:'companera',hueco:3}],
  [{p:'companera',hueco:0},{p:'instructor',hueco:3}],
  [{p:'lider',hueco:0},{p:'companera',hueco:2},{p:'instructor',hueco:3}],
];

/* Quién habla cada día: el del diálogo de ese día. Se saca de DIALOGOS en vez de
   repetirlo aquí, para que no puedan separarse. */
const hablanteDe=dia=>idDe(DIALOGOS.es[dia][0]);

/* Qué personaje se ocupa de cada tema del Repaso (las claves de temasRepaso). */
const TEMA_DE={quiz:'instructor',review:'companera',sql:'lider',regex:'lider',merge:'companera',
  palabras:'instructor',git:'instructor',parejas:'companera',terminal:'instructor',orden:'instructor'};

const CONSEJOS={
  /* Uno por día, dicho por quien habla ese día. */
  puerta:[
    {es:'Lee el comando completo antes de escribir. Con calma sale más rápido que con prisa.',
     en:'Read the whole command before typing. Calm beats rushing.'},
    {es:'Toca el bug apenas asome. También valen las teclas 1 a 9, y el ☕ da puntos extra.',
     en:'Tap the bug as soon as it pops up. Keys 1 to 9 work too, and the ☕ gives bonus points.'},
    {es:'¡Menos giros, más estrellas! Fíjate dónde viste cada carta antes de destapar la segunda.',
     en:'Fewer flips, more stars! Remember where you saw each card before flipping the second.'},
    {es:'Cada ronda añade UN comando. Repítelos en voz baja mientras se iluminan: ayuda.',
     en:'Each round adds ONE command. Repeat them under your breath as they light up: it helps.'},
    {es:'No hay reloj: lee las tres respuestas enteras. Lo que falles volverá a salir, así que fallar también enseña.',
     en:'No timer: read all three answers. What you miss comes back, so missing teaches too.'},
    {es:'Ojo con el = donde debería ir ===. Es el error favorito del código de la ficha de al lado.',
     en:"Watch for = where === belongs. It is the favourite mistake in the other group's code."},
    {es:'Hoy son MUCHOS. No persigas uno solo: toca el que asome y sigue. ¡Y el ☕ suma!',
     en:"There are LOTS today. Don't chase just one: tap whichever pops up and move on. The ☕ adds points!"},
    {es:'Casi siempre falla un paréntesis o una comilla. Compara las dos líneas de izquierda a derecha.',
     en:'Usually a bracket or a quote is missing. Compare the two lines left to right.'},
    {es:'Un comando fuera de orden y se cae todo. Mira la secuencia completa antes de repetirla.',
     en:'One command out of order and everything falls. Watch the whole sequence before repeating it.'},
    {es:'▲ para saltar, ▼ para agacharte: los papeles vuelan altos. Y agarra los cafés.',
     en:'▲ to jump, ▼ to duck: the papers fly high. And grab the coffees.'},
    {es:'SELECT, FROM, WHERE, en ese orden. Una pieza mal puesta cuenta como error.',
     en:'SELECT, FROM, WHERE, in that order. A piece in the wrong place counts as an error.'},
    {es:'Toca SOLO lo que cumple el patrón. Tocar uno que no cumple es un error: lee el patrón dos veces.',
     en:'Tap ONLY what matches the pattern. Tapping one that does not is an error: read the pattern twice.'},
    {es:'Las bombas de imitación quitan puntos. Si dudas, no toques.',
     en:'The fake bombs take points away. If in doubt, don\'t tap.'},
    {es:'Lo mismo que en la lectiva: cada ronda suma un comando. Ahora con rebase y stash; repítelos bajito.',
     en:'Same as in training: each round adds a command. Now with rebase and stash; repeat them quietly.'},
    {es:'Última prueba: ▲ o espacio para saltar, ▼ para agacharte. Cafés seguidos te dan racha.',
     en:'Final trial: ▲ or space to jump, ▼ to duck. Coffees in a row build a streak.'},
  ],
  /* Cuando un tema tiene preguntas pendientes en el Repaso. */
  tema:{
    quiz:{es:'Vi que el cuestionario se te complica. Lo que fallas vuelve a salir hasta que lo domines. ¿Lo repasamos?',
          en:'I saw the quiz is giving you trouble. What you miss comes back until you master it. Shall we review it?'},
    review:{es:'Vi que el code review te cuesta. Fíjate en el = contra ===, y en las comillas que faltan.',
            en:'I saw code review is hard for you. Look at = versus ===, and at missing quotes.'},
    sql:{es:'SQL se te atraviesa, ¿cierto? Piensa en el orden: SELECT, FROM, WHERE. ¿Repasamos?',
         en:'SQL is giving you a hard time, right? Think of the order: SELECT, FROM, WHERE. Shall we review?'},
    regex:{es:'Las expresiones regulares cuestan al principio. Lee qué pide el patrón, no cómo se ve.',
           en:'Regular expressions are hard at first. Read what the pattern asks for, not how it looks.'},
    merge:{es:'Los conflictos casi siempre son un paréntesis o una comilla. Míralas con calma, ¡yo te ayudo a repasar!',
           en:"Conflicts are almost always a bracket or a quote. Look at them calmly. I'll help you review!"},
    palabras:{es:'Los comandos se aprenden con los dedos. Un repaso corto cada día vale más que uno largo.',
              en:'Commands are learned with your fingers. A short review every day beats a long one.'},
    git:{es:'El flujo de Git es siempre el mismo. Repítelo hasta que te salga solo.',
         en:'The Git flow is always the same. Repeat it until it comes naturally.'},
    parejas:{es:'Las parejas se pegan con práctica. ¡Un repaso y las tienes!',
             en:'The pairs stick with practice. One review and you\'ve got them!'},
    terminal:{es:'Si fallas un comando el juego te muestra cuál era: así se aprende. Repasemos esos.',
              en:'If you miss a command the game shows you which one it was: that is how you learn. Let\'s review those.'},
    orden:{es:'Cada tanda es un proceso real del trabajo. Piensa qué se hace primero.',
           en:'Each round is a real process from the job. Think about what is done first.'},
  },
  /* Cuando no hay nada de lo anterior: van rotando, uno por toque. */
  general:{
    instructor:[
      {es:'Vas al día con todo. Aprovecha para practicar en el modo libre.',
       en:"You're up to date on everything. A good time to practise in free play."},
      {es:'Un día a la vez. Lo importante es que no te quedes sin entender.',
       en:"One day at a time. What matters is not leaving anything you don't understand."},
      {es:'Descansa la vista: el código se ve mejor con ojos frescos.',
       en:'Rest your eyes: code reads better with fresh eyes.'},
    ],
    companera:[
      {es:'¡Vamos bien! Si un día se te quedó en 2 estrellas, vuelve y sácale las 3.',
       en:"We're doing great! If a day stayed at 2 stars, go back and get all 3."},
      {es:'¿Ya probaste el reto diario? Hay uno nuevo cada día.',
       en:'Have you tried the daily challenge? There is a new one every day.'},
      {es:'¡No te rindas, que casi lo logras!',
       en:"Don't give up, you're almost there!"},
    ],
    lider:[
      {es:'Buen trabajo. En la empresa se valora quien deja el código limpio.',
       en:'Good work. At the company, people who leave clean code are valued.'},
      {es:'Antes de entregar, revisa dos veces. Siempre.',
       en:'Before delivering, check twice. Always.'},
      {es:'Si te trabas, pregunta. Nadie aprende solo.',
       en:'If you get stuck, ask. Nobody learns alone.'},
    ],
  },
  /* Don Jairo no enseña programación: cuenta qué más hay en el juego. */
  vigilante:[
    {es:'¿Ya pasó por la tienda, aprendiz? Con los puntos compra mejoras y cosas para su personaje.',
     en:'Have you been to the shop yet, apprentice? With your points you can buy upgrades and things for your character.'},
    {es:'Cada día hay un reto nuevo. Si juega días seguidos, la racha le da premios.',
     en:'There is a new challenge every day. If you play on consecutive days, the streak earns you rewards.'},
    {es:'En el modo libre juega el minijuego que quiera, sin XP: solo marca un récord. Ideal para practicar.',
     en:'In free play you pick any minigame, with no XP: it just sets a score. Great for practice.'},
    {es:'El juego se acuerda de lo que usted falla. En REPASO practica justo eso.',
     en:'The game remembers what you miss. In REVIEW you practise exactly that.'},
    {es:'El modo sin fin es una sola vida, y cada tres rondas sube la dificultad. ¡Atrévase!',
     en:'Endless mode is a single life, and every three rounds the difficulty goes up. Dare to try it!'},
    {es:'Si es de una clase, el instructor abre una sala con un código y juegan todos a la vez.',
     en:'If you are in a class, the instructor opens a room with a code and everyone plays at once.'},
  ],
};

/* Qué gesto pone cada tipo de consejo (los retratos dibujados tienen cinco). */
const GESTO_CONSEJO={tema:'preocupado',puerta:'normal',general:'feliz',vigilante:'feliz'};

/**
 * Qué dice `id` ahora. Función pura: todo lo que necesita entra por `o`.
 *   o.dia        la puerta de la que se habla (la elegida, o el día que toca); null si no hay
 *   o.pendientes lo que devuelve temasRepaso()
 *   o.vuelta     cuántas veces se le ha hablado ya (para rotar los generales)
 * Devuelve {tipo, clave, txt:{es,en}} y, si es de un tema, también {pool, juego}
 * (el tipo de minijuego para abrir el Repaso). `clave` identifica el consejo para
 * saber si ya se dio.
 * Orden: 1) un tema flojo suyo · 2) la puerta, si la dice él · 3) lo de siempre.
 */
function consejoDe(id,o={}){
  const mios=(o.pendientes||[]).filter(r=>r.pendientes>0&&TEMA_DE[r.pool]===id)
    .sort((a,b)=>(b.pc||0)-(a.pc||0)||b.pendientes-a.pendientes);
  if(mios.length){
    const r=mios[0];
    return {tipo:'tema',clave:'tema:'+r.pool,pool:r.pool,juego:r.tipo,txt:CONSEJOS.tema[r.pool]};
  }
  const d=o.dia;
  if(d!=null&&d>=0&&d<CONSEJOS.puerta.length&&hablanteDe(d)===id)
    return {tipo:'puerta',clave:'puerta:'+d,dia:d,txt:CONSEJOS.puerta[d]};
  const v=o.vuelta||0;
  if(id==='vigilante')return {tipo:'vigilante',clave:'vigilante',txt:CONSEJOS.vigilante[v%CONSEJOS.vigilante.length]};
  const g=CONSEJOS.general[id];
  return {tipo:'general',clave:'general',txt:g[v%g.length]};
}

/* Lo de esta sesión: cuántas veces se habló con cada uno y qué consejos
   "nuevos" (de tema o de puerta) ya se dieron. Para el "!" de encima. */
const charla={vueltas:{},vistos:new Set()};
/** ¿Tiene `id` algo nuevo que decir? Solo cuentan los de tema y de puerta. */
function tieneNovedad(id,o){
  const c=consejoDe(id,o);
  return (c.tipo==='tema'||c.tipo==='puerta')&&!charla.vistos.has(c.clave);
}
