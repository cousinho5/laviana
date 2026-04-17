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
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center p-6"
      style={{ background: '#0a0c0f' }}>

      {/* Fondo SVG montañas */}
      <div className="absolute inset-0 w-full h-full">
        <svg width="100%" height="100%" viewBox="0 0 680 820" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          {/* Estrellas */}
          <circle cx="80" cy="60" r="1" fill="#ffffff" opacity="0.6"/>
          <circle cx="150" cy="35" r="1.5" fill="#ffffff" opacity="0.4"/>
          <circle cx="240" cy="80" r="1" fill="#ffffff" opacity="0.7"/>
          <circle cx="340" cy="25" r="1" fill="#ffffff" opacity="0.5"/>
          <circle cx="420" cy="55" r="1.5" fill="#ffffff" opacity="0.3"/>
          <circle cx="500" cy="40" r="1" fill="#ffffff" opacity="0.6"/>
          <circle cx="580" cy="70" r="1" fill="#ffffff" opacity="0.4"/>
          <circle cx="620" cy="30" r="1.5" fill="#ffffff" opacity="0.5"/>
          <circle cx="60" cy="110" r="1" fill="#ffffff" opacity="0.3"/>
          <circle cx="460" cy="90" r="1" fill="#ffffff" opacity="0.6"/>
          <circle cx="300" cy="50" r="1" fill="#ffffff" opacity="0.4"/>
          <circle cx="180" cy="100" r="1.5" fill="#ffffff" opacity="0.5"/>
          {/* Luna */}
          <circle cx="520" cy="90" r="38" fill="#0a0c0f"/>
          <circle cx="520" cy="90" r="34" fill="#e8e0c8"/>
          <circle cx="508" cy="82" r="6" fill="#d4c9a8" opacity="0.5"/>
          <circle cx="530" cy="98" r="4" fill="#d4c9a8" opacity="0.4"/>
          <circle cx="518" cy="105" r="3" fill="#d4c9a8" opacity="0.3"/>
          {/* Montañas fondo */}
          <path d="M-20 420 L100 200 L200 320 L280 180 L380 300 L440 220 L520 350 L600 240 L700 380 L700 820 L-20 820Z" fill="#111418"/>
          <path d="M200 420 L320 250 L420 350 L500 220 L600 320 L700 280 L700 820 L200 820Z" fill="#0e1215"/>
          {/* Montañas principales */}
          <path d="M-20 500 L80 300 L160 380 L240 260 L340 420 L400 820 L-20 820Z" fill="#161b20"/>
          <path d="M340 500 L420 280 L500 360 L580 240 L700 400 L700 820 L340 820Z" fill="#14191e"/>
          {/* Niebla */}
          <ellipse cx="340" cy="620" rx="380" ry="60" fill="#1e2832" opacity="0.8"/>
          <ellipse cx="200" cy="640" rx="250" ry="40" fill="#243040" opacity="0.5"/>
          <ellipse cx="500" cy="630" rx="220" ry="35" fill="#1e2832" opacity="0.4"/>
          {/* Silueta pueblo */}
          <rect x="120" y="530" width="18" height="30" fill="#0d1115"/>
          <polygon points="120,530 129,515 138,530" fill="#0d1115"/>
          <rect x="145" y="538" width="14" height="22" fill="#0d1115"/>
          <polygon points="145,538 152,526 159,538" fill="#0d1115"/>
          <rect x="165" y="542" width="10" height="18" fill="#0d1115"/>
          <rect x="180" y="534" width="16" height="26" fill="#0d1115"/>
          <polygon points="180,534 188,520 196,534" fill="#0d1115"/>
          {/* Hórreo */}
          <rect x="430" y="528" width="40" height="16" fill="#0d1115"/>
          <rect x="435" y="516" width="30" height="14" fill="#0d1115"/>
          <rect x="436" y="544" width="4" height="12" fill="#0d1115"/>
          <rect x="462" y="544" width="4" height="12" fill="#0d1115"/>
          <polygon points="430,528 450,514 470,528" fill="#0d1115"/>
          {/* Árboles */}
          <rect x="60" y="540" width="5" height="25" fill="#0d1115"/>
          <ellipse cx="62" cy="535" rx="12" ry="18" fill="#0d1115"/>
          <rect x="600" y="535" width="5" height="30" fill="#0d1115"/>
          <ellipse cx="602" cy="528" rx="14" ry="20" fill="#0d1115"/>
          <rect x="580" y="545" width="4" height="20" fill="#0d1115"/>
          <ellipse cx="582" cy="539" rx="10" ry="15" fill="#0d1115"/>
        </svg>
      </div>

      {/* Contenido */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm">

        {/* Título */}
        <h1 style={{
          fontFamily: 'Georgia, serif',
          fontSize: '64px',
          fontWeight: '700',
          color: '#c8b89a',
          letterSpacing: '10px',
          marginBottom: '4px',
          textShadow: 'none',
        }}>LAVIANA</h1>

        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize: '12px',
          color: '#6a5a45',
          letterSpacing: '4px',
          marginBottom: '8px',
        }}>EL PUEBLO TIENE UN SECRETO</p>

        {/* Línea decorativa */}
        <div className="flex items-center gap-2 mb-10 w-full justify-center">
          <div style={{ height: '1px', width: '80px', background: '#2a2520' }}/>
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#6a5a45' }}/>
          <div style={{ height: '1px', width: '80px', background: '#2a2520' }}/>
        </div>

        {/* Formulario */}
        <div className="w-full flex flex-col gap-3">
          <input
            style={{
              background: 'rgba(13,16,21,0.85)',
              border: '1px solid #2a2520',
              borderRadius: '4px',
              padding: '12px 16px',
              color: '#c8b89a',
              fontFamily: 'Georgia, serif',
              fontSize: '14px',
              outline: 'none',
              width: '100%',
            }}
            placeholder="Tu nombre en el pueblo..."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <button
            onClick={createRoom}
            disabled={loading}
            style={{
              background: 'rgba(42,34,24,0.9)',
              border: '1px solid #5a4830',
              borderRadius: '4px',
              padding: '13px 16px',
              color: '#c8b89a',
              fontFamily: 'Georgia, serif',
              fontSize: '14px',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            {loading ? 'Cargando...' : 'Crear sala'}
          </button>

          <div className="flex items-center gap-3 my-1">
            <div style={{ flex: 1, height: '1px', background: '#1a1815' }}/>
            <span style={{ color: '#3a3530', fontSize: '12px', fontFamily: 'Georgia, serif' }}>o</span>
            <div style={{ flex: 1, height: '1px', background: '#1a1815' }}/>
          </div>

          <input
            style={{
              background: 'rgba(13,16,21,0.85)',
              border: '1px solid #2a2520',
              borderRadius: '4px',
              padding: '12px 16px',
              color: '#c8b89a',
              fontFamily: 'Georgia, serif',
              fontSize: '14px',
              letterSpacing: '6px',
              outline: 'none',
              width: '100%',
              textTransform: 'uppercase',
            }}
            placeholder="Código de sala"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            maxLength={6}
          />

          <button
            onClick={joinRoom}
            disabled={loading}
            style={{
              background: 'rgba(20,20,20,0.85)',
              border: '1px solid #2a2520',
              borderRadius: '4px',
              padding: '13px 16px',
              color: '#7a6a55',
              fontFamily: 'Georgia, serif',
              fontSize: '14px',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Unirse a sala
          </button>

          {error && (
            <p style={{ color: '#a05040', fontSize: '13px', textAlign: 'center', fontFamily: 'Georgia, serif' }}>
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}