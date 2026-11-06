const CACHE_NAME = 'infoscreen-steuerung-v2-20261106';

const FALLBACK_FILES = [
  './index.html',
  './manifest.json',
  './app-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FALLBACK_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Die App-Hauptseite immer frisch vom Netz laden.
  // Nur wenn das Netz nicht erreichbar ist, wird der lokale Fallback verwendet.
  if (
    event.request.mode === 'navigate' ||
    url.pathname.endsWith('/InfoscreenApp/') ||
    url.pathname.endsWith('/InfoscreenApp/index.html')
  ) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Lokale App-Dateien: Netzwerk zuerst, Cache nur als Fallback.
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
