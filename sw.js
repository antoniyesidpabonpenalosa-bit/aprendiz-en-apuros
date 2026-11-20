/* Service worker · Practicante en Apuros 4
   Mismo origen: red primero (siempre fresco) con respaldo de caché offline.
   Lo de otros orígenes —el marcador en Supabase— no se toca: va a la red. */
/* Va a la par con VERSION de js/datos.js: scripts/validar.mjs falla si se
   separan, porque entonces el juego enseñaría unas novedades y la caché
   serviría otra versión. */
const CACHE = 'pa4-v40.22';
/* Cuánto se espera a la red antes de servir la copia guardada. Con "red
   primero" a secas, una conexión mala (la del aula, un 3G flojo) dejaba cada
   archivo colgado hasta que el navegador se rindiera, aunque estuviera en
   caché. Pasado el tope se sirve la copia y la red, si llega, la renueva. */
const TOPE_RED = 3500;
const BASE = [
  './', './index.html', './manifest.webmanifest', './icon.svg', './icon-180.png',
  './css/estilos.css', './img/logros/primer.png', './img/logros/perfecto.png', './img/logros/mitad.png', './img/logros/secreto.png', './img/logros/sala-logros.webp', './img/logros/comprador.png', './img/logros/veloz.png', './img/logros/cerebro.png', './img/logros/gitmaster.png', './img/logros/revisor.png', './img/logros/resolutor.png', './img/logros/jefe.png', './img/logros/titulado.png', './img/logros/intacto.png', './img/logros/combo.png', './img/logros/coleccionista.png', './img/logros/pesadilla.png', './img/logros/maraton.png', './img/logros/sql.png', './img/logros/regex.png', './img/logros/contrato.png', './img/logros/s10.png', './img/logros/s6.png', './img/logros/s7.png', './img/logros/s4.png', './img/logros/s3.png', './img/logros/s5.png', './img/logros/s9.png', './img/logros/s1.png', './img/logros/s8.png', './img/logros/s2.png', './img/aprendiz-caminar.png', './img/npc/pasillo.png', './img/cine/formacion.webp', './img/cine/empresa.webp', './img/aprendiz-caminar-hd.png', './img/aprendiz-portada-hd.png', './img/aprendiz-femenina-caminar.png', './img/aprendiz-femenina-portada.png', './img/aprendiz-masculino-premium-caminar.png', './img/aprendiz-masculino-premium-portada.png',
  /* los 20 retratos dibujados (4 personajes × 5 gestos): son su único estilo,
     así que tienen que estar también sin conexión */
  './img/retratos/instructor-normal.webp', './img/retratos/instructor-feliz.webp', './img/retratos/instructor-enojado.webp', './img/retratos/instructor-sorprendido.webp', './img/retratos/instructor-preocupado.webp',
  './img/retratos/companera-normal.webp', './img/retratos/companera-feliz.webp', './img/retratos/companera-enojado.webp', './img/retratos/companera-sorprendido.webp', './img/retratos/companera-preocupado.webp',
  './img/retratos/lider-normal.webp', './img/retratos/lider-feliz.webp', './img/retratos/lider-enojado.webp', './img/retratos/lider-sorprendido.webp', './img/retratos/lider-preocupado.webp',
  './img/retratos/vigilante-normal.webp', './img/retratos/vigilante-feliz.webp', './img/retratos/vigilante-enojado.webp', './img/retratos/vigilante-sorprendido.webp', './img/retratos/vigilante-preocupado.webp',
  './img/jefe/jefe-fase-1.png', './img/jefe/jefe-fase-2.png', './img/jefe/jefe-fase-3.png', './img/jefe/jefe-transformaciones-atlas.png',
  './img/titulo/titulo-aprendiz-en-apuros.png',
  /* el campus nocturno de la portada (v36, js/fondo.js): escenario y 5 capas animadas */
  './img/portada/campus-noche.webp', './img/portada/estrellas-1.png', './img/portada/estrellas-2.png', './img/portada/nubes-cercanas.png', './img/portada/nubes-lejanas.png', './img/portada/ventanas.png',
  /* el pasillo HD (v37, css/estilos.css): techo, muro, suelo y hoja de puerta de cada ambiente */
  './img/pasillo-hd/formacion-techo.webp', './img/pasillo-hd/formacion-muro.webp', './img/pasillo-hd/formacion-suelo.webp', './img/pasillo-hd/formacion-puerta.png',
  './img/pasillo-hd/empresa-techo.webp', './img/pasillo-hd/empresa-muro.webp', './img/pasillo-hd/empresa-suelo.webp', './img/pasillo-hd/empresa-puerta.png',
  './fuentes/press-start-2p.woff2', './fuentes/vt323.woff2',
  './js/datos.js', './js/iconos.js', './js/estado.js', './js/consola.js', './js/reto.js', './js/ranking.js', './js/audio.js', './js/retratos-aprendiz-arte.js', './js/retratos-aprendiz.js', './js/graficos.js', './js/fondo.js', './js/efectos.js', './js/pixelfx.js', './js/pxefectos.js',
  './js/entrada.js', './js/nucleo.js', './js/cinematica.js', './js/menus.js', './js/consejos.js', './js/npc-sprites.js', './js/pasillo.js', './js/certificados.js', './js/tienda.js', './js/records.js', './js/retoui.js',
  './js/minijuegos.js', './js/minijuegos-codigo.js', './js/minijuegos-runner.js', './js/minijuegos-avanzados.js',
  './js/jefe-sprites.js', './js/jefe.js', './js/modos.js', './js/sala.js', './js/salaui.js', './js/salavivo.js', './js/accesorios-cuerpo-arte.js', './js/sprite.js', './js/gato-arte.js', './js/gato.js', './js/consolaui.js', './js/principal.js',
];

