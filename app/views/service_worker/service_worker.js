const version = '1.0.22'; // Update this version number with each change

const ASSETS_TO_CACHE = [
  'https://unpkg.com/dexie/dist/dexie.js',
  'https://maxbeier.github.io/tawian-frontend/tawian-frontend.css',
  'https://fonts.googleapis.com/css?family=Cousine:400,400i,700,700i',
];

const PAGES_TO_CACHE = [
  '/',
  '/posts',
  "/posts/new",
  "/manifest.json",
];

self.addEventListener('install', event => {
  console.log('[Serviceworker]', "Installing!", event);

  const documentsCachePromise = caches.open(`documents-${version}`).then(cache => {
    return cache.addAll(PAGES_TO_CACHE.map(url => new Request(url, { cache: 'reload' })));
  });

  const assetsCachePromise = caches.open(`assets-styles-and-scripts-${version}`).then(cache => {
    return cache.addAll(ASSETS_TO_CACHE);
  });

  event.waitUntil(
    Promise.all([documentsCachePromise, assetsCachePromise])
      .then(() => {
        console.log('All caches have been populated successfully.');
      })
      .catch(error => {
        console.error('Failed to populate caches:', error);
      })
  );
});

self.addEventListener('activate', event => {
  console.log('[Serviceworker]', "Activating!", event);

  // clear old caches
  const currentCaches = [
    `documents-${version}`,
    `assets-styles-and-scripts-${version}`,
    `assets-images-${version}`
  ];

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          // If this cache name isn't in the list of current caches, then delete it.
          if (!currentCaches.includes(cache)) {
            console.log(`Deleting old cache: ${cache}`);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      console.log('Service worker activated and old caches cleared.');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  console.log('[Serviceworker]', "fetch", event)
  const url = new URL(event.request.url);

  if (PAGES_TO_CACHE.includes(url.pathname)) {
    console.log("URL Pathname", url.pathname)
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        console.log("Request:", event.request)
        console.log("cachedResponse:", cachedResponse)
        if (cachedResponse) {
          return cachedResponse; // Return the cached response if available
        }
        return fetch(event.request).then(networkResponse => {
          return caches.open(`documents-${version}`).then(cache => {
            cache.put(event.request, networkResponse.clone()); // Cache the new response
            return networkResponse; // Return the network response
          });
        }).catch(() => {
          // Return the offline page if the network is unavailable
          if (url.pathname === '/' || url.pathname === '/posts') {
            return caches.match('/offline.html');
          }
        });
      })
    );
  } else if (event.request.url.includes('/1x1.png') || event.request.url.includes('/test_image.jpg')) {
    // Network only
    event.respondWith(fetch(event.request));
  } else if (event.request.destination === 'style' || event.request.destination === 'script' || event.request.destination === 'image') {
    // Cache first, then network
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        return cachedResponse || fetch(event.request).then(networkResponse => {
          return caches.open(`assets-styles-and-scripts-${version}`).then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
  } else {
    event.respondWith(fetch(event.request));
  }
});