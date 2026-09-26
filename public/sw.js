const CACHE_NAME = 'mc-connect-v8-cache';
const ASSETS_TO_CACHE = [
  '/',
  '/css/app.css',
  '/css/landing.css',
  '/css/command-center.css',
  '/css/stage-mode.css',
  '/js/soundboard.js',
  '/js/teleprompter.js',
  '/js/live-sync.js',
  '/js/calendar.js',
  '/js/app.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).catch(() => caches.match('/'));
    })
  );
});
