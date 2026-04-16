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

    supabase
      .from('players')
      .select()
      .eq('room_id', room.id)
      .then(({ data }) => { if (data) setPlayers(data) })

    supabase
      .from('night_actions')
      .select()
      .eq('room_id', room.id)
      .eq('night', room.night)
      .then(({ data }) => { if (data) setNightActions(data) })

    supabase
      .from('players')
      .select()
      .eq('id', currentPlayer?.id)
      .single()
      .then(({ data }) => {
        if (data?.used_infection) setAlphaUsedInfection(true)
      })

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
        supabase
          .from('night_actions')
          .select()
          .eq('room_id', room.id)
          .eq('night', room.night)
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

      return confirmedActions.find(a =>
        a.player_id === p.id &&
        ['kill', 'infect', 'reveal', 'protect', 'sleep'].includes(a.action_type)
      )
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
    const mayorDied = victimId && !isProtected && !isInfectedVictim && victimId === room.mayor_id

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

    if (mayorDied) {
      await supabase.from('players').update({ voted_for: null }).eq('room_id', room.id)
      await supabase.from('rooms').update({
        phase: 'mayor_replace',
        mayor_vote_reason: 'night',
        day_phase: 'dawn',
        night: room.night + 1,
        last_victim_id: victimId,
        last_victim_saved: false,
        last_victim_infected: false,
      }).eq('id', room.id)
      return
    }

    const winner = checkVictory(updatedPlayers.data)
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

  async function selectTarget(id: string) {
    if (!currentPlayer || !room || !isWolf) return
    setTargetId(id)

    const actionType = infectMode ? 'infect' : 'kill'

    if (pendingActionId) {
      await supabase.from('night_actions').update({ target_id: id, action_type: actionType }).eq('id', pendingActionId)
    } else {
      const { data } = await supabase
        .from('night_actions')
        .insert({
          room_id: room.id,
          player_id: currentPlayer.id,
          action_type: actionType,
          target_id: id,
          night: room.night,
          confirmed: false,
        })
        .select()
        .single()

      if (data) setPendingActionId(data.id)
    }
  }

  async function confirmKill(passing: boolean = false) {
    if (!currentPlayer || !room) return

    if (pendingActionId) {
      await supabase.from('night_actions').update({ confirmed: true, target_id: passing ? null : targetId }).eq('id', pendingActionId)
    } else {
      await supabase.from('night_actions').insert({
        room_id: room.id,
        player_id: currentPlayer.id,
        action_type: infectMode ? 'infect' : 'kill',
        target_id: null,
        night: room.night,
        confirmed: true,
      })
    }

    if (infectMode) {
      await supabase.from('players').update({ used_infection: true }).eq('id', currentPlayer.id)
      setAlphaUsedInfection(true)
    }

    if (isInfectedWithRole) {
      setInfectedKillDone(true)
      setTargetId(null)
      setPendingActionId(null)
    } else {
      setHasActed(true)
    }
  }

  async function confirmRoleAction(passing: boolean = false, roleTargetId?: string) {
    if (!currentPlayer || !room) return

    let actionType = ''
    if (isSeer) actionType = 'reveal'
    if (isProtector) actionType = 'protect'

    const finalTarget = passing ? null : (roleTargetId ?? targetId)

    await supabase.from('night_actions').insert({
      room_id: room.id,
      player_id: currentPlayer.id,
      action_type: actionType,
      target_id: finalTarget,
      night: room.night,
      confirmed: true,
    })

    if (isProtector && finalTarget) {
      await supabase.from('players').update({ last_protected: finalTarget }).eq('id', currentPlayer.id)
    }

    setHasActed(true)
  }

  async function confirmSleep() {
    if (!currentPlayer || !room) return

    await supabase.from('night_actions').insert({
      room_id: room.id,
      player_id: currentPlayer.id,
      action_type: 'sleep',
      target_id: null,
      night: room.night,
      confirmed: true,
    })

    setHasActed(true)
  }

  const confirmedKills = nightActions.filter(a => (a.action_type === 'kill' || a.action_type === 'infect') && a.confirmed)
  const pendingKills = nightActions.filter(a => (a.action_type === 'kill' || a.action_type === 'infect') && !a.confirmed)

  const voteCountByTarget: Record<string, number> = {}
  confirmedKills.forEach(a => {
    if (a.target_id) voteCountByTarget[a.target_id] = (voteCountByTarget[a.target_id] || 0) + 1
  })

  if (!room || !currentPlayer) return null

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
      <p className="text-gray-500 text-xs mb-1 uppercase tracking-widest">Noche {room.night}</p>
      <h2 className="text-2xl font-bold mb-8">El pueblo duerme</h2>

      {isSleeper && !hasActed && (
        <div className="w-full max-w-sm flex flex-col gap-3">
          {sleepStep === 0 && (
            <button onClick={() => setSleepStep(1)} className="w-full bg-gray-800 hover:bg-gray-700 rounded-lg px-4 py-4 font-medium transition-colors">
              Acostarse
            </button>
          )}
          {sleepStep === 1 && (
            <button onClick={() => setSleepStep(2)} className="w-full bg-gray-800 hover:bg-gray-700 rounded-lg px-4 py-4 font-medium transition-colors">
              Cerrar los ojos
            </button>
          )}
          {sleepStep === 2 && (
            <button onClick={confirmSleep} className="w-full bg-gray-700 hover:bg-gray-600 rounded-lg px-4 py-4 font-medium transition-colors">
              Dormir
            </button>
          )}
        </div>
      )}

      {isWolf && !hasActed && !infectedKillDone && (
        <div className="w-full max-w-sm flex flex-col gap-3">
          {isAlpha && !alphaUsedInfection && (
            <div className="bg-gray-900 rounded-xl p-3 flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-red-300">Modo infección</p>
                <p className="text-xs text-gray-500">Solo una vez por partida</p>
              </div>
              <button
                onClick={() => setInfectMode(!infectMode)}
                className={`w-12 h-6 rounded-full transition-colors ${infectMode ? 'bg-red-600' : 'bg-gray-700'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full mx-0.5 transition-transform ${infectMode ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          )}

          <p className="text-gray-400 text-sm mb-2">
            {infectMode ? 'Selecciona a quién infectar' : 'Selecciona a quién devorar — confirma cuando estés listo'}
          </p>

          {alivePlayers.map(player => {
            const confirmedVotes = voteCountByTarget[player.id] || 0
            const pendingVoter = pendingKills.find(a => a.target_id === player.id)
            const pendingVoterName = pendingVoter
              ? players.find(p => p.id === pendingVoter.player_id)?.name
              : null
            const isMyPending = pendingKills.find(a => a.player_id === currentPlayer.id)?.target_id === player.id

            return (
              <button
                key={player.id}
                onClick={() => selectTarget(player.id)}
                className={`rounded-lg px-4 py-3 flex items-center justify-between transition-colors
                  ${targetId === player.id
                    ? infectMode ? 'bg-red-900 border border-red-500' : 'bg-purple-800 border border-purple-500'
                    : 'bg-gray-800 hover:bg-gray-700'}
                `}
              >
                <span>{player.name}</span>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {confirmedVotes > 0 && (
                    <span className="text-xs bg-red-900 text-red-300 px-2 py-1 rounded-full">
                      {confirmedVotes} confirmado{confirmedVotes > 1 ? 's' : ''}
                    </span>
                  )}
                  {pendingVoterName && !isMyPending && (
                    <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-1 rounded-full">
                      {pendingVoterName} quiere votar
                    </span>
                  )}
                  {isMyPending && (
                    <span className="text-xs text-gray-500">tu selección</span>
                  )}
                </div>
              </button>
            )
          })}

          <button
            onClick={() => confirmKill(false)}
            disabled={!targetId}
            className={`w-full mt-2 rounded-lg px-4 py-3 font-medium transition-colors
              ${targetId
                ? infectMode ? 'bg-red-700 hover:bg-red-600' : 'bg-purple-700 hover:bg-purple-600'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'}
            `}
          >
            {infectMode ? 'Confirmar infección' : 'Confirmar voto'}
          </button>

          <button
            onClick={() => confirmKill(true)}
            className="w-full rounded-lg px-4 py-3 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Pasar turno
          </button>

          {aliveWolves.length > 1 && (
            <div className="bg-gray-900 rounded-xl p-4 mt-2">
              <p className="text-xs text-red-400 mb-2 uppercase tracking-widest">Estado de los lobos</p>
              {nightActions.filter(a => a.action_type === 'kill' || a.action_type === 'infect').length === 0
                ? <p className="text-gray-600 text-sm">Ningún lobo ha seleccionado aún</p>
                : nightActions.filter(a => a.action_type === 'kill' || a.action_type === 'infect').map(action => {
                    const voter = players.find(p => p.id === action.player_id)
                    const target = players.find(p => p.id === action.target_id)
                    return (
                      <p key={action.id} className="text-sm mb-1">
                        <span className="text-red-300">{voter?.name}</span>
                        <span className="text-gray-500"> → </span>
                        <span className="text-white">{target ? target.name : 'pasa'}</span>
                        {action.action_type === 'infect' && <span className="text-xs text-red-400 ml-1">(infectar)</span>}
                        <span className="text-xs ml-2">
                          {action.confirmed
                            ? <span className="text-green-400">confirmado</span>
                            : <span className="text-yellow-400">pensando...</span>}
                        </span>
                      </p>
                    )
                  })
              }
            </div>
          )}
        </div>
      )}

      {infectedKillDone && !hasActed && (
        <div className="w-full max-w-sm flex flex-col gap-3">
          <p className="text-gray-400 text-sm mb-2">
            {isSeer ? 'Ahora investiga a alguien' : 'Ahora elige a quién proteger'}
          </p>

          {alivePlayers.map(player => {
            const isLastProtected = isProtector && myPlayer?.last_protected === player.id
            return (
              <button
                key={player.id}
                onClick={() => !isLastProtected && setTargetId(player.id)}
                disabled={isLastProtected}
                className={`rounded-lg px-4 py-3 flex items-center justify-between transition-colors
                  ${isLastProtected ? 'bg-gray-900 text-gray-600 cursor-not-allowed' : ''}
                  ${!isLastProtected && targetId === player.id ? 'bg-purple-800 border border-purple-500' : ''}
                  ${!isLastProtected && targetId !== player.id ? 'bg-gray-800 hover:bg-gray-700' : ''}
                `}
              >
                <span>{player.name}</span>
                {isLastProtected && <span className="text-xs text-gray-600">protegido anoche</span>}
              </button>
            )
          })}

          <button
            onClick={() => confirmRoleAction(false)}
            disabled={!targetId}
            className={`w-full mt-2 rounded-lg px-4 py-3 font-medium transition-colors
              ${targetId ? 'bg-purple-700 hover:bg-purple-600' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}
            `}
          >
            {isSeer ? 'Investigar' : 'Proteger'}
          </button>

          <button
            onClick={() => confirmRoleAction(true)}
            className="w-full rounded-lg px-4 py-3 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Pasar turno
          </button>
        </div>
      )}

      {!isWolf && (isSeer || isProtector) && !hasActed && !infectedKillDone && (
        <div className="w-full max-w-sm flex flex-col gap-3">
          <p className="text-gray-400 text-sm mb-2">
            {isSeer ? 'Elige a quién investigar' : 'Elige a quién proteger'}
          </p>

          {alivePlayers.map(player => {
            const isLastProtected = isProtector && myPlayer?.last_protected === player.id
            return (
              <button
                key={player.id}
                onClick={() => !isLastProtected && setTargetId(player.id)}
                disabled={isLastProtected}
                className={`rounded-lg px-4 py-3 flex items-center justify-between transition-colors
                  ${isLastProtected ? 'bg-gray-900 text-gray-600 cursor-not-allowed' : ''}
                  ${!isLastProtected && targetId === player.id ? 'bg-purple-800 border border-purple-500' : ''}
                  ${!isLastProtected && targetId !== player.id ? 'bg-gray-800 hover:bg-gray-700' : ''}
                `}
              >
                <span>{player.name}</span>
                {isLastProtected && <span className="text-xs text-gray-600">protegido anoche</span>}
              </button>
            )
          })}

          <button
            onClick={() => confirmRoleAction(false)}
            disabled={!targetId}
            className={`w-full mt-2 rounded-lg px-4 py-3 font-medium transition-colors
              ${targetId ? 'bg-purple-700 hover:bg-purple-600' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}
            `}
          >
            {isSeer ? 'Investigar' : 'Proteger'}
          </button>

          <button
            onClick={() => confirmRoleAction(true)}
            className="w-full rounded-lg px-4 py-3 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Pasar turno
          </button>
        </div>
      )}

      {hasActed && (
        <p className="text-gray-500 text-sm mt-4">Acción registrada. Esperando al amanecer...</p>
      )}
    </div>
  )
}