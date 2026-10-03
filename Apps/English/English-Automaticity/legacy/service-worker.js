const CACHE='grammar-automaticity-v27-0-1-full-online-assessment-en';
const ASSETS=['./','./index.html','./resources.js','./resources.css','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./offline.html','./assets/dashboard-banner.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));return response}).catch(()=>caches.match(event.request).then(r=>r||caches.match('./offline.html','./assets/dashboard-banner.svg'))));
});
