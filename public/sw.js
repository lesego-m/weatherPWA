const CACHE_NAME = "weather-pwa-cache-version-2";
const urlsToCache = [
  "./",
  "./index.html",
  "./css/styles.min.css",
  "./js/script.js",
  "./images/icon48.png",
  "./images/apple-touch-icon.png",
  "./images/icon144.png"
];
self.addEventListener("install", function (event) {
  console.log("Installing");
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
});
self.addEventListener("fetch", function(event) {
  console.log('WORKER: fetch event in progress.');
  if (event.request.method !== 'GET') {
    console.log('WORKER: fetch event ignored.', event.request.method, event.request.url);
    return;
  }
  event.respondWith(
    caches.match(event.request)
      .then(function(cached) {
        const networked = fetch(event.request)
          // We handle the network request with success and failure scenarios.
          .then(fetchedFromNetwork, unableToResolve)
          // We should catch errors on the fetchedFromNetwork handler as well.
          .catch(unableToResolve);

        /* We return the cached response immediately if there is one, and fall
           back to waiting on the network as usual.
        */
        console.log('WORKER: fetch event', cached ? '(cached)' : '(network)', event.request.url);
        return cached || networked;

        function fetchedFromNetwork(response) {
          /* We copy the response before replying to the network request.
             This is the response that will be stored on the ServiceWorker cache.
          */
          const cacheCopy = response.clone();

          console.log('WORKER: fetch response from network.', event.request.url);

          if((event.request.url.indexOf('http') === 0)){
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, cacheCopy);
          }).then(function() {
              console.log('WORKER: fetch response stored in cache.', event.request.url);
            });
          }
          // Return the response so that the promise is settled in fulfillment.
          return response;
        }

        function unableToResolve () {
          console.log('WORKER: fetch request failed in both cache and network.');
         return caches.open(urlsToCache).then(function (cache) {
            return cache.match("./index.html");
          });
        }
      })
  );
});

self.addEventListener("activate", function (event) {
  var cacheAllowlist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheAllowlist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
