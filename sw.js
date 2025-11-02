const CACHE_NAME = 'money-muffin-v1.2.0';
const STATIC_CACHE = 'money-muffin-static-v1';
const DYNAMIC_CACHE = 'money-muffin-dynamic-v1';

// Статические ресурсы для кэширования при установке
const staticAssets = [
  '/money-muffin/',
  '/money-muffin/index.html',
  '/money-muffin/style.css',
  '/money-muffin/script.js',
  '/money-muffin/manifest.json',
  '/money-muffin/icons/icon-72x72.png',
  '/money-muffin/icons/icon-96x96.png',
  '/money-muffin/icons/icon-128x128.png',
  '/money-muffin/icons/icon-144x144.png',
  '/money-muffin/icons/icon-152x152.png',
  '/money-muffin/icons/icon-192x192.png',
  '/money-muffin/icons/icon-384x384.png',
  '/money-muffin/icons/icon-512x512.png'
];

// Стратегия кэширования: Cache First для статики, Network First для данных
self.addEventListener('install', function(event) {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE)
        .then(function(cache) {
          console.log('Service Worker: Caching static assets');
          return cache.addAll(staticAssets.map(url => new Request(url, { cache: 'reload' })));
        })
        .catch(function(error) {
          console.error('Service Worker: Cache installation failed:', error);
        }),
      
      // Активируем SW сразу без ожидания перезагрузки страницы
      self.skipWaiting()
    ])
  );
});

// Активация - очистка старых кэшей
self.addEventListener('activate', function(event) {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Очищаем старые кэши
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Берем контроль над всеми клиентами сразу
      self.clients.claim()
    ])
  );
});

// Обработка запросов
self.addEventListener('fetch', function(event) {
  const request = event.request;
  
  // Пропускаем неподдерживаемые схемы
  if (request.url.startsWith('chrome-extension://') || 
      request.url.includes('extension') ||
      !request.url.startsWith('http')) {
    return;
  }

  // Для навигационных запросов - стратегия Network First
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(function(response) {
          // Кэшируем успешные навигационные запросы
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then(function(cache) {
                cache.put(request, responseClone);
              });
          }
          return response;
        })
        .catch(function() {
          // При ошибке сети пробуем получить из кэша
          return caches.match(request)
            .then(function(cachedResponse) {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Если нет в кэше, показываем оффлайн страницу
              return caches.match('/money-muffin/index.html');
            });
        })
    );
    return;
  }

  // Для статических ресурсов - стратегия Cache First
  if (request.destination === 'style' || 
      request.destination === 'script' ||
      request.destination === 'image' ||
      request.url.includes('.css') ||
      request.url.includes('.js') ||
      request.url.includes('.png') ||
      request.url.includes('.json')) {
    
    event.respondWith(
      caches.match(request)
        .then(function(cachedResponse) {
          // Возвращаем из кэша если есть
          if (cachedResponse) {
            return cachedResponse;
          }

          // Иначе загружаем из сети и кэшируем
          return fetch(request)
            .then(function(response) {
              // Кэшируем только валидные ответы
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(STATIC_CACHE)
                  .then(function(cache) {
                    cache.put(request, responseClone);
                  });
              }
              return response;
            })
            .catch(function(error) {
              console.log('Service Worker: Fetch failed for', request.url, error);
              // Для критичных ресурсов можно вернуть fallback
              if (request.destination === 'style') {
                return new Response('/* Fallback CSS */', { 
                  headers: { 'Content-Type': 'text/css' }
                });
              }
              throw error;
            });
        })
    );
    return;
  }

  // Для API запросов - Network First
  if (request.url.includes('/api/') || request.method === 'POST') {
    event.respondWith(
      fetch(request)
        .then(function(response) {
          return response;
        })
        .catch(function() {
          // Для API запросов не используем кэш, просто пробуем снова
          return new Response(JSON.stringify({ 
            error: 'Network connection failed',
            offline: true 
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // Общая стратегия по умолчанию - Network First
  event.respondWith(
    fetch(request)
      .then(function(response) {
        // Кэшируем успешные ответы
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then(function(cache) {
              cache.put(request, responseClone);
            });
        }
        return response;
      })
      .catch(function() {
        return caches.match(request);
      })
  );
});

// Обработка сообщений от главного потока
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Фоновая синхронизация (для будущего использования)
self.addEventListener('sync', function(event) {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    // Здесь можно реализовать фоновую синхронизацию данных
  }
});

// Пуш-уведомления (для будущего использования)
self.addEventListener('push', function(event) {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'Money Muffin - обновление баланса',
    icon: '/money-muffin/icons/icon-192x192.png',
    badge: '/money-muffin/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/money-muffin/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Money Muffin', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});
