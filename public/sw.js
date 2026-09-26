self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Solo interceptamos peticiones de red para que el navegador nos considere PWA.
  // Usamos Network First simple. No cacheamos para evitar problemas con los datos dinámicos.
  if (e.request.method !== 'GET') return;
  
  e.respondWith(
    fetch(e.request).catch(() => {
      return new Response("Estás desconectado. Por favor, revisa tu conexión a internet.", {
        status: 503,
        statusText: 'Service Unavailable'
      });
    })
  );
});
