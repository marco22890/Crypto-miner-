self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass through fetch requests to network
  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response('Offline Crypto Miner App loaded', {
        headers: { 'Content-Type': 'text/html' }
      });
    })
  );
});
