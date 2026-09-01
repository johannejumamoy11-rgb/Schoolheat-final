const CACHE_NAME = 'schoolheat-v4';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './assets/app-logo.png',
  './assets/school-logo.png',
  './assets/school-bg-mobile.jpg',
  './assets/campus-map.jpg'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS.map(asset => new URL(asset, self.registration.scope))))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      if (response) return response;
      return fetch(e.request).catch(() => {
        if (e.request.destination === 'document') {
          return caches.match(new URL('./index.html', self.registration.scope));
        }
      });
    })
  );
});
