const version = '1.0.19'; // Update this version number with each change

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

importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js"
);

workbox.setConfig({ debug: true });

// We first define the strategies we will use and the registerRoute function
const {CacheFirst, NetworkFirst, NetworkOnly} = workbox.strategies;
const {registerRoute} = workbox.routing;
const {ExpirationPlugin} = workbox.expiration;
const {CacheableResponsePlugin} = workbox.cacheableResponse;
const {precacheAndRoute} = workbox.precaching;

async function onInstall(event) {
  console.log('[Serviceworker]', "Installing!", event);
  event.waitUntil(
    (async () => {
      try {
        const doc_cache = await caches.open(`documents-${version}`);
        await doc_cache.addAll([
          '/',
          '/manifest.json',
          '/offline'
        ]);

        // Manually cache the cross-origin assets
        const asset_cache = await caches.open(`assets-styles-and-scripts-${version}`);
        for (const url of URLS_TO_CACHE) {
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
  precacheAndRoute(ASSETS_TO_CACHE)
}

// Cache the home page with a Network First strategy
registerRoute(
  ({ url }) => url.pathname === '/',
  new CacheFirst({
    cacheName: `documents-${version}`,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

// manifest.json
registerRoute(
  ({url}) => url.pathname === '/manifest.json',
  new CacheFirst({
    cacheName: `documents-${version}`,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

// Specific route for the network check image and connection quality image
registerRoute(
  ({url}) => url.pathname === '/1x1.png',
  new NetworkOnly()
);

registerRoute(
  ({url}) => url.pathname === '/test_image.jpg',
  new NetworkOnly()
);

// For every other page we use network first to ensure the most up-to-date resources
registerRoute(
  ({request, url}) => request.destination === "document" ||
    request.destination === "",
    new NetworkFirst({
      cacheName: `documents-${version}`,
      networkTimeoutSeconds: 10,
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        }),
      ],
    })
);

// For assets (scripts and images), we use cache first
registerRoute(
  ({request}) =>  request.destination === "script" ||
                  request.destination === "style",
  new CacheFirst({
    cacheName: `assets-styles-and-scripts-${version}`,
  })
)
registerRoute(
  ({request}) => request.destination === "image",
  new CacheFirst({
    cacheName: `assets-images-${version}`,
  })
)