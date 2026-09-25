'use strict';
/* ── CONSOLA DE LABORATORIO ──
   Un mini terminal dentro del juego: se escriben órdenes y cambian las
   palancas de la partida (vidas, tiempo, dureza del jefe…) en el momento.

   TRES REGLAS que dan forma a todo este archivo:

   1) NADA SE GUARDA. Los cambios viven en este objeto, en memoria. No tocan la
      partida guardada ni el localStorage: recargar la página lo devuelve todo a
      su sitio. Mientras hay un ensayo en marcha, guardar() no escribe nada
      (js/estado.js) y al volver a lo normal la partida se restaura desde la
      copia que se hizo al entrar. Por eso ni un punto ganado en el laboratorio
      sobrevive.

   2) UN ENSAYO NO CUENTA. En cuanto se cambia algo, la sesión queda marcada
      como ensayo: no sube al marcador global (js/ranking.js), no puntúa en una
      sala (js/sala.js) y no da puntos, estrellas ni logros. Además se ve en la
      cabecera, para que nadie juegue con trucos y mande la captura como real.

   3) SOLO EXISTE LO DECLARADO. Las órdenes no evalúan código: únicamente
      pueden mover los parámetros de la lista PARAMS, con su tipo y su rango.
      Un valor fuera de rango se rechaza con un mensaje que explica qué se
      esperaba; escribir mal el nombre sugiere el parecido.

   Este archivo no toca el DOM a propósito: así se puede probar entero con
   node (test/consola.test.mjs). El panel y el gesto para abrirlo viven en
   js/consolaui.js, como sala.js y salaui.js. */

