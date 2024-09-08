const version = '1.0.37'; // Update this version number with each change
const CACHE_NAME = `app-cache-v${version}`;
const DYNAMIC_CACHE_NAME = `dynamic-cache-v${version}`; // Separate cache for dynamic content

// Define files to cache (static assets)
const ASSETS_TO_CACHE = [
  '/offline.html',
  '/',
  new Request('/posts/new', { 
    cache: 'reload',  // Forces the browser to fetch the resource from the network and store it
    headers: { 'Accept': 'text/html' } // Ensures the correct headers are present
  }),
  new Request('/posts', { 
    cache: 'reload',  // Forces the browser to fetch the resource from the network and store it
    headers: { 'Accept': 'text/html' } // Ensures the correct headers are present
  }),
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

  // Ignore fetch requests to the online check URL
  if (event.request.url.includes('/get')) {
    return fetch(event.request);
  }
  
  // Handle navigation requests (e.g., for HTML pages)
  if (event.request.mode === 'navigate') {
    const normalizedRequest = new Request(event.request.url, {
      method: event.method,
      headers: { 'Accept': 'text/html' },
      cache: 'default',  // Allow the cache to handle the response as normal
      credentials: 'same-origin'  // Ensure same-origin credentials are respected
    });

    event.respondWith(
      fetch(normalizedRequest)  // Try fetching the latest content from the network first
        .then(networkResponse => {
          return caches.open(DYNAMIC_CACHE_NAME).then(cache => {
            cache.put(normalizedRequest, networkResponse.clone()); // Cache the network response for future use
            return networkResponse;
          });
        })
        .catch(() => {
          // If the network fetch fails, try to serve the page from the cache
          return caches.match(normalizedRequest).then(cachedResponse => {
            return cachedResponse || caches.match('/offline.html');  // If no cache available, return offline fallback
          });
        })
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
