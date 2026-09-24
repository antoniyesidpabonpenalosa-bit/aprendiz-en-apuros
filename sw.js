/* Service worker · Practicante en Apuros 4
   Mismo origen: red primero (siempre fresco) con respaldo de caché offline.
   Lo de otros orígenes —el marcador en Supabase— no se toca: va a la red. */
const CACHE = 'pa4-v25';
/* Cuánto se espera a la red antes de servir la copia guardada. Con "red
   primero" a secas, una conexión mala (la del aula, un 3G flojo) dejaba cada
   archivo colgado hasta que el navegador se rindiera, aunque estuviera en
   caché. Pasado el tope se sirve la copia y la red, si llega, la renueva. */
const TOPE_RED = 3500;
const BASE = [
  './', './index.html', './manifest.webmanifest', './icon.svg', './icon-180.png',
  './css/estilos.css', './img/aprendiz.png',
  './fuentes/press-start-2p.woff2', './fuentes/vt323.woff2',
  './js/datos.js', './js/estado.js', './js/reto.js', './js/ranking.js', './js/audio.js', './js/graficos.js',
  './js/entrada.js', './js/nucleo.js', './js/menus.js', './js/retoui.js', './js/minijuegos.js',
  './js/jefe.js', './js/modos.js', './js/sala.js', './js/salaui.js', './js/sprite.js', './js/principal.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)));
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
  e.respondWith((async () => {
    const red = fetch(e.request).then(r => {
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
