/*
 * Service worker Dokumenku.
 *
 * Prinsip: data dokumen bersifat pribadi, jadi halaman HTML dan respons API
 * TIDAK PERNAH disimpan di cache. Yang di-cache hanya aset statis yang namanya
 * sudah ber-hash (/_next/static) dan ikon, plus halaman offline sederhana.
 */
const VERSION = "v3"; // naikkan setiap ikon/aset offline berubah
const STATIC_CACHE = `dokumenku-static-${VERSION}`;
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, "/icons/icon-192.png"]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("dokumenku-") && key !== STATIC_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigasi halaman: selalu dari jaringan; tampilkan halaman offline bila gagal.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL).then((r) => r ?? Response.error()))
    );
    return;
  }

  // Aset statis ber-hash & ikon: cache-first.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
  }
  // Selain itu (API, data RSC, dll.) dibiarkan ke jaringan tanpa cache.
});
