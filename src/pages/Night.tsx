import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'

export default function Night() {
  const { room, players, currentPlayer, setPlayers, setRoom } = useGameStore()
  const [targetId, setTargetId] = useState<string | null>(null)
  const [hasActed, setHasActed] = useState(false)
  const [waiting, setWaiting] = useState(false)

  const myPlayer = players.find(p => p.id === currentPlayer?.id)
  const myRole = myPlayer?.role
  const alivePlayers = players.filter(p => p.is_alive && p.id !== currentPlayer?.id)

  const isWolf = myRole === 'lobo' || myRole === 'alpha'
  const isSeer = myRole === 'vidente'
  const isProtector = myRole === 'protector'
  const hasNightAction = isWolf || isSeer || isProtector

  useEffect(() => {
    if (!room) return

    supabase
      .from('players')
      .select()
      .eq('room_id', room.id)
      .then(({ data }) => { if (data) setPlayers(data) })

    const channel = supabase
      .channel(`night-${room.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'rooms',
        filter: `id=eq.${room.id}`,
      }, ({ new: updated }) => {
        setRoom(updated as any)
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'night_actions',
        filter: `room_id=eq.${room.id}`,
      }, () => {
        checkAllActed()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [room])

  async function checkAllActed() {
    if (!room) return

    const { data: actions } = await supabase
      .from('night_actions')
      .select()
      .eq('room_id', room.id)
      .eq('night', room.night)

    const { data: activePlayers } = await supabase
      .from('players')
      .select()
      .eq('room_id', room.id)
      .eq('is_alive', true)
      .in('role', ['lobo', 'alpha', 'vidente', 'protector'])

    if (!actions || !activePlayers) return

    const wolfAction = actions.find(a => a.action_type === 'kill')
    const allActed = wolfAction !== undefined &&
      activePlayers
        .filter(p => p.role !== 'lobo' && p.role !== 'alpha' || p.role === 'alpha')
        .every(p => actions.find(a => a.player_id === p.id))

    if (allActed && currentPlayer?.is_host) {
      resolveNight(actions)
    }
  }

  async function resolveNight(actions: any[]) {
    if (!room) return

    const killAction = actions.find(a => a.action_type === 'kill')
    const protectAction = actions.find(a => a.action_type === 'protect')

    if (!killAction) return

    const isProtected = protectAction?.target_id === killAction.target_id

    if (!isProtected) {
      await supabase
        .from('players')
        .update({ is_alive: false })
        .eq('id', killAction.target_id)
    }

    await supabase
      .from('rooms')
      .update({ phase: 'day', night: room.night + 1 })
      .eq('id', room.id)
  }

  async function submitAction() {
    if (!targetId || !currentPlayer || !room || hasActed) return

    let actionType = ''
    if (isWolf) actionType = 'kill'
    if (isSeer) actionType = 'reveal'
    if (isProtector) actionType = 'protect'

    await supabase
      .from('night_actions')
      .insert({
        room_id: room.id,
        player_id: currentPlayer.id,
        action_type: actionType,
        target_id: targetId,
        night: room.night,
      })

    setHasActed(true)
    setWaiting(true)
    checkAllActed()
  }

  const actionLabel = () => {
    if (isWolf) return 'Elegir víctima'
    if (isSeer) return 'Investigar jugador'
    if (isProtector) return 'Proteger jugador'
    return ''
  }

  const targetLabel = () => {
    if (isWolf) return 'Elige a quién devorar esta noche'
    if (isSeer) return 'Elige a quién investigar'
    if (isProtector) return 'Elige a quién proteger'
    return ''
  }

  if (!room || !currentPlayer) return null

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
      <p className="text-gray-500 text-xs mb-1 uppercase tracking-widest">Noche {room.night}</p>
      <h2 className="text-2xl font-bold mb-8">El pueblo duerme</h2>

      {!hasNightAction && (
        <div className="w-full max-w-sm text-center">
          <p className="text-gray-500 text-sm">No tienes acción esta noche.</p>
          <p className="text-gray-600 text-sm mt-2">Espera a que amanezca...</p>
        </div>
      )}

      {hasNightAction && !hasActed && (
        <div className="w-full max-w-sm flex flex-col gap-3">
          <p className="text-gray-400 text-sm mb-2">{targetLabel()}</p>
          {alivePlayers.map(player => (
            <button
              key={player.id}
              onClick={() => setTargetId(player.id)}
              className={`rounded-lg px-4 py-3 flex items-center justify-between transition-colors
                ${targetId === player.id ? 'bg-purple-800 border border-purple-500' : 'bg-gray-800 hover:bg-gray-700'}
              `}
            >
              <span>{player.name}</span>
            </button>
          ))}

          <button
            onClick={submitAction}
            disabled={!targetId}
            className={`w-full mt-2 rounded-lg px-4 py-3 font-medium transition-colors
              ${targetId ? 'bg-purple-700 hover:bg-purple-600' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}
            `}
          >
            {actionLabel()}
          </button>
        </div>
      )}

      {waiting && (
        <p className="text-gray-500 text-sm mt-4">Acción registrada. Esperando al amanecer...</p>
      )}
    </div>
  )
}