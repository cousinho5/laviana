const CACHE_NAME = 'laviana-v2'

self.addEventListener('install', event => {
  // Activar inmediatamente sin esperar a que se cierren las pestañas
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(['/']))
  )
})

self.addEventListener('activate', event => {
  // Borrar cachés antiguas
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  // Network first — siempre intentar la red primero
  // Solo usar caché si la red falla
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la respuesta es válida, guardarla en caché
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        // Solo si la red falla, usar caché
        return caches.match(event.request)
      })
  )
})