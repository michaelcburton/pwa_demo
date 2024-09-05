const version = '1.0.27'; // Update this version number with each change
const CACHE_NAME = `my-rails-app-cache-v${version}`;

// Define files to cache (add more static files or assets as needed)
const ASSETS_TO_CACHE = [
  '/offline.html',
  '/',
  '/posts',
  '/manifest.json',
  'https://unpkg.com/dexie/dist/dexie.js',
  'https://maxbeier.github.io/tawian-frontend/tawian-frontend.css',
  'https://fonts.googleapis.com/css?family=Cousine:400,400i,700,700i',
];

// Install event: caching the assets on initial load
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// Activate event: Clean up old caches if necessary
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event: Serve cached files when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // If a cached file is found, return it, otherwise fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // If both the cache and the network are unavailable, serve a fallback page
        return caches.match('/offline.html');
      })
  );
});