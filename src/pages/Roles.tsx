import { useState, useRef, useEffect } from 'react'

type Props = { onBack: () => void }

const roles = [
  {
    id: 'torok',
    nombre: 'Torok',
    imagen: '/assets/roles/TOROK.png',
    descripcion: 'Cada noche cazas a un lavianes. Durante el día finges ser uno de ellos. Eres la maldición hecha carne.',
    color: '#c04040',
    glow: 'rgba(192,64,64,0.4)',
    bando: 'MALDICIÓN',
  },
  {
    id: 'alpha',
    nombre: 'Torok Alpha',
    imagen: '/assets/roles/TOROK_ALPHA.png',
    descripcion: 'El primero de tu especie. Una vez por partida puedes infectar a tu víctima en vez de matarla, propagando la maldición de Zapico.',
    color: '#d04040',
    glow: 'rgba(208,64,64,0.5)',
    bando: 'MALDICIÓN',
  },
  {
    id: 'infectado',
    nombre: 'Torok Infectado',
    imagen: '/assets/roles/TOROK_INFECTADO.png',
    descripcion: 'La maldición te ha alcanzado. De día sigues siendo uno de ellos. De noche, cazas con los Toroks.',
    color: '#a03030',
    glow: 'rgba(160,48,48,0.4)',
    bando: 'MALDICIÓN',
  },
  {
    id: 'vieya',
    nombre: 'Vieya Cotilla',
    imagen: '/assets/roles/VIEYA_COTILLA.png',
    descripcion: 'Cada noche descubres la verdadera naturaleza de un jugador. Úsalo con cuidado, o los Toroks irán a por ti.',
    color: '#9080c0',
    glow: 'rgba(144,128,192,0.4)',
    bando: 'PUEBLO',
  },
  {
    id: 'protector',
    nombre: 'Protector',
    imagen: '/assets/roles/PROTECTOR.png',
    descripcion: 'Cada noche proteges a alguien de los Toroks. No puedes proteger a la misma persona dos noches seguidas.',
    color: '#5080a0',
    glow: 'rgba(80,128,160,0.4)',
    bando: 'PUEBLO',
  },
  {
    id: 'cazaor',
    nombre: 'Cazaor',
    imagen: '/assets/roles/CAZAOR.png',
    descripcion: 'Si mueres, antes de caer eres capaz de llevarte a alguien contigo. Que no sea en vano.',
    color: '#a08030',
    glow: 'rgba(160,128,48,0.4)',
    bando: 'PUEBLO',
  },
  {
    id: 'lavianes',
    nombre: 'Lavianes',
    imagen: '/assets/roles/LAVIANES.png',
    descripcion: 'Un aldeano sin poderes especiales. Tu única arma es la deducción y el voto. No la desperdicies.',
    color: '#8a7a65',
    glow: 'rgba(138,122,101,0.4)',
    bando: 'PUEBLO',
  },
  {
    id: 'edil',
    nombre: 'Edil',
    imagen: '/assets/roles/EDIL.png',
    descripcion: 'Lideras Laviana. Tu voto cuenta el doble en las ejecuciones. Si caes, el pueblo deberá elegir a quien te suceda.',
    color: '#c8a840',
    glow: 'rgba(200,168,64,0.4)',
    bando: 'PUEBLO',
  },
]

function useVisible() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return { ref, visible }
}

