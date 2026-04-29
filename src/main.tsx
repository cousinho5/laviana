import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
  })
}

// Evitar que el botón atrás cierre la app
window.addEventListener('popstate', (event) => {
  history.pushState(null, '', window.location.href)
})
history.pushState(null, '', window.location.href)