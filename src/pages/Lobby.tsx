import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'

type Config = {
  wolves: number
  has_alpha: boolean
  has_seer: boolean
  has_protector: boolean
  has_hunter: boolean
  public_votes: boolean
  reveal_role: boolean
}

function getMaxWolves(playerCount: number): number {
  if (playerCount <= 10) return 2
  if (playerCount <= 15) return 3
  return 4
}

function getLavianos(playerCount: number, config: Config): number {
  const specials =
    (config.has_alpha ? 1 : 0) +
    (config.has_seer ? 1 : 0) +
    (config.has_protector ? 1 : 0) +
    (config.has_hunter ? 1 : 0)
  return playerCount - config.wolves - specials
}

function canStart(playerCount: number, config: Config): boolean {
  if (playerCount < 6) return false
  const lavianos = getLavianos(playerCount, config)
  if (lavianos < 0) return false
  const maxWolves = getMaxWolves(playerCount)
  if (config.wolves > maxWolves) return false
  if (config.wolves < 1) return false
  return true
}

export default function Lobby() {
  const { room, players, currentPlayer, setPlayers, setRoom } = useGameStore()
  const [showConfig, setShowConfig] = useState(false)
  const [config, setConfig] = useState<Config>({
  wolves: 2,
  has_alpha: false,
  has_seer: false,
  has_protector: false,
  has_hunter: false,
  public_votes: true,
  reveal_role: true,
})

  const isHost = currentPlayer?.is_host
  const playerCount = players.length
  const maxWolves = getMaxWolves(playerCount)
  const lavianos = getLavianos(playerCount, config)
  const startable = canStart(playerCount, config)

  useEffect(() => {
    if (!room) return

    supabase
      .from('players')
      .select()
      .eq('room_id', room.id)
      .then(({ data }) => { if (data) setPlayers(data) })

    const channel = supabase
      .channel(`room-${room.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'players',
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

  async function saveConfig(newConfig: Config) {
    setConfig(newConfig)
    await supabase
      .from('rooms')
      .update({ config: newConfig })
      .eq('id', room!.id)
  }

  async function startGame() {
    if (!startable || !room) return

    const roles: string[] = []
    for (let i = 0; i < config.wolves; i++) roles.push('lobo')
    if (config.has_alpha) roles.push('alpha')
    if (config.has_seer) roles.push('vidente')
    if (config.has_protector) roles.push('protector')
    if (config.has_hunter) roles.push('cazador')
    while (roles.length < playerCount) roles.push('laviano')

    const shuffled = roles.sort(() => Math.random() - 0.5)

    for (let i = 0; i < players.length; i++) {
      await supabase
        .from('players')
        .update({ role: shuffled[i] })
        .eq('id', players[i].id)
    }

    await supabase
      .from('rooms')
      .update({ phase: 'mayor_vote' })
      .eq('id', room.id)
  }

  if (!room) return null

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
      <p className="text-gray-500 text-sm mb-1">Código de sala</p>
      <h2 className="text-5xl font-bold tracking-widest mb-2">{room.code}</h2>
      <p className="text-gray-500 text-sm mb-8">Comparte este código con los jugadores</p>

      <div className="w-full max-w-sm">
        <p className="text-gray-400 text-sm mb-3">Jugadores ({playerCount})</p>
        <div className="flex flex-col gap-2 mb-6">
          {players.map((player) => (
            <div key={player.id} className="bg-gray-800 rounded-lg px-4 py-3 flex items-center justify-between">
              <span>{player.name}</span>
              <div className="flex gap-2">
                {player.is_host && (
                  <span className="text-xs bg-purple-900 text-purple-300 px-2 py-1 rounded-full">host</span>
                )}
                {player.id === currentPlayer?.id && (
                  <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">tú</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {isHost && (
          <>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="w-full mb-3 bg-gray-800 hover:bg-gray-700 rounded-lg px-4 py-3 text-sm text-gray-300 transition-colors"
            >
              {showConfig ? 'Ocultar configuración' : 'Configurar partida'}
            </button>

            {showConfig && (
              <div className="bg-gray-900 rounded-xl p-4 mb-4 flex flex-col gap-4">

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Lobos normales</p>
                    <p className="text-xs text-gray-500">Máximo {maxWolves} para {playerCount} jugadores</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => saveConfig({ ...config, wolves: Math.max(1, config.wolves - 1) })}
                      className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-lg text-lg font-medium"
                    >-</button>
                    <span className="w-4 text-center">{config.wolves}</span>
                    <button
                      onClick={() => saveConfig({ ...config, wolves: Math.min(maxWolves, config.wolves + 1) })}
                      className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-lg text-lg font-medium"
                    >+</button>
                  </div>
                </div>

                {[
                  { key: 'has_alpha', label: 'Alpha', desc: 'Lobo especial con infección' },
                  { key: 'has_seer', label: 'Vidente', desc: 'Ve el rol de un jugador cada noche' },
                  { key: 'has_protector', label: 'Protector', desc: 'Protege a un jugador cada noche' },
                  { key: 'has_hunter', label: 'Cazador', desc: 'Al morir elimina a otro jugador' },
                  { key: 'public_votes', label: 'Votos públicos', desc: 'Todos ven a quién vota cada uno' },
                  { key: 'reveal_role', label: 'Revelar rol al morir', desc: 'Se muestra el rol del ejecutado' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                    <button
                      onClick={() => saveConfig({ ...config, [key]: !config[key as keyof Config] })}
                      className={`w-12 h-6 rounded-full transition-colors ${config[key as keyof Config] ? 'bg-purple-600' : 'bg-gray-700'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full mx-0.5 transition-transform ${config[key as keyof Config] ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                ))}

                <div className="border-t border-gray-800 pt-3 flex justify-between text-sm text-gray-400">
                  <span>Lavianos normales</span>
                  <span className={lavianos < 0 ? 'text-red-400' : 'text-gray-300'}>{lavianos}</span>
                </div>

                {!startable && playerCount >= 6 && (
                  <p className="text-red-400 text-xs text-center">
                    {lavianos < 0 ? 'Demasiados roles especiales para los jugadores actuales' : 'Configuración inválida'}
                  </p>
                )}
              </div>
            )}

            <button
              onClick={startGame}
              disabled={!startable}
              className={`w-full rounded-lg px-4 py-3 font-medium transition-colors ${startable ? 'bg-purple-700 hover:bg-purple-600' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
            >
              {playerCount < 6 ? `Faltan ${6 - playerCount} jugadores` : 'Comenzar partida'}
            </button>
          </>
        )}

        {!isHost && (
          <p className="text-center text-gray-500 text-sm">Esperando a que el host inicie la partida...</p>
        )}
      </div>
    </div>
  )
}