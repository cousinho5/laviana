import { useRef, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'

export default function Intro() {
  const { room, currentPlayer, setRoom } = useGameStore()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [skippedLocally, setSkippedLocally] = useState(false)

  // Escuchar cambios de fase en tiempo real
  useEffect(() => {
    if (!room) return
    const channel = supabase
      .channel(`intro-${room.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${room.id}`,
      }, ({ new: updated }) => {
        setRoom(updated as any)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [room?.id])

  async function advanceAsHost() {
    if (!room || !currentPlayer?.is_host) return
    // Leer config fresca de la DB para evitar que llegue undefined
    const { data: freshRoom } = await supabase
      .from('rooms')
      .select('config')
      .eq('id', room.id)
      .single()
    const hasMayor = freshRoom?.config?.has_mayor ?? true
    const nextPhase = hasMayor ? 'mayor_vote' : 'role_reveal'
    await supabase.from('rooms').update({ phase: nextPhase }).eq('id', room.id)
  }

  function handleSkip() {
    if (currentPlayer?.is_host) {
      // Host: pausa el vídeo y avanza para todos
      if (videoRef.current) videoRef.current.pause()
      advanceAsHost()
    } else {
      // No-host: solo oculta el vídeo localmente y espera
      setSkippedLocally(true)
    }
  }

  function handleEnded() {
    if (currentPlayer?.is_host) {
      advanceAsHost()
    } else {
      setSkippedLocally(true)
    }
  }

  // Pantalla de espera para no-host que saltaron
  if (skippedLocally) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0c0f',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize: '13px',
          color: '#4a3f30',
          letterSpacing: '1px',
        }}>
          Esperando al host...
        </p>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <video
        ref={videoRef}
        src="/assets/intro.mp4"
        autoPlay
        playsInline
        onEnded={handleEnded}
        style={{
          width: '100%',
          height: '100vh',
          objectFit: 'cover',
        }}
      />

      <button
        onClick={handleSkip}
        style={{
          position: 'absolute',
          bottom: '48px',
          right: '24px',
          background: 'rgba(13,16,21,0.8)',
          border: '1px solid #2a2520',
          borderRadius: '4px',
          padding: '10px 20px',
          color: '#7a6a55',
          fontFamily: 'Georgia, serif',
          fontSize: '13px',
          cursor: 'pointer',
          letterSpacing: '2px',
        }}
      >
        SALTAR
      </button>
    </div>
  )
}