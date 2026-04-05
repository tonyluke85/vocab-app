const CACHE = 'vocab-v3'; // ← bump this number each time you deploy
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
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Never intercept Google API or font calls — pass straight to network.
  // Must use respondWith(fetch(...)) rather than bare return to avoid
  // undefined behaviour on some browsers.
  if (
    url.includes('googleapis.com') ||
    url.includes('accounts.google.com') ||
    url.includes('fonts.googleapis.com') ||
    url.includes('fonts.gstatic.com')
  ) {
    e.respondWith(fetch(e.request));
    return;
  }

  // For our own assets: network-first, fall back to cache when offline
  e.respondWith(
    fetch(e.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
