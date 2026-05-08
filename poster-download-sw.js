self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (!url.pathname.includes('/generated-posters/')) return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;
      return new Response('Poster download has expired. Please generate the poster again.', {
        status: 404,
        headers: { 'Content-Type': 'text/plain' },
      });
    }),
  );
});
