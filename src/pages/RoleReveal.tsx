import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'

const roleInfo: Record<string, { label: string; description: string; color: string }> = {
  lobo: {
    label: 'Hombre lobo',
    description: 'Cada noche devoras a un aldeano. Finge ser uno de ellos durante el día.',
    color: 'text-red-400',
  },
  alpha: {
    label: 'Hombre lobo Alpha',
    description: 'Eres el lobo especial. Una vez por partida puedes infectar a tu víctima en vez de matarla.',
    color: 'text-red-500',
  },
  vidente: {
    label: 'Vidente',
    description: 'Cada noche descubres el rol de un jugador. Úsalo con cuidado.',
    color: 'text-purple-400',
  },
  protector: {
    label: 'Protector',
    description: 'Cada noche proteges a alguien. No puedes proteger a la misma persona dos noches seguidas.',
    color: 'text-blue-400',
  },
  cazador: {
    label: 'Cazador',
    description: 'Si mueres, en ese momento eliminas a otro jugador de tu elección.',
    color: 'text-yellow-400',
  },
  laviano: {
    label: 'Laviano',
    description: 'Eres un aldeano sin poderes especiales. Tu arma es la deducción y el voto.',
    color: 'text-gray-300',
  },
}

export default function RoleReveal() {
  const { room, players, currentPlayer, setPlayers, setRoom } = useGameStore()
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    if (!room) return

    supabase
      .from('players')
      .select()
      .eq('room_id', room.id)
      .then(({ data }) => { if (data) setPlayers(data) })

    const channel = supabase
      .channel(`reveal-${room.id}`)
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

  const mayor = players.find(p => p.id === room?.mayor_id)
  const myPlayer = players.find(p => p.id === currentPlayer?.id)
  const myRole = myPlayer?.role
  const info = myRole ? roleInfo[myRole] : null
  const isMayor = currentPlayer?.id === room?.mayor_id
  const isWolf = myRole === 'lobo' || myRole === 'alpha'
  const wolves = players.filter(p => p.role === 'lobo' || p.role === 'alpha')

  if (!room || !currentPlayer) return null

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">

      <div className="w-full max-w-sm mb-8 bg-gray-900 rounded-xl p-4 text-center">
        <p className="text-gray-500 text-xs mb-1">Alcalde elegido</p>
        <p className="text-xl font-bold text-yellow-400">{mayor?.name ?? 'Cargando...'}</p>
        {isMayor && <p className="text-xs text-yellow-600 mt-1">Eres tú — tu voto cuenta doble</p>}
      </div>

      {!revealed ? (
        <div className="w-full max-w-sm text-center">
          <p className="text-gray-400 mb-6">Asegúrate de que nadie ve tu pantalla</p>
          <button
            onClick={() => setRevealed(true)}
            className="w-full bg-purple-700 hover:bg-purple-600 rounded-lg px-4 py-3 font-medium transition-colors"
          >
            Ver mi rol
          </button>
        </div>
      ) : (
        <div className="w-full max-w-sm flex flex-col gap-4">
          <div className="bg-gray-900 rounded-xl p-6 text-center">
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest">Tu rol</p>
            <h3 className={`text-2xl font-bold mb-3 ${info?.color}`}>{info?.label ?? myRole}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{info?.description}</p>
          </div>

          {isWolf && wolves.length > 1 && (
            <div className="bg-red-950 border border-red-900 rounded-xl p-4">
              <p className="text-xs text-red-400 mb-2 uppercase tracking-widest">Tus compañeros lobos</p>
              {wolves
                .filter(w => w.id !== currentPlayer.id)
                .map(w => (
                  <p key={w.id} className="text-red-300 text-sm">{w.name}</p>
                ))}
              <p className="text-xs text-red-600 mt-2">Solo tú ves esto</p>
            </div>
          )}

          {isMayor && (
            <div className="bg-yellow-950 border border-yellow-900 rounded-xl p-4">
              <p className="text-xs text-yellow-400 mb-1 uppercase tracking-widest">Alcalde</p>
              <p className="text-yellow-300 text-sm">Tu voto cuenta doble en las ejecuciones. Si mueres, el pueblo elige a tu sustituto.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}