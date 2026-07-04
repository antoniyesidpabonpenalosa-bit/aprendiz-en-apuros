/* Service worker · Practicante en Apuros 4
   Mismo origen: red primero (siempre fresco) con respaldo de caché offline.
   Otros orígenes (fuentes): caché primero. */
const CACHE = 'pa4-v4';
const BASE = [
  './', './index.html', './manifest.webmanifest', './icon.svg',
  './css/estilos.css',
  './js/datos.js', './js/estado.js', './js/audio.js', './js/graficos.js',
  './js/entrada.js', './js/nucleo.js', './js/menus.js', './js/minijuegos.js',
  './js/jefe.js', './js/principal.js',
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
  const propio = new URL(e.request.url).origin === location.origin;
  if (propio) {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          const copia = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, copia));
          return r;
        })
        .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(r2 => {
        if (r2.ok) {
          const copia = r2.clone();
          caches.open(CACHE).then(c => c.put(e.request, copia));
        }
        return r2;
      }))
    );
  }
});
