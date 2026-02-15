const CACHE_NAME = 'cpb-v5';
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/variables.css',
  './css/base.css',
  './css/components.css',
  './css/layout.css',
  './css/views/browse.css',
  './css/views/add.css',
  './css/views/settings.css',
  './css/views/books.css',
  './js/app.js',
  './js/config.js',
  './js/auth.js',
  './js/sheets.js',
  './js/store.js',
  './js/router.js',
  './js/data.js',
  './js/icons.js',
  './js/utils/dom.js',
  './js/utils/qid.js',
  './js/utils/format.js',
  './js/components/nav.js',
  './js/components/toast.js',
  './js/views/browse.js',
  './js/views/add.js',
  './js/views/settings.js',
  './js/views/books.js',
  './assets/icon-192.png',
  './assets/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Don't cache Google API calls
  if (event.request.url.includes('googleapis.com') ||
      event.request.url.includes('accounts.google.com') ||
      event.request.url.includes('gstatic.com')) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
