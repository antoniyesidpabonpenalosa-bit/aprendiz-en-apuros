'use strict';
/* ── RETO DIARIO ──
   Una partida corta de 3 minijuegos, igual para todo el mundo ese día.

   La semilla sale de la FECHA LOCAL, no del servidor: así el reto es el mismo
   para todos y además funciona sin internet. Se usa la fecha local y no UTC
   porque si no el reto cambiaría a las 7 de la tarde en Colombia.

   Aquí vive también el sesgo de contenido: cada ítem (una pregunta del quiz,
   una línea de code review…) lleva un peso que sube cuando lo fallas y baja
   cuando lo aciertas, y el sorteo lo tiene en cuenta. Lo que no te sabes
   vuelve pronto; lo que dominas se espacia. */

const RETO = (() => {

  /* ── fecha y semilla ── */

  /* 'YYYY-MM-DD' en hora local (toISOString daría UTC y adelantaría el día) */
  function fechaDe(d = new Date()) {
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }
  const hoy = () => fechaDe();
  const mesDe = fecha => fecha.slice(0, 7);

  /* días entre dos fechas 'YYYY-MM-DD' (a mediodía para esquivar el horario
     de verano: sumar 24 h en el cambio de hora daría 23 o 25) */
  function diasEntre(a, b) {
    const t = f => { const [y, m, d] = f.split('-').map(Number); return Date.UTC(y, m - 1, d, 12); };
    return Math.round((t(b) - t(a)) / 86400000);
  }

  /* hash de cadena → entero (FNV-1a), para convertir la fecha en semilla */
  function semillaDe(txt) {
    let h = 2166136261;
    for (let i = 0; i < txt.length; i++) { h ^= txt.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  /* generador con semilla (mulberry32): mismo número de partida, misma serie */
  function rngCon(semilla) {
    let a = semilla >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ── memoria de aciertos y fallos ──
     S.pesos guarda solo los ítems con peso extra: un objeto pequeño que cabe
     de sobra en localStorage aunque se juegue durante meses. */

  const TOPE = 3;                       // un ítem nunca pesa más de 4 veces lo normal
  const clave = (pool, i) => pool + ':' + i;

  function pesos() {
    if (!S.pesos || typeof S.pesos !== 'object') S.pesos = {};
    return S.pesos;
  }

  /* Registra cómo te fue con un ítem. Fallarlo lo acerca; acertarlo lo aleja. */
  function marcar(pool, i, acerto) {
    const p = pesos();
    const k = clave(pool, i);
    const v = (p[k] || 0) + (acerto ? -1 : 1);
    if (v <= 0) delete p[k]; else p[k] = Math.min(TOPE, v);
    guardar();
  }

  /* Elige n índices de un pool de `total`, sin repetir, sesgando hacia lo
     fallado. Sin historial todos pesan igual y esto es un sorteo normal. */
  function elegir(pool, total, n, rnd = Math.random) {
    const p = pesos();
    const quedan = [];
    for (let i = 0; i < total; i++) quedan.push(i);
    const salida = [];
    n = Math.min(n, total);
    while (salida.length < n) {
      const pesoDe = i => 1 + (p[clave(pool, i)] || 0);
      const suma = quedan.reduce((a, i) => a + pesoDe(i), 0);
      let corte = rnd() * suma;
      let elegido = quedan.length - 1;                 // por si la coma flotante se queda corta
      for (let j = 0; j < quedan.length; j++) {
        corte -= pesoDe(quedan[j]);
        if (corte < 0) { elegido = j; break; }
      }
      salida.push(quedan[elegido]);
      quedan.splice(elegido, 1);
    }
    return salida;
  }

  /* ── estado del reto de hoy ── */

  const VACIO = { fecha: '', pts: 0, racha: 0, mejorRacha: 0, perdon: '', hechos: 0 };

  /* Rellena lo que falte SIN crear un objeto nuevo: si aquí se reasignara
     S.reto, cualquier referencia tomada antes (la de registrar, por ejemplo)
     quedaría huérfana y sus cambios se perderían en silencio.
     Además sanea los tipos, porque esto puede venir de un código de guardado
     escrito a mano. */
  function datos() {
    if (!S.reto || typeof S.reto !== 'object') S.reto = {};
    const r = S.reto;
    if (typeof r.fecha !== 'string') r.fecha = VACIO.fecha;
    if (typeof r.perdon !== 'string') r.perdon = VACIO.perdon;
    for (const k of ['pts', 'racha', 'mejorRacha', 'hechos'])
      if (typeof r[k] !== 'number' || !isFinite(r[k]) || r[k] < 0) r[k] = 0;
    return r;
  }

  /* La racha que se vería HOY, sin haber jugado todavía: si te saltaste días
     ya está rota, aunque el contador guardado diga otra cosa. */
  function rachaViva(fecha = hoy()) {
    const r = datos();
    if (!r.fecha) return 0;
    const d = diasEntre(r.fecha, fecha);
    if (d <= 0) return r.racha;                        // hoy ya jugado
    if (d === 1) return r.racha;                       // ayer: sigue viva
    if (d === 2 && r.perdon !== mesDe(fecha)) return r.racha;   // un día saltado, con perdón
    return 0;
  }

  const jugadoHoy = (fecha = hoy()) => datos().fecha === fecha;

  /* Multiplicador por racha: ×1 el primer día, ×2 a partir del séptimo. */
  const multiplicador = racha => Math.min(2, 1 + Math.max(0, racha - 1) / 6);

  /* Cierra el reto del día. Solo cuenta el PRIMER intento: repetirlo para
     practicar está bien, pero no sube el puntaje ni la racha.
     Devuelve el resumen de lo ganado, o null si hoy ya estaba cerrado. */
  function registrar(pts, fecha = hoy()) {
    const r = datos();
    if (jugadoHoy(fecha)) return null;

    const d = r.fecha ? diasEntre(r.fecha, fecha) : Infinity;
    let racha, perdonUsado = false;
    if (d === 1) racha = r.racha + 1;
    else if (d === 2 && r.perdon !== mesDe(fecha)) { racha = r.racha + 1; perdonUsado = true; }
    else racha = 1;

    const mult = multiplicador(racha);
    const ganado = Math.round(Math.max(0, pts) * mult);

    r.fecha = fecha;
    r.pts = Math.max(0, Math.round(pts));
    r.racha = racha;
    r.mejorRacha = Math.max(r.mejorRacha, racha);
    r.hechos++;
    if (perdonUsado) r.perdon = mesDe(fecha);

    S.pts += ganado;
    S.xp += ganado;
    guardar();
    return { ganado, racha, mult, perdonUsado, base: r.pts };
  }

  /* ── premios que no se compran ── */
  const PREMIOS = [
    { dias: 3,  ico: '🔥' },
    { dias: 7,  ico: '⭐' },
    { dias: 14, ico: '💎' },
    { dias: 30, ico: '🏆' },
  ];
  /* Se miden contra la mejor racha histórica: una vez ganado, no se pierde. */
  const premiosGanados = () => PREMIOS.filter(p => datos().mejorRacha >= p.dias);
  const proximoPremio = () => PREMIOS.find(p => datos().mejorRacha < p.dias) || null;

  /* ── el reto de hoy ── */

  /* Tipos de minijuego que pueden salir. Se excluye el runner porque dura
     mucho más que los demás y rompería los 3 minutos que debe durar esto. */
  const TIPOS = ['escribir', 'bugs', 'memoria', 'simon', 'quiz', 'review', 'merge', 'sql', 'regex'];

  /* Los 3 minijuegos del día, iguales para todo el mundo. */
  function retosDe(fecha = hoy()) {
    const rnd = rngCon(semillaDe('reto-' + fecha));
    const quedan = TIPOS.slice();
    const salida = [];
    for (let i = 0; i < 3; i++) salida.push(quedan.splice(Math.floor(rnd() * quedan.length), 1)[0]);
    return salida;
  }

  /* Generador del día, para que los minijuegos saquen el mismo contenido en
     todos los dispositivos. El sufijo separa la serie de cada ronda. */
  const rngDelDia = (sufijo = '', fecha = hoy()) => rngCon(semillaDe('reto-' + fecha + sufijo));

  return {
    fechaDe, hoy, diasEntre, semillaDe, rngCon,
    marcar, elegir, pesos,
    datos, rachaViva, jugadoHoy, multiplicador, registrar,
    PREMIOS, premiosGanados, proximoPremio,
    TIPOS, retosDe, rngDelDia,
  };
})();
