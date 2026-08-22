const CACHE = "english-automaticity-v28-canonical-grammar-1";
const PRECACHE = [
  "/",
  "/daily",
  "/studio",
  "/grammar",
  "/replacements/en/grammar-curriculum.js",
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/dashboard-banner.svg",
  "/automaticity-journey-hero.png",
  "/automaticity-progress-story.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (new URL(event.request.url).pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(async () => {
        return (
          (await caches.match(event.request)) ??
          (event.request.mode === "navigate"
            ? ((await caches.match("/")) ?? (await caches.match("/offline")))
            : Response.error())
        );
      }),
  );
});
