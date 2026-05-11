const CACHE_NAME = 'vivanticos-v9';
const APP_VERSION = '1.8.0';

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
      return self.clients.claim();
    }).then(() => {
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

// ==========================================
// PUSH NOTIFICATION HANDLERS
// ==========================================

// Handle push events — show native notification
self.addEventListener('push', (event) => {
  let data = {
    title: 'Vivanticos',
    body: 'Tienes una nueva notificación',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'vivanticos-notification',
    data: {},
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    vibrate: [100, 50, 100],
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click — open/focus the app and navigate
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notifData = event.notification.data || {};
  let targetUrl = '/';

  // Navigate to the relevant section based on notification data
  if (notifData.relacionado_tipo === 'entrega' && notifData.relacionado_id) {
    targetUrl = `/?entrega=${notifData.relacionado_id}`;
  } else if (notifData.relacionado_tipo === 'cotizacion' && notifData.relacionado_id) {
    targetUrl = `/?cotizacion=${notifData.relacionado_id}`;
  }

  // Handle action button clicks
  if (event.action === 'view' && notifData.relacionado_id) {
    // Already handled by targetUrl above
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If there's already a window open, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            data: notifData,
            url: targetUrl,
          });
          return client.focus();
        }
      }
      // If no window is open, open a new one
      return self.clients.openWindow(targetUrl);
    })
  );
});

// ==========================================
// MESSAGE HANDLERS (from app)
// ==========================================

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: APP_VERSION });
  }
  if (event.data && event.data.type === 'FORCE_UPDATE') {
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

// ==========================================
// FETCH HANDLER (caching strategy)
// ==========================================

self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip API calls and external requests — never cache these
  if (event.request.url.includes('/api/') || !event.request.url.startsWith(self.location.origin)) return;

  // For navigation requests (HTML pages), ALWAYS fetch from network
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then((response) => {
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

  // For Next.js static chunks (/_next/static/) — DO NOT cache in SW.
  if (event.request.url.includes('/_next/static/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || new Response('Offline', { status: 503 });
          });
        })
    );
    return;
  }

  // For other static assets (images, fonts, etc.) — network first, cache fallback
  const isStaticAsset = event.request.url.match(/\.(woff2?|ttf|png|jpg|jpeg|gif|svg|ico|webp|wasm)$/i);

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

  // For everything else (JSON, etc.) — network first, no cache
  event.respondWith(
    fetch(event.request, { cache: 'no-cache' })
      .then((response) => {
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || new Response('Offline', { status: 503 });
        });
      })
  );
});
