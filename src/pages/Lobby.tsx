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

const s = {
  page: { minHeight: '100vh', background: '#0a0c0f', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '24px' },
  label: { fontFamily: 'Georgia, serif', fontSize: '11px', color: '#6a5a45', letterSpacing: '3px', marginBottom: '6px', textAlign: 'center' as const },
  code: { fontFamily: 'Georgia, serif', fontSize: '48px', fontWeight: '700', color: '#c8b89a', letterSpacing: '12px', marginBottom: '4px' },
  subtitle: { fontFamily: 'Georgia, serif', fontSize: '12px', color: '#4a3f30', letterSpacing: '1px', marginBottom: '32px', textAlign: 'center' as const },
  section: { width: '100%', maxWidth: '340px' },
  sectionLabel: { fontFamily: 'Georgia, serif', fontSize: '11px', color: '#6a5a45', letterSpacing: '3px', marginBottom: '12px' },
  playerCard: { background: 'rgba(13,16,21,0.9)', border: '1px solid #2a2520', borderRadius: '4px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' },
  playerName: { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#c8b89a' },
  badge: (color: string) => ({ fontFamily: 'Georgia, serif', fontSize: '10px', color, border: `1px solid ${color}`, borderRadius: '3px', padding: '2px 8px', marginLeft: '6px', opacity: 0.8 }),
  divider: { height: '1px', background: '#1a1815', margin: '16px 0' },
  configBox: { background: 'rgba(13,16,21,0.9)', border: '1px solid #2a2520', borderRadius: '4px', padding: '16px', marginBottom: '12px', display: 'flex', flexDirection: 'column' as const, gap: '16px' },
  configLabel: { fontFamily: 'Georgia, serif', fontSize: '13px', color: '#c8b89a' },
  configDesc: { fontFamily: 'Georgia, serif', fontSize: '11px', color: '#4a3f30', marginTop: '2px' },
  btnSecondary: { background: 'rgba(20,20,20,0.9)', border: '1px solid #2a2520', borderRadius: '4px', padding: '12px 16px', color: '#7a6a55', fontFamily: 'Georgia, serif', fontSize: '13px', cursor: 'pointer', width: '100%', marginBottom: '8px' },
  btnPrimary: (active: boolean) => ({ background: active ? 'rgba(42,34,24,0.9)' : 'rgba(13,16,21,0.5)', border: `1px solid ${active ? '#5a4830' : '#1a1815'}`, borderRadius: '4px', padding: '13px 16px', color: active ? '#c8b89a' : '#3a3530', fontFamily: 'Georgia, serif', fontSize: '14px', cursor: active ? 'pointer' : 'not-allowed', width: '100%' }),
  waiting: { fontFamily: 'Georgia, serif', fontSize: '13px', color: '#4a3f30', textAlign: 'center' as const, letterSpacing: '1px' },
}

export default function Lobby() {
  const { room, players, currentPlayer, setPlayers, setRoom } = useGameStore()
  const [showConfig, setShowConfig] = useState(false)
  const [config, setConfig] = useState<Config>({
    wolves: 2, has_alpha: false, has_seer: false, has_protector: false, has_hunter: false, public_votes: true, reveal_role: true,
  })

  const isHost = currentPlayer?.is_host
  const playerCount = players.length
  const maxWolves = getMaxWolves(playerCount)
  const lavianos = getLavianos(playerCount, config)
  const startable = canStart(playerCount, config)

  useEffect(() => {
    if (!room) return
    supabase.from('players').select().eq('room_id', room.id)
      .then(({ data }) => { if (data) setPlayers(data) })
    const channel = supabase
      .channel(`room-${room.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${room.id}` }, () => {
        supabase.from('players').select().eq('room_id', room.id)
          .then(({ data }) => { if (data) setPlayers(data) })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` }, ({ new: updated }) => {
        setRoom(updated as any)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [room])

  async function saveConfig(newConfig: Config) {
    setConfig(newConfig)
    await supabase.from('rooms').update({ config: newConfig }).eq('id', room!.id)
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
      await supabase.from('players').update({ role: shuffled[i] }).eq('id', players[i].id)
    }
    await supabase.from('rooms').update({ phase: 'mayor_vote' }).eq('id', room.id)
  }

  if (!room) return null

  return (
    <div style={s.page}>
      <p style={s.label}>CÓDIGO DE SALA</p>
      <h2 style={s.code}>{room.code}</h2>
      <p style={s.subtitle}>Comparte este código con los jugadores</p>

      <div style={s.section}>
        <p style={s.sectionLabel}>JUGADORES ({playerCount})</p>

        {players.map((player) => (
          <div key={player.id} style={s.playerCard}>
            <span style={s.playerName}>{player.name}</span>
            <div style={{ display: 'flex' }}>
              {player.is_host && <span style={s.badge('#8a7a65')}>host</span>}
              {player.id === currentPlayer?.id && <span style={s.badge('#5a5045')}>tú</span>}
            </div>
          </div>
        ))}

        {isHost && (
          <>
            <div style={s.divider} />

            <button style={s.btnSecondary} onClick={() => setShowConfig(!showConfig)}>
              {showConfig ? 'Ocultar configuración' : 'Configurar partida'}
            </button>

            {showConfig && (
              <div style={s.configBox}>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={s.configLabel}>Lobos normales</p>
                    <p style={s.configDesc}>Máximo {maxWolves} para {playerCount} jugadores</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={() => saveConfig({ ...config, wolves: Math.max(1, config.wolves - 1) })}
                      style={{ width: '32px', height: '32px', background: 'rgba(20,20,20,0.9)', border: '1px solid #2a2520', borderRadius: '4px', color: '#c8b89a', fontFamily: 'Georgia, serif', fontSize: '18px', cursor: 'pointer' }}
                    >-</button>
                    <span style={{ ...s.configLabel, minWidth: '16px', textAlign: 'center' }}>{config.wolves}</span>
                    <button
                      onClick={() => saveConfig({ ...config, wolves: Math.min(maxWolves, config.wolves + 1) })}
                      style={{ width: '32px', height: '32px', background: 'rgba(20,20,20,0.9)', border: '1px solid #2a2520', borderRadius: '4px', color: '#c8b89a', fontFamily: 'Georgia, serif', fontSize: '18px', cursor: 'pointer' }}
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
                  <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={s.configLabel}>{label}</p>
                      <p style={s.configDesc}>{desc}</p>
                    </div>
                    <div
                      onClick={() => saveConfig({ ...config, [key]: !config[key as keyof Config] })}
                      style={{ width: '44px', height: '24px', borderRadius: '12px', background: config[key as keyof Config] ? '#5a4830' : '#1a1815', border: `1px solid ${config[key as keyof Config] ? '#8a6840' : '#2a2520'}`, cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}
                    >
                      <div style={{ position: 'absolute', top: '3px', left: config[key as keyof Config] ? '22px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: config[key as keyof Config] ? '#c8b89a' : '#3a3530', transition: 'left 0.2s' }} />
                    </div>
                  </div>
                ))}

                <div style={{ borderTop: '1px solid #2a2520', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={s.configDesc}>Lavianos normales</span>
                  <span style={{ ...s.configLabel, color: lavianos < 0 ? '#a05040' : '#c8b89a' }}>{lavianos}</span>
                </div>

                {!startable && playerCount >= 6 && (
                  <p style={{ color: '#a05040', fontSize: '12px', textAlign: 'center', fontFamily: 'Georgia, serif' }}>
                    {lavianos < 0 ? 'Demasiados roles especiales' : 'Configuración inválida'}
                  </p>
                )}
              </div>
            )}

            <button style={s.btnPrimary(startable)} onClick={startGame} disabled={!startable}>
              {playerCount < 6 ? `Faltan ${6 - playerCount} jugadores` : 'Comenzar partida'}
            </button>
          </>
        )}

        {!isHost && (
          <p style={s.waiting}>Esperando al host...</p>
        )}
      </div>
    </div>
  )
}