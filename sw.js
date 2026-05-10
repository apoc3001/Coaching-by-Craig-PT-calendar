const CACHE = 'cbc-v8';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './logo-header.png',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap'
];

// Install — cache core assets and skip waiting for activation
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting(); // Activate this SW immediately
});

// Activate — clean old caches and take control of clients
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch — NEVER cache Google API requests, otherwise serve from cache
self.addEventListener('fetch', function(e) {
  const url = e.request.url;

  // CRITICAL: Never cache Google API or Google Identity calls
  if (url.includes('googleapis.com') || url.includes('accounts.google.com') || url.includes('gstatic.com/gsi')) {
    e.respondWith(fetch(e.request));
    return;
  }

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(response) {
        // Cache Google Fonts dynamically
        if (url.includes('fonts.googleapis') || url.includes('fonts.gstatic')) {
          var clone = response.clone();
          caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
        }
        return response;
      });
    }).catch(function() {
      if (e.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});
