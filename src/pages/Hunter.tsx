import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'

export default function Hunter() {
  const { room, players, currentPlayer, setPlayers, setRoom } = useGameStore()

  const isHunter = currentPlayer?.id === room?.hunter_id
  const alivePlayers = players.filter(p => p.is_alive && p.id !== room?.hunter_id)
  const hunterPlayer = players.find(p => p.id === room?.hunter_id)

  useEffect(() => {
    if (!room) return
    supabase.from('players').select().eq('room_id', room.id).then(({ data }) => { if (data) setPlayers(data) })
    const channel = supabase.channel(`hunter-${room.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` }, ({ new: updated }) => {
        setRoom(updated as any)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'players', filter: `room_id=eq.${room.id}` }, () => {
        supabase.from('players').select().eq('room_id', room.id).then(({ data }) => { if (data) setPlayers(data) })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [room])

  async function shoot(targetId: string) {
    if (!room) return
    await supabase.from('players').update({ is_alive: false }).eq('id', targetId)
    const updatedPlayers = await supabase.from('players').select().eq('room_id', room.id)
    if (updatedPlayers.data) {
      const alive = updatedPlayers.data.filter(p => p.is_alive)
      const wolves = alive.filter(p => p.role === 'lobo' || p.role === 'alpha' || p.infected)
      const villagers = alive.filter(p => !wolves.includes(p))
      let winner = null
      if (wolves.length === 0) winner = 'pueblo'
      else if (wolves.length >= villagers.length) winner = 'lobos'
      if (winner) {
        await supabase.from('rooms').update({ phase: 'finished', winner, hunter_target_id: targetId }).eq('id', room.id)
        return
      }
    }
    const comingFromNight = room.day_phase === 'dawn'
await supabase.from('rooms').update({
  hunter_target_id: targetId,
  phase: 'day',
  day_phase: comingFromNight ? 'dawn' : 'execution',
  last_victim_id: comingFromNight ? room.hunter_id : room.last_victim_id,
}).eq('id', room.id)
  }

  async function skipShot() {
    if (!room) return
    const comingFromNight = room.day_phase === 'dawn'
    await supabase.from('rooms').update({ hunter_target_id: null, phase: 'day', day_phase: comingFromNight ? 'dawn' : 'execution' }).eq('id', room.id)
  }

  if (!room || !currentPlayer) return null

  return (
    <div style={{ minHeight: '100vh', background: '#0a0c0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <p style={{ fontFamily: 'Georgia, serif', fontSize: '11px', color: '#6a5a45', letterSpacing: '3px', marginBottom: '8px' }}>CAZADOR</p>
      <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '26px', fontWeight: '700', color: '#c8a840', marginBottom: '8px' }}>
        {hunterPlayer?.name} apunta...
      </h2>
      <p style={{ fontFamily: 'Georgia, serif', fontSize: '13px', color: '#4a3f30', marginBottom: '32px', textAlign: 'center', letterSpacing: '1px' }}>
        El cazador cae, pero no sin antes disparar.
      </p>

      {isHunter ? (
        <div style={{ width: '100%', maxWidth: '340px' }}>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '12px', color: '#4a3f30', marginBottom: '12px', letterSpacing: '1px' }}>
            Elige a quién disparas antes de morir
          </p>

          {alivePlayers.map(player => (
            <button
              key={player.id}
              onClick={() => shoot(player.id)}
              style={{ width: '100%', background: 'rgba(13,16,21,0.9)', border: '1px solid #2a2520', borderRadius: '4px', padding: '12px 16px', color: '#c8b89a', fontFamily: 'Georgia, serif', fontSize: '14px', cursor: 'pointer', textAlign: 'left', marginBottom: '6px' }}
              onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = 'rgba(40,10,10,0.9)'; (e.target as HTMLButtonElement).style.border = '1px solid #6a2020' }}
              onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = 'rgba(13,16,21,0.9)'; (e.target as HTMLButtonElement).style.border = '1px solid #2a2520' }}
            >
              {player.name}
            </button>
          ))}

          <button
            onClick={skipShot}
            style={{ width: '100%', background: 'transparent', border: 'none', padding: '12px 16px', color: '#4a3f30', fontFamily: 'Georgia, serif', fontSize: '13px', cursor: 'pointer', marginTop: '8px' }}
          >
            No disparar a nadie
          </button>
        </div>
      ) : (
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '13px', color: '#4a3f30', letterSpacing: '1px' }}>
          Esperando a que el cazador decida...
        </p>
      )}
    </div>
  )
}