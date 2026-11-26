// Service Worker Transkeu.ID: melayani aset aplikasi & data belajar dari cache terversi saat offline.
// Permintaan API (/api/*) tidak pernah di-cache sebagai jawaban AI dan pertanyaan offline tidak pernah diantrekan.
const CACHE_PREFIX = 'transkeu-paket-v';
const STAGING_INFIX = '-staging-';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

async function findFromCommittedCaches(request) {
  const keys = await caches.keys();
  const committed = keys
    .filter((k) => k.startsWith(CACHE_PREFIX) && !k.includes(STAGING_INFIX))
    .sort()
    .reverse();

  for (const name of committed) {
    const cache = await caches.open(name);
    const hit = await cache.match(request, { ignoreSearch: true });
    if (hit) return hit;
    if (request.mode === 'navigate') {
      const rootHit = (await cache.match('./index.html')) || (await cache.match('/index.html')) || (await cache.match('/'));
      if (rootHit) return rootHit;
    }
  }
  return null;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith((async () => {
    try {
      const networkResponse = await fetch(request);
      return networkResponse;
    } catch {
      const cached = await findFromCommittedCaches(request);
      if (cached) return cached;
      return new Response('Halaman belum tersedia di paket belajar offline.', {
        status: 503,
        statusText: 'Offline',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
  })());
});
