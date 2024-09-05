const version = '1.0.26'; // Update this version number with each change

importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js"
);

// We first define the strategies we will use and the registerRoute function
const {CacheFirst, NetworkFirst, NetworkOnly} = workbox.strategies;
const {registerRoute} = workbox.routing;
const {warmStrategyCache, staticResourceCache} = workbox.recipes;
const {setCatchHandler} = workbox.routing;
const strategy = new NetworkFirst();
const urls = [
  '/offline.html',
  '/',
  '/posts',
  '/manifest.json',
  'https://unpkg.com/dexie/dist/dexie.js',
  'https://maxbeier.github.io/tawian-frontend/tawian-frontend.css',
  'https://fonts.googleapis.com/css?family=Cousine:400,400i,700,700i',
];
// Warm the runtime cache with a list of asset URLs
warmStrategyCache({urls, strategy});

// Static resources cache 
// The static resources cache recipe allows your service worker to respond
// to a request for static resources, specifically CSS, JavaScript, and Web 
// Worker requests, with a stale-while-revalidate caching strategy so those 
// assets can be quickly served from the cache and be updated in the background
//
// This recipe supports cache warming through the warmCache option. See the static 
// resources cache options for a list of all configuration options.
staticResourceCache({
  warmCache: urls,  // Pre-cache the static resources
  cacheName: `static-resources-${version}`, // Optional: specify a custom cache name
  plugins: [
    new workbox.expiration.ExpirationPlugin({
      maxEntries: 100,  // Optional: limit the number of entries
      maxAgeSeconds: 30 * 24 * 60 * 60, // Cache static resources for 30 days
    }),
  ],
});

// If we have critical pages that won't be changing very often, it's a good idea to use cache first with them
// registerRoute(
//   ({url}) => url.pathname.startsWith('/'),
//     new CacheFirst()
// )

// Specific route for the network check image
registerRoute(
  ({url}) => url.pathname === '/1x1.png',
  new NetworkOnly()
);

// For every other page we use network first to ensure the most up-to-date resources
registerRoute(
  ({request, url}) => request.destination === "document" ||
                      request.destination === "",
  new NetworkFirst()
)

// For assets (scripts and images), we use cache first
// registerRoute(
//   ({request}) =>  request.destination === "script" ||
//                   request.destination === "style" ||
//                   request.destination === "image",
//   new CacheFirst()
// )

// Trigger a 'catch' handler when any of the other routes fail to generate a response
setCatchHandler(async ({event}) => {
  switch (event.request.destination) {
    case 'document':
      return strategy.handle({event, request: urls[0]});
    default:
     return Response.error();
   }
});