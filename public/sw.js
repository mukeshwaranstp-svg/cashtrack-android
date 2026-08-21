/* CashTrack service worker.
 * Caches the app shell + hashed build assets so the app loads when the
 * network is flaky. API calls (/api/*) are never cached.
 * Note: browsers only register service workers on secure origins (HTTPS or
 * localhost), so this is dormant when served over a plain-LAN address.
 * v2 — bumping CACHE name purges the old bugged (Android GPU-corruption)
 * bundle from devices so the fixed build loads clean.
 * v3 — GPU fixes shipped; bump forces every device to purge v2 and
 * refetch the fixed index.html + hashed assets.
 * v4 — Dashboard hero-blob gradient fix; byte-bump forces reinstall on
 * devices that had already upgraded to v3, purging the pre-fix bundle.
 * v5 — removed every bg-gradient on Home/Tools/Profile so all three screens
 * now match the clean Analysis screen (zero gradients); byte-bump purges v4. */
const CACHE = "cashtrack-v5";
const APP_SHELL = ["/", "/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {}),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET") return;
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (url.pathname.startsWith("/assets/")) {
    // Cache-first for hashed assets (immutable filenames): instant load from
    // cache, and any cache miss is fetched + stored.
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          return response;
        });
      }),
    );
    return;
  }

  // Navigation + everything else: network-first. A fresh index.html is what
  // pulls in the new hashed assets, so never short-circuit with a stale copy
  // unless the network is actually down.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/"))),
  );
});
