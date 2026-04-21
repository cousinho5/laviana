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
    supabase.from('players').select().eq('room_id', room.id).then(({ data }) => { if (data) setPlayers(data) })
    supabase.from('day_votes').select().eq('room_id', room.id).eq('day', currentDay).then(({ data }) => { if (data) setDayVotes(data) })
    if (myPlayer?.role === 'vidente') {
      supabase.from('night_actions').select().eq('room_id', room.id).eq('night', room.night - 1).eq('player_id', currentPlayer?.id).eq('action_type', 'reveal').single()
        .then(({ data }) => {
          if (data?.target_id) {
            const target = players.find(p => p.id === data.target_id)
            if (target) setSeerResult({ name: target.name, role: target.role ?? 'desconocido' })
          }
        })
    }
    const channel = supabase.channel(`day-${room.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'players', filter: `room_id=eq.${room.id}` }, () => {
        supabase.from('players').select().eq('room_id', room.id).then(({ data }) => { if (data) setPlayers(data) })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` }, ({ new: updated }) => {
        setRoom(updated as any)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'day_votes', filter: `room_id=eq.${room.id}` }, () => {
        supabase.from('day_votes').select().eq('room_id', room.id).eq('day', currentDay).then(({ data }) => { if (data) setDayVotes(data) })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [room])

  async function selectTarget(id: string) {
    if (!currentPlayer || !room || hasVoted || !isAlive) return
    setSelectedId(id)
    if (pendingVoteId) {
      await supabase.from('day_votes').update({ target_id: id }).eq('id', pendingVoteId)
    } else {
      const { data } = await supabase.from('day_votes').insert({ room_id: room.id, player_id: currentPlayer.id, target_id: id, confirmed: false, abstain: false, day: currentDay }).select().single()
      if (data) setPendingVoteId(data.id)
    }
  }

  async function confirmVote(abstain: boolean = false) {
    if (!currentPlayer || !room || hasVoted || !isAlive) return
    if (pendingVoteId) {
      await supabase.from('day_votes').update({ confirmed: true, abstain, target_id: abstain ? null : selectedId }).eq('id', pendingVoteId)
    } else {
      await supabase.from('day_votes').insert({ room_id: room.id, player_id: currentPlayer.id, target_id: abstain ? null : selectedId, confirmed: true, abstain, day: currentDay })
    }
    setHasVoted(true)
  }

  const confirmedVotes = dayVotes.filter(v => v.confirmed)
  const pendingVotes = dayVotes.filter(v => !v.confirmed)
  const voteCountByTarget: Record<string, number> = {}
  confirmedVotes.filter(v => !v.abstain).forEach(v => {
    const weight = v.player_id === room?.mayor_id ? 2 : 1
    if (v.target_id) voteCountByTarget[v.target_id] = (voteCountByTarget[v.target_id] || 0) + weight
  })

  if (!room || !currentPlayer) return null

  const card = { background: 'rgba(13,16,21,0.9)', border: '1px solid #2a2520', borderRadius: '4px', padding: '20px', textAlign: 'center' as const, marginBottom: '12px' }
  const label = { fontFamily: 'Georgia, serif', fontSize: '11px', color: '#6a5a45', letterSpacing: '3px', marginBottom: '8px' }
  const btnHost = { width: '100%', background: 'rgba(20,20,20,0.9)', border: '1px solid #2a2520', borderRadius: '4px', padding: '13px 16px', color: '#7a6a55', fontFamily: 'Georgia, serif', fontSize: '13px', cursor: 'pointer' }
  const btnPrimary = { width: '100%', background: 'rgba(42,34,24,0.9)', border: '1px solid #5a4830', borderRadius: '4px', padding: '13px 16px', color: '#c8b89a', fontFamily: 'Georgia, serif', fontSize: '14px', cursor: 'pointer' }
  const btnDisabled = { width: '100%', background: 'rgba(13,16,21,0.5)', border: '1px solid #1a1815', borderRadius: '4px', padding: '13px 16px', color: '#3a3530', fontFamily: 'Georgia, serif', fontSize: '14px', cursor: 'not-allowed' }
  const waiting = { fontFamily: 'Georgia, serif', fontSize: '12px', color: '#4a3f30', textAlign: 'center' as const, letterSpacing: '1px' }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0c0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>

      {dayPhase === 'new_mayor' && (
        <div style={{ width: '100%', maxWidth: '340px', textAlign: 'center' }}>
          <p style={label}>NUEVO ALCALDE</p>
          <div style={{ ...card, border: '1px solid #3a3020' }}>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '13px', color: '#6a5a45', marginBottom: '8px' }}>El pueblo ha elegido como nuevo Alcalde a</p>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '26px', fontWeight: '700', color: '#c8a840' }}>{players.find(p => p.id === room.mayor_id)?.name}</p>
          </div>
          {currentPlayer.is_host
            ? <button style={btnHost} onClick={async () => { await supabase.from('rooms').update({ phase: 'night', day_phase: 'dawn', hunter_target_id: null }).eq('id', room.id) }}>Comenzar siguiente noche</button>
            : <p style={waiting}>Esperando al host...</p>}
        </div>
      )}

      {dayPhase === 'dawn' && (
        <div style={{ width: '100%', maxWidth: '340px' }}>
          <p style={{ ...label, textAlign: 'center', marginBottom: '16px' }}>DÍA {currentDay}</p>

          {room.last_victim_infected && myPlayer?.infected && (
            <div style={{ ...card, border: '1px solid #4a2020', marginBottom: '12px' }}>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: '700', color: '#c04040', marginBottom: '6px' }}>Has sido infectado</p>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '13px', color: '#6a4040' }}>Los lobos te han convertido en uno de los suyos.</p>
            </div>
          )}

          {room.last_victim_saved ? (
            <div style={card}>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '16px', color: '#6a9a50', marginBottom: '6px' }}>Nadie ha muerto esta noche</p>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '13px', color: '#4a5a40' }}>El protector salvó a alguien.</p>
            </div>
          ) : lastVictim ? (
            <div style={card}>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '12px', color: '#6a5a45', letterSpacing: '1px', marginBottom: '8px' }}>Esta mañana encontraron el cuerpo de</p>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: '700', color: '#c04040', marginBottom: '6px' }}>{lastVictim.name}</p>
              {revealRole && <p style={{ fontFamily: 'Georgia, serif', fontSize: '12px', color: '#4a3f30' }}>Era un {lastVictim.role}</p>}
            </div>
          ) : (
            <div style={card}>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '16px', color: '#6a5a45' }}>Nadie ha muerto esta noche.</p>
            </div>
          )}

          {room.hunter_target_id && (
            <div style={card}>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '12px', color: '#6a5a45', letterSpacing: '1px', marginBottom: '8px' }}>Antes de morir, el cazador disparó a</p>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '700', color: '#c08030' }}>{players.find(p => p.id === room.hunter_target_id)?.name}</p>
            </div>
          )}

          {seerResult && (
            <div style={{ ...card, border: '1px solid #3a2860', textAlign: 'left' }}>
              <p style={{ ...label, marginBottom: '8px' }}>TU INVESTIGACIÓN</p>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '14px', color: '#8a7ab0' }}>
                <span style={{ color: '#c8b89a', fontWeight: '700' }}>{seerResult.name}</span> es un <span style={{ color: '#c8b89a', fontWeight: '700' }}>{seerResult.role}</span>
              </p>
            </div>
          )}

          <div style={{ ...card, textAlign: 'left', marginBottom: '16px' }}>
            <p style={{ ...label, marginBottom: '12px' }}>VIVOS ({alivePlayers.length})</p>
            {alivePlayers.map(p => (
              <p key={p.id} style={{ fontFamily: 'Georgia, serif', fontSize: '14px', color: '#c8b89a', padding: '4px 0' }}>
                {p.name}
                {p.id === room.mayor_id && <span style={{ fontFamily: 'Georgia, serif', fontSize: '11px', color: '#8a7030', marginLeft: '8px' }}>Alcalde</span>}
              </p>
            ))}
          </div>

          {currentPlayer.is_host ? (
            <button style={btnHost} onClick={async () => {
              const mayorIsDead = !alivePlayers.find(p => p.id === room.mayor_id)
              if (mayorIsDead) {
                await supabase.from('players').update({ voted_for: null }).eq('room_id', room.id)
                await supabase.from('rooms').update({ phase: 'mayor_replace', mayor_vote_reason: 'dawn' }).eq('id', room.id)
              } else {
                await supabase.from('rooms').update({ day_phase: 'debate', hunter_target_id: null }).eq('id', room.id)
              }
            }}>
              {!alivePlayers.find(p => p.id === room.mayor_id) ? 'Elegir nuevo Alcalde' : 'Comenzar debate'}
            </button>
          ) : <p style={waiting}>Esperando al host...</p>}
        </div>
      )}

      {dayPhase === 'debate' && (
        <div style={{ width: '100%', maxWidth: '340px' }}>
          <p style={{ ...label, textAlign: 'center' }}>DÍA {currentDay} — DEBATE</p>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '700', color: '#c8b89a', textAlign: 'center', marginBottom: '6px' }}>Discutid entre vosotros</p>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '13px', color: '#4a3f30', textAlign: 'center', marginBottom: '24px' }}>Sin chat — todo es presencial</p>

          <div style={{ ...card, textAlign: 'left', marginBottom: '16px' }}>
            <p style={{ ...label, marginBottom: '12px' }}>VIVOS ({alivePlayers.length})</p>
            {alivePlayers.map(p => (
              <p key={p.id} style={{ fontFamily: 'Georgia, serif', fontSize: '14px', color: '#c8b89a', padding: '4px 0' }}>
                {p.name}
                {p.id === room.mayor_id && <span style={{ fontFamily: 'Georgia, serif', fontSize: '11px', color: '#8a7030', marginLeft: '8px' }}>Alcalde</span>}
              </p>
            ))}
          </div>

          {currentPlayer.is_host ? (
            <button style={btnPrimary} onClick={async () => {
              await supabase.from('day_votes').delete().eq('room_id', room.id).eq('day', currentDay)
              await supabase.from('rooms').update({ day_phase: 'vote' }).eq('id', room.id)
              setHasVoted(false); setSelectedId(null); setPendingVoteId(null)
            }}>Iniciar votación</button>
          ) : <p style={waiting}>Esperando al host para votar...</p>}
        </div>
      )}

      {dayPhase === 'vote' && (
        <div style={{ width: '100%', maxWidth: '340px' }}>
          <p style={{ ...label, textAlign: 'center', marginBottom: '16px' }}>DÍA {currentDay} — VOTACIÓN</p>
          {!isAlive && <p style={{ ...waiting, marginBottom: '12px' }}>Estás muerto — solo puedes observar</p>}

          {alivePlayers.map(player => {
            const confirmedVoteCount = voteCountByTarget[player.id] || 0
            const pendingVotersForThis = pendingVotes.filter(v => v.target_id === player.id)
            const pendingVoterNames = pendingVotersForThis.map(v => players.find(p => p.id === v.player_id)?.name).filter(Boolean)
            const isMyPending = pendingVotes.find(v => v.player_id === currentPlayer.id)?.target_id === player.id
            const isMe = player.id === currentPlayer.id
            const hasConfirmed = confirmedVotes.find(v => v.player_id === player.id)
            const isSelected = selectedId === player.id

            return (
              <button key={player.id} onClick={() => !isMe && selectTarget(player.id)} disabled={isMe || hasVoted || !isAlive}
                style={{ width: '100%', borderRadius: '4px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', cursor: isMe || hasVoted || !isAlive ? 'not-allowed' : 'pointer', background: isSelected ? 'rgba(42,34,24,0.95)' : 'rgba(13,16,21,0.9)', border: isSelected ? '1px solid #8a6840' : '1px solid #2a2520', opacity: isMe ? 0.4 : 1 }}>
                <span style={{ fontFamily: 'Georgia, serif', fontSize: '14px', color: '#c8b89a' }}>
                  {player.name}
                  {player.id === room.mayor_id && <span style={{ fontFamily: 'Georgia, serif', fontSize: '11px', color: '#8a7030', marginLeft: '8px' }}>Alcalde</span>}
                  {isMe && <span style={{ fontFamily: 'Georgia, serif', fontSize: '11px', color: '#4a3f30', marginLeft: '8px' }}>(tú)</span>}
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {publicVotes && confirmedVoteCount > 0 && <span style={{ fontFamily: 'Georgia, serif', fontSize: '11px', color: '#8a6840', border: '1px solid #5a4830', borderRadius: '3px', padding: '2px 8px' }}>{confirmedVoteCount} voto{confirmedVoteCount > 1 ? 's' : ''}</span>}
                  {publicVotes && pendingVoterNames.length > 0 && !isMyPending && <span style={{ fontFamily: 'Georgia, serif', fontSize: '11px', color: '#8a7030', border: '1px solid #5a4820', borderRadius: '3px', padding: '2px 8px' }}>{pendingVoterNames.join(', ')}</span>}
                  {isMyPending && <span style={{ fontFamily: 'Georgia, serif', fontSize: '11px', color: '#4a3f30' }}>tu selección</span>}
                  {!publicVotes && hasConfirmed && <span style={{ fontFamily: 'Georgia, serif', fontSize: '11px', color: '#4a3f30' }}>votó</span>}
                </div>
              </button>
            )
          })}

          {isAlive && !hasVoted && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              <button style={selectedId ? btnPrimary : btnDisabled} onClick={() => confirmVote(false)} disabled={!selectedId}>Confirmar voto</button>
              <button style={{ ...btnHost, color: '#4a3f30' }} onClick={() => confirmVote(true)}>Abstenerme</button>
            </div>
          )}

          {hasVoted && <p style={{ ...waiting, marginTop: '12px' }}>Esperando votos... ({confirmedVotes.length}/{alivePlayers.length})</p>}
        </div>
      )}

      {dayPhase === 'execution' && (
        <div style={{ width: '100%', maxWidth: '340px', textAlign: 'center' }}>
          <p style={{ ...label, marginBottom: '16px' }}>DÍA {currentDay} — EJECUCIÓN</p>

          {executedPlayer ? (
            <div style={card}>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '12px', color: '#6a5a45', letterSpacing: '1px', marginBottom: '8px' }}>El pueblo ha ejecutado a</p>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: '700', color: '#c04040', marginBottom: '6px' }}>{executedPlayer.name}</p>
              {revealRole && (
  <p style={{ fontFamily: 'Georgia, serif', fontSize: '12px', color: '#4a3f30' }}>
    Era un {executedPlayer.role}{executedPlayer.infected ? ' (infectado)' : ''}
  </p>
)}
            </div>
          ) : (
            <div style={card}>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '16px', color: '#6a5a45' }}>El pueblo no ha ejecutado a nadie hoy.</p>
            </div>
          )}

          {room.hunter_target_id && (
  <div style={card}>
    <p style={{ fontFamily: 'Georgia, serif', fontSize: '12px', color: '#6a5a45', letterSpacing: '1px', marginBottom: '8px' }}>Antes de morir, el cazador disparó a</p>
    <p style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '700', color: '#c08030', marginBottom: '6px' }}>{players.find(p => p.id === room.hunter_target_id)?.name}</p>
    {revealRole && <p style={{ fontFamily: 'Georgia, serif', fontSize: '12px', color: '#4a3f30' }}>Era un {players.find(p => p.id === room.hunter_target_id)?.role}</p>}
  </div>
)}

          {currentPlayer.is_host ? (
            <button style={btnHost} onClick={async () => {
              const mayorWasExecuted = room.last_executed_id === room.mayor_id
              const mayorWasHunterTarget = room.hunter_target_id === room.mayor_id
              if (mayorWasExecuted || mayorWasHunterTarget) {
                await supabase.from('players').update({ voted_for: null }).eq('room_id', room.id)
                await supabase.from('rooms').update({ phase: 'mayor_replace', mayor_vote_reason: 'day' }).eq('id', room.id)
              } else {
                await supabase.from('rooms').update({ phase: 'night', day_phase: 'dawn', hunter_target_id: null }).eq('id', room.id)
              }
            }}>
              {room.last_executed_id === room.mayor_id || room.hunter_target_id === room.mayor_id ? 'Elegir nuevo Alcalde' : 'Comenzar siguiente noche'}
            </button>
          ) : <p style={waiting}>Esperando al host...</p>}
        </div>
      )}
    </div>
  )
}