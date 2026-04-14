import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function Home() {
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setRoom, setCurrentPlayer } = useGameStore()

  async function createRoom() {
    if (!name.trim()) return setError('Escribe tu nombre')
    setLoading(true)
    setError('')

    const { data: authData } = await supabase.auth.signInAnonymously()
    const userId = authData.user?.id
    if (!userId) return setError('Error de conexión')

    const code = generateCode()

    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert({ code, host_id: userId, status: 'lobby' })
      .select()
      .single()

    if (roomError) return setError('Error creando sala')

    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert({ room_id: room.id, name: name.trim(), is_host: true })
      .select()
      .single()

    if (playerError) return setError('Error creando jugador')

    setRoom(room)
    setCurrentPlayer(player)
    setLoading(false)
  }

  async function joinRoom() {
    if (!name.trim()) return setError('Escribe tu nombre')
    if (!joinCode.trim()) return setError('Escribe el código de sala')
    setLoading(true)
    setError('')

    await supabase.auth.signInAnonymously()

    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select()
      .eq('code', joinCode.toUpperCase())
      .single()

    if (roomError || !room) return setError('Sala no encontrada')

    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert({ room_id: room.id, name: name.trim(), is_host: false })
      .select()
      .single()

    if (playerError) return setError('Error uniéndose a la sala')

    setRoom(room)
    setCurrentPlayer(player)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold mb-2">Laviana</h1>
      <p className="text-gray-400 mb-10">Pueblo asturiano maldito</p>

      <div className="w-full max-w-sm flex flex-col gap-4">
        <input
          className="bg-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none"
          placeholder="Tu nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button
          onClick={createRoom}
          disabled={loading}
          className="bg-purple-700 hover:bg-purple-600 rounded-lg px-4 py-3 font-medium transition-colors"
        >
          Crear sala
        </button>

        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-gray-500 text-sm">o</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        <input
          className="bg-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none uppercase tracking-widest"
          placeholder="Código de sala"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          maxLength={6}
        />

        <button
          onClick={joinRoom}
          disabled={loading}
          className="bg-gray-700 hover:bg-gray-600 rounded-lg px-4 py-3 font-medium transition-colors"
        >
          Unirse a sala
        </button>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </div>
    </div>
  )
}