const CACHE_NAME = 'tamizh-todo-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/transformer_logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Exclude API requests from being cached by URL structure and POST requests 
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return; 
  }
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // If found in cache, return it. Else, fetch from network.
      return cachedResponse || fetch(event.request);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});
