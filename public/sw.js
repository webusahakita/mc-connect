const CACHE_NAME = 'mc-connect-v19-rundown-ref-fixed';
const ASSETS_TO_CACHE = [
  '/',
  '/favicon.jpg',
  '/manifest.json',
  '/css/app.css',
  '/css/admin.css',
  '/css/landing.css',
  '/css/command-center.css',
  '/css/stage-mode.css',
  '/css/custom-modal.css',
  '/js/session-client.js',
  '/js/soundboard.js',
  '/js/teleprompter.js',
  '/js/live-sync.js',
  '/js/calendar.js',
  '/js/app.js',
  '/js/bgm-player.js',
  '/js/custom-modal.js',
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
      /^\/(admin|stage|vendor|login|bisnis|keunggulan)(\.html)?\/?$/.test(url.pathname)) {
    return; // Session responses must always come from the server.
  }
  // Network first for CSS & JS to ensure immediate updates in browser
  if (url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => caches.match(event.request))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).catch(() => caches.match('/'));
    })
  );
});
