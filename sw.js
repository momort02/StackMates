const CACHE = 'stackmates-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/projects.html',
  '/auth.html',
  '/profile.html',
  '/messages.html',
  '/new-project.html',
  '/style.css',
  '/logo.svg',
  '/manifest.json'
];

// Installation : mise en cache des assets statiques
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activation : suppression des anciens caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch : network-first pour Firebase/API, cache-first pour assets statiques
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Toujours réseau pour Firebase et APIs externes
  if (
    url.hostname.includes('firebasejs') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('firestore') ||
    url.hostname.includes('identitytoolkit') ||
    url.hostname.includes('gstatic')
  ) {
    return; // laisser passer sans interception
  }

  // Network-first pour les pages HTML (contenu toujours frais)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first pour CSS, JS, images
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
