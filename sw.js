const CACHE_NAME = 'money-muffin-v1.2';
const urlsToCache = [
  './',
  './index.html',
  './style.css', 
  './script.js',
  './manifest.json',
  './icons/icon-192x192.png'
];

// Установка Service Worker
self.addEventListener('install', function(event) {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache).catch(function(error) {
          console.warn('Service Worker: Some files failed to cache:', error);
        });
      })
      .then(function() {
        console.log('Service Worker: Skip waiting for activation');
        return self.skipWaiting();
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', function(event) {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      console.log('Service Worker: Claiming clients');
      return self.clients.claim();
    })
  );
});

// Обработка запросов
self.addEventListener('fetch', function(event) {
  // Пропускаем не-GET запросы и chrome-extension
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Возвращаем кэшированную версию, если есть
        if (response) {
          console.log('Service Worker: Serving from cache:', event.request.url);
          return response;
        }

        // Делаем сетевой запрос
        console.log('Service Worker: Fetching from network:', event.request.url);
        return fetch(event.request)
          .then(function(networkResponse) {
            // Кэшируем только успешные ответы и те, что относятся к нашему origin
            if (networkResponse && networkResponse.status === 200 && 
                networkResponse.url.startsWith(self.location.origin)) {
              
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(function(cache) {
                  console.log('Service Worker: Caching new resource:', event.request.url);
                  cache.put(event.request, responseToCache);
                })
                .catch(function(error) {
                  console.warn('Service Worker: Cache put failed:', error);
                });
            }
            
            return networkResponse;
          })
          .catch(function(error) {
            console.warn('Service Worker: Fetch failed:', error);
            
            // Для HTML-страниц возвращаем запасную страницу
            if (event.request.destination === 'document' || 
                event.request.headers.get('accept').includes('text/html')) {
              return caches.match('./index.html');
            }
            
            // Для других типов возвращаем ошибку
            return new Response('Network error happened', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Обработка сообщений от основного потока
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
