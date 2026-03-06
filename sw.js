const CACHE_NAME = 'cpb-dynamic-v1';
const PRE_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/variables.css',
  './css/base.css',
  './css/layout.css',
  './js/app.js',
  './js/config.js',
  './js/starter.js'
];

// On install, pre-cache the essential "shell"
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRE_CACHE))
  );
  self.skipWaiting();
});

// Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

// Smart Fetch Strategy: Stale-While-Revalidate
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Skip non-GET requests and Google APIs (always fresh)
  if (request.method !== 'GET' || 
      url.hostname.includes('googleapis.com') || 
      url.hostname.includes('accounts.google.com') ||
      url.hostname.includes('gstatic.com')) {
    return;
  }

  // 2. Strategy: Stale-While-Revalidate for local assets
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(request).then(cachedResponse => {
        const fetchPromise = fetch(request).then(networkResponse => {
          // If network request is successful, clone it and update the cache
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // If network fails, we just silently fail (already serving from cache)
        });

        // Return the cached response immediately, or wait for the network if not in cache
        return cachedResponse || fetchPromise;
      });
    })
  );
});
