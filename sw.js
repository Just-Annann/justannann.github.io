const CACHE_NAME = 'ussd-offline-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/packages.json'
];

self.addEventListener('install', evt=>{
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache=>cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', evt=>{
  evt.respondWith(
    caches.match(evt.request).then(resp=>resp || fetch(evt.request))
  );
});