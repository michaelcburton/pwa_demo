const version = '1.0.25'; // Update this version number with each change

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

// We first define the strategies we will use and the registerRoute function
const {CacheFirst, NetworkFirst} = workbox.strategies;
const {registerRoute} = workbox.routing;

// If we have critical pages that won't be changing very often, it's a good idea to use cache first with them
// registerRoute(
//   ({url}) => url.pathname.startsWith('/'),
//     new CacheFirst()
// )

// For every other page we use network first to ensure the most up-to-date resources
registerRoute(
  ({request, url}) => request.destination === "document" ||
                      request.destination === "",
  new NetworkFirst()
)

// For assets (scripts and images), we use cache first
registerRoute(
  ({request}) =>  request.destination === "script" ||
                  request.destination === "style" ||
                  request.destination === "image",
  new CacheFirst()
)
const {warmStrategyCache} = workbox.recipes;
const {setCatchHandler} = workbox.routing;
const strategy = new NetworkFirst();
const urls = [
  '/',
  '/offline.html',
  '/posts',
  '/manifest.json',
  'https://unpkg.com/dexie/dist/dexie.js',
  'https://maxbeier.github.io/tawian-frontend/tawian-frontend.css',
  'https://fonts.googleapis.com/css?family=Cousine:400,400i,700,700i',
];
// Warm the runtime cache with a list of asset URLs
warmStrategyCache({urls, strategy});

// Trigger a 'catch' handler when any of the other routes fail to generate a response
setCatchHandler(async ({event}) => {
  switch (event.request.destination) {
    case 'document':
      return strategy.handle({event, request: urls[0]});
    default:
     return Response.error();
   }
});

self.addEventListener('install', (event) => {
  console.log('[Serviceworker]', "install", event)
});

self.addEventListener('activate', (event) => {
  console.log('[Serviceworker]', "activate", event)
});

self.addEventListener('fetch', (event) => {
  console.log('[Serviceworker]', "fetch", event)
});