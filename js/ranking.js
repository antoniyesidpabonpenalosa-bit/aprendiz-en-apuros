'use strict';
/* ── MARCADOR GLOBAL ──
   Tabla de récords compartida, sobre Supabase. Se habla con la API REST
   usando fetch a secas: sin SDK, sin build, sin dependencias — el juego
   se sigue abriendo con doble clic.

   La clave de abajo es PÚBLICA a propósito (Supabase la llama "publishable"):
   viaja en el JS del navegador y cualquiera puede leerla. Lo que protege los
   datos son las reglas del servidor, no el secreto de la clave: la tabla
   permite leer e insertar, pero NADIE puede editar ni borrar una marca, y los
   CHECK de la base rechazan puntajes o nombres imposibles.

   Todo aquí falla en silencio: sin internet, con el servidor caído o si el
   proyecto se borra, el juego sigue funcionando igual con sus récords locales. */

const RANKING = (() => {
  const URL_BASE = 'https://rfrvtuorcdgmlqwqzfqq.supabase.co/rest/v1/records';
  const CLAVE = 'sb_publishable_BOBxU9OmQuno60u1JgHkzw_Tyk2cuD3';
  const ESPERA = 6000;   // ms: si el servidor no responde, no dejamos la UI colgada

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
     quiere ver el podio absoluto. Devuelve null si la consulta falla. */
  async function top(n = 8, dificultad = null) {
    const filtro = [0, 1, 2].includes(dificultad) ? `&dificultad=eq.${dificultad}` : '';
    const r = await pedir(`${URL_BASE}?select=nombre,puntos,xp,dificultad,temporada&order=puntos.desc,creado_en.asc&limit=${n}${filtro}`);
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
  async function publicar({ nombre, puntos, xp, dificultad, temporada }) {
    const enteroValido = v => Number.isFinite(v) && v >= 0 && v <= 100000;
    const pts = Math.round(Number(puntos));
    const exp = Math.round(Number(xp));
    if (!enteroValido(pts) || !enteroValido(exp)) return false;

    const fila = {
      nombre: String(nombre || 'TU').toUpperCase().replace(/\s+/g, ' ').trim().slice(0, 10) || 'TU',
      puntos: pts,
      xp: exp,
      dificultad: [0, 1, 2].includes(dificultad) ? dificultad : 1,
      temporada: temporada === 2 ? 2 : 1,
    };
    const r = await pedir(URL_BASE, { method: 'POST', body: JSON.stringify(fila) });
    return !!r;
  }

  return { top, publicar };
})();
