// Use only local, valid assets so installation can complete without unretrievable LFS media.
const CACHE = "deutschflow-web-2026.10.03.7";
const CORE = [
  "/replacements/de/grammar-runtime.js?v=2026.10.02.3",
  "/replacements/de/grammar-catalog.js?v=20260902-valency-1",
  "/device-access/learning-path.js",
  "/device-access/grammar-drafts.js",
  "/device-access/writing.js",
  "/device-access/writing.css",
  "/device-access/grammar-layout.js",
  "/device-access/mobile-drawer.js",
  "/device-access/mobile-drawer.css",
  "/roadmap.html",
  "/assessment-benchmarks.html",
  "/assessment-benchmarks.json",
  "/microphone-check.html",
  "/microphone-check.js",
  "/practice",
  "/learning-core/practice.js",
  "/learning-core/overview.js",
  "/learning-core/practice.css",
  "/learning-core/curriculum-de.json",
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
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/") || url.searchParams.has("_rsc") || event.request.headers.get("RSC") === "1") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && !response.headers.get("content-type")?.includes("text/x-component") && new URL(event.request.url).origin === self.location.origin) {
          const copy = response.clone();
          event.waitUntil(
            caches.open(CACHE).then((cache) => cache.put(event.request, copy)),
          );
        }
        return response;
      })
      .catch(async () => {
        // Lesson parameters select local content inside the same route shell.
        if (event.request.mode === "navigate") {
          const page = await caches.match(event.request) ?? await caches.match(url.pathname);
          if (page) return page;
        }
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
