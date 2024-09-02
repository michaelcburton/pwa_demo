// app/views/service_worker/service_worker.js

const version = '1.0.5'; // Update this version number with each change

// Define an array of URLs to cache
const URLS_TO_CACHE = [
  'https://unpkg.com/dexie/dist/dexie.js',
  'https://maxbeier.github.io/tawian-frontend/tawian-frontend.css',
  'https://fonts.googleapis.com/css?family=Cousine:400,400i,700,700i',
  'https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js'
  // Add other assets and routes as needed
];

importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js"
);

workbox.setConfig({ debug: true });

// The precaching doesn't work with cross-origin assets. For now trying
// a manual solution in the 'install' event.
//
// workbox.precaching.precacheAndRoute([
//   { url: '/', revision: version },
//   { url: '/offline', revision: version },
//   ...URLS_TO_CACHE.map(url => ({url, revision: null})),
// ]);

function onInstall(event) {
  console.log('[Serviceworker]', "Installing!", event);
  event.waitUntil(
    (async () => {
      const doc_cache = await caches.open(`documents-${version}`);
      await doc_cache.addAll([
        '/',
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
}

function onFetch(event) {
}
self.addEventListener('install', onInstall);
self.addEventListener('activate', onActivate);
self.addEventListener('fetch', onFetch);

// We first define the strategies we will use and the registerRoute function
const {CacheFirst, NetworkFirst, NetworkOnly} = workbox.strategies;
const {registerRoute} = workbox.routing;

// If we have critical pages that won't be changing very often, it's a good idea to use cache first with them
registerRoute(
  ({url}) => url.pathname === '/',
    new CacheFirst({
      cacheName: `documents-${version}`,
  })
)

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
    })
)

// For assets (scripts and images), we use cache first
registerRoute(
  ({request}) => request.destination === "script" ||
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

// Offline fallback
const {warmStrategyCache} = workbox.recipes;
const {setCatchHandler} = workbox.routing;
const strategy = new CacheFirst();
const urls = ['/offline.html'];

// Warm the runtime cache with a list of asset URLs
warmStrategyCache({urls, strategy});

// Trigger a 'catch' handler when any of the other routes fail to generate a response
setCatchHandler(async ({event}) => {
  switch (event.request.destination) {
    case 'document':
      return await caches.match('/offline.html') || Response.error();
    default:
     return Response.error();
   }
});