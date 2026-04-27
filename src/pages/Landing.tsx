import { useEffect, useState } from 'react'
import type { AppPage } from '../App'

type Props = {
  onNavigate: (page: AppPage) => void
}

export default function Landing({ onNavigate }: Props) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="landing-bg" style={{
      minHeight: '100vh',
      background: '#0a0c0f',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
      backgroundImage: 'url(/assets/fondo_inicio.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>

{/* Overlay */}
<div style={{
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(to bottom, rgba(10,12,15,0.2) 0%, rgba(10,12,15,0.6) 35%, rgba(10,12,15,0.6) 65%, rgba(10,12,15,0.2) 100%)',
  zIndex: 1,
}} />

      <style>{`
        @keyframes moonRise {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 0.9; }
        }
        @keyframes moonGlow {
          0%, 100% { box-shadow: 0 0 30px 8px rgba(232,224,200,0.15); }
          50% { box-shadow: 0 0 50px 16px rgba(232,224,200,0.25); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.7; }
        }
        @keyframes fogRise {
          0%, 100% { transform: translateY(0); opacity: 0.7; }
          50% { transform: translateY(-8px); opacity: 0.9; }
        }
        .star { animation: twinkle var(--dur) ease-in-out infinite; }
        .btn-landing {
          width: 100%;
          border-radius: 4px;
          padding: 14px 16px;
          font-family: Georgia, serif;
          font-size: 14px;
          letter-spacing: 3px;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .btn-landing:hover { opacity: 0.8; }
        @media (max-width: 768px) {
        .landing-bg {
       background-image: url(/assets/fondo_inicio_movil.png) !important;
  }
}
        
      `}</style>

      {/* Contenido */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: '340px',
      }}>

        {/* Título */}
        <div style={{
          animation: show ? 'fadeUp 1.2s ease 0.3s forwards' : 'none',
          opacity: 0,
          textAlign: 'center',
          marginBottom: '8px',
        }}>
          <h1 style={{
            fontFamily: 'Georgia, serif',
            fontSize: 'clamp(38px, 12vw, 64px)',
            fontWeight: '700',
            color: '#c8b89a',
            letterSpacing: '12px',
            margin: 0,
            textShadow: '0 2px 20px rgba(0,0,0,0.6)',
          }}>
            LAVIANA
          </h1>
        </div>

        {/* Subtítulo */}
        <div style={{
          animation: show ? 'fadeUp 1.2s ease 0.8s forwards' : 'none',
          opacity: 0,
          textAlign: 'center',
          marginBottom: '8px',
        }}>
          <p style={{
            fontFamily: 'Georgia, serif',
            fontSize: '11px',
            color: '#8a7a60',
            letterSpacing: '3px',
            margin: 0,
            textShadow: '0 1px 8px rgba(0,0,0,0.8)',
          }}>
            ALGO CAMINA EN LA NOCHE
          </p>
        </div>

        {/* Separador */}
        <div style={{
          animation: show ? 'fadeUp 1.2s ease 1s forwards' : 'none',
          opacity: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '56px',
          width: '100%',
          justifyContent: 'center',
        }}>
          <div style={{ height: '1px', width: '70px', background: '#2a2520' }} />
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#6a5a45' }} />
          <div style={{ height: '1px', width: '70px', background: '#2a2520' }} />
        </div>

        {/* Botones */}
        <div style={{
          animation: show ? 'fadeUp 1.2s ease 1.4s forwards' : 'none',
          opacity: 0,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <button
            className="btn-landing"
            onClick={() => onNavigate('home')}
            style={{
              background: 'rgba(42,34,24,0.9)',
              border: '1px solid #5a4830',
              color: '#c8b89a',
            }}
          >
            JUGAR
          </button>

          <button
            className="btn-landing"
            onClick={() => onNavigate('roles')}
            style={{
              background: 'rgba(20,20,20,0.9)',
              border: '1px solid #2a2520',
              color: '#7a6a55',
            }}
          >
            ROLES
          </button>

          <button
            className="btn-landing"
            onClick={() => onNavigate('historia')}
            style={{
              background: 'rgba(20,20,20,0.9)',
              border: '1px solid #2a2520',
              color: '#7a6a55',
            }}
          >
            HISTORIA
          </button>
        </div>
      </div>
    </div>
  )
}