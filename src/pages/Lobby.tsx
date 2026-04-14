import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'

export default function Lobby() {
  const { room, players, currentPlayer, setPlayers } = useGameStore()

  useEffect(() => {
    if (!room) return

    supabase
      .from('players')
      .select()
      .eq('room_id', room.id)
      .then(({ data }) => {
        if (data) setPlayers(data)
      })

    const channel = supabase
      .channel(`room-${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `room_id=eq.${room.id}`,
        },
        () => {
          supabase
            .from('players')
            .select()
            .eq('room_id', room.id)
            .then(({ data }) => {
              if (data) setPlayers(data)
            })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [room])

  if (!room) return null

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
      <p className="text-gray-500 text-sm mb-1">Código de sala</p>
      <h2 className="text-5xl font-bold tracking-widest mb-2">{room.code}</h2>
      <p className="text-gray-500 text-sm mb-10">Comparte este código con los jugadores</p>

      <div className="w-full max-w-sm">
        <p className="text-gray-400 text-sm mb-3">
          Jugadores ({players.length})
        </p>
        <div className="flex flex-col gap-2">
          {players.map((player) => (
            <div
              key={player.id}
              className="bg-gray-800 rounded-lg px-4 py-3 flex items-center justify-between"
            >
              <span>{player.name}</span>
              <div className="flex gap-2">
                {player.is_host && (
                  <span className="text-xs bg-purple-900 text-purple-300 px-2 py-1 rounded-full">
                    host
                  </span>
                )}
                {player.id === currentPlayer?.id && (
                  <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
                    tú
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {currentPlayer?.is_host && (
          <button className="w-full mt-8 bg-purple-700 hover:bg-purple-600 rounded-lg px-4 py-3 font-medium transition-colors">
            Comenzar partida
          </button>
        )}
      </div>
    </div>
  )
}