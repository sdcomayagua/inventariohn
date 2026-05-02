const CACHE_NAME = "sdcomayagua-inventario-v49-wow";
const ASSETS = [
  "./",
  "index.html",
  "inventario.html",
  "404.html",
  "style-v48-wow.css?v=49-wow",
  "app-v48-wow.js?v=49-wow",
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

function networkFirst(request) {
  return fetch(request, { cache: "no-store" }).then((response) => {
    if (response && response.status === 200) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
    }
    return response;
  }).catch(() => caches.match(request));
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (url.hostname.includes("script.google.com")) {
    event.respondWith(fetch(request).catch(() => new Response(JSON.stringify({ offline: true, products: [], history: [] }), {
      status: 503,
      headers: { "Content-Type": "application/json", "X-SDC-Offline": "1" }
    })));
    return;
  }

  if (request.mode === "navigate" || url.pathname.endsWith(".js") || url.pathname.endsWith(".css") || url.pathname.endsWith(".html")) {
    event.respondWith(networkFirst(request).then((response) => response || caches.match("index.html")));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response && response.status === 200) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    }).catch(() => cached))
  );
});
