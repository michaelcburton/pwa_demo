const version = '1.0.28'; // Update this version number with each change
const CACHE_NAME = `my-rails-app-cache-v${version}`;
const DYNAMIC_CACHE_NAME = `my-rails-dynamic-cache-v${version}`; // Separate cache for dynamic content

// Define files to cache (static assets)
const ASSETS_TO_CACHE = [
  '/offline.html',
  '/',
  '/manifest.json',
  'https://unpkg.com/dexie/dist/dexie.js',
  'https://maxbeier.github.io/tawian-frontend/tawian-frontend.css',
  'https://fonts.googleapis.com/css?family=Cousine:400,400i,700,700i',
];

// Install event: caching the static assets on initial load
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching static assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
  self.skipWaiting(); // Activate worker immediately
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Start controlling the pages immediately
});

// Fetch event: Serve cached files when offline
self.addEventListener('fetch', event => {
  // Exclude `/1x1.png` and `/test_image.jpg` from being cached or served from cache
  if (event.request.url.endsWith('/1x1.png') || event.request.url.endsWith('/test_image.jpg')) {
    // Always fetch this from the network to check online status
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Handle navigation requests (e.g., for HTML pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse; // Serve from cache if found
          }
          return fetch(event.request)
            .then(networkResponse => {
              return caches.open(DYNAMIC_CACHE_NAME)
                .then(cache => {
                  // Cache the dynamic page response for future use
                  cache.put(event.request, networkResponse.clone());
                  return networkResponse;
                });
            });
        })
        .catch(() => caches.match('/offline.html')) // Serve fallback if both cache and network fail
    );
  } else {
    // Handle other asset requests (e.g., CSS, JS, etc.)
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          return cachedResponse || fetch(event.request)
            .then(networkResponse => {
              // Cache the new response dynamically
              return caches.open(DYNAMIC_CACHE_NAME).then(cache => {
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
              });
            });
        })
        .catch(() => {
          // Handle offline fallback for non-navigation requests
          if (event.request.destination === 'document') {
            return caches.match('/offline.html');
          }
        })
    );
  }
});
