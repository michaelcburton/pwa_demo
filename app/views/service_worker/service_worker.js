const version = '1.0.24'; // Update this version number with each change

const ASSETS_TO_CACHE = [
  'https://unpkg.com/dexie/dist/dexie.js',
  'https://maxbeier.github.io/tawian-frontend/tawian-frontend.css',
  'https://fonts.googleapis.com/css?family=Cousine:400,400i,700,700i',
];

const PAGES_TO_CACHE = [
  '/',
  '/offline.html',
  '/posts',
  '/manifest.json',
];

async function onInstall(event) {
  console.log('[Serviceworker]', "Installing!", event);
  event.waitUntil(
    (async () => {
      try {
        const doc_cache = await caches.open(`documents-${version}`);
        await doc_cache.addAll(PAGES_TO_CACHE);

        const asset_cache = await caches.open(`assets-styles-and-scripts-${version}`);
        for (const url of ASSETS_TO_CACHE) {
          try {
            const response = await fetch(url, { mode: 'cors' });
            if (response.ok) {
              await asset_cache.put(url, response);
            } else {
              console.error(`Failed to cache ${url}:`, response.status, response.statusText);
            }
          } catch (error) {
            console.error(`Failed to fetch ${url}:`, error);
          }
        }
      } catch (error) {
        console.error('Error during service worker installation:', error);
      }
    })()
  );
}

function onActivate(event) {
  console.log('[Serviceworker]', "Activating!", event);

  const currentCaches = [
    `documents-${version}`,
    `assets-styles-and-scripts-${version}`
  ];

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
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
}

self.addEventListener('install', onInstall);
self.addEventListener('activate', onActivate);

self.addEventListener('fetch', (event) => {
  console.log('[Serviceworker]', "fetch", event)
  if (event.request.url.includes('/manifest.json')) {
    event.respondWith(
      caches.match('/manifest.json').then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then(networkResponse => {
          if (networkResponse.ok) {
            return caches.open(`documents-${version}`).then(cache => {
              cache.put('/manifest.json', networkResponse.clone());
              return networkResponse;
            });
          } else {
            throw new Error('Network response was not ok.');
          }
        }).catch(error => {
          console.error('Fetch failed; returning offline page instead.', error);
          return caches.match('/offline.html');
        });
      }).catch(error => {
        console.error('Cache match failed:', error);
        return caches.match('/offline.html');
      })
    );
  } else if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse; // Serve from cache
        }
        return fetch(event.request).catch(() => caches.match('/offline.html'));
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