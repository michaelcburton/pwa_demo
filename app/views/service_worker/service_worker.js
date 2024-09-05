const version = '1.0.26'; // Update this version number with each change

importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js"
);

// We first define the strategies we will use and the registerRoute function
const {CacheFirst, NetworkFirst, NetworkOnly} = workbox.strategies;
const {registerRoute} = workbox.routing;
const {warmStrategyCache, staticResourceCache, pageCache} = workbox.recipes;
const {setCatchHandler} = workbox.routing;
const {ExpirationPlugin} = workbox.expiration;
const {CacheableResponsePlugin} = workbox.cacheableResponse;
const strategy = new NetworkFirst();
const urls = [
  '/offline.html',
  '/',
  '/posts',
  '/manifest.json',
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
  warmCache: [
    'https://unpkg.com/dexie/dist/dexie.js',
    'https://maxbeier.github.io/tawian-frontend/tawian-frontend.css',
    'https://fonts.googleapis.com/css?family=Cousine:400,400i,700,700i',
  ],  // Pre-cache the static resources
  cacheName: `static-resources-${version}`, // Optional: specify a custom cache name
  plugins: [
    new workbox.expiration.ExpirationPlugin({
      maxEntries: 100,  // Optional: limit the number of entries
      maxAgeSeconds: 30 * 24 * 60 * 60, // Cache static resources for 30 days
    }),
  ],
});

// Add the pageCache recipe for caching HTML pages
pageCache({
  cacheName: `pages-cache-${version}`,  // Custom cache name for pages
  networkTimeoutSeconds: 10,  // Give up on network after 10 seconds
  warmCache: [
    new Request('/', { cache: 'reload' }),
    new Request('/posts', { cache: 'reload' }),
    new Request('/posts/new', { cache: 'reload' }),
    new Request('/offline.html', { cache: 'reload' })
  ],  // Warm cache for critical pages
  plugins: [
    new ExpirationPlugin({
      maxEntries: 50,  // Limit the number of cached pages
      maxAgeSeconds: 7 * 24 * 60 * 60,  // Cache pages for 7 days
    }),
    {
      cacheDidUpdate: async ({ cacheName, request, oldResposne, newResponse }) => {
        console.log(`Cached page: ${request.url} in ${cacheName}`)
      }
    }
  ],
});

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