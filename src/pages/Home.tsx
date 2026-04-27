import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

type Props = { onBack: () => void }

export default function Home({ onBack }: Props) {
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
    <div style={{
      minHeight: '100vh',
      background: '#0a0c0f',
      backgroundImage: 'url(/assets/fondo_inicio.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to bottom, rgba(10,12,15,0.2) 0%, rgba(10,12,15,0.6) 35%, rgba(10,12,15,0.6) 65%, rgba(10,12,15,0.2) 100%)',
        zIndex: 1,
      }} />

      {/* Contenido */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '340px' }}>

        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '52px', fontWeight: '700', color: '#c8b89a', textShadow: '0 2px 20px rgba(0,0,0,0.6)', letterSpacing: '8px', margin: '0 0 4px 0' }}>
          LAVIANA
        </h1>

        <p style={{ fontFamily: 'Georgia, serif', fontSize: '11px', color: '#8a7a60', textShadow: '0 1px 8px rgba(0,0,0,0.8)', letterSpacing: '3px', margin: '0 0 6px 0' }}>
          ALGO CAMINA EN LA NOCHE
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '40px', width: '100%', justifyContent: 'center' }}>
          <div style={{ height: '1px', width: '70px', background: '#2a2520' }}/>
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#6a5a45' }}/>
          <div style={{ height: '1px', width: '70px', background: '#2a2520' }}/>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            style={{ background: 'rgba(13,16,21,0.9)', border: '1px solid #2a2520', borderRadius: '4px', padding: '13px 16px', color: '#c8b89a', fontFamily: 'Georgia, serif', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
            placeholder="Tu nombre en Laviana..."
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

          <button
            onClick={onBack}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8a7a60',
              textShadow: '0 1px 6px rgba(0,0,0,0.9)',
              fontFamily: 'Georgia, serif',
              fontSize: '12px',
              letterSpacing: '2px',
              cursor: 'pointer',
              marginTop: '4px',
              padding: 0,
            }}
          >
            ← VOLVER
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