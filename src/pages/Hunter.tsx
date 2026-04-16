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

    supabase
      .from('players')
      .select()
      .eq('room_id', room.id)
      .then(({ data }) => { if (data) setPlayers(data) })

    const channel = supabase
      .channel(`hunter-${room.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'rooms',
        filter: `id=eq.${room.id}`,
      }, ({ new: updated }) => {
        setRoom(updated as any)
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'players',
        filter: `room_id=eq.${room.id}`,
      }, () => {
        supabase.from('players').select().eq('room_id', room.id)
          .then(({ data }) => { if (data) setPlayers(data) })
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
    }).eq('id', room.id)
  }

  async function skipShot() {
    if (!room) return

    const comingFromNight = room.day_phase === 'dawn'

    await supabase.from('rooms').update({
      hunter_target_id: null,
      phase: 'day',
      day_phase: comingFromNight ? 'dawn' : 'execution',
    }).eq('id', room.id)
  }

  if (!room || !currentPlayer) return null

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
      <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">Cazador</p>
      <h2 className="text-2xl font-bold mb-2">{hunterPlayer?.name} apunta...</h2>
      <p className="text-gray-400 text-sm mb-8 text-center">
        El cazador cae, pero no sin antes disparar.
      </p>

      {isHunter ? (
        <div className="w-full max-w-sm flex flex-col gap-3">
          <p className="text-gray-400 text-sm mb-2">Elige a quién disparas antes de morir</p>

          {alivePlayers.map(player => (
            <button
              key={player.id}
              onClick={() => shoot(player.id)}
              className="rounded-lg px-4 py-3 bg-gray-800 hover:bg-red-900 hover:border hover:border-red-700 text-left transition-colors"
            >
              {player.name}
            </button>
          ))}

          <button
            onClick={skipShot}
            className="w-full mt-2 rounded-lg px-4 py-3 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            No disparar a nadie
          </button>
        </div>
      ) : (
        <div className="w-full max-w-sm text-center">
          <p className="text-gray-500 text-sm">Esperando a que el cazador decida...</p>
        </div>
      )}
    </div>
  )
}