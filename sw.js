// ⚡ Incrémente CACHE_VERSION à chaque mise à jour de l'app
const CACHE_VERSION = 6,10;
const CACHE_NAME = `izidutch-v${CACHE_VERSION}`;

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Lilita+One&display=swap'
];

// Installation : met en cache les assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS).catch(() => {}))
      .then(() => self.skipWaiting()) // Active immédiatement sans attendre la fermeture des onglets
  );
});

// Activation : supprime TOUS les anciens caches automatiquement
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k.startsWith('izidutch-') && k !== CACHE_NAME)
          .map(k => {
            console.log('[SW] Suppression ancien cache :', k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim()) // Prend le contrôle de tous les onglets ouverts
  );
});

// Fetch : network-first pour index.html, cache-first pour le reste
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isHTML = e.request.destination === 'document' || url.pathname.endsWith('.html') || url.pathname === '/';

  if (isHTML) {
    // Network-first pour le HTML : toujours essayer d'avoir la version la plus récente
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
  } else {
    // Cache-first pour les autres ressources (images, fonts...)
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        }).catch(() => {});
      })
    );
  }
});

// Message pour forcer la mise à jour depuis l'app
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
