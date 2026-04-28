type Props = { onBack: () => void }

const roles = [
  {
    id: 'torok',
    nombre: 'Torok',
    imagen: '/assets/roles/TOROK.png',
    descripcion: 'Cada noche cazas a un lavianes. Durante el día finges ser uno de ellos. Eres la maldición hecha carne.',
    color: '#c04040',
  },
  {
    id: 'alpha',
    nombre: 'Torok Alpha',
    imagen: '/assets/roles/TOROK_ALPHA.png',
    descripcion: 'El primero de tu especie. Una vez por partida puedes infectar a tu víctima en vez de matarla, propagando la maldición de Zapico.',
    color: '#d04040',
  },
  {
    id: 'infectado',
    nombre: 'Torok Infectado',
    imagen: '/assets/roles/TOROK_INFECTADO.png',
    descripcion: 'La maldición te ha alcanzado. De día sigues siendo uno de ellos. De noche, cazas con los Toroks.',
    color: '#a03030',
  },
  {
    id: 'vieya',
    nombre: 'Vieya Cotilla',
    imagen: '/assets/roles/VIEYA_COTILLA.png',
    descripcion: 'Cada noche descubres la verdadera naturaleza de un jugador. Úsalo con cuidado, o los Toroks irán a por ti.',
    color: '#9080c0',
  },
  {
    id: 'protector',
    nombre: 'Protector',
    imagen: '/assets/roles/PROTECTOR.png',
    descripcion: 'Cada noche proteges a alguien de los Toroks. No puedes proteger a la misma persona dos noches seguidas.',
    color: '#5080a0',
  },
  {
    id: 'cazaor',
    nombre: 'Cazaor',
    imagen: '/assets/roles/CAZAOR.png',
    descripcion: 'Si mueres, antes de caer eres capaz de llevarte a alguien contigo. Que no sea en vano.',
    color: '#a08030',
  },
  {
    id: 'lavianes',
    nombre: 'Lavianes',
    imagen: '/assets/roles/LAVIANES.png',
    descripcion: 'Un aldeano sin poderes especiales. Tu única arma es la deducción y el voto. No la desperdicies.',
    color: '#8a7a65',
  },
  {
    id: 'edil',
    nombre: 'Edil',
    imagen: '/assets/roles/EDIL.png',
    descripcion: 'Lideras Laviana. Tu voto cuenta el doble en las ejecuciones. Si caes, el pueblo deberá elegir a quien te suceda.',
    color: '#c8a840',
  },
]

export default function Roles({ onBack }: Props) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0c0f',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '24px',
    }}>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .rol-card {
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(13,16,21,0.9);
          border-radius: 4px;
          overflow: hidden;
          padding: 12px;
          opacity: 0;
        }
        .rol-card:hover {
          background: rgba(20,18,14,0.95);
        }
      `}</style>

      {/* Header */}
      <div style={{ width: '100%', maxWidth: '400px', marginBottom: '28px' }}>
        <button
          onClick={onBack}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#4a3f30',
            fontFamily: 'Georgia, serif',
            fontSize: '12px',
            letterSpacing: '2px',
            cursor: 'pointer',
            padding: 0,
            marginBottom: '20px',
            display: 'block',
          }}
        >
          ← VOLVER
        </button>
        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize: '11px',
          color: '#6a5a45',
          letterSpacing: '3px',
          marginBottom: '6px',
          margin: '0 0 6px 0',
        }}>
          LOS HABITANTES DE LAVIANA
        </p>
        <h1 style={{
          fontFamily: 'Georgia, serif',
          fontSize: '32px',
          fontWeight: '700',
          color: '#c8b89a',
          margin: 0,
        }}>
          Roles
        </h1>
      </div>

      {/* Lista */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        paddingBottom: '48px',
      }}>
        {roles.map((rol, i) => (
          <div
            key={rol.id}
            className="rol-card"
            style={{
              border: `1px solid ${rol.color}33`,
              animation: `fadeUp 0.5s ease ${i * 0.07}s forwards`,
            }}
          >
            {/* Imagen */}
            <div style={{
              width: '80px',
             minWidth: '80px',
              height: '82px',
              borderRadius: '3px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <img
                src={rol.imagen}
                alt={rol.nombre}
                style={{
                  height: '100%',
                  width: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>

            {/* Texto */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontFamily: 'Georgia, serif',
                fontSize: '10px',
                color: rol.color,
                letterSpacing: '2px',
                margin: '0 0 4px 0',
              }}>
                {rol.nombre.toUpperCase()}
              </p>
              <p style={{
                fontFamily: 'Georgia, serif',
                fontSize: '12px',
                color: '#6a5a45',
                lineHeight: '1.6',
                margin: 0,
              }}>
                {rol.descripcion}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}