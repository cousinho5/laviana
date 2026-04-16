import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'

export default function Day() {
  const { room, players, currentPlayer, setPlayers, setRoom } = useGameStore()
  const [hasVoted, setHasVoted] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [seerResult, setSeerResult] = useState<{ name: string; role: string } | null>(null)
  const [dayVotes, setDayVotes] = useState<any[]>([])
  const [pendingVoteId, setPendingVoteId] = useState<string | null>(null)

  const myPlayer = players.find(p => p.id === currentPlayer?.id)
  const isAlive = myPlayer?.is_alive
  const alivePlayers = players.filter(p => p.is_alive)
  const lastVictim = players.find(p => p.id === room?.last_victim_id)
  const executedPlayer = players.find(p => p.id === room?.last_executed_id)
  const dayPhase = room?.day_phase ?? 'dawn'
  const publicVotes = room?.config?.public_votes ?? true
  const revealRole = room?.config?.reveal_role ?? true
  const currentDay = room ? room.night - 1 : 1

  useEffect(() => {
    if (!room) return

    supabase
      .from('players')
      .select()
      .eq('room_id', room.id)
      .then(({ data }) => { if (data) setPlayers(data) })

    supabase
      .from('day_votes')
      .select()
      .eq('room_id', room.id)
      .eq('day', currentDay)
      .then(({ data }) => { if (data) setDayVotes(data) })

    if (myPlayer?.role === 'vidente') {
      supabase
        .from('night_actions')
        .select()
        .eq('room_id', room.id)
        .eq('night', room.night - 1)
        .eq('player_id', currentPlayer?.id)
        .eq('action_type', 'reveal')
        .single()
        .then(({ data }) => {
          if (data?.target_id) {
            const target = players.find(p => p.id === data.target_id)
            if (target) setSeerResult({ name: target.name, role: target.role ?? 'desconocido' })
          }
        })
    }

    const channel = supabase
      .channel(`day-${room.id}`)
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
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'day_votes',
        filter: `room_id=eq.${room.id}`,
      }, () => {
        supabase
          .from('day_votes')
          .select()
          .eq('room_id', room.id)
          .eq('day', currentDay)
          .then(({ data }) => {
            if (data) {
              setDayVotes(data)
              if (currentPlayer?.is_host) checkAllVoted(data)
            }
          })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [room])

  function checkAllVoted(votes: any[]) {
    const confirmedVotes = votes.filter(v => v.confirmed)
    const currentAlivePlayers = players.filter(p => p.is_alive)
    if (confirmedVotes.length >= currentAlivePlayers.length && currentAlivePlayers.length > 0) {
      resolveVote(confirmedVotes)
    }
  }

  function checkVictory(currentPlayers: any[]) {
    const alive = currentPlayers.filter(p => p.is_alive)
    const wolves = alive.filter(p => p.role === 'lobo' || p.role === 'alpha' || p.infected)
    const villagers = alive.filter(p => !wolves.includes(p))
    if (wolves.length === 0) return 'pueblo'
    if (wolves.length >= villagers.length) return 'lobos'
    return null
  }

  async function selectTarget(id: string) {
    if (!currentPlayer || !room || hasVoted || !isAlive) return
    setSelectedId(id)

    if (pendingVoteId) {
      await supabase.from('day_votes').update({ target_id: id }).eq('id', pendingVoteId)
    } else {
      const { data } = await supabase
        .from('day_votes')
        .insert({
          room_id: room.id,
          player_id: currentPlayer.id,
          target_id: id,
          confirmed: false,
          abstain: false,
          day: currentDay,
        })
        .select()
        .single()

      if (data) setPendingVoteId(data.id)
    }
  }

  async function confirmVote(abstain: boolean = false) {
    if (!currentPlayer || !room || hasVoted || !isAlive) return

    if (pendingVoteId) {
      await supabase
        .from('day_votes')
        .update({ confirmed: true, abstain, target_id: abstain ? null : selectedId })
        .eq('id', pendingVoteId)
    } else {
      await supabase.from('day_votes').insert({
        room_id: room.id,
        player_id: currentPlayer.id,
        target_id: abstain ? null : selectedId,
        confirmed: true,
        abstain,
        day: currentDay,
      })
    }

    setHasVoted(true)
  }

  async function resolveVote(votes: any[]) {
    if (!room) return

    const realVotes = votes.filter(v => !v.abstain && v.target_id)
    const abstentions = votes.filter(v => v.abstain).length
    const mayorVote = votes.find(v => v.player_id === room.mayor_id && !v.abstain)

    const voteCounts: Record<string, number> = {}
    for (const vote of realVotes) {
      const weight = vote.player_id === room.mayor_id ? 2 : 1
      voteCounts[vote.target_id] = (voteCounts[vote.target_id] || 0) + weight
    }

    const maxVotes = Math.max(...Object.values(voteCounts), 0)
    const noExecution = abstentions > maxVotes || Object.keys(voteCounts).length === 0

    if (noExecution) {
      await supabase.from('rooms').update({ last_executed_id: null, day_phase: 'execution' }).eq('id', room.id)
      return
    }

    const sorted = Object.entries(voteCounts).sort((a, b) => b[1] - a[1])
    const topVotes = sorted[0][1]
    const tied = sorted.filter(([, v]) => v === topVotes)

    let executedId = tied[0][0]

    if (tied.length > 1 && mayorVote) {
      const mayorTie = tied.find(([id]) => id === mayorVote.target_id)
      if (mayorTie) executedId = mayorTie[0]
    }

    await supabase.from('players').update({ is_alive: false }).eq('id', executedId)

    if (executedId === room.mayor_id) {
      await supabase.from('players').update({ voted_for: null }).eq('room_id', room.id)
      await supabase.from('rooms').update({
        phase: 'mayor_replace',
        mayor_vote_reason: 'day',
        last_executed_id: executedId,
      }).eq('id', room.id)
      return
    }

    const executedPlayerData = players.find(p => p.id === executedId)
    if (executedPlayerData?.role === 'cazador') {
      await supabase.from('rooms').update({
        phase: 'hunter',
        hunter_id: executedId,
        last_executed_id: executedId,
      }).eq('id', room.id)
      return
    }

    const updatedPlayers = await supabase.from('players').select().eq('room_id', room.id)

    if (updatedPlayers.data) {
      const winner = checkVictory(updatedPlayers.data)
      if (winner) {
        await supabase.from('rooms').update({ phase: 'finished', winner, last_executed_id: executedId }).eq('id', room.id)
        return
      }
    }

    await supabase.from('rooms').update({ last_executed_id: executedId, day_phase: 'execution' }).eq('id', room.id)
  }

  const confirmedVotes = dayVotes.filter(v => v.confirmed)
  const pendingVotes = dayVotes.filter(v => !v.confirmed)

  const voteCountByTarget: Record<string, number> = {}
  confirmedVotes.filter(v => !v.abstain).forEach(v => {
    const weight = v.player_id === room?.mayor_id ? 2 : 1
    if (v.target_id) voteCountByTarget[v.target_id] = (voteCountByTarget[v.target_id] || 0) + weight
  })

  if (!room || !currentPlayer) return null

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">

      {dayPhase === 'dawn' && (
        <div className="w-full max-w-sm flex flex-col gap-4">
          <p className="text-gray-500 text-xs uppercase tracking-widest text-center mb-2">
            Día {currentDay}
          </p>

          {room.last_victim_infected && myPlayer?.infected && (
            <div className="bg-red-950 border border-red-900 rounded-xl p-6 text-center">
              <p className="text-red-400 text-xl font-bold mb-2">Has sido infectado</p>
              <p className="text-gray-400 text-sm">Los lobos te han convertido en uno de los suyos.</p>
            </div>
          )}

          {room.last_victim_saved ? (
            <div className="bg-gray-900 rounded-xl p-6 text-center">
              <p className="text-green-400 text-lg font-medium mb-2">Nadie ha muerto esta noche</p>
              <p className="text-gray-400 text-sm">El protector salvó a alguien.</p>
            </div>
          ) : lastVictim ? (
            <div className="bg-gray-900 rounded-xl p-6 text-center">
              <p className="text-gray-400 text-sm mb-2">Esta mañana encontraron el cuerpo de</p>
              <p className="text-red-400 text-2xl font-bold mb-2">{lastVictim.name}</p>
              {revealRole && (
                <p className="text-gray-500 text-sm">Era un {lastVictim.role}</p>
              )}
            </div>
          ) : (
            <div className="bg-gray-900 rounded-xl p-6 text-center">
              <p className="text-gray-400 text-lg">Nadie ha muerto esta noche.</p>
            </div>
          )}

          {seerResult && (
            <div className="bg-purple-950 border border-purple-900 rounded-xl p-4">
              <p className="text-xs text-purple-400 mb-2 uppercase tracking-widest">Tu investigación</p>
              <p className="text-purple-300 text-sm">
                <span className="font-medium text-white">{seerResult.name}</span> es un{' '}
                <span className="font-medium text-white">{seerResult.role}</span>
              </p>
            </div>
          )}

          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-gray-500 text-xs mb-3 uppercase tracking-widest">
              Vivos ({alivePlayers.length})
            </p>
            {alivePlayers.map(p => (
              <p key={p.id} className="text-gray-300 text-sm py-1">
                {p.name}
                {p.id === room.mayor_id && (
                  <span className="text-yellow-400 text-xs ml-2">Alcalde</span>
                )}
              </p>
            ))}
          </div>

          {currentPlayer.is_host ? (
  <button
    onClick={async () => {
      const mayorIsDead = !alivePlayers.find(p => p.id === room.mayor_id)
      if (mayorIsDead) {
        await supabase.from('players').update({ voted_for: null }).eq('room_id', room.id)
        await supabase.from('rooms').update({
          phase: 'mayor_replace',
          mayor_vote_reason: 'dawn',
        }).eq('id', room.id)
      } else {
        await supabase.from('rooms').update({ day_phase: 'debate' }).eq('id', room.id)
      }
    }}
    className="w-full bg-gray-800 hover:bg-gray-700 rounded-lg px-4 py-3 text-sm text-gray-300 transition-colors"
  >
    {!alivePlayers.find(p => p.id === room.mayor_id) ? 'Elegir nuevo Alcalde' : 'Comenzar debate'}
  </button>
) : (
  <p className="text-gray-600 text-sm text-center">Esperando al host...</p>
)}
        </div>
      )}

      {dayPhase === 'debate' && (
        <div className="w-full max-w-sm flex flex-col gap-4">
          <p className="text-gray-500 text-xs uppercase tracking-widest text-center mb-2">
            Día {currentDay} — Debate
          </p>
          <p className="text-gray-300 text-lg font-medium text-center">Discutid entre vosotros</p>
          <p className="text-gray-500 text-sm text-center">Sin chat — todo es presencial</p>

          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-gray-500 text-xs mb-3 uppercase tracking-widest">
              Vivos ({alivePlayers.length})
            </p>
            {alivePlayers.map(p => (
              <p key={p.id} className="text-gray-300 text-sm py-1">
                {p.name}
                {p.id === room.mayor_id && (
                  <span className="text-yellow-400 text-xs ml-2">Alcalde</span>
                )}
              </p>
            ))}
          </div>

          {currentPlayer.is_host ? (
            <button
              onClick={async () => {
                await supabase.from('day_votes').delete().eq('room_id', room.id).eq('day', currentDay)
                await supabase.from('rooms').update({ day_phase: 'vote' }).eq('id', room.id)
                setHasVoted(false)
                setSelectedId(null)
                setPendingVoteId(null)
              }}
              className="w-full bg-purple-700 hover:bg-purple-600 rounded-lg px-4 py-3 font-medium transition-colors"
            >
              Iniciar votación
            </button>
          ) : (
            <p className="text-gray-600 text-sm text-center">Esperando al host para votar...</p>
          )}
        </div>
      )}

      {dayPhase === 'vote' && (
        <div className="w-full max-w-sm flex flex-col gap-3">
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-2 text-center">
            Día {currentDay} — Votación
          </p>

          {!isAlive && (
            <p className="text-gray-600 text-sm text-center mb-2">
              Estás muerto — solo puedes observar
            </p>
          )}

          {alivePlayers.map(player => {
            const confirmedVoteCount = voteCountByTarget[player.id] || 0
            const pendingVotersForThis = pendingVotes.filter(v => v.target_id === player.id)
            const pendingVoterNames = pendingVotersForThis
              .map(v => players.find(p => p.id === v.player_id)?.name)
              .filter(Boolean)
            const isMyPending = pendingVotes.find(v => v.player_id === currentPlayer.id)?.target_id === player.id
            const isMe = player.id === currentPlayer.id
            const hasConfirmed = confirmedVotes.find(v => v.player_id === player.id)

            return (
              <button
                key={player.id}
                onClick={() => !isMe && selectTarget(player.id)}
                disabled={isMe || hasVoted || !isAlive}
                className={`rounded-lg px-4 py-3 flex items-center justify-between transition-colors
                  ${isMe ? 'bg-gray-900 text-gray-600 cursor-not-allowed' : ''}
                  ${!isMe && selectedId === player.id ? 'bg-purple-800 border border-purple-500' : ''}
                  ${!isMe && selectedId !== player.id ? 'bg-gray-800 hover:bg-gray-700' : ''}
                `}
              >
                <span>
                  {player.name}
                  {player.id === room.mayor_id && (
                    <span className="text-yellow-400 text-xs ml-2">Alcalde</span>
                  )}
                  {isMe && <span className="text-gray-500 text-xs ml-2">(tú)</span>}
                </span>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {publicVotes && confirmedVoteCount > 0 && (
                    <span className="text-xs bg-purple-900 text-purple-300 px-2 py-1 rounded-full">
                      {confirmedVoteCount} voto{confirmedVoteCount > 1 ? 's' : ''}
                    </span>
                  )}
                  {publicVotes && pendingVoterNames.length > 0 && !isMyPending && (
                    <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-1 rounded-full">
                      {pendingVoterNames.join(', ')} quiere{pendingVoterNames.length > 1 ? 'n' : ''} votar
                    </span>
                  )}
                  {isMyPending && (
                    <span className="text-xs text-gray-500">tu selección</span>
                  )}
                  {!publicVotes && hasConfirmed && (
                    <span className="text-xs text-gray-500">votó</span>
                  )}
                </div>
              </button>
            )
          })}

          {isAlive && !hasVoted && (
            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={() => confirmVote(false)}
                disabled={!selectedId}
                className={`w-full rounded-lg px-4 py-3 font-medium transition-colors
                  ${selectedId ? 'bg-purple-700 hover:bg-purple-600' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}
                `}
              >
                Confirmar voto
              </button>
              <button
                onClick={() => confirmVote(true)}
                className="w-full rounded-lg px-4 py-3 text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                Abstenerme
              </button>
            </div>
          )}

          {hasVoted && (
            <p className="text-gray-500 text-sm text-center mt-2">
              Esperando votos... ({confirmedVotes.length}/{alivePlayers.length})
            </p>
          )}
        </div>
      )}

      {dayPhase === 'execution' && (
        <div className="w-full max-w-sm flex flex-col gap-4 text-center">
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">
            Día {currentDay} — Ejecución
          </p>

          {executedPlayer ? (
            <div className="bg-gray-900 rounded-xl p-6">
              <p className="text-gray-400 text-sm mb-2">El pueblo ha ejecutado a</p>
              <p className="text-red-400 text-2xl font-bold mb-2">{executedPlayer.name}</p>
              {revealRole && (
                <p className="text-gray-500 text-sm">Era un {executedPlayer.role}</p>
              )}
            </div>
          ) : (
            <div className="bg-gray-900 rounded-xl p-6">
              <p className="text-gray-400 text-lg">El pueblo no ha ejecutado a nadie hoy.</p>
            </div>
          )}

          {currentPlayer.is_host ? (
            <button
              onClick={async () => {
                await supabase.from('rooms').update({ phase: 'night', day_phase: 'dawn' }).eq('id', room.id)
              }}
              className="w-full bg-gray-800 hover:bg-gray-700 rounded-lg px-4 py-3 text-sm text-gray-300 transition-colors"
            >
              Comenzar siguiente noche
            </button>
          ) : (
            <p className="text-gray-600 text-sm">Esperando al host...</p>
          )}
        </div>
      )}
    </div>
  )
}