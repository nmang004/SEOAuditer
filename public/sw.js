// COMPLETELY DISABLED SERVICE WORKER - DO NOTHING
console.log('Service Worker: Completely disabled');

// Do not handle any events
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install - but doing nothing');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate - but doing nothing');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Service Worker: Deleting cache', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// DO NOT HANDLE FETCH EVENTS AT ALL
// self.addEventListener('fetch', ...) is completely removed