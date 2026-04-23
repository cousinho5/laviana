import { useRef, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'

export default function Intro() {
  const { room, players, currentPlayer, setRoom, setPlayers } = useGameStore()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [localDone, setLocalDone] = useState(false)

  useEffect(() => {
    if (!room) return

    // Cargar jugadores frescos
    supabase.from('players').select().eq('room_id', room.id)
      .then(({ data }) => { if (data) setPlayers(data) })

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
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'players',
        filter: `room_id=eq.${room.id}`,
      }, () => {
        supabase.from('players').select().eq('room_id', room.id)
          .then(({ data }) => { if (data) setPlayers(data) })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [room?.id])

  // Comprobar si todos han terminado — solo el host avanza
  useEffect(() => {
    if (!room || !currentPlayer?.is_host) return
    const allDone = players.length > 0 && players.every(p => p.voted_for === '00000000-0000-0000-0000-000000000000')
    if (!allDone) return

    async function advance() {
      const { data: freshRoom } = await supabase
        .from('rooms').select('config').eq('id', room!.id).single()
      const hasMayor = freshRoom?.config?.has_mayor ?? true
      const nextPhase = hasMayor ? 'mayor_vote' : 'role_reveal'
      // Limpiar voted_for antes de avanzar
      await supabase.from('players').update({ voted_for: null }).eq('room_id', room!.id)
      await supabase.from('rooms').update({ phase: nextPhase }).eq('id', room!.id)
    }

    advance()
  }, [players])

  async function markDone() {
  if (!currentPlayer || localDone) return
  setLocalDone(true)
  if (videoRef.current) videoRef.current.pause()
  
  const { error } = await supabase
  .from('players')
  .update({ voted_for: '00000000-0000-0000-0000-000000000000' })
  .eq('id', currentPlayer.id)
  
  console.log('markDone result:', { playerId: currentPlayer.id, error })
}

  const donePlayers = players.filter(p => p.voted_for === '00000000-0000-0000-0000-000000000000').length
  const totalPlayers = players.length

  if (localDone) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0c0f',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
      }}>
        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize: '11px',
          color: '#6a5a45',
          letterSpacing: '3px',
        }}>
          ESPERANDO AL RESTO
        </p>
        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize: '13px',
          color: '#4a3f30',
          letterSpacing: '1px',
        }}>
          {donePlayers}/{totalPlayers} listos
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
        onEnded={markDone}
        style={{
          width: '100%',
          height: '100vh',
          objectFit: 'cover',
        }}
      />

      <button
        onClick={markDone}
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