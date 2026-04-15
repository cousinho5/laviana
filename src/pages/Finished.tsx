import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'

const roleLabels: Record<string, string> = {
  lobo: 'Hombre lobo',
  alpha: 'Alpha',
  vidente: 'Vidente',
  protector: 'Protector',
  cazador: 'Cazador',
  laviano: 'Laviano',
  lobo_infectado: 'Infectado',
}

export default function Finished() {
  const { room, players, setRoom, setPlayers } = useGameStore()

  const winner = room?.winner
  const wolves = players.filter(p => p.role === 'lobo' || p.role === 'alpha' || p.infected)
  const villagers = players.filter(p => !wolves.includes(p))
  const winners = winner === 'lobos' ? wolves : villagers
  const losers = winner === 'lobos' ? villagers : wolves

  async function playAgain() {
    setRoom(null as any)
    setPlayers([])
  }

  if (!room) return null

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col gap-6">

        {winner === 'lobos' ? (
          <div className="text-center">
            <p className="text-xs text-red-400 uppercase tracking-widest mb-2">Victoria</p>
            <h1 className="text-4xl font-bold text-red-400 mb-2">Los lobos ganan</h1>
            <p className="text-gray-500 text-sm">Laviana ha caído en la oscuridad.</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-xs text-green-400 uppercase tracking-widest mb-2">Victoria</p>
            <h1 className="text-4xl font-bold text-green-400 mb-2">El pueblo gana</h1>
            <p className="text-gray-500 text-sm">Laviana ha sobrevivido a la maldición.</p>
          </div>
        )}

        <div className="bg-gray-900 rounded-xl p-4">
          <p className="text-xs uppercase tracking-widest mb-3 text-green-400">Ganadores</p>
          {winners.map(p => (
            <div key={p.id} className="flex items-center justify-between py-1">
              <span className="text-white text-sm">{p.name}</span>
              <span className="text-gray-500 text-xs">{roleLabels[p.role ?? ''] ?? p.role}</span>
            </div>
          ))}
        </div>

        <div className="bg-gray-900 rounded-xl p-4">
          <p className="text-xs uppercase tracking-widest mb-3 text-red-400">Perdedores</p>
          {losers.map(p => (
            <div key={p.id} className="flex items-center justify-between py-1">
              <span className="text-gray-400 text-sm">{p.name}</span>
              <span className="text-gray-600 text-xs">{roleLabels[p.role ?? ''] ?? p.role}</span>
            </div>
          ))}
        </div>

        <button
          onClick={playAgain}
          className="w-full bg-gray-800 hover:bg-gray-700 rounded-lg px-4 py-3 text-sm text-gray-300 transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  )
}