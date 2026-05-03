const CACHE_NAME = "sdcomayagua-inventario-v56-gamer-ops";
const ASSETS = [
  "./",
  "./index.html",
  "./inventario.html",
  "./404.html",
  "./style-v54-compacto-mobile.css?v=54",
  "./style-v55-pro-github.css?v=55",
  "./style-v56-gamer-ops.css?v=56",
  "./app-v54-compacto-mobile.js?v=54",
  "./fix-v55-github.js?v=55",
  "./fix-v56-gamer-ops.js?v=56",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => null));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME && key.startsWith("sdcomayagua-inventario-")).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(fetch(req).then((response) => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => null);
    return response;
  }).catch(() => caches.match(req).then((cached) => cached || caches.match("./index.html"))));
});
