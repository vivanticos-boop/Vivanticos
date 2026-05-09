const CACHE_NAME = 'vivanticos-v7';
const APP_VERSION = '1.6.0';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/logo-vivanticos.jpeg',
  '/logo.svg',
  '/favicon.ico',
  '/apple-touch-icon.png',
];

// Install event - cache static assets and take control immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Force the new SW to activate immediately
  self.skipWaiting();
});

// Activate event - clean old caches and claim all clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      // Claim all clients immediately so they get the new SW
      return self.clients.claim();
    }).then(() => {
      // Notify all clients that a new version is active
      return self.clients.matchAll({ includeUncontrolled: true });
    }).then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'SW_UPDATED',
          version: APP_VERSION,
        });
      });
    })
  );
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: APP_VERSION });
  }
  if (event.data && event.data.type === 'FORCE_UPDATE') {
    // Clear all caches and reload
    caches.keys().then((names) => {
      return Promise.all(names.map((name) => caches.delete(name)));
    }).then(() => {
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'FORCE_RELOAD' });
        });
      });
    });
  }
  if (event.data && event.data.type === 'CLEAR_CACHE_AND_RELOAD') {
    caches.keys().then((names) => {
      return Promise.all(names.map((name) => caches.delete(name)));
    }).then(() => {
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'FORCE_RELOAD' });
        });
      });
    });
  }
});

// Fetch event - network first with aggressive cache bypass for HTML
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip API calls and external requests
  if (event.request.url.includes('/api/') || !event.request.url.startsWith(self.location.origin)) return;

  // For navigation requests (HTML pages), ALWAYS fetch from network - never use cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || caches.match('/');
          });
        })
    );
    return;
  }

  // For JS/CSS/static assets - network first with short timeout, cache fallback
  const isStaticAsset = event.request.url.match(/\.(js|css|woff2?|ttf|png|jpg|jpeg|gif|svg|ico|webp|wasm)$/i);

  if (isStaticAsset) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || new Response('Offline', { status: 503 });
          });
        })
    );
    return;
  }

  // For other requests (JSON, etc.) - network first, cache fallback
  event.respondWith(
    fetch(event.request, { cache: 'no-cache' })
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || new Response('Offline', { status: 503 });
        });
      })
  );
});
