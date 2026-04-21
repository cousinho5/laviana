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

  function playAgain() {
    setRoom(null as any)
    setPlayers([])
  }

  if (!room) return null

  const card = { background: 'rgba(13,16,21,0.9)', border: '1px solid #2a2520', borderRadius: '4px', padding: '20px', marginBottom: '12px' }
  const label = { fontFamily: 'Georgia, serif', fontSize: '11px', letterSpacing: '3px', marginBottom: '12px' }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0c0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {winner === 'lobos' ? (
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <p style={{ ...label, color: '#8a4040' }}>VICTORIA</p>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '38px', fontWeight: '700', color: '#c04040', marginBottom: '8px' }}>Los lobos ganan</h1>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '13px', color: '#4a3030', letterSpacing: '1px' }}>Laviana ha caído en la oscuridad.</p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <p style={{ ...label, color: '#4a7040' }}>VICTORIA</p>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '38px', fontWeight: '700', color: '#6a9a50', marginBottom: '8px' }}>El pueblo gana</h1>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '13px', color: '#3a4a30', letterSpacing: '1px' }}>Laviana ha sobrevivido a la maldición.</p>
          </div>
        )}

        <div style={{ ...card, border: '1px solid #2a3a20' }}>
          <p style={{ ...label, color: '#5a8040' }}>GANADORES</p>
          {winners.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1a2015' }}>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: '14px', color: '#c8b89a' }}>{p.name}</span>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: '11px', color: '#5a7040' }}>{roleLabels[p.role ?? ''] ?? p.role}</span>
            </div>
          ))}
        </div>

        <div style={{ ...card, border: '1px solid #3a2020' }}>
          <p style={{ ...label, color: '#8a4040' }}>PERDEDORES</p>
          {losers.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #201515' }}>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: '14px', color: '#6a5a55' }}>{p.name}</span>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: '11px', color: '#4a3030' }}>{roleLabels[p.role ?? ''] ?? p.role}</span>
            </div>
          ))}
        </div>

        <button
          onClick={playAgain}
          style={{ width: '100%', background: 'rgba(20,20,20,0.9)', border: '1px solid #2a2520', borderRadius: '4px', padding: '13px 16px', color: '#7a6a55', fontFamily: 'Georgia, serif', fontSize: '13px', cursor: 'pointer', marginTop: '8px' }}
        >
          Volver al inicio
        </button>
      </div>
    </div>
  )
}