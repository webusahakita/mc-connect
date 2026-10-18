const CACHE_NAME = 'mc-connect-v9-session-cache';
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
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api/') ||
      /^\/(admin|stage|vendor|login)(\.html)?\/?$/.test(url.pathname)) {
    return; // Session responses must always come from the server.
  }
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).catch(() => caches.match('/'));
    })
  );
});
