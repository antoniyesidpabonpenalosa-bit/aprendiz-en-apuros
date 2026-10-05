'use strict';
/* ── SALAS DE CLASE: datos y red ──
   El instructor crea una sala (dificultad + minijuegos), los aprendices se
   unen con un código de 5 letras y el proyector muestra quién entró y cómo
   van. El servidor son cinco funciones de Supabase (db/salas.sql); aquí se
   habla con ellas y se guarda la lógica que no depende de la pantalla, para
   poder probarla sin navegador (test/sala.test.mjs). Las pantallas viven en
   salaui.js.

   Sin cuentas: al crear la sala o al unirse, el servidor devuelve un token
   secreto que se guarda en ESTE dispositivo (localStorage, aparte de la
   partida para que no viaje en el código de guardado). Con él el instructor
   recupera el mando si recarga el proyector, y el aprendiz su puesto. */

const SALA = (() => {
  /* Sin 0/O ni 1/I: se confunden al dictarlo en voz alta o leerlo en un
     proyector. Es el mismo alfabeto que usa la base para generarlo. */
  const CODIGO_OK = /^[A-HJ-NP-Z2-9]{5}$/;
  const limpiaCodigo = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
  const MAX_JUEGOS = 6;
  const CLAVE = 'pa4-sala';

  /** @typedef {{codigo:string, host?:string, id?:string, token?:string,
                 vivo?:{n:number, limite:number}}} Sesion */
  /** @typedef {{id:string, nombre:string, skin:number, camisa:number, acc:string,
                 av32:boolean, ronda:number, puntos:number, host:boolean}} Jugador */
  /** @typedef {{codigo:string, dificultad:number, juegos:string[],
                 estado:'espera'|'jugando'|'fin', jugadores:Jugador[],
                 modo?:'ritmo'|'vivo', items?:number[], q_n?:number, q_total?:number,
                 revelada?:boolean, limite?:number, ms?:number|null,
                 respondieron?:number, dist?:number[]|null}} Estado */

  /** @returns {Sesion|null} */
  function sesion() {
    try {
      const v = JSON.parse(localStorage.getItem(CLAVE) || 'null');
      return v && typeof v === 'object' && CODIGO_OK.test(v.codigo) ? v : null;
    } catch (e) { return null; }
  }
  /** @param {Sesion|null} v */
  function guardarSesion(v) {
    try { v ? localStorage.setItem(CLAVE, JSON.stringify(v)) : localStorage.removeItem(CLAVE); } catch (e) {}
  }
  const soyHost = codigo => { const s = sesion(); return !!(s && s.codigo === codigo && s.host); };
  const miId = codigo => { const s = sesion(); return s && s.codigo === codigo ? s.id || '' : ''; };

  /* ── llamadas al servidor ── */

  async function crear(dificultad, juegos) {
    const r = await RANKING.rpc('sala_crear', { p_dificultad: dificultad, p_juegos: juegos });
    if (r.ok && r.datos && CODIGO_OK.test(r.datos.codigo))
      guardarSesion({ codigo: r.datos.codigo, host: r.datos.token });
    return r;
  }

  /* Se une con el personaje actual. Si este dispositivo creó la sala, manda
     también el token del instructor para que salga con 👑. */
  async function unirse(codigo) {
    const previa = sesion();
    const host = previa && previa.codigo === codigo ? previa.host : undefined;
    const r = await RANKING.rpc('sala_unirse', {
      p_codigo: codigo, p_nombre: S.nombre || t('tu'),
      p_skin: S.skin, p_camisa: S.camisa, p_acc: S.acc || '', p_av32: !!S.av32,
      p_host: host || null,
    });
    if (r.ok && r.datos && r.datos.id)
      guardarSesion(Object.assign({ codigo, id: r.datos.id, token: r.datos.token }, host ? { host } : {}));
    return r;
  }

  /** @returns {Promise<{ok:boolean, datos?:Estado|null, error?:string, red?:boolean}>} */
  const estado = codigo => RANKING.rpc('sala_estado', { p_codigo: codigo });

  const mando = (codigo, accion, jugador) => {
    const s = sesion();
    return RANKING.rpc('sala_host', { p_codigo: codigo, p_token: s && s.host || '',
                                      p_accion: accion, p_jugador: jugador || null });
  };

  /* Puntuación de la sala: se manda el TOTAL y las rondas terminadas. Si un
     envío falla (se cayó la wifi del aula) se reintenta unas veces; como es
     el total, el siguiente que llegue deja el marcador bien igualmente. No usa
     tvez(): la pantalla cambia justo después y limpiarT() lo cancelaría. */
  let pendiente = null, reintento = 0;
  function puntuar(codigo, ronda, puntos) {
    /* Una sala es competencia real: con el laboratorio tocado no se puntúa.
       Es un cinturón de seguridad, porque la consola ni se abre dentro de una
       sala (js/consolaui.js) y entrar a una con un ensayo en marcha se avisa
       antes (rSala). Si algún día se abre otro camino, aquí se corta. */
    if (typeof LAB !== 'undefined' && LAB.ensayo()) return;
    pendiente = { codigo, ronda, puntos };
    clearTimeout(reintento);
    enviar(0);
  }
  async function enviar(vez) {
    const p = pendiente, s = sesion();
    if (!p || !s || s.codigo !== p.codigo || !s.id) return;
    const r = await RANKING.rpc('sala_puntuar', { p_id: s.id, p_token: s.token, p_ronda: p.ronda, p_puntos: p.puntos });
    if (pendiente !== p) return;                 // ya hay uno más nuevo en camino
    if (r.ok || vez >= 4) { pendiente = null; return; }
    reintento = setTimeout(() => enviar(vez + 1), 2000 * (vez + 1));
  }

  /* ── sondeo ──
   Pide el estado cada 3 s mientras la pantalla siga abierta: alLimpiar lo
   corta al cambiar de pantalla. Con la pestaña oculta no pide nada (un
   proyector minimizado no gasta), y si falla espera el doble antes de volver
   a intentar. Una respuesta que llega tarde, detrás de otra más nueva, se tira. */
  function vigilar(codigo, alLlegar, cadencia) {
    let vivo = true, pedidas = 0, reloj = 0;
    const vuelta = async () => {
      if (!vivo) return;
      let espera = 3000;
      if (!document.hidden) {
        const mia = ++pedidas;
        const r = await estado(codigo);
        if (!vivo || mia !== pedidas) return;
        if (!r.ok) espera = 6000;
        else if (cadencia) { try { espera = cadencia(r) || espera; } catch (e) {} }
        alLlegar(r);
      }
      if (vivo) reloj = setTimeout(vuelta, espera);
    };
    reloj = setTimeout(vuelta, 0);
    alLimpiar.push(() => { vivo = false; clearTimeout(reloj); });
  }

  /* ── RONDA EN VIVO y PANEL (db/sala-vivo.sql) ──
     El instructor lanza una pregunta, todos responden a la vez y el proyector
     enseña el podio al instante. La pregunta actual y su reloj viven en el
     servidor: cada dispositivo solo pregunta cuál es y cuánto lleva. */

  /* La configuración de la ronda en vivo (cuántas preguntas y cuántos
     segundos) la elige el instructor al crear la sala y se guarda en SU
     sesión, junto a su token: solo la usa el dispositivo que proyecta. */
  /** @param {string} codigo @param {{n:number,limite:number}|null} cfg */
  function fijarVivo(codigo, cfg) {
    const s = sesion();
    if (!s || s.codigo !== codigo) return;
    guardarSesion(Object.assign({}, s, { vivo: cfg || undefined }));
  }
  const configVivo = codigo => { const s = sesion(); return s && s.codigo === codigo && s.vivo ? s.vivo : null; };

  const vivoMando = (codigo, accion, items, limite) => {
    const s = sesion();
    return RANKING.rpc('sala_vivo', { p_codigo: codigo, p_token: s && s.host || '', p_accion: accion,
                                      p_items: items || null, p_limite: limite || 20 });
  };

  /* Responder: devuelve los puntos ganados, o -1 si el servidor no lo acepta
     (ya respondida, fuera de tiempo, pregunta que no es la actual…). */
  async function responder(codigo, q, opcion, ok) {
    const s = sesion();
    if (!s || s.codigo !== codigo || !s.id) return { ok: false, error: 'sin sesión' };
    return RANKING.rpc('sala_responder', { p_id: s.id, p_token: s.token, p_q: q, p_opcion: opcion, p_ok: !!ok });
  }

  /* Panel del instructor: lo jugado en una ronda, para que el proyector pueda
     enseñar qué temas falló más la clase. Solo agregados, nunca nombres. Un
     ensayo de la consola no reporta; y si un envío falla se reintenta una vez:
     el servidor solo cuenta una vez por jugador y ronda, así que repetir es
     inofensivo. No usa tvez(): la pantalla cambia justo después y limpiarT()
     lo cancelaría. */
  function reportar(codigo, ronda, items) {
    if (typeof LAB !== 'undefined' && LAB.ensayo()) return;
    const s = sesion();
    if (!s || s.codigo !== codigo || !s.id || !items || !items.length) return;
    const lote = items.slice(0, 40);
    const mandar = vez => RANKING.rpc('sala_reportar', { p_id: s.id, p_token: s.token, p_ronda: ronda, p_items: lote })
      .then(r => { if (!r.ok && vez < 1) setTimeout(() => mandar(vez + 1), 2500); });
    mandar(0);
  }
  const resumen = codigo => RANKING.rpc('sala_resumen', { p_codigo: codigo });

  /* ── lógica pura ── */

  /* n preguntas distintas de un banco de `total`, al azar. El instructor las
     escoge al empezar y las guarda el servidor, así todos ven las mismas. */
  /** @returns {number[]} */
  function preguntasVivo(n, total, rnd = Math.random) {
    const bolsa = Array.from({ length: total }, (_, i) => i);
    const k = Math.max(0, Math.min(n, total));
    for (let i = 0; i < k; i++) {
      const j = i + Math.floor(rnd() * (bolsa.length - i));
      [bolsa[i], bolsa[j]] = [bolsa[j], bolsa[i]];
    }
    return bolsa.slice(0, k);
  }

  /* Los puntos por rapidez, igual que en sala_responder (el servidor es quien
     manda; esto sirve para enseñar la escala y para probarla): de 1000 al
     instante a 300 al límite, y 0 si se falla. */
  const puntosPorRapidez = (ms, limiteS, acerto = true) =>
    !acerto ? 0 : Math.max(300, 1000 - Math.round(700 * Math.min(ms, limiteS * 1000) / (limiteS * 1000)));

  /* Cuánto queda de la pregunta. `est.ms` es lo que llevaba según el reloj del
     SERVIDOR cuando respondió; se le suma lo que ha pasado en este dispositivo
     desde entonces, así los relojes de los celulares no tienen que coincidir. */
  /** @param {any} est @param {number} recibidoEn @param {number} ahora */
  const restanteMs = (est, recibidoEn, ahora) =>
    est && est.ms != null ? Math.max(0, est.limite * 1000 - (est.ms + (ahora - recibidoEn))) : 0;

  const esVivo = est => !!est && est.modo === 'vivo';


  /* Orden de la tabla: puntos, luego quien lleva más rondas (va por delante
     aunque empate) y, a igualdad, el orden en que llegaron del servidor, que
     es el de entrada a la sala. Nunca muta la lista recibida. */
  /** @param {Jugador[]} js */
  function ordenar(js) {
    return js.map((j, i) => ({ j, i }))
      .sort((a, b) => b.j.puntos - a.j.puntos || b.j.ronda - a.j.ronda || a.i - b.i)
      .map(x => x.j);
  }

  /* Puesto de cada jugador, con empates compartidos (1, 2, 2, 4): dos que
     empatan no deben verse como primero y segundo. */
  /** @param {Jugador[]} ordenados @returns {number[]} */
  function puestos(ordenados) {
    const out = [];
    ordenados.forEach((j, i) => {
      out.push(i > 0 && j.puntos === ordenados[i - 1].puntos && j.ronda === ordenados[i - 1].ronda ? out[i - 1] : i + 1);
    });
    return out;
  }

  /* ¿Ya terminaron todos? El proyector pasa solo al podio cuando sí. */
  /** @param {Estado} e */
  const todosTerminaron = e => e.jugadores.length > 0 && e.jugadores.every(j => j.ronda >= e.juegos.length);

  /* El personaje de otro jugador, en el formato de cara()/cara32(). Los
     índices vienen de otro dispositivo: si no existen se cae al primero, y un
     accesorio desconocido simplemente no se dibuja. */
  /** @param {Jugador} j */
  function caraDe(j) {
    const o = { skin: SKINS[j.skin] || SKINS[0], camisa: CAMISAS[j.camisa] || CAMISAS[0],
                pelo: '#2a1c10', feliz: true, av32: !!j.av32 };
    if (ACCS.some(a => a.id === j.acc)) o[j.acc] = true;
    return o;
  }

  return {
    CODIGO_OK, MAX_JUEGOS, limpiaCodigo,
    sesion, guardarSesion, soyHost, miId,
    crear, unirse, estado, mando, puntuar, vigilar,
    fijarVivo, configVivo, vivoMando, responder, reportar, resumen,
    preguntasVivo, puntosPorRapidez, restanteMs, esVivo,
    ordenar, puestos, todosTerminaron, caraDe,
  };
})();
