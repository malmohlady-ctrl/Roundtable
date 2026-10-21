/* Roundtable service worker — cache-first offline shell. API calls (POST,
   other origins) are never intercepted. */
const CACHE = "roundtable-v1";
const ASSETS = ["./", "index.html", "manifest.json",
  "icon-192.png", "icon-512.png", "icon-maskable-512.png"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) =>
    Promise.all(ASSETS.map((a) => c.add(a).catch(() => {})))
  ).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((k) => k.startsWith("roundtable-") && k !== CACHE)
      .map((k) => caches.delete(k))
  )).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(caches.match(e.request).then((hit) =>
    hit || fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    })
  ));
});
