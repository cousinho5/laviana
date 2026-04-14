import { useEffect } from 'react'
import { supabase } from './lib/supabase'

function App() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.log('Error conectando con Supabase:', error)
      } else {
        console.log('Conexión con Supabase OK', data)
      }
    })
  }, [])

  return (
    <div>
      <h1>Laviana</h1>
    </div>
  )
}

export default App