import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function Home() {
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setRoom, setCurrentPlayer } = useGameStore()

  async function createRoom() {
    if (!name.trim()) return setError('Escribe tu nombre')
    setLoading(true)
    setError('')
    const { data: authData } = await supabase.auth.signInAnonymously()
    const userId = authData.user?.id
    if (!userId) return setError('Error de conexión')
    const code = generateCode()
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert({ code, host_id: userId, status: 'lobby' })
      .select()
      .single()
    if (roomError) return setError('Error creando sala')
    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert({ room_id: room.id, name: name.trim(), is_host: true })
      .select()
      .single()
    if (playerError) return setError('Error creando jugador')
    setRoom(room)
    setCurrentPlayer(player)
    setLoading(false)
  }

  async function joinRoom() {
    if (!name.trim()) return setError('Escribe tu nombre')
    if (!joinCode.trim()) return setError('Escribe el código de sala')
    setLoading(true)
    setError('')
    await supabase.auth.signInAnonymously()
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select()
      .eq('code', joinCode.toUpperCase())
      .single()
    if (roomError || !room) return setError('Sala no encontrada')
    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert({ room_id: room.id, name: name.trim(), is_host: false })
      .select()
      .single()
    if (playerError) return setError('Error uniéndose a la sala')
    setRoom(room)
    setCurrentPlayer(player)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0c0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden' }}>

      {/* Luna */}
      <div style={{ position: 'absolute', top: '40px', right: '40px', width: '60px', height: '60px', borderRadius: '50%', background: '#e8e0c8', opacity: 0.9 }} />

      {/* Estrellas */}
      {[[60,50],[150,30],[250,70],[400,20],[480,55],[580,35],[620,80],[100,100],[350,45]].map(([x,y], i) => (
        <div key={i} style={{ position: 'absolute', left: `${x/6.8}%`, top: `${y}px`, width: '2px', height: '2px', borderRadius: '50%', background: '#ffffff', opacity: 0.5 }} />
      ))}

      {/* Montañas SVG en la parte inferior */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%' }}>
        <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M-10 300 L60 140 L120 200 L180 100 L240 180 L300 120 L360 170 L410 130 L410 300Z" fill="#111418"/>
          <path d="M-10 300 L40 180 L100 240 L160 160 L220 220 L290 150 L350 200 L410 170 L410 300Z" fill="#161b20"/>
          <path d="M-10 300 L30 220 L90 270 L150 200 L210 250 L280 190 L340 240 L410 210 L410 300Z" fill="#1a2028"/>
          {/* Niebla */}
          <ellipse cx="200" cy="290" rx="250" ry="30" fill="#1e2832" opacity="0.7"/>
          {/* Pueblo silueta */}
          <rect x="60" y="255" width="12" height="20" fill="#0d1115"/>
          <polygon points="60,255 66,244 72,255" fill="#0d1115"/>
          <rect x="78" y="260" width="10" height="15" fill="#0d1115"/>
          <polygon points="78,260 83,251 88,260" fill="#0d1115"/>
          <rect x="270" y="258" width="14" height="18" fill="#0d1115"/>
          <polygon points="270,258 277,246 284,258" fill="#0d1115"/>
          {/* Árboles */}
          <rect x="30" y="262" width="3" height="18" fill="#0d1115"/>
          <ellipse cx="31" cy="258" rx="8" ry="12" fill="#0d1115"/>
          <rect x="350" y="258" width="3" height="18" fill="#0d1115"/>
          <ellipse cx="351" cy="254" rx="9" ry="13" fill="#0d1115"/>
        </svg>
      </div>

      {/* Contenido */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '340px' }}>

        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '52px', fontWeight: '700', color: '#c8b89a', letterSpacing: '8px', margin: '0 0 4px 0' }}>
          LAVIANA
        </h1>

        <p style={{ fontFamily: 'Georgia, serif', fontSize: '11px', color: '#6a5a45', letterSpacing: '3px', margin: '0 0 6px 0' }}>
          EL PUEBLO TIENE UN SECRETO
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '40px', width: '100%', justifyContent: 'center' }}>
          <div style={{ height: '1px', width: '70px', background: '#2a2520' }}/>
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#6a5a45' }}/>
          <div style={{ height: '1px', width: '70px', background: '#2a2520' }}/>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            style={{ background: 'rgba(13,16,21,0.9)', border: '1px solid #2a2520', borderRadius: '4px', padding: '13px 16px', color: '#c8b89a', fontFamily: 'Georgia, serif', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
            placeholder="Tu nombre en el pueblo..."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <button
            onClick={createRoom}
            disabled={loading}
            style={{ background: 'rgba(42,34,24,0.9)', border: '1px solid #5a4830', borderRadius: '4px', padding: '13px 16px', color: '#c8b89a', fontFamily: 'Georgia, serif', fontSize: '14px', cursor: 'pointer', width: '100%' }}
          >
            {loading ? 'Cargando...' : 'Crear sala'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#1a1815' }}/>
            <span style={{ color: '#3a3530', fontSize: '12px', fontFamily: 'Georgia, serif' }}>o</span>
            <div style={{ flex: 1, height: '1px', background: '#1a1815' }}/>
          </div>

          <input
            style={{ background: 'rgba(13,16,21,0.9)', border: '1px solid #2a2520', borderRadius: '4px', padding: '13px 16px', color: '#c8b89a', fontFamily: 'Georgia, serif', fontSize: '14px', letterSpacing: '6px', outline: 'none', width: '100%', boxSizing: 'border-box', textTransform: 'uppercase' }}
            placeholder="Código de sala"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            maxLength={6}
          />

          <button
            onClick={joinRoom}
            disabled={loading}
            style={{ background: 'rgba(20,20,20,0.9)', border: '1px solid #2a2520', borderRadius: '4px', padding: '13px 16px', color: '#7a6a55', fontFamily: 'Georgia, serif', fontSize: '14px', cursor: 'pointer', width: '100%' }}
          >
            Unirse a sala
          </button>

          {error && (
            <p style={{ color: '#a05040', fontSize: '13px', textAlign: 'center', fontFamily: 'Georgia, serif', margin: '4px 0 0' }}>
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}