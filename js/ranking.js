'use strict';
/* ── MARCADOR GLOBAL ──
   Tabla de récords compartida, sobre Supabase. Se habla con la API REST
   usando fetch a secas: sin SDK, sin build, sin dependencias — el juego
   se sigue abriendo con doble clic.

   La clave de abajo es PÚBLICA a propósito (Supabase la llama "publishable"):
   viaja en el JS del navegador y cualquiera puede leerla. Lo que protege los
   datos son las reglas del servidor, no el secreto de la clave: la tabla
   permite leer e insertar, pero NADIE puede editar ni borrar una marca (no hay
   políticas de UPDATE ni DELETE, así que RLS las niega), y los CHECK de la base
   rechazan nombres imposibles, puntajes fuera de rango y cualquier marca con
   más puntos que XP, que es algo que una partida real no puede producir.

   Todo aquí falla en silencio: sin internet, con el servidor caído o si el
   proyecto se borra, el juego sigue funcionando igual con sus récords locales. */

/** Una fila del marcador, tal como la devuelve la base.
    @typedef {{nombre:string, puntos:number, xp:number, dificultad?:number, temporada?:number}} Fila */
/** Lo que el juego manda al publicar una marca.
    dificultad: 0, 1 o 2 · temporada: 0, 1, 2 o 3 (el sin fin) · grupo: el código de aula, si hay.
    @typedef {{nombre:string, puntos:number, xp:number, dificultad:number, temporada:number, grupo?:string}} Marca */

