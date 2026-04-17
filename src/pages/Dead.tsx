import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'

export default function Dead() {
  const { room, players, currentPlayer, setRoom, setPlayers } = useGameStore()

  const isHost = currentPlayer?.is_host
  const dayPhase = room?.day_phase ?? 'dawn'
  const isNight = room?.phase === 'night'
  const isDay = room?.phase === 'day'

  useEffect(() => {
    if (!room) return

    supabase
      .from('players')
      .select()
      .eq('room_id', room.id)
      .then(({ data }) => { if (data) setPlayers(data) })

    const channel = supabase
      .channel(`dead-${room.id}`)
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
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'night_actions',
        filter: `room_id=eq.${room.id}`,
      }, () => {
        if (!isHost || !room) return
        supabase
          .from('night_actions')
          .select()
          .eq('room_id', room.id)
          .eq('night', room.night)
          .then(({ data }) => {
            if (data) checkAllActed(data)
          })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [room])

  async function checkAllActed(actions: any[]) {
    if (!room) return

    const confirmedActions = actions.filter(a => a.confirmed)
    const alivePlayers = players.filter(p => p.is_alive)

    const allActed = alivePlayers.every(p => {
      const isSeerPlayer = p.role === 'vidente'
      const isProtectorPlayer = p.role === 'protector'
      const isInfectedWithRolePlayer = p.infected && (isSeerPlayer || isProtectorPlayer)

      if (isInfectedWithRolePlayer) {
        const hasKill = confirmedActions.find(a => a.player_id === p.id && (a.action_type === 'kill' || a.action_type === 'infect'))
        const hasRole = confirmedActions.find(a => a.player_id === p.id && (a.action_type === 'reveal' || a.action_type === 'protect'))
        return hasKill && hasRole
      }

      return confirmedActions.find(a =>
        a.player_id === p.id &&
        ['kill', 'infect', 'reveal', 'protect', 'sleep'].includes(a.action_type)
      )
    })

    if (!allActed) return

    const killActions = confirmedActions.filter(a => a.action_type === 'kill' || a.action_type === 'infect')
    const protectAction = confirmedActions.find(a => a.action_type === 'protect')
    const infectAction = confirmedActions.find(a => a.action_type === 'infect')

    let victimId: string | null = null

    if (killActions.length > 0) {
      const voteCounts: Record<string, { count: number; firstAt: string; hasAlpha: boolean }> = {}

      for (const action of killActions) {
        if (!action.target_id) continue
        const voter = players.find(p => p.id === action.player_id)
        if (!voteCounts[action.target_id]) {
          voteCounts[action.target_id] = { count: 0, firstAt: action.created_at, hasAlpha: false }
        }
        voteCounts[action.target_id].count++
        if (voter?.role === 'alpha') voteCounts[action.target_id].hasAlpha = true
      }

      const candidates = Object.entries(voteCounts)
        .filter(([id]) => id !== 'null')
        .sort((a, b) => {
          if (b[1].count !== a[1].count) return b[1].count - a[1].count
          if (b[1].hasAlpha !== a[1].hasAlpha) return b[1].hasAlpha ? 1 : -1
          return new Date(a[1].firstAt).getTime() - new Date(b[1].firstAt).getTime()
        })

      if (candidates.length > 0) victimId = candidates[0][0]
    }

    const isProtected = victimId && protectAction?.target_id === victimId
    const isInfectedVictim = infectAction && infectAction.target_id === victimId

    if (victimId && !isProtected) {
      if (isInfectedVictim) {
        await supabase.from('players').update({ infected: true }).eq('id', victimId)
      } else {
        await supabase.from('players').update({ is_alive: false }).eq('id', victimId)
      }
    }

    const updatedPlayers = await supabase.from('players').select().eq('room_id', room.id)
    if (!updatedPlayers.data) return

    const victimPlayer = victimId ? updatedPlayers.data.find(p => p.id === victimId) : null
    const victimIsHunter = victimPlayer?.role === 'cazador' && !isProtected && !isInfectedVictim

    if (victimIsHunter) {
      await supabase.from('rooms').update({
        phase: 'hunter',
        hunter_id: victimId,
        day_phase: 'dawn',
        night: room.night + 1,
        last_victim_id: null,
        last_victim_saved: false,
        last_victim_infected: false,
      }).eq('id', room.id)
      return
    }

    const alive = updatedPlayers.data.filter(p => p.is_alive)
    const wolves = alive.filter(p => p.role === 'lobo' || p.role === 'alpha' || p.infected)
    const villagers = alive.filter(p => !wolves.includes(p))
    let winner = null
    if (wolves.length === 0) winner = 'pueblo'
    else if (wolves.length >= villagers.length) winner = 'lobos'

    if (winner) {
      await supabase.from('rooms').update({ phase: 'finished', winner }).eq('id', room.id)
      return
    }

    await supabase.from('rooms').update({
      phase: 'day',
      day_phase: 'dawn',
      night: room.night + 1,
      last_victim_id: victimId && !isProtected && !isInfectedVictim ? victimId : null,
      last_victim_saved: isProtected ? true : false,
      last_victim_infected: isInfectedVictim ? true : false,
    }).eq('id', room.id)
  }

  async function advance(update: object) {
    if (!room) return
    await supabase.from('rooms').update(update).eq('id', room.id)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold text-red-500 mb-4">Has muerto</h1>
      <p className="text-gray-500 text-sm mb-8">Tu historia en Laviana ha terminado.</p>

      {isHost && (
        <div className="w-full max-w-sm flex flex-col gap-3">
          <p className="text-gray-600 text-xs uppercase tracking-widest text-center mb-2">
            Controles del host
          </p>

          {isNight && (
            <p className="text-gray-600 text-sm text-center">
              Esperando a que todos actúen...
            </p>
          )}

          {isDay && dayPhase === 'dawn' && (
            <button
              onClick={() => advance({ day_phase: 'debate' })}
              className="w-full bg-gray-800 hover:bg-gray-700 rounded-lg px-4 py-3 text-sm text-gray-300 transition-colors"
            >
              Comenzar debate
            </button>
          )}

          {isDay && dayPhase === 'debate' && (
            <button
              onClick={async () => {
                if (!room) return
                await supabase.from('day_votes').delete().eq('room_id', room.id)
                await advance({ day_phase: 'vote' })
              }}
              className="w-full bg-purple-700 hover:bg-purple-600 rounded-lg px-4 py-3 text-sm text-gray-300 transition-colors"
            >
              Iniciar votación
            </button>
          )}

          {isDay && dayPhase === 'vote' && (
            <p className="text-gray-600 text-sm text-center">
              Esperando votos...
            </p>
          )}

          {isDay && dayPhase === 'execution' && (
            <button
              onClick={() => advance({ phase: 'night', day_phase: 'dawn', hunter_target_id: null })}
              className="w-full bg-gray-800 hover:bg-gray-700 rounded-lg px-4 py-3 text-sm text-gray-300 transition-colors"
            >
              Comenzar siguiente noche
            </button>
          )}
          {isDay && dayPhase === 'new_mayor' && (
  <button
    onClick={() => advance({ phase: 'night', day_phase: 'dawn', hunter_target_id: null })}
    className="w-full bg-gray-800 hover:bg-gray-700 rounded-lg px-4 py-3 text-sm text-gray-300 transition-colors"
  >
    Comenzar siguiente noche
  </button>
)}
        </div>
      )}
    </div>
  )
}