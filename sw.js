// sw.js - Полный код Service Worker
const CACHE_NAME = 'money-muffin-v2.0';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-128x128.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/icon-192x192.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png'
];

// Установка Service Worker
self.addEventListener('install', function(event) {
  console.log('💰 Service Worker: Установка Money Muffin...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('💰 Service Worker: Кэшируем файлы приложения');
        return cache.addAll(urlsToCache).catch(function(error) {
          console.log('💰 Service Worker: Ошибка кэширования:', error);
        });
      })
      .then(function() {
        console.log('💰 Service Worker: Пропускаем ожидание активации');
        return self.skipWaiting();
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', function(event) {
  console.log('💰 Service Worker: Активация Money Muffin...');
  
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('💰 Service Worker: Удаляем старый кэш', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      console.log('💰 Service Worker: Активируем для всех клиентов');
      return self.clients.claim();
    })
  );
});

// Обработка запросов
self.addEventListener('fetch', function(event) {
  // Пропускаем не-GET запросы
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Возвращаем кэшированную версию если есть
        if (response) {
          console.log('💰 Service Worker: Загружаем из кэша:', event.request.url);
          return response;
        }

        // Иначе делаем сетевой запрос
        console.log('💰 Service Worker: Загружаем из сети:', event.request.url);
        return fetch(event.request)
          .then(function(networkResponse) {
            // Кэшируем только успешные ответы
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(function(cache) {
                  cache.put(event.request, responseToCache);
                  console.log('💰 Service Worker: Закэширован новый ресурс:', event.request.url);
                });
            }
            return networkResponse;
          })
          .catch(function(error) {
            console.log('💰 Service Worker: Ошибка сети:', error);
            // Для HTML-страниц возвращаем запасную страницу
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
            // Для других типов возвращаем ошибку
            return new Response('Приложение оффлайн', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Обработка сообщений от приложения
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
