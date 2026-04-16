import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'

export default function MayorReplace() {
  const { room, players, currentPlayer, setPlayers, setRoom } = useGameStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)

  const alivePlayers = players.filter(p => p.is_alive)

  useEffect(() => {
    if (!room) return

    supabase
      .from('players')
      .select()
      .eq('room_id', room.id)
      .then(({ data }) => { if (data) setPlayers(data) })

    const channel = supabase
      .channel(`mayor-replace-${room.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'players',
        filter: `room_id=eq.${room.id}`,
      }, () => {
        supabase.from('players').select().eq('room_id', room.id)
          .then(({ data }) => { if (data) setPlayers(data) })
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'rooms',
        filter: `id=eq.${room.id}`,
      }, ({ new: updated }) => {
        setRoom(updated as any)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [room])

  const votesPerPlayer = alivePlayers.reduce((acc, p) => {
    if (p.voted_for) {
      acc[p.voted_for] = (acc[p.voted_for] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  const totalVotes = alivePlayers.filter(p => p.voted_for).length
  const allVoted = totalVotes === alivePlayers.length && alivePlayers.length > 0

  useEffect(() => {
    if (!allVoted || !currentPlayer?.is_host || !room) return

    const currentAlive = players.filter(p => p.is_alive)
    if (currentAlive.length === 0) return

    const sorted = [...currentAlive].sort((a, b) => {
      const votesA = votesPerPlayer[a.id] || 0
      const votesB = votesPerPlayer[b.id] || 0
      return votesB - votesA
    })

    const winner = sorted[0]
    const reason = room.mayor_vote_reason

    const nextDayPhase = reason === 'day' ? 'execution' : reason === 'dawn' ? 'debate' : 'dawn'

    supabase
      .from('rooms')
      .update({
        mayor_id: winner.id,
        phase: 'day',
        day_phase: nextDayPhase,
      })
      .eq('id', room.id)
      .then(async () => {
        for (const player of currentAlive) {
          await supabase
            .from('players')
            .update({ voted_for: null })
            .eq('id', player.id)
        }
      })
  }, [allVoted])

  async function vote() {
    if (!selectedId || !currentPlayer || hasVoted) return

    await supabase
      .from('players')
      .update({ voted_for: selectedId })
      .eq('id', currentPlayer.id)

    setHasVoted(true)
  }

  if (!room || !currentPlayer) return null

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
      <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">Alcalde</p>
      <h2 className="text-2xl font-bold mb-2">El Alcalde ha muerto</h2>
      <p className="text-gray-400 text-sm mb-8 text-center">
        El pueblo debe elegir un nuevo Alcalde.
      </p>

      <div className="w-full max-w-sm flex flex-col gap-2 mb-6">
        {alivePlayers.map(player => {
          const voteCount = votesPerPlayer[player.id] || 0
          const isSelected = selectedId === player.id
          const isMe = player.id === currentPlayer.id

          return (
            <button
              key={player.id}
              onClick={() => !hasVoted && !isMe && setSelectedId(player.id)}
              disabled={hasVoted || isMe}
              className={`rounded-lg px-4 py-3 flex items-center justify-between transition-colors
                ${isMe ? 'bg-gray-900 text-gray-600 cursor-not-allowed' : ''}
                ${!isMe && isSelected ? 'bg-purple-800 border border-purple-500' : ''}
                ${!isMe && !isSelected ? 'bg-gray-800 hover:bg-gray-700' : ''}
              `}
            >
              <span>{player.name} {isMe && '(tú)'}</span>
              <div className="flex items-center gap-2">
                {voteCount > 0 && (
                  <span className="text-xs bg-purple-900 text-purple-300 px-2 py-1 rounded-full">
                    {voteCount} voto{voteCount > 1 ? 's' : ''}
                  </span>
                )}
                {player.voted_for && (
                  <span className="text-xs text-gray-500">votó</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {!hasVoted && (
        <button
          onClick={vote}
          disabled={!selectedId}
          className={`w-full max-w-sm rounded-lg px-4 py-3 font-medium transition-colors
            ${selectedId ? 'bg-purple-700 hover:bg-purple-600' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}
          `}
        >
          Confirmar voto
        </button>
      )}

      {hasVoted && !allVoted && (
        <p className="text-gray-500 text-sm">
          Esperando votos... ({totalVotes}/{alivePlayers.length})
        </p>
      )}

      {allVoted && (
        <p className="text-green-400 text-sm">Todos han votado. Calculando resultado...</p>
      )}
    </div>
  )
}