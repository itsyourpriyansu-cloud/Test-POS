const CACHE_NAME = 'kitchenflow-v1';
const ASSETS = [
  './index.html',
  './manifest.json',
  './css/variables.css',
  './css/style.css',
  './css/responsive.css',
  './js/app.js',
  './js/utils.js',
  './js/menu.js',
  './js/kitchen.js',
  './js/billing.js',
  './data/menu.json',
  './assets/icons/icon.svg'
];

// Install Event - cache core shell assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching App Shell Assets');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - clean up obsolete cache directories
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing obsolete cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - cache-first with network fallback
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Dev bypass: bypass cache-first on localhost/127.0.0.1 to avoid stale dev state
  if (event.request.url.includes('localhost') || event.request.url.includes('127.0.0.1')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Serve from cache but fetch fresh copies asynchronously (Stale While Revalidate style)
          fetch(event.request)
            .then(networkResponse => {
              if (networkResponse.status === 200) {
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
              }
            })
            .catch(() => {/* Ignore network update failure offline */});
          
          return cachedResponse;
        }

        return fetch(event.request).then(networkResponse => {
          // If response is valid, save to cache
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        });
      }).catch(() => {
        // Handle physical resource fetch failure when completely offline
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      })
  );
});
