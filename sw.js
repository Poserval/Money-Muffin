const CACHE_NAME = 'money-muffin-v1';
const urlsToCache = [
  'https://poserval.github.io/money-muffin/',
  'https://poserval.github.io/money-muffin/index.html',
  'https://poserval.github.io/money-muffin/style.css',
  'https://poserval.github.io/money-muffin/script.js',
  'https://poserval.github.io/money-muffin/manifest.json',
  'https://poserval.github.io/money-muffin/icons/icon-192x192.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Caching files for offline use');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Возвращаем кэшированную версию или делаем сетевой запрос
        return response || fetch(event.request);
      })
  );
});
