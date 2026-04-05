const CACHE = 'vocab-v2'; // ← bump this number each time you deploy
const ASSETS = [
  '/vocab-app/',
  '/vocab-app/index.html',
  '/vocab-app/manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Delete ALL old caches automatically when version changes
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Pass through Google API calls — never cache these
  if (e.request.url.includes('googleapis.com') || e.request.url.includes('accounts.google.com')) {
    return;
  }

  // Network-first for our own assets: always try to fetch fresh,
  // fall back to cache only if offline
  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Update the cache with the fresh response
        const clone = response.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
