import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'

export default function MayorVote() {
  const { room, players, currentPlayer, setPlayers, setRoom } = useGameStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [localVotes, setLocalVotes] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!room) return
    setLocalVotes({})
    setHasVoted(false)
    setSelectedId(null)

    const roomId = room.id
    const totalPlayers = players.length
    const isHost = currentPlayer?.is_host

    supabase.from('players').select().eq('room_id', roomId)
      .then(({ data }) => { if (data) setPlayers(data) })

    const channel = supabase
      .channel(`mayor-vote-${roomId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` }, ({ new: updated }) => {
        if (updated.voted_for) {
          setLocalVotes(prev => {
            const newVotes = { ...prev, [updated.id]: updated.voted_for }

            if (isHost && Object.keys(newVotes).length === totalPlayers) {
              const votesPerTarget = Object.values(newVotes).reduce<Record<string, number>>((acc, targetId) => {
  acc[targetId] = (acc[targetId] || 0) + 1
  return acc
}, {})

              const sorted = Object.entries(votesPerTarget).sort((a, b) => b[1] - a[1])
              const topVotes = sorted[0][1]
              const tied = sorted.filter(([, v]) => v === topVotes)
              const winnerId = tied[Math.floor(Math.random() * tied.length)][0]

              supabase.from('rooms').update({ mayor_id: winnerId, phase: 'role_reveal' }).eq('id', roomId)
            }

            return newVotes
          })
        }
        supabase.from('players').select().eq('room_id', roomId)
          .then(({ data }) => { if (data) setPlayers(data) })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, ({ new: updated }) => {
        setRoom(updated as any)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const votesPerTarget = Object.values(newVotes).reduce<Record<string, number>>((acc, targetId: string) => {
  acc[targetId] = (acc[targetId] || 0) + 1
  return acc
}, {})

  const totalVotes = Object.keys(localVotes).length
  const allVoted = totalVotes === players.length && players.length > 0

  async function vote() {
    if (!selectedId || !currentPlayer || hasVoted) return
    await supabase.from('players').update({ voted_for: selectedId }).eq('id', currentPlayer.id)
    setHasVoted(true)
  }

  if (!room) return null

  return (
    <div style={{ minHeight: '100vh', background: '#0a0c0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>

      <p style={{ fontFamily: 'Georgia, serif', fontSize: '11px', color: '#6a5a45', letterSpacing: '3px', marginBottom: '8px' }}>
        ELECCIÓN DEL ALCALDE
      </p>
      <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '26px', fontWeight: '700', color: '#c8b89a', marginBottom: '8px' }}>
        ¿Quién liderará el pueblo?
      </h2>
      <p style={{ fontFamily: 'Georgia, serif', fontSize: '13px', color: '#4a3f30', marginBottom: '32px', textAlign: 'center' }}>
        Nadie conoce aún su rol. Vota con instinto.
      </p>

      <div style={{ width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
        {players.map((player) => {
          const voteCount = votesPerTarget[player.id] || 0
          const isSelected = selectedId === player.id
          const isMe = player.id === currentPlayer?.id
          const hasVotedPlayer = Object.keys(localVotes).includes(player.id)

          return (
            <button
              key={player.id}
              onClick={() => !hasVoted && !isMe && setSelectedId(player.id)}
              disabled={hasVoted || isMe}
              style={{
                background: isSelected ? 'rgba(42,34,24,0.95)' : 'rgba(13,16,21,0.9)',
                border: isSelected ? '1px solid #8a6840' : '1px solid #2a2520',
                borderRadius: '4px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: isMe || hasVoted ? 'not-allowed' : 'pointer',
                opacity: isMe ? 0.4 : 1,
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
          Esperando votos... ({totalVotes}/{players.length})
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