const LAB = (() => {

  /* ── PARÁMETROS ──
     Cada uno se corresponde con una de las palancas que js/estado.js ya usaba
     para la dificultad; la consola solo sustituye el valor que devuelven.
     ali: el nombre en inglés, para que la consola se pueda usar en los dos
     idiomas del juego. */
  const PARAMS = [
    { id: 'vidas', ali: 'lives', tipo: 'num', min: 1, max: 9, ent: true,
      es: 'vidas con las que empiezas el día', en: 'lives you start the day with' },
    { id: 'tiempo', ali: 'time', tipo: 'num', min: 0.2, max: 5,
      es: 'multiplica el tiempo de cada prueba', en: 'multiplies the time of each test' },
    { id: 'jefe', ali: 'boss', tipo: 'num', min: 0.2, max: 3,
      es: 'dureza del jefe final', en: 'final boss toughness' },
    { id: 'cantidad', ali: 'amount', tipo: 'num', min: 0.2, max: 3,
      es: 'cuántas rondas trae cada prueba', en: 'how many rounds each test brings' },
    { id: 'ritmo', ali: 'pace', tipo: 'num', min: 0.2, max: 5,
      es: 'ritmo de lo que se mueve (más alto = más lento)', en: 'pace of moving things (higher = slower)' },
    { id: 'errores', ali: 'errors', tipo: 'num', min: 1, max: 20, ent: true,
      es: 'errores que perdona una prueba', en: 'mistakes a test forgives' },
    { id: 'ojeada', ali: 'peek', tipo: 'num', min: 1, max: 20, ent: true,
      es: 'segundos para memorizar', en: 'seconds to memorise' },
    { id: 'puntos', ali: 'points', tipo: 'num', min: 0, max: 10,
      es: 'multiplica los puntos ganados', en: 'multiplies the points earned' },
    { id: 'dif', ali: 'level', tipo: 'lista', ops: ['practica', 'normal', 'pesadilla'],
      opsEn: ['practice', 'normal', 'nightmare'],
      es: 'dificultad de base', en: 'base difficulty' },
  ];
  /* Object.create(null) y no {}: con un objeto normal, "constructor",
     "toString" o "__proto__" se heredan del prototipo y la consola los habría
     aceptado como si fueran parámetros del juego. Solo existe lo declarado. */
  const porId = Object.create(null);
  PARAMS.forEach(p => { porId[p.id] = p; porId[p.ali] = p; });

  /* ── ESTADO DEL LABORATORIO (todo en memoria) ── */
  let puesto = Object.create(null);   /* id -> valor puesto por la consola */
  let ensayoOn = false;     /* ¿esta sesión ya dejó de contar? */
  let avanzadoOn = false;   /* ¿se desbloquearon las órdenes de desarrollo? */
  let copia = null;         /* la partida real, tal como estaba antes del ensayo */
  let semillaOn = 0;        /* semilla del azar, 0 = el azar de siempre */
  const azarReal = Math.random;

  const ES = () => (typeof S !== 'undefined' && S && S.lang === 'en' ? 'en' : 'es');
  const dos = (a, b) => (ES() === 'en' ? b : a);
  /* Texto de un parámetro o de una orden en el idioma del juego */
  const desc = o => (ES() === 'en' ? o.en : o.es);
  const nombreDe = p => (ES() === 'en' ? p.ali : p.id);
  const opsDe = p => (ES() === 'en' && p.opsEn ? p.opsEn : p.ops);
  /* Un número legible: 2 en vez de 2.0, 1.35 en vez de 1.3500000000000001 */
  const num = n => String(Math.round(Number(n) * 1000) / 1000);

  /* ── LA PALANCA QUE USA EL JUEGO ──
     js/estado.js pregunta aquí por cada palanca: si la consola la cambió
     devuelve el valor puesto; si no, el que traía el juego. */
  function ajuste(id, base) {
    return Object.prototype.hasOwnProperty.call(puesto, id) ? puesto[id] : base;
  }

  const activo = () => Object.keys(puesto).length > 0 || !!semillaOn;
  const ensayo = () => ensayoOn;
  const avanzado = () => avanzadoOn;
  const valores = () => Object.assign({}, puesto);

  /* Resumen corto para la cabecera: "vidas 9 · tiempo 2" */
  function resumen() {
    const p = PARAMS.filter(x => Object.prototype.hasOwnProperty.call(puesto, x.id))
      .map(x => nombreDe(x) + ' ' + (x.tipo === 'lista' ? opsDe(x)[puesto[x.id]] : num(puesto[x.id])));
    if (semillaOn) p.push(dos('semilla', 'seed') + ' ' + semillaOn);
    return p.join(' · ');
  }

  /* ── ENSAYO ──
     Al empezar se copia la partida; al volver a lo normal se restaura. Así lo
     ganado con trucos no sobrevive ni en memoria, y lo de antes del ensayo no
     se pierde. */
  function empezarEnsayo() {
    if (ensayoOn) return;
    try { copia = JSON.stringify(S); } catch (e) { copia = null; }
    ensayoOn = true;
  }
  function volverANormal() {
    puesto = Object.create(null);
    semilla(0);
    ensayoOn = false;                      /* antes de guardar(), que vuelve a escribir */
    if (copia) {
      try {
        S = JSON.parse(copia);
        sanear(); vidas = maxVidas(); aplicarModo(); guardar();
      } catch (e) { /* si la copia se estropeó, se deja lo que haya en memoria */ }
    }
    copia = null;
  }

  /* Azar repetible: con una semilla, la misma partida sale igual dos veces.
     Sirve para afinar un minijuego sin que el azar cambie la medida. */
  function semilla(n) {
    const s = Math.floor(Number(n) || 0);
    if (!s) { Math.random = azarReal; semillaOn = 0; return 0; }
    let a = s >>> 0;
    Math.random = () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    semillaOn = s;
    return s;
  }

  /* ── PONER UN PARÁMETRO ──
     Devuelve {ok, msg}. El mensaje de error dice qué se esperaba: es una
     consola de un juego sobre programar, así que el error también enseña. */
  function fijar(nombre, texto) {
    const p = porId[String(nombre || '').toLowerCase()];
    if (!p) return { ok: false, msg: noExiste(nombre) };
    const val = String(texto == null ? '' : texto).trim().toLowerCase();

    if (p.tipo === 'lista') {
      const ops = p.ops, opsIdioma = opsDe(p);
      let i = ops.indexOf(val);
      if (i < 0) i = (p.opsEn || []).indexOf(val);
      if (i < 0 && /^[0-9]+$/.test(val) && +val < ops.length) i = +val;
      if (i < 0) return { ok: false, msg: dos(
        `${nombreDe(p)} espera una de estas: ${opsIdioma.join(', ')}. Recibí "${val}"`,
        `${nombreDe(p)} expects one of: ${opsIdioma.join(', ')}. I got "${val}"`) };
      puesto[p.id] = i;
      empezarEnsayo();
      return { ok: true, msg: `${nombreDe(p)} = ${opsIdioma[i]}` };
    }

    if (val === '') return { ok: false, msg: dos(
      `${nombreDe(p)} espera un número entre ${num(p.min)} y ${num(p.max)}`,
      `${nombreDe(p)} expects a number between ${num(p.min)} and ${num(p.max)}`) };
    /* Se acepta la coma decimal: en español se escribe 1,5 sin pensarlo */
    const n = Number(val.replace(',', '.'));
    if (!Number.isFinite(n)) return { ok: false, msg: dos(
      `${nombreDe(p)} espera un número entre ${num(p.min)} y ${num(p.max)}; "${val}" no es un número`,
      `${nombreDe(p)} expects a number between ${num(p.min)} and ${num(p.max)}; "${val}" is not a number`) };
    if (n < p.min || n > p.max) return { ok: false, msg: dos(
      `${nombreDe(p)} solo llega de ${num(p.min)} a ${num(p.max)}; pediste ${num(n)}`,
      `${nombreDe(p)} only goes from ${num(p.min)} to ${num(p.max)}; you asked for ${num(n)}`) };
    puesto[p.id] = p.ent ? Math.round(n) : n;
    empezarEnsayo();
    return { ok: true, msg: `${nombreDe(p)} = ${num(puesto[p.id])}` };
  }

  /* Distancia de edición, para sugerir el parámetro que se quiso escribir */
  function cerca(a, b) {
    const m = a.length, n = b.length;
    let fila = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const sig = [i];
      for (let j = 1; j <= n; j++) {
        sig[j] = Math.min(fila[j] + 1, sig[j - 1] + 1, fila[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      fila = sig;
    }
    return fila[n];
  }
  function noExiste(nombre) {
    const q = String(nombre || '').toLowerCase();
    let mejor = '', d = 99;
    for (const p of PARAMS) {
      for (const cand of [p.id, p.ali]) {
        const k = cerca(q, cand);
        if (k < d) { d = k; mejor = nombreDe(p); }
      }
    }
    const pista = d <= 3 ? dos(`. ¿Querías "${mejor}"?`, `. Did you mean "${mejor}"?`) : '';
    return dos(`no existe "${nombre}"${pista} Escribe "ayuda"`,
               `there is no "${nombre}"${pista} Type "help"`);
  }

  /* ── ÓRDENES ──
     nom/en: cómo se escribe · dev: solo tras desbloquear · es/en: qué hace. */
  const ORDENES = [
    { nom: 'ayuda', en: 'help', otros: ['?'], es: 'esta lista, o "ayuda <nombre>" para el detalle', en_d: 'this list, or "help <name>" for detail' },
    { nom: 'listar', en: 'list', otros: ['ls'], es: 'todos los parámetros con su valor', en_d: 'every parameter with its value' },
    { nom: 'poner', en: 'set', otros: [], es: 'poner <parámetro> <valor>  ·  también vale "vidas 5"', en_d: 'set <parameter> <value>  ·  "lives 5" works too' },
    { nom: 'normal', en: 'reset', otros: [], es: 'deshace todo y la partida vuelve a contar', en_d: 'undo everything; the game counts again' },
    { nom: 'salir', en: 'exit', otros: ['q'], es: 'cerrar la consola', en_d: 'close the console' },
    { nom: 'dev', en: 'dev', otros: ['desarrollo'], es: 'desbloquea las órdenes de desarrollo', en_d: 'unlock the development commands' },
    { nom: 'dia', en: 'day', otros: ['día'], dev: true, es: 'dia <1-15> salta a ese día de la campaña', en_d: 'day <1-15> jumps to that campaign day' },
    { nom: 'juego', en: 'game', otros: [], dev: true, es: 'juego <tipo> lanza un minijuego suelto', en_d: 'game <type> launches one minigame' },
    { nom: 'semilla', en: 'seed', otros: [], dev: true, es: 'semilla <n> repite el azar igual; "semilla 0" lo suelta', en_d: 'seed <n> repeats the same randomness; "seed 0" releases it' },
    { nom: 'fps', en: 'fps', otros: [], dev: true, es: 'muestra los fotogramas por segundo', en_d: 'show frames per second' },
    { nom: 'estado', en: 'state', otros: [], dev: true, es: 'vuelca la partida en crudo', en_d: 'dump the raw save' },
  ];
  const ordenDe = w => ORDENES.find(o => o.nom === w || o.en === w || o.otros.includes(w));
  const escribeOrden = o => (ES() === 'en' ? o.en : o.nom);

  /* Los tipos de minijuego que existen. Se leen de NIVELES para que la lista no
     se quede vieja cuando se añada uno nuevo. */
  function tiposJuego() {
    try { return [...new Set(NIVELES.map(n => n.tipo))]; } catch (e) { return []; }
  }

  /* ── EL INTÉRPRETE ──
     ejecutar(linea, ctx) -> {lineas:[{c,s}], accion}
       c: 'ok' | 'err' | 'info' | 'tit'   (clase para pintar la línea)
       accion: lo que la consola no puede hacer sola y hace el panel
               ({tipo:'salir'|'dia'|'juego'|'fps'})
     ctx: {enNivel, enSala} — lo que pasa fuera de la consola. Va por parámetro
     y no se consulta del juego, para que esto se pueda probar sin navegador. */
  function ejecutar(linea, ctx) {
    const c = ctx || {};
    const salida = [], out = (cl, s) => salida.push({ c: cl, s });
    const fin = accion => ({ lineas: salida, accion: accion || null });

    const texto = String(linea == null ? '' : linea).trim();
    if (!texto) return fin();
    const trozos = texto.split(/\s+/);
    const w = trozos[0].toLowerCase();
    const resto = trozos.slice(1);

    const o = ordenDe(w);

    /* "vidas 5" sin escribir "poner": el atajo que de verdad se usa */
    if (!o && porId[w]) {
      if (!resto.length) return fin(mostrar(porId[w], out));
      return fin(aplicar(w, resto.join(' '), out, c));
    }
    if (!o) { out('err', noExiste(w)); return fin(); }
    if (o.dev && !avanzadoOn) {
      out('err', dos(`"${escribeOrden(o)}" es de desarrollo. Escribe "dev" para desbloquearla`,
                     `"${escribeOrden(o)}" is a development command. Type "dev" to unlock it`));
      return fin();
    }

    switch (o.nom) {
      case 'ayuda': {
        if (resto.length) {
          const p = porId[resto[0].toLowerCase()];
          if (p) { detalle(p, out); return fin(); }
          const od = ordenDe(resto[0].toLowerCase());
          if (od) { out('info', escribeOrden(od) + ' — ' + dos(od.es, od.en_d)); return fin(); }
          out('err', noExiste(resto[0]));
          return fin();
        }
        out('tit', dos('ÓRDENES', 'COMMANDS'));
        for (const od of ORDENES) {
          if (od.dev && !avanzadoOn) continue;
          out('info', escribeOrden(od).padEnd(9) + dos(od.es, od.en_d));
        }
        out('info', dos('Un parámetro solo, sin valor, dice cuánto vale ahora.',
                        'A parameter on its own tells you its current value.'));
        return fin();
      }
      case 'listar': {
        out('tit', dos('PARÁMETROS', 'PARAMETERS'));
        for (const p of PARAMS) {
          const tocado = Object.prototype.hasOwnProperty.call(puesto, p.id);
          const v = tocado
            ? (p.tipo === 'lista' ? opsDe(p)[puesto[p.id]] : num(puesto[p.id]))
            : dos('(del juego)', '(from the game)');
          out(tocado ? 'ok' : 'info', nombreDe(p).padEnd(10) + String(v).padEnd(12) + desc(p));
        }
        if (semillaOn) out('ok', dos('semilla', 'seed').padEnd(10) + String(semillaOn));
        return fin();
      }
      case 'poner': {
        if (resto.length < 2) {
          out('err', dos('se escribe: poner <parámetro> <valor>', 'it goes: set <parameter> <value>'));
          return fin();
        }
        return fin(aplicar(resto[0], resto.slice(1).join(' '), out, c));
      }
      case 'normal': {
        if (!activo() && !ensayoOn) {
          out('info', dos('ya está todo como en el juego', 'everything is already as in the game'));
          return fin();
        }
        if (c.enNivel) {
          out('err', dos('no en mitad de una prueba: sal o termínala y vuelve',
                         'not in the middle of a test: leave or finish it, then come back'));
          return fin();
        }
        volverANormal();
        out('ok', dos('todo como el juego lo tenía. La partida vuelve a contar.',
                      'everything back as the game had it. The game counts again.'));
        return fin();
      }
      case 'salir': return fin({ tipo: 'salir' });
      case 'dev': {
        if (avanzadoOn) { out('info', dos('ya estaban desbloqueadas', 'already unlocked')); return fin(); }
        avanzadoOn = true;
        out('ok', dos('órdenes de desarrollo desbloqueadas: dia, juego, semilla, fps, estado',
                      'development commands unlocked: day, game, seed, fps, state'));
        return fin();
      }
      case 'dia': {
        const n = Math.floor(Number(resto[0]));
        const tot = (() => { try { return TOT_DIAS; } catch (e) { return 15; } })();
        if (!Number.isFinite(n) || n < 1 || n > tot) {
          out('err', dos(`dia espera un número de 1 a ${tot}`, `day expects a number from 1 to ${tot}`));
          return fin();
        }
        if (c.enSala) { out('err', dos('no desde una sala', 'not from a room')); return fin(); }
        empezarEnsayo();
        out('ok', dos('vamos al día ', 'going to day ') + n);
        return fin({ tipo: 'dia', dia: n - 1 });
      }
      case 'juego': {
        const tipos = tiposJuego();
        const q = String(resto[0] || '').toLowerCase();
        if (!tipos.includes(q)) {
          out('err', dos(`juego espera uno de: ${tipos.join(', ')}`, `game expects one of: ${tipos.join(', ')}`));
          return fin();
        }
        if (c.enSala) { out('err', dos('no desde una sala', 'not from a room')); return fin(); }
        empezarEnsayo();
        out('ok', dos('lanzando ', 'launching ') + q);
        return fin({ tipo: 'juego', juego: q });
      }
      case 'semilla': {
        const n = Math.floor(Number(resto[0]));
        if (!Number.isFinite(n) || n < 0) {
          out('err', dos('semilla espera un número entero (0 para soltar el azar)',
                         'seed expects a whole number (0 to release randomness)'));
          return fin();
        }
        if (n === 0) { semilla(0); out('ok', dos('azar libre otra vez', 'randomness free again')); return fin(); }
        semilla(n);
        empezarEnsayo();
        out('ok', dos('azar fijado con la semilla ', 'randomness fixed with seed ') + n);
        return fin();
      }
      case 'fps': return fin({ tipo: 'fps' });
      case 'estado': {
        out('tit', dos('PARTIDA', 'SAVE'));
        try {
          out('info', `pts ${S.pts} · xp ${S.xp} · dif ${S.dif} · ${dos('nombre', 'name')} ${S.nombre || '—'}`);
          out('info', `dias ${S.dias.join(',')}`);
          out('info', `logros ${S.logros.length} · mejoras ${S.mejoras.join(',') || '—'}`);
        } catch (e) { out('err', dos('no se pudo leer la partida', 'could not read the save')); }
        return fin();
      }
    }
    return fin();
  }

  /* Poner un parámetro y contar el resultado, con el aviso del ensayo la
     primera vez: quien cambia algo tiene que saber que deja de contar. */
  function aplicar(nombre, valor, out, ctx) {
    const eraEnsayo = ensayoOn;
    const r = fijar(nombre, valor);
    out(r.ok ? 'ok' : 'err', r.msg);
    if (r.ok && !eraEnsayo) {
      out('info', dos('desde aquí esto es un ENSAYO: no da puntos ni sube al marcador. "normal" lo deshace.',
                      'from here this is a REHEARSAL: no points, nothing published. "reset" undoes it.'));
    }
    if (r.ok && ctx && ctx.enNivel) {
      out('info', dos('la prueba que está en marcha no cambia; se nota en la siguiente.',
                      'the running test does not change; you will see it in the next one.'));
    }
    return null;
  }
  function mostrar(p, out) {
    const tocado = Object.prototype.hasOwnProperty.call(puesto, p.id);
    const v = tocado
      ? (p.tipo === 'lista' ? opsDe(p)[puesto[p.id]] : num(puesto[p.id]))
      : dos('lo que diga el juego', 'whatever the game says');
    out(tocado ? 'ok' : 'info', `${nombreDe(p)} = ${v}`);
    out('info', desc(p));
    return null;
  }
  function detalle(p, out) {
    out('tit', nombreDe(p));
    out('info', desc(p));
    out('info', p.tipo === 'lista'
      ? dos('valores: ', 'values: ') + opsDe(p).join(', ')
      : dos(`número de ${num(p.min)} a ${num(p.max)}`, `number from ${num(p.min)} to ${num(p.max)}`) +
        (p.ent ? dos(' (entero)', ' (whole)') : ''));
    out('info', dos('ejemplo: ', 'example: ') + nombreDe(p) + ' ' +
      (p.tipo === 'lista' ? opsDe(p)[0] : num(p.ent ? Math.min(p.max, 5) : 2)));
  }

  return {
    PARAMS, ORDENES,
    ajuste, activo, ensayo, avanzado, valores, resumen, tiposJuego,
    fijar, ejecutar, semilla, volverANormal,
    /* para las pruebas: dejar el laboratorio como recién cargado */
    _olvidar() { puesto = Object.create(null); ensayoOn = false; avanzadoOn = false; copia = null; semilla(0); },
  };
})();
