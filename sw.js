const SDC_CACHE = 'sdc-control-cache-final';
const CORE_ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './css/quality.css',
  './css/presence.css',
  './css/executive.css',
  './css/command.css',
  './css/mobile.css',
  './css/finishing.css',
  './js/config.js',
  './js/data.js',
  './js/storage.js',
  './js/cloud.js',
  './js/pwa.js',
  './js/app.js',
  './js/quality.js',
  './js/presence.js',
  './js/executive.js',
  './js/command.js',
  './js/private-tools.js',
  './assets/logo-sdc.png',
  './assets/placeholders/no-image.svg',
  './assets/placeholders/gamer.svg',
  './assets/placeholders/tecnologia.svg',
  './assets/placeholders/hogar.svg',
  './assets/categorias/categoria.svg',
  './manifest.webmanifest',
  './cliente.html',
  './css/client-view.css',
  './js/client-view.js'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(SDC_CACHE).then(cache => cache.addAll(CORE_ASSETS).catch(() => Promise.resolve())).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key.indexOf('sdc-') === 0 && key !== SDC_CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.endsWith('/index.html') || url.pathname.endsWith('/')) {
    event.respondWith(fetch(req).then(res => {
      const copy = res.clone();
      caches.open(SDC_CACHE).then(cache => cache.put(req, copy));
      return res;
    }).catch(() => caches.match(req).then(cached => cached || caches.match('./index.html'))));
    return;
  }
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(SDC_CACHE).then(cache => cache.put(req, copy));
      return res;
    }).catch(() => cached))
  );
});
