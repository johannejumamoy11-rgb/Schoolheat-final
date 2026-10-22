importScripts(
  'https://www.gstatic.com/firebasejs/13.0.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/13.0.0/firebase-messaging-compat.js'
);

firebase.initializeApp({
  apiKey: 'AIzaSyDtXhB7VjJof72FgkMC_rC3r-JrxaBs4rs',
  authDomain: 'schoolheat-final.firebaseapp.com',
  projectId: 'schoolheat-final',
  messagingSenderId: '960776018094',
  appId: '1:960776018094:web:2d61dc050347340c86f53f'
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage(payload => {
  const notification = payload.notification || {};
  return self.registration.showNotification(notification.title || 'SchoolHeat heat warning', {
    body: notification.body || 'A new heat alert is available.',
    icon: notification.icon || './assets/app-logo.png',
    badge: './assets/app-logo.png',
    tag: 'schoolheat-heat-alert',
    renotify: true,
    data: { url: './' }
  });
});

const CACHE_NAME = 'schoolheat-v7';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './cloud_config.js',
  './manifest.json',
  './assets/app-logo.png',
  './assets/school-bg-mobile.jpg',
  './assets/campus-map.png'
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

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    const existing = clients.find(client => 'focus' in client);
    if (existing) return existing.focus();
    return self.clients.openWindow(event.notification.data?.url || './');
  }));
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
