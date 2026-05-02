const CACHE_NAME = "sdcomayagua-inventario-v41-estable";
const ASSETS = [
  "./",
  "index.html",
  "inventario.html",
  "404.html",
  "style.css",
  "style-pro-v31.css",
  "style-v33-maravilla.css",
  "style-v35-premium-compacto.css",
  "style-v37-tienda-grid.css",
  "style-v38-mobile-pro.css",
  "style-v39-mobile-ultra.css",
  "style-v40-caja-movil.css",
  "style-v41-estable.css",
  "app.js",
  "fix-v31.js",
  "fix-v33-maravilla.js",
  "fix-v35-premium-compacto.js",
  "fix-v37-tienda-grid.js",
  "fix-v38-mobile-pro.js",
  "fix-v39-mobile-ultra.js",
  "fix-v40-caja-movil.js",
  "fix-v41-estable.js",
  "manifest.json",
  "icon-192.png",
  "icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.allSettled(ASSETS.map((asset) => cache.add(asset))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (url.hostname.includes("script.google.com")) {
    event.respondWith(fetch(request).catch(() => new Response(JSON.stringify({ products: [], history: [] }), {
      headers: { "Content-Type": "application/json" }
    })));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
