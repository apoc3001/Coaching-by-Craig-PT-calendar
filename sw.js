const CACHE = 'cbc-v9';
const ASSETS = [
  './',
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
  self.skipWaiting();
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
 
// Fetch handler — different strategies for different content types
self.addEventListener('fetch', function(e) {
  const url = e.request.url;
  const req = e.request;
 
  // NEVER cache Google API/Auth calls
  if (url.includes('googleapis.com') || url.includes('accounts.google.com') || url.includes('gstatic.com/gsi')) {
    e.respondWith(fetch(req));
    return;
  }
 
  // NETWORK-FIRST for HTML and navigation (so app updates are picked up immediately)
  if (req.mode === 'navigate' || url.endsWith('.html') || url.endsWith('/')) {
    e.respondWith(
      fetch(req).then(function(response) {
        // Update cache with fresh copy
        var clone = response.clone();
        caches.open(CACHE).then(function(cache) { cache.put(req, clone); });
        return response;
      }).catch(function() {
        // Offline — fall back to cache
        return caches.match(req).then(function(cached) {
          return cached || caches.match('./');
        });
      })
    );
    return;
  }
 
  // CACHE-FIRST for everything else (icons, fonts, manifest)
  e.respondWith(
    caches.match(req).then(function(cached) {
      return cached || fetch(req).then(function(response) {
        if (url.includes('fonts.googleapis') || url.includes('fonts.gstatic')) {
          var clone = response.clone();
          caches.open(CACHE).then(function(cache) { cache.put(req, clone); });
        }
        return response;
      });
    })
  );
});