self.addEventListener('install', e => {
  /* cache:'reload' = directo del servidor. Sin esto, la copia de la versión
     nueva se llenaba con lo que el navegador tuviera en su caché HTTP, y
     GitHub Pages deja reutilizar cada archivo 10 minutos (max-age=600): justo
     después de publicar, la "v21" guardada podía ser la v20 por dentro. */
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE.map(u => new Request(u, { cache: 'reload' })))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  /* Solo lo propio. Antes lo de fuera se servía con "caché primero", una
     regla pensada para Google Fonts que se quedó cuando las fuentes pasaron
     al repo, y lo único que atrapaba ya era el marcador global: la URL de la
     consulta es siempre la misma, así que se guardaba la primera respuesta y
     el marcador se quedaba CONGELADO para siempre. Sin red, ranking.js ya
     muestra "sin conexión"; no hace falta caché aquí. */
  if (new URL(e.request.url).origin !== location.origin) return;
  /* La analítica de Vercel va siempre a la red: guardarla en caché no sirve
     de nada y sin conexión simplemente no se mide. */
  if (new URL(e.request.url).pathname.startsWith('/_vercel/')) return;
  e.respondWith((async () => {
    /* cache:'no-cache': pregunta siempre al servidor si el archivo cambió
       (si no, contesta un 304 de unos bytes). Sin esto, durante 10 minutos
       tras publicar, el aviso de "versión nueva" recargaba... la vieja (en
       GitHub Pages; Vercel ya obliga a revalidar). Se pide por URL porque una
       navegación no deja cambiar sus opciones. */
    const red = fetch(e.request.url, { cache: 'no-cache', credentials: 'same-origin' }).then(r => {
      if (r.ok) {
        const copia = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copia));
      }
      return r;
    });
    const tope = new Promise((_, falla) => setTimeout(() => falla(new Error('lenta')), TOPE_RED));
    try {
      return await Promise.race([red, tope]);
    } catch (_) {
      /* red caída o lenta: la copia guardada; si no la hay (primera visita),
         se sigue esperando a la red; y si tampoco, la portada offline. */
      const guardada = await caches.match(e.request);
      if (guardada) return guardada;
      try { return await red; } catch (_) { return caches.match('./index.html'); }
    }
  })());
});
