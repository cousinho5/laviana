import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'

export default function MayorReplace() {
  const { room, players, currentPlayer, setPlayers, setRoom } = useGameStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [localVotes, setLocalVotes] = useState<Record<string, string>>({})

  const alivePlayers = players.filter(p => p.is_alive)
  const myPlayer = players.find(p => p.id === currentPlayer?.id)

  useEffect(() => {
    if (!room) return
    setLocalVotes({})
    setHasVoted(false)
    setSelectedId(null)

    supabase.from('players').select().eq('room_id', room.id)
      .then(({ data }) => { if (data) setPlayers(data) })

    const channel = supabase
      .channel(`mayor-replace-${room.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'players', filter: `room_id=eq.${room.id}` }, ({ new: updated }) => {
        if (updated.voted_for) {
          setLocalVotes(prev => ({ ...prev, [updated.id]: updated.voted_for }))
        }
        supabase.from('players').select().eq('room_id', room.id)
          .then(({ data }) => { if (data) setPlayers(data) })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` }, ({ new: updated }) => {
        setRoom(updated as any)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const votesPerTarget = Object.values(localVotes).reduce((acc, targetId) => {
    acc[targetId] = (acc[targetId] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const totalVotes = Object.keys(localVotes).length
  const allVoted = totalVotes === alivePlayers.length && alivePlayers.length > 0

  useEffect(() => {
    if (!allVoted || !currentPlayer?.is_host || !room) return
    if (totalVotes === 0) return
    const sorted = Object.entries(votesPerTarget).sort((a, b) => b[1] - a[1])
    if (sorted.length === 0) return
    const topVotes = sorted[0][1]
    const tied = sorted.filter(([, v]) => v === topVotes)
    const winnerId = tied[Math.floor(Math.random() * tied.length)][0]
    supabase.from('rooms').update({ mayor_id: winnerId, phase: 'day', day_phase: 'new_mayor' }).eq('id', room.id)
      .then(async () => { await supabase.from('players').update({ voted_for: null }).eq('room_id', room.id) })
  }, [allVoted, totalVotes])

  async function vote() {
    if (!selectedId || !currentPlayer || hasVoted || !myPlayer?.is_alive) return
    await supabase.from('players').update({ voted_for: selectedId }).eq('id', currentPlayer.id)
    setLocalVotes(prev => ({ ...prev, [currentPlayer.id]: selectedId }))
    setHasVoted(true)
  }

  if (!room || !currentPlayer) return null

  return (
    <div style={{ minHeight: '100vh', background: '#0a0c0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <p style={{ fontFamily: 'Georgia, serif', fontSize: '11px', color: '#6a5a45', letterSpacing: '3px', marginBottom: '8px' }}>ALCALDE</p>
      <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '26px', fontWeight: '700', color: '#c8b89a', marginBottom: '8px' }}>El Alcalde ha muerto</h2>
      <p style={{ fontFamily: 'Georgia, serif', fontSize: '13px', color: '#4a3f30', marginBottom: '32px', textAlign: 'center', letterSpacing: '1px' }}>
        El pueblo debe elegir un nuevo Alcalde.
      </p>

      <div style={{ width: '100%', maxWidth: '340px', marginBottom: '16px' }}>
        {alivePlayers.map(player => {
          const voteCount = votesPerTarget[player.id] || 0
          const isSelected = selectedId === player.id
          const isMe = player.id === currentPlayer.id
          const hasVotedPlayer = Object.keys(localVotes).includes(player.id)

          return (
            <button
              key={player.id}
              onClick={() => !hasVoted && !isMe && setSelectedId(player.id)}
              disabled={hasVoted || isMe}
              style={{
                width: '100%',
                background: isSelected ? 'rgba(42,34,24,0.95)' : 'rgba(13,16,21,0.9)',
                border: isSelected ? '1px solid #8a6840' : '1px solid #2a2520',
                borderRadius: '4px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: isMe || hasVoted ? 'not-allowed' : 'pointer',
                opacity: isMe ? 0.4 : 1,
                marginBottom: '6px',
              }}
            >
              <span style={{ fontFamily: 'Georgia, serif', fontSize: '14px', color: '#c8b89a' }}>
                {player.name} {isMe && '(tú)'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {voteCount > 0 && (
                  <span style={{ fontFamily: 'Georgia, serif', fontSize: '11px', color: '#8a6840', border: '1px solid #5a4830', borderRadius: '3px', padding: '2px 8px' }}>
                    {voteCount} voto{voteCount > 1 ? 's' : ''}
                  </span>
                )}
                {hasVotedPlayer && (
                  <span style={{ fontFamily: 'Georgia, serif', fontSize: '11px', color: '#4a3f30' }}>votó</span>
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
          style={{
            width: '100%',
            maxWidth: '340px',
            background: selectedId ? 'rgba(42,34,24,0.9)' : 'rgba(13,16,21,0.5)',
            border: `1px solid ${selectedId ? '#5a4830' : '#1a1815'}`,
            borderRadius: '4px',
            padding: '13px 16px',
            color: selectedId ? '#c8b89a' : '#3a3530',
            fontFamily: 'Georgia, serif',
            fontSize: '14px',
            cursor: selectedId ? 'pointer' : 'not-allowed',
          }}
        >
          Confirmar voto
        </button>
      )}

      {hasVoted && !allVoted && (
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '13px', color: '#4a3f30', letterSpacing: '1px' }}>
          Esperando votos... ({totalVotes}/{alivePlayers.length})
        </p>
      )}

      {allVoted && (
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '13px', color: '#8a9a70', letterSpacing: '1px' }}>
          Todos han votado. Calculando resultado...
        </p>
      )}
    </div>
  )
}