// SD COMAYAGUA V59 - Service worker desactivado para evitar caché viejo.
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => { return; });