const RANKING = (() => {
  const URL_BASE = 'https://rfrvtuorcdgmlqwqzfqq.supabase.co/rest/v1/records';
  const CLAVE = 'sb_publishable_BOBxU9OmQuno60u1JgHkzw_Tyk2cuD3';
  const ESPERA = 6000;   // ms: si el servidor no responde, no dejamos la UI colgada

  /* Hitos que puede llevar una marca. El 3 es el sin fin y se consulta aparte;
     el nombre con letras evita que el número suelto se lea como "temporada 3". */
  const HITO_SIN_FIN = 3;
  const HITOS = [0, 1, 2, HITO_SIN_FIN];

  /* Código de aula: mayúsculas y dígitos, de 3 a 8. El mismo formato que exige
     el CHECK de la base, escrito una sola vez para que no se separen. */
  const GRUPO_OK = /^[A-Z0-9]{3,8}$/;
  const limpiaGrupo = g => {
    const v = String(g || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    return GRUPO_OK.test(v) ? v : '';
  };

  const cabeceras = {
    'apikey': CLAVE,
    'Authorization': 'Bearer ' + CLAVE,
    'Content-Type': 'application/json',
  };

  /* fetch con límite de tiempo: devuelve null ante cualquier problema */
  async function pedir(url, opts = {}) {
    const corte = new AbortController();
    const reloj = setTimeout(() => corte.abort(), ESPERA);
    try {
      const r = await fetch(url, { ...opts, headers: cabeceras, signal: corte.signal });
      if (!r.ok) return null;
      return r;
    } catch (e) {
      return null;               // sin red, DNS caído, CORS, aborto por tiempo…
    } finally {
      clearTimeout(reloj);
    }
  }

  /* Los mejores puntajes, opcionalmente de una sola dificultad (0, 1 o 2).
     Sin filtro se mezclan las tres, que no es justo pero es lo que pide quien
     quiere ver el podio absoluto. Devuelve null si la consulta falla.

     `modo` separa los dos marcadores que viven en la misma tabla: la campaña
     (hitos 0, 1 y 2) y el sin fin (hito 3). No se mezclan porque no son
     comparables — el puntaje de la campaña es el acumulado de quince días y el
     del sin fin es el de una sola racha, así que juntos el podio sería siempre
     de la campaña y el sin fin no se vería nunca. */
  /** @param {number} [n] @param {number|null} [dificultad] @param {string} [grupo]
      @param {'campana'|'sinfin'} [modo] @returns {Promise<Fila[]|null>} */
  async function top(n = 8, dificultad = null, grupo = '', modo = 'campana') {
    const filtro = [0, 1, 2].includes(dificultad) ? `&dificultad=eq.${dificultad}` : '';
    const fhito = modo === 'sinfin' ? `&temporada=eq.${HITO_SIN_FIN}` : `&temporada=neq.${HITO_SIN_FIN}`;
    /* Con grupo se ve solo la cohorte; sin él, el marcador abierto. */
    const g = limpiaGrupo(grupo);
    const fgrupo = g ? `&grupo=eq.${g}` : '';
    const r = await pedir(`${URL_BASE}?select=nombre,puntos,xp,dificultad,temporada&order=puntos.desc,creado_en.asc&limit=${n}${filtro}${fhito}${fgrupo}`);
    if (!r) return null;         // null = "no se pudo consultar"; [] = "no hay marcas"
    try {
      const filas = await r.json();
      return Array.isArray(filas) ? filas : null;
    } catch (e) {
      return null;
    }
  }

  /* Publica una marca. No espera respuesta ni interrumpe el juego si falla.

     Un puntaje fuera de rango se DESCARTA, no se recorta: recortarlo a 100000
     convertiría un valor absurdo en el primer puesto del marcador, que es
     justo lo contrario de lo que queremos. Una partida real nunca llega ahí. */
  /** @param {Marca} marca @returns {Promise<boolean>} */
  async function publicar({ nombre, puntos, xp, dificultad, temporada, grupo }) {
    const enteroValido = v => Number.isFinite(v) && v >= 0 && v <= 100000;
    const pts = Math.round(Number(puntos));
    const exp = Math.round(Number(xp));
    if (!enteroValido(pts) || !enteroValido(exp)) return false;
    if (pts > exp) return false;          // invariante del juego, igual que en la base

    const fila = {
      nombre: String(nombre || 'TU').toUpperCase().replace(/\s+/g, ' ').trim().slice(0, 10) || 'TU',
      puntos: pts,
      xp: exp,
      dificultad: [0, 1, 2].includes(dificultad) ? dificultad : 1,
      /* 0 = día 5 (media etapa) · 1 = día 10 (titulado) · 2 = día 15 (el
         contrato) · 3 = sin fin. Un valor que no exista cae al día 10 en vez
         de colarse tal cual en la base. */
      temporada: HITOS.includes(temporada) ? temporada : 1,
    };
    /* null y no cadena vacía: el CHECK de la base acepta null o el formato
       exacto, y '' no es ninguno de los dos. */
    const g = limpiaGrupo(grupo);
    if (g) fila.grupo = g;
    const r = await pedir(URL_BASE, { method: 'POST', body: JSON.stringify(fila) });
    return !!r;
  }

  /* ── marcador del reto diario ──
     Tabla aparte: se filtra por fecha, así que cada día empieza en blanco y
     cualquiera puede ser primero hoy. */
  const URL_RETOS = URL_BASE.replace(/\/records$/, '/retos');

  /** @param {number} n @param {string} fecha AAAA-MM-DD @param {string} [grupo]
      @returns {Promise<Fila[]|null>} */
  async function topReto(n = 8, fecha, grupo = '') {
    const g = limpiaGrupo(grupo);
    const r = await pedir(`${URL_RETOS}?select=nombre,puntos,xp&fecha=eq.${encodeURIComponent(fecha)}` +
      `${g ? `&grupo=eq.${g}` : ''}&order=puntos.desc,creado_en.asc&limit=${n}`);
    if (!r) return null;
    try { const f = await r.json(); return Array.isArray(f) ? f : null; } catch (e) { return null; }
  }

  /** @param {Omit<Marca,'temporada'> & {fecha:string}} marca @returns {Promise<boolean>} */
  async function publicarReto({ nombre, puntos, xp, dificultad, fecha, grupo }) {
    const enteroValido = v => Number.isFinite(v) && v >= 0 && v <= 100000;
    const pts = Math.round(Number(puntos)), exp = Math.round(Number(xp));
    if (!enteroValido(pts) || !enteroValido(exp)) return false;
    if (pts > exp) return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(fecha))) return false;
    const fila = {
      nombre: String(nombre || 'TU').toUpperCase().replace(/\s+/g, ' ').trim().slice(0, 10) || 'TU',
      puntos: pts, xp: exp,
      dificultad: [0, 1, 2].includes(dificultad) ? dificultad : 1,
      fecha: String(fecha),
    };
    const g = limpiaGrupo(grupo);
    if (g) fila.grupo = g;
    return !!(await pedir(URL_RETOS, { method: 'POST', body: JSON.stringify(fila) }));
  }

  return { top, publicar, topReto, publicarReto, limpiaGrupo, HITO_SIN_FIN };
})();
