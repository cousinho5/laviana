if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      // Comprobar actualizaciones cada vez que se carga la página
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (!newWorker) return
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            // Hay una nueva versión — recargar automáticamente
            window.location.reload()
          }
        })
      })
    })
  })
}