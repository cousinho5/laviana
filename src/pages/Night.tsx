import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'

export default function Night() {
  const { room, players, currentPlayer, setPlayers, setRoom } = useGameStore()
  const [targetId, setTargetId] = useState<string | null>(null)
  const [hasActed, setHasActed] = useState(false)
  const [nightActions, setNightActions] = useState<any[]>([])
  const [pendingActionId, setPendingActionId] = useState<string | null>(null)
  const [infectMode, setInfectMode] = useState(false)
  const [alphaUsedInfection, setAlphaUsedInfection] = useState(false)
  const [sleepStep, setSleepStep] = useState<0 | 1 | 2 | 3>(0)
  const [infectedKillDone, setInfectedKillDone] = useState(false)

  const myPlayer = players.find(p => p.id === currentPlayer?.id)
  const myRole = myPlayer?.role
  const isInfected = myPlayer?.infected ?? false
  const alivePlayers = players.filter(p => p.is_alive && p.id !== currentPlayer?.id)
  const aliveWolves = players.filter(p => p.is_alive && (p.role === 'lobo' || p.role === 'alpha' || p.infected))

  const isWolf = myRole === 'lobo' || myRole === 'alpha' || isInfected
  const isAlpha = myRole === 'alpha'
  const isSeer = myRole === 'vidente'
  const isProtector = myRole === 'protector'
  const isInfectedWithRole = isInfected && (isSeer || isProtector)
  const isSleeper = !isWolf && !isSeer && !isProtector

  useEffect(() => {
    if (!room) return
    supabase.from('players').select().eq('room_id', room.id)
      .then(({ data }) => { if (data) setPlayers(data) })
    supabase.from('night_actions').select().eq('room_id', room.id).eq('night', room.night)
      .then(({ data }) => { if (data) setNightActions(data) })
    supabase.from('players').select().eq('id', currentPlayer?.id).single()
      .then(({ data }) => { if (data?.used_infection) setAlphaUsedInfection(true) })

    const channel = supabase
      .channel(`night-${room.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` }, ({ new: updated }) => {
        setRoom(updated as any)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'night_actions', filter: `room_id=eq.${room.id}` }, () => {
        supabase.from('night_actions').select().eq('room_id', room.id).eq('night', room.night)
          .then(({ data }) => {
            if (data) {
              setNightActions(data)
              if (currentPlayer?.is_host) checkAllActed(data)
            }
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
      return confirmedActions.find(a => a.player_id === p.id && ['kill', 'infect', 'reveal', 'protect', 'sleep'].includes(a.action_type))
    })
    if (allActed) resolveNight(confirmedActions)
  }

  function checkVictory(currentPlayers: any[]) {
    const alive = currentPlayers.filter(p => p.is_alive)
    const wolves = alive.filter(p => p.role === 'lobo' || p.role === 'alpha' || p.infected)
    const villagers = alive.filter(p => !wolves.includes(p))
    if (wolves.length === 0) return 'pueblo'
    if (wolves.length >= villagers.length) return 'lobos'
    return null
  }

  async function resolveNight(actions: any[]) {
    if (!room) return
    const killActions = actions.filter(a => a.action_type === 'kill' || a.action_type === 'infect')
    const protectAction = actions.find(a => a.action_type === 'protect')
    const infectAction = actions.find(a => a.action_type === 'infect')
    let victimId: string | null = null
    if (killActions.length > 0) {
      const voteCounts: Record<string, { count: number; firstAt: string; hasAlpha: boolean }> = {}
      for (const action of killActions) {
        if (!action.target_id) continue
        const voter = players.find(p => p.id === action.player_id)
        if (!voteCounts[action.target_id]) voteCounts[action.target_id] = { count: 0, firstAt: action.created_at, hasAlpha: false }
        voteCounts[action.target_id].count++
        if (voter?.role === 'alpha') voteCounts[action.target_id].hasAlpha = true
      }
      const candidates = Object.entries(voteCounts).filter(([id]) => id !== 'null').sort((a, b) => {
        if (b[1].count !== a[1].count) return b[1].count - a[1].count
        if (b[1].hasAlpha !== a[1].hasAlpha) return b[1].hasAlpha ? 1 : -1
        return new Date(a[1].firstAt).getTime() - new Date(b[1].firstAt).getTime()
      })
      if (candidates.length > 0) victimId = candidates[0][0]
    }
    const isProtected = victimId && protectAction?.target_id === victimId
    const isInfectedVictim = infectAction && infectAction.target_id === victimId
    if (victimId && !isProtected) {
      if (isInfectedVictim) await supabase.from('players').update({ infected: true }).eq('id', victimId)
      else await supabase.from('players').update({ is_alive: false }).eq('id', victimId)
    }
    const updatedPlayers = await supabase.from('players').select().eq('room_id', room.id)
    if (!updatedPlayers.data) return
    const victimPlayer = victimId ? updatedPlayers.data.find(p => p.id === victimId) : null
    const victimIsHunter = victimPlayer?.role === 'cazador' && !isProtected && !isInfectedVictim
    const mayorDied = victimId && !isProtected && !isInfectedVictim && victimId === room.mayor_id
    if (victimIsHunter) {
      await supabase.from('rooms').update({ phase: 'hunter', hunter_id: victimId, day_phase: 'dawn', night: room.night + 1, last_victim_id: victimId, last_victim_saved: false, last_victim_infected: false, mayor_vote_reason: victimId === room.mayor_id ? 'night' : null }).eq('id', room.id)
      return
    }
    if (mayorDied) {
      await supabase.from('players').update({ voted_for: null }).eq('room_id', room.id)
      await supabase.from('rooms').update({ phase: 'mayor_replace', mayor_vote_reason: 'night', day_phase: 'dawn', night: room.night + 1, last_victim_id: victimId, last_victim_saved: false, last_victim_infected: false }).eq('id', room.id)
      return
    }
    const winner = checkVictory(updatedPlayers.data)
    if (winner) { await supabase.from('rooms').update({ phase: 'finished', winner }).eq('id', room.id); return }
    await supabase.from('rooms').update({ phase: 'day', day_phase: 'dawn', night: room.night + 1, last_victim_id: victimId && !isProtected && !isInfectedVictim ? victimId : null, last_victim_saved: isProtected ? true : false, last_victim_infected: isInfectedVictim ? true : false, hunter_target_id: null }).eq('id', room.id)
  }

  async function selectTarget(id: string) {
    if (!currentPlayer || !room || !isWolf) return
    setTargetId(id)
    const actionType = infectMode ? 'infect' : 'kill'
    if (pendingActionId) {
      await supabase.from('night_actions').update({ target_id: id, action_type: actionType }).eq('id', pendingActionId)
    } else {
      const { data } = await supabase.from('night_actions').insert({ room_id: room.id, player_id: currentPlayer.id, action_type: actionType, target_id: id, night: room.night, confirmed: false }).select().single()
      if (data) setPendingActionId(data.id)
    }
  }

  async function confirmKill(passing: boolean = false) {
    if (!currentPlayer || !room) return
    if (pendingActionId) {
      await supabase.from('night_actions').update({ confirmed: true, target_id: passing ? null : targetId }).eq('id', pendingActionId)
    } else {
      await supabase.from('night_actions').insert({ room_id: room.id, player_id: currentPlayer.id, action_type: infectMode ? 'infect' : 'kill', target_id: null, night: room.night, confirmed: true })
    }
    if (infectMode) { await supabase.from('players').update({ used_infection: true }).eq('id', currentPlayer.id); setAlphaUsedInfection(true) }
    if (isInfectedWithRole) { setInfectedKillDone(true); setTargetId(null); setPendingActionId(null) }
    else setHasActed(true)
  }

  async function confirmRoleAction(passing: boolean = false, roleTargetId?: string) {
    if (!currentPlayer || !room) return
    const actionType = isSeer ? 'reveal' : 'protect'
    const finalTarget = passing ? null : (roleTargetId ?? targetId)
    await supabase.from('night_actions').insert({ room_id: room.id, player_id: currentPlayer.id, action_type: actionType, target_id: finalTarget, night: room.night, confirmed: true })
    if (isProtector && finalTarget) await supabase.from('players').update({ last_protected: finalTarget }).eq('id', currentPlayer.id)
    setHasActed(true)
  }

  async function confirmSleep() {
    if (!currentPlayer || !room) return
    await supabase.from('night_actions').insert({ room_id: room.id, player_id: currentPlayer.id, action_type: 'sleep', target_id: null, night: room.night, confirmed: true })
    setHasActed(true)
  }

  const confirmedKills = nightActions.filter(a => (a.action_type === 'kill' || a.action_type === 'infect') && a.confirmed)
  const pendingKills = nightActions.filter(a => (a.action_type === 'kill' || a.action_type === 'infect') && !a.confirmed)
  const voteCountByTarget: Record<string, number> = {}
  confirmedKills.forEach(a => { if (a.target_id) voteCountByTarget[a.target_id] = (voteCountByTarget[a.target_id] || 0) + 1 })

  if (!room || !currentPlayer) return null

  const btnBase = { borderRadius: '4px', padding: '13px 16px', fontFamily: 'Georgia, serif', fontSize: '14px', cursor: 'pointer', width: '100%', marginBottom: '6px' }
  const btnPrimary = { ...btnBase, background: 'rgba(42,34,24,0.9)', border: '1px solid #5a4830', color: '#c8b89a' }
  const btnSecondary = { ...btnBase, background: 'rgba(13,16,21,0.9)', border: '1px solid #2a2520', color: '#7a6a55' }
  const btnDisabled = { ...btnBase, background: 'rgba(13,16,21,0.5)', border: '1px solid #1a1815', color: '#3a3530', cursor: 'not-allowed' }
  const btnRed = { ...btnBase, background: 'rgba(40,10,10,0.9)', border: '1px solid #6a2020', color: '#c08080' }
  const playerCard = (selected: boolean, red: boolean = false) => ({
    borderRadius: '4px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: '6px', width: '100%',
    background: selected ? (red ? 'rgba(40,10,10,0.95)' : 'rgba(42,34,24,0.95)') : 'rgba(13,16,21,0.9)',
    border: selected ? (red ? '1px solid #8a2020' : '1px solid #8a6840') : '1px solid #2a2520',
  })

  return (
    <div style={{ minHeight: '100vh', background: '#0a0c0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <p style={{ fontFamily: 'Georgia, serif', fontSize: '11px', color: '#6a5a45', letterSpacing: '3px', marginBottom: '8px' }}>NOCHE {room.night}</p>
      <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '26px', fontWeight: '700', color: '#c8b89a', marginBottom: '32px' }}>El pueblo duerme</h2>

      {/* Laviano — pasos para dormir */}
      {isSleeper && !hasActed && (
        <div style={{ width: '100%', maxWidth: '340px' }}>
          {sleepStep === 0 && <button style={btnSecondary} onClick={() => setSleepStep(1)}>Acostarse</button>}
          {sleepStep === 1 && <button style={btnSecondary} onClick={() => setSleepStep(2)}>Cerrar los ojos</button>}
          {sleepStep === 2 && <button style={btnPrimary} onClick={confirmSleep}>Dormir</button>}
        </div>
      )}

      {/* Lobos */}
      {isWolf && !hasActed && !infectedKillDone && (
        <div style={{ width: '100%', maxWidth: '340px' }}>
          {isAlpha && !alphaUsedInfection && (
            <div style={{ background: 'rgba(20,8,8,0.9)', border: '1px solid #4a2020', borderRadius: '4px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <p style={{ fontFamily: 'Georgia, serif', fontSize: '13px', color: '#c08080' }}>Modo infección</p>
                <p style={{ fontFamily: 'Georgia, serif', fontSize: '11px', color: '#4a2020', marginTop: '2px' }}>Solo una vez por partida</p>
              </div>
              <div onClick={() => setInfectMode(!infectMode)} style={{ width: '44px', height: '24px', borderRadius: '12px', background: infectMode ? '#6a2020' : '#1a1815', border: `1px solid ${infectMode ? '#8a2020' : '#2a2520'}`, cursor: 'pointer', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '3px', left: infectMode ? '22px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: infectMode ? '#c08080' : '#3a3530', transition: 'left 0.2s' }} />
              </div>
            </div>
          )}

          <p style={{ fontFamily: 'Georgia, serif', fontSize: '12px', color: '#4a3f30', marginBottom: '12px', letterSpacing: '1px' }}>
            {infectMode ? 'Elige a quién infectar' : 'Elige a quién devorar'}
          </p>

          {alivePlayers.map(player => {
            const confirmedVotes = voteCountByTarget[player.id] || 0
            const pendingVoter = pendingKills.find(a => a.target_id === player.id)
            const pendingVoterName = pendingVoter ? players.find(p => p.id === pendingVoter.player_id)?.name : null
            const isMyPending = pendingKills.find(a => a.player_id === currentPlayer.id)?.target_id === player.id
            return (
              <button key={player.id} onClick={() => selectTarget(player.id)} style={playerCard(targetId === player.id, infectMode)}>
                <span style={{ fontFamily: 'Georgia, serif', fontSize: '14px', color: '#c8b89a' }}>{player.name}</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {confirmedVotes > 0 && <span style={{ fontFamily: 'Georgia, serif', fontSize: '11px', color: '#c08080', border: '1px solid #6a2020', borderRadius: '3px', padding: '2px 8px' }}>{confirmedVotes} conf.</span>}
                  {pendingVoterName && !isMyPending && <span style={{ fontFamily: 'Georgia, serif', fontSize: '11px', color: '#a08030', border: '1px solid #6a5020', borderRadius: '3px', padding: '2px 8px' }}>{pendingVoterName}</span>}
                  {isMyPending && <span style={{ fontFamily: 'Georgia, serif', fontSize: '11px', color: '#4a3f30' }}>tu voto</span>}
                </div>
              </button>
            )
          })}

          <button style={targetId ? (infectMode ? btnRed : btnPrimary) : btnDisabled} onClick={() => confirmKill(false)} disabled={!targetId}>
            {infectMode ? 'Confirmar infección' : 'Confirmar voto'}
          </button>
          <button style={btnSecondary} onClick={() => confirmKill(true)}>Pasar turno</button>

          {aliveWolves.length > 1 && (
            <div style={{ background: 'rgba(13,8,8,0.95)', border: '1px solid #3a1818', borderRadius: '4px', padding: '16px', marginTop: '12px' }}>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '11px', color: '#8a4040', letterSpacing: '3px', marginBottom: '10px' }}>ESTADO DE LOS LOBOS</p>
              {nightActions.filter(a => a.action_type === 'kill' || a.action_type === 'infect').length === 0
                ? <p style={{ fontFamily: 'Georgia, serif', fontSize: '13px', color: '#3a2020' }}>Ningún lobo ha seleccionado aún</p>
                : nightActions.filter(a => a.action_type === 'kill' || a.action_type === 'infect').map(action => {
                    const voter = players.find(p => p.id === action.player_id)
                    const target = players.find(p => p.id === action.target_id)
                    return (
                      <p key={action.id} style={{ fontFamily: 'Georgia, serif', fontSize: '13px', marginBottom: '6px' }}>
                        <span style={{ color: '#c08080' }}>{voter?.name}</span>
                        <span style={{ color: '#3a2020' }}> → </span>
                        <span style={{ color: '#c8b89a' }}>{target ? target.name : 'pasa'}</span>
                        {action.action_type === 'infect' && <span style={{ color: '#8a4040', fontSize: '11px', marginLeft: '6px' }}>(infectar)</span>}
                        <span style={{ fontSize: '11px', marginLeft: '8px', color: action.confirmed ? '#6a9a50' : '#8a7030' }}>
                          {action.confirmed ? 'confirmado' : 'pensando...'}
                        </span>
                      </p>
                    )
                  })
              }
            </div>
          )}
        </div>
      )}

      {/* Infectado con rol — segunda acción */}
      {infectedKillDone && !hasActed && (
        <div style={{ width: '100%', maxWidth: '340px' }}>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '12px', color: '#4a3f30', marginBottom: '12px', letterSpacing: '1px' }}>
            {isSeer ? 'Ahora investiga a alguien' : 'Ahora elige a quién proteger'}
          </p>
          {alivePlayers.map(player => {
            const isLastProtected = isProtector && myPlayer?.last_protected === player.id
            return (
              <button key={player.id} onClick={() => !isLastProtected && setTargetId(player.id)} disabled={isLastProtected} style={{ ...playerCard(targetId === player.id), opacity: isLastProtected ? 0.4 : 1, cursor: isLastProtected ? 'not-allowed' : 'pointer' }}>
                <span style={{ fontFamily: 'Georgia, serif', fontSize: '14px', color: '#c8b89a' }}>{player.name}</span>
                {isLastProtected && <span style={{ fontFamily: 'Georgia, serif', fontSize: '11px', color: '#3a3530' }}>protegido anoche</span>}
              </button>
            )
          })}
          <button style={targetId ? btnPrimary : btnDisabled} onClick={() => confirmRoleAction(false)} disabled={!targetId}>
            {isSeer ? 'Investigar' : 'Proteger'}
          </button>
          <button style={btnSecondary} onClick={() => confirmRoleAction(true)}>Pasar turno</button>
        </div>
      )}

      {/* Vidente / Protector */}
      {!isWolf && (isSeer || isProtector) && !hasActed && !infectedKillDone && (
        <div style={{ width: '100%', maxWidth: '340px' }}>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '12px', color: '#4a3f30', marginBottom: '12px', letterSpacing: '1px' }}>
            {isSeer ? 'Elige a quién investigar' : 'Elige a quién proteger'}
          </p>
          {alivePlayers.map(player => {
            const isLastProtected = isProtector && myPlayer?.last_protected === player.id
            return (
              <button key={player.id} onClick={() => !isLastProtected && setTargetId(player.id)} disabled={isLastProtected} style={{ ...playerCard(targetId === player.id), opacity: isLastProtected ? 0.4 : 1, cursor: isLastProtected ? 'not-allowed' : 'pointer' }}>
                <span style={{ fontFamily: 'Georgia, serif', fontSize: '14px', color: '#c8b89a' }}>{player.name}</span>
                {isLastProtected && <span style={{ fontFamily: 'Georgia, serif', fontSize: '11px', color: '#3a3530' }}>protegido anoche</span>}
              </button>
            )
          })}
          <button style={targetId ? btnPrimary : btnDisabled} onClick={() => confirmRoleAction(false)} disabled={!targetId}>
            {isSeer ? 'Investigar' : 'Proteger'}
          </button>
          <button style={btnSecondary} onClick={() => confirmRoleAction(true)}>Pasar turno</button>
        </div>
      )}

      {hasActed && (
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '13px', color: '#4a3f30', letterSpacing: '1px', marginTop: '16px' }}>
          Acción registrada. Esperando al amanecer...
        </p>
      )}
    </div>
  )
}