function RolCard({ rol, index }: { rol: typeof roles[0]; index: number }) {
  const { ref, visible } = useVisible()
  const [hovered, setHovered] = useState(false)

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: hovered ? 'rgba(20,18,14,0.98)' : 'rgba(13,12,10,0.95)',
        border: `1px solid ${hovered ? rol.color + '80' : rol.color + '25'}`,
        borderRadius: '6px',
        overflow: 'hidden',
        cursor: 'default',
        opacity: visible ? 1 : 0,
        transform: visible
          ? hovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)'
          : 'translateY(24px)',
        transition: visible
          ? 'opacity 0.7s ease, transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease'
          : `opacity 0.7s ease ${index * 0.08}s, transform 0.7s ease ${index * 0.08}s`,
        boxShadow: hovered
          ? `0 16px 48px rgba(0,0,0,0.6), 0 0 32px ${rol.glow}`
          : '0 4px 16px rgba(0,0,0,0.3)',
      }}
    >
      {/* Glow de fondo al hacer hover */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at top, ${rol.color}12 0%, transparent 60%)`,
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.4s ease',
        pointerEvents: 'none',
      }} />

      {/* Imagen */}
      <div style={{
        width: '100%',
        aspectRatio: '1/1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 20px 8px',
        position: 'relative',
      }}>
        <img
          src={rol.imagen}
          alt={rol.nombre}
          style={{
            width: '85%',
            height: '85%',
            objectFit: 'contain',
            display: 'block',
            transform: hovered ? 'scale(1.06) translateY(-4px)' : 'scale(1) translateY(0)',
            transition: 'transform 0.4s ease',
            filter: hovered ? `drop-shadow(0 8px 20px ${rol.glow})` : 'none',
          }}
        />
      </div>

      {/* Separador con color del rol */}
      <div style={{
        height: '1px',
        background: `linear-gradient(to right, transparent, ${rol.color}60, transparent)`,
        margin: '0 20px',
        opacity: hovered ? 1 : 0.4,
        transition: 'opacity 0.3s ease',
      }} />

      {/* Contenido */}
      <div style={{ padding: '16px 20px 24px' }}>
        {/* Bando */}
        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize: '9px',
          color: rol.color,
          letterSpacing: '4px',
          marginBottom: '6px',
          opacity: 0.8,
        }}>
          {rol.bando}
        </p>

        {/* Nombre */}
        <h3 style={{
          fontFamily: 'Georgia, serif',
          fontSize: '18px',
          fontWeight: '700',
          color: hovered ? rol.color : '#c8b89a',
          marginBottom: '10px',
          transition: 'color 0.3s ease',
          lineHeight: 1.2,
        }}>
          {rol.nombre}
        </h3>

        {/* Descripción */}
        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize: '12px',
          color: hovered ? '#9a8a78' : '#6a5a48',
          lineHeight: '1.7',
          margin: 0,
          transition: 'color 0.3s ease',
        }}>
          {rol.descripcion}
        </p>
      </div>
    </div>
  )
}

export default function Roles({ onBack }: Props) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#050608',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '24px',
    }}>

      <style>{`
        @media (min-width: 640px) {
          .roles-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ width: '100%', maxWidth: '680px', marginBottom: '48px' }}>
        <button
          onClick={onBack}
          style={{
            background: 'transparent', border: 'none',
            color: '#4a3f30', fontFamily: 'Georgia, serif',
            fontSize: '12px', letterSpacing: '2px',
            cursor: 'pointer', padding: 0, marginBottom: '32px',
            display: 'block',
          }}
        >
          ← VOLVER
        </button>

        <p style={{
          fontFamily: 'Georgia, serif', fontSize: '11px',
          color: '#6a5a45', letterSpacing: '4px', marginBottom: '10px',
        }}>
          LAVIANA · ASTURIAS
        </p>
        <h1 style={{
          fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 7vw, 44px)',
          fontWeight: '700', color: '#c8b89a',
          margin: '0 0 10px 0', letterSpacing: '1px', lineHeight: 1.2,
        }}>
          ¿Quién serás en Laviana?
        </h1>
        <p style={{
          fontFamily: 'Georgia, serif', fontSize: '15px',
          color: '#5a4a38', fontStyle: 'italic', margin: 0,
        }}>
          Cada rol esconde un destino… y un objetivo.
        </p>

        {/* Separador */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          marginTop: '24px',
        }}>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, #2a2018)' }} />
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#5a4830' }} />
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, #2a2018)' }} />
        </div>
      </div>

      {/* Grid de roles */}
      <div
        className="roles-grid"
        style={{
          width: '100%',
          maxWidth: '680px',
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '20px',
          paddingBottom: '64px',
        }}
      >
        {roles.map((rol, i) => (
          <RolCard key={rol.id} rol={rol} index={i} />
        ))}
      </div>
    </div>
  )
}