import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'

const roleInfo: Record<string, { label: string; description: string; color: string }> = {
  lobo: { label: 'Hombre Lobo', description: 'Cada noche devoras a un aldeano. Finge ser uno de ellos durante el día.', color: '#c04040' },
  alpha: { label: 'Hombre Lobo Alpha', description: 'Eres el lobo especial. Una vez por partida puedes infectar a tu víctima en vez de matarla.', color: '#d04040' },
  vidente: { label: 'Vidente', description: 'Cada noche descubres el rol de un jugador. Úsalo con cuidado.', color: '#9080c0' },
  protector: { label: 'Protector', description: 'Cada noche proteges a alguien. No puedes proteger a la misma persona dos noches seguidas.', color: '#5080a0' },
  cazador: { label: 'Cazador', description: 'Si mueres, en ese momento eliminas a otro jugador de tu elección.', color: '#a08030' },
  laviano: { label: 'Laviano', description: 'Eres un aldeano sin poderes especiales. Tu arma es la deducción y el voto.', color: '#8a7a65' },
}

export default function RoleReveal() {
  const { room, players, currentPlayer, setPlayers, setRoom } = useGameStore()
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    if (!room) return
    supabase.from('players').select().eq('room_id', room.id)
      .then(({ data }) => { if (data) setPlayers(data) })
    const channel = supabase
      .channel(`reveal-${room.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'players', filter: `room_id=eq.${room.id}` }, () => {
        supabase.from('players').select().eq('room_id', room.id)
          .then(({ data }) => { if (data) setPlayers(data) })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` }, ({ new: updated }) => {
        setRoom(updated as any)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [room])

  async function startNight() {
    if (!room) return
    await supabase.from('rooms').update({ phase: 'night' }).eq('id', room.id)
  }

  const mayor = players.find(p => p.id === room?.mayor_id)
  const myPlayer = players.find(p => p.id === currentPlayer?.id)
  const myRole = myPlayer?.role
  const info = myRole ? roleInfo[myRole] : null
  const isMayor = currentPlayer?.id === room?.mayor_id
  const isWolf = myRole === 'lobo' || myRole === 'alpha'
  const wolves = players.filter(p => p.role === 'lobo' || p.role === 'alpha')

  if (!room || !currentPlayer) return null

  return (
    <div style={{ minHeight: '100vh', background: '#0a0c0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>

      {/* Alcalde */}
      <div style={{ width: '100%', maxWidth: '340px', background: 'rgba(13,16,21,0.9)', border: '1px solid #3a3020', borderRadius: '4px', padding: '16px', textAlign: 'center', marginBottom: '24px' }}>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '11px', color: '#6a5a45', letterSpacing: '3px', marginBottom: '6px' }}>ALCALDE DEL PUEBLO</p>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '700', color: '#c8a840' }}>{mayor?.name ?? '...'}</p>
        {isMayor && <p style={{ fontFamily: 'Georgia, serif', fontSize: '11px', color: '#8a7030', marginTop: '4px', letterSpacing: '1px' }}>Eres tú — tu voto cuenta doble</p>}
      </div>

      {!revealed ? (
        <div style={{ width: '100%', maxWidth: '340px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '13px', color: '#4a3f30', marginBottom: '24px', letterSpacing: '1px' }}>
            Asegúrate de que nadie ve tu pantalla
          </p>
          <button
            onClick={() => setRevealed(true)}
            style={{ width: '100%', background: 'rgba(42,34,24,0.9)', border: '1px solid #5a4830', borderRadius: '4px', padding: '13px 16px', color: '#c8b89a', fontFamily: 'Georgia, serif', fontSize: '14px', cursor: 'pointer' }}
          >
            Ver mi rol
          </button>
        </div>
      ) : (
        <div style={{ width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Rol */}
          <div style={{ background: 'rgba(13,16,21,0.9)', border: `1px solid ${info?.color ?? '#2a2520'}`, borderRadius: '4px', padding: '24px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '11px', color: '#6a5a45', letterSpacing: '3px', marginBottom: '8px' }}>TU ROL</p>
            <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '26px', fontWeight: '700', color: info?.color ?? '#c8b89a', marginBottom: '12px' }}>
              {info?.label ?? myRole}
            </h3>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '13px', color: '#8a7a65', lineHeight: '1.7' }}>
              {info?.description}
            </p>
          </div>

          {/* Compañeros lobos */}
          {isWolf && wolves.length > 1 && (
            <div style={{ background: 'rgba(13,8,8,0.95)', border: '1px solid #4a2020', borderRadius: '4px', padding: '16px' }}>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '11px', color: '#8a4040', letterSpacing: '3px', marginBottom: '10px' }}>TUS COMPAÑEROS</p>
              {wolves.filter(w => w.id !== currentPlayer.id).map(w => (
                <p key={w.id} style={{ fontFamily: 'Georgia, serif', fontSize: '14px', color: '#c08080', marginBottom: '4px' }}>{w.name}</p>
              ))}
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '11px', color: '#4a2020', marginTop: '8px', letterSpacing: '1px' }}>Solo tú ves esto</p>
            </div>
          )}

          {/* Alcalde */}
          {isMayor && (
            <div style={{ background: 'rgba(13,12,8,0.95)', border: '1px solid #4a3820', borderRadius: '4px', padding: '16px' }}>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '11px', color: '#8a7030', letterSpacing: '3px', marginBottom: '8px' }}>ALCALDE</p>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '13px', color: '#a08040', lineHeight: '1.6' }}>
                Tu voto cuenta doble en las ejecuciones. Si mueres, el pueblo elige a tu sustituto.
              </p>
            </div>
          )}

          {currentPlayer?.is_host && (
            <button
              onClick={startNight}
              style={{ width: '100%', background: 'rgba(20,20,20,0.9)', border: '1px solid #2a2520', borderRadius: '4px', padding: '13px 16px', color: '#7a6a55', fontFamily: 'Georgia, serif', fontSize: '13px', cursor: 'pointer', marginTop: '4px' }}
            >
              Comenzar primera noche
            </button>
          )}
        </div>
      )}
    </div>
  )
}