// Use only local, valid assets so installation can complete without unretrievable LFS media.
const CACHE = "deutschflow-v23-local-icon-1";
const CORE = [
  "/",
  "/audio",
  "/fehler",
  "/heute",
  "/studio",
  "/grammatik",
  "/wiederholungen",
  "/ressourcen",
  "/einstellungen",
  "/manifest.webmanifest",
  "/offline.html",
  "/icons/deutschflow.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        Promise.allSettled(CORE.map((asset) => cache.add(asset))),
      ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE && key.startsWith("deutschflow-"))
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && new URL(event.request.url).origin === self.location.origin) {
          const copy = response.clone();
          event.waitUntil(
            caches.open(CACHE).then((cache) => cache.put(event.request, copy)),
          );
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) {
          return cached;
        }
        if (event.request.mode === "navigate") {
          return (
            (await caches.match("/offline.html")) ??
            new Response("Offline", {
              status: 503,
              headers: { "content-type": "text/plain; charset=utf-8" },
            })
          );
        }
        return new Response("", { status: 503 });
      }),
  );
});
