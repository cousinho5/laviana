import { useState, useRef, useEffect } from 'react'

type Props = { onBack: () => void }

function useVisible(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return { ref, visible }
}

function Hero({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 600)
    const t2 = setTimeout(() => setStep(2), 2200)
    const t3 = setTimeout(() => setStep(3), 4000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      background: '#050608',
    }}>
      <style>{`
        @keyframes fogDrift {
          0% { transform: translateX(-5%) scale(1.05); opacity: 0.4; }
          50% { transform: translateX(5%) scale(1.08); opacity: 0.6; }
          100% { transform: translateX(-5%) scale(1.05); opacity: 0.4; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes bloodDrip {
          0% { height: 0; opacity: 0; }
          30% { opacity: 1; }
          100% { height: 60px; opacity: 0.7; }
        }
      `}</style>

      {/* Imagen de fondo con parallax */}
      <div style={{
        position: 'absolute',
        inset: '-10%',
        backgroundImage: 'url(/assets/historia/Pueblo.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'brightness(0.25) saturate(0.6)',
        animation: 'fogDrift 20s ease-in-out infinite',
      }} />

      {/* Niebla overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 20%, rgba(5,6,8,0.7) 70%, rgba(5,6,8,0.95) 100%)',
      }} />

      {/* Volver */}
      <button
        onClick={onBack}
        style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          background: 'transparent',
          border: 'none',
          color: '#4a3f30',
          fontFamily: 'Georgia, serif',
          fontSize: '12px',
          letterSpacing: '2px',
          cursor: 'pointer',
          padding: 0,
          zIndex: 10,
        }}
      >
        ← VOLVER
      </button>

      {/* Contenido hero */}
      <div style={{
        position: 'relative',
        zIndex: 5,
        textAlign: 'center',
        padding: '0 32px',
        maxWidth: '480px',
      }}>
        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize: '11px',
          color: '#6a5a45',
          letterSpacing: '5px',
          marginBottom: '24px',
          opacity: step >= 1 ? 1 : 0,
          transition: 'opacity 1.5s ease',
        }}>
          LAVIANA · ASTURIAS
        </p>

        <h1 style={{
          fontFamily: 'Georgia, serif',
          fontSize: 'clamp(32px, 8vw, 52px)',
          fontWeight: '700',
          color: '#e8d8b8',
          lineHeight: 1.2,
          marginBottom: '24px',
          opacity: step >= 1 ? 1 : 0,
          filter: step >= 1 ? 'blur(0px)' : 'blur(8px)',
          transition: 'opacity 1.8s ease 0.3s, filter 1.8s ease 0.3s',
        }}>
          Laviana era un lugar tranquilo…
        </h1>

        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize: '18px',
          color: '#8a6a50',
          fontStyle: 'italic',
          marginBottom: '48px',
          opacity: step >= 2 ? 1 : 0,
          filter: step >= 2 ? 'blur(0px)' : 'blur(6px)',
          transition: 'opacity 1.5s ease, filter 1.5s ease',
        }}>
          Hasta que algo despertó en la noche.
        </p>

        {/* Indicador de scroll */}
        <div style={{
          opacity: step >= 3 ? 1 : 0,
          transition: 'opacity 1s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}>
          <p style={{
            fontFamily: 'Georgia, serif',
            fontSize: '10px',
            color: '#4a3a28',
            letterSpacing: '3px',
          }}>
            DESCUBRE LO QUE OCURRIÓ
          </p>
          <div style={{
            width: '1px',
            height: '40px',
            background: 'linear-gradient(to bottom, #8a6840, transparent)',
            animation: 'pulse 2s ease-in-out infinite',
          }} />
        </div>
      </div>
    </div>
  )
}

function BloqueImagen({ imagen, children, flip = false }: { imagen: string; children: React.ReactNode; flip?: boolean }) {
  const { ref, visible } = useVisible(0.1)

  return (
    <div ref={ref} style={{ width: '100%', position: 'relative' }}>
      {/* Imagen a ancho completo */}
      <div style={{
        width: '100%',
        aspectRatio: '16/9',
        position: 'relative',
        overflow: 'hidden',
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(1.04)',
        transition: 'opacity 1.2s ease, transform 1.4s ease',
      }}>
        <img
          src={imagen}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            filter: 'brightness(0.75) saturate(0.85)',
          }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: flip
            ? 'linear-gradient(to top, rgba(5,6,8,0.95) 0%, rgba(5,6,8,0.3) 40%, transparent 70%)'
            : 'linear-gradient(to bottom, rgba(5,6,8,0.95) 0%, rgba(5,6,8,0.3) 40%, transparent 70%)',
        }} />
      </div>

      {/* Texto sobre la imagen en zona oscura */}
      <div style={{
        padding: '20px 28px 0',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.9s ease 0.4s, transform 0.9s ease 0.4s',
      }}>
        {children}
      </div>
    </div>
  )
}

function BloqueTexto({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  const { ref, visible } = useVisible(0.2)

  return (
    <div
      ref={ref}
      style={{
        padding: '0 28px',
        position: 'relative',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.8s ease, transform 0.8s ease',
      }}
    >
      {accent && (
        <div style={{
          width: '32px',
          height: '2px',
          background: '#8a2020',
          marginBottom: '16px',
        }} />
      )}
      {children}
    </div>
  )
}

function BloqueCrimax() {
  const { ref, visible } = useVisible(0.1)

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        padding: '60px 28px',
      }}
    >
      {/* Fondo con imagen del Torok */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'url(/assets/historia/Torok_pueblo.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        filter: 'brightness(0.2) saturate(0.5)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 2s ease',
      }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at center, rgba(80,10,10,0.3) 0%, rgba(5,6,8,0.85) 70%)',
      }} />

      <div style={{
        position: 'relative',
        zIndex: 2,
        textAlign: 'center',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 1s ease 0.5s, transform 1s ease 0.5s',
      }}>
        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize: '11px',
          color: '#8a2020',
          letterSpacing: '5px',
          marginBottom: '24px',
        }}>
          EL TOROK ALPHA
        </p>
        <h2 style={{
          fontFamily: 'Georgia, serif',
          fontSize: 'clamp(28px, 7vw, 48px)',
          fontWeight: '700',
          color: '#e8d8b8',
          lineHeight: 1.2,
          marginBottom: '20px',
          textShadow: '0 0 40px rgba(180,40,40,0.4)',
        }}>
          De día, uno de vosotros.
        </h2>
        <h2 style={{
          fontFamily: 'Georgia, serif',
          fontSize: 'clamp(28px, 7vw, 48px)',
          fontWeight: '700',
          color: '#c04040',
          lineHeight: 1.2,
          marginBottom: '32px',
          textShadow: '0 0 40px rgba(180,40,40,0.6)',
        }}>
          De noche… el Torok.
        </h2>
        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize: '15px',
          color: '#8a7a65',
          lineHeight: 1.8,
          maxWidth: '340px',
          margin: '0 auto',
        }}>
          Camina entre los aldeanos. Observa. Espera. Y cuando la oscuridad cae… caza.
        </p>
      </div>
    </div>
  )
}

function BloqueDesconfianza() {
  const { ref, visible } = useVisible(0.15)

  return (
    <div
      ref={ref}
      style={{
        padding: '0 28px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.8s ease, transform 0.8s ease',
      }}
    >
      {/* Siluetas */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '12px',
        marginBottom: '32px',
      }}>
        {[0.4, 0.7, 1, 0.7, 0.4].map((op, i) => (
          <div key={i} style={{
            width: '32px',
            height: '64px',
            borderRadius: '16px 16px 4px 4px',
            background: `rgba(200,184,154,${op * (visible ? 1 : 0)})`,
            transition: `opacity 0.5s ease ${i * 0.15}s`,
            opacity: visible ? 1 : 0,
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              top: '-16px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: `rgba(200,184,154,${op})`,
            }} />
          </div>
        ))}
      </div>

      <h2 style={{
        fontFamily: 'Georgia, serif',
        fontSize: '24px',
        fontWeight: '700',
        color: '#c8b89a',
        textAlign: 'center',
        marginBottom: '12px',
        lineHeight: 1.3,
      }}>
        Ya no puedes confiar en nadie.
      </h2>
      <p style={{
        fontFamily: 'Georgia, serif',
        fontSize: '16px',
        color: '#6a5a48',
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: '0',
      }}>
        Ni siquiera en quien tienes al lado.
      </p>
    </div>
  )
}

function BloqueEleccion({ pregunta, opciones }: { pregunta: string; opciones: string[] }) {
  const { ref, visible } = useVisible(0.2)
  const [elegido, setElegido] = useState<number | null>(null)

  return (
    <div
      ref={ref}
      style={{
        padding: '0 28px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.8s ease, transform 0.8s ease',
      }}
    >
      <div style={{
        background: 'rgba(13,10,8,0.8)',
        border: '1px solid #2a2018',
        borderRadius: '4px',
        padding: '24px',
      }}>
        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize: '13px',
          color: '#8a7a65',
          letterSpacing: '1px',
          marginBottom: '20px',
          fontStyle: 'italic',
        }}>
          {pregunta}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {opciones.map((op, i) => (
            <button
              key={i}
              onClick={() => setElegido(i)}
              style={{
                background: elegido === i ? 'rgba(42,20,10,0.9)' : 'transparent',
                border: `1px solid ${elegido === i ? '#8a2020' : '#2a2018'}`,
                borderRadius: '3px',
                padding: '12px 16px',
                color: elegido === i ? '#c8b89a' : '#6a5a48',
                fontFamily: 'Georgia, serif',
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
              }}
            >
              {op}
            </button>
          ))}
        </div>
        {elegido !== null && (
          <p style={{
            fontFamily: 'Georgia, serif',
            fontSize: '12px',
            color: '#8a2020',
            marginTop: '16px',
            fontStyle: 'italic',
            letterSpacing: '1px',
          }}>
            En Laviana, todas las decisiones tienen un precio.
          </p>
        )}
      </div>
    </div>
  )
}

function BloqueClimax() {
  const { ref, visible } = useVisible(0.1)

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px 28px',
        background: '#050608',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at center, rgba(120,10,10,0.15) 0%, transparent 70%)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 2s ease',
      }} />

      <div style={{
        position: 'relative',
        zIndex: 2,
        textAlign: 'center',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 1s ease 0.3s, transform 1s ease 0.3s',
      }}>
        <div style={{
          width: '1px',
          height: '60px',
          background: 'linear-gradient(to bottom, transparent, #8a2020)',
          margin: '0 auto 32px',
          opacity: visible ? 1 : 0,
          transition: 'opacity 1s ease 0.8s',
        }} />
        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize: '11px',
          color: '#8a2020',
          letterSpacing: '5px',
          marginBottom: '20px',
        }}>
          ESTA NOCHE
        </p>
        <h2 style={{
          fontFamily: 'Georgia, serif',
          fontSize: 'clamp(32px, 9vw, 56px)',
          fontWeight: '700',
          color: '#e8d8b8',
          lineHeight: 1.1,
          marginBottom: '16px',
          textShadow: '0 0 60px rgba(180,40,40,0.3)',
        }}>
          Alguien morirá.
        </h2>
        <div style={{
          width: '1px',
          height: '60px',
          background: 'linear-gradient(to top, transparent, #8a2020)',
          margin: '20px auto 0',
          opacity: visible ? 1 : 0,
          transition: 'opacity 1s ease 1.2s',
        }} />
      </div>
    </div>
  )
}

function BoqueFinal({ onBack }: { onBack: () => void }) {
  const { ref, visible } = useVisible(0.1)

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        padding: '60px 28px',
      }}
    >
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'url(/assets/historia/Puente.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'brightness(0.2) saturate(0.5)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 2s ease',
      }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to bottom, rgba(5,6,8,0.8) 0%, rgba(5,6,8,0.5) 50%, rgba(5,6,8,0.9) 100%)',
      }} />

      <div style={{
        position: 'relative',
        zIndex: 2,
        textAlign: 'center',
        maxWidth: '380px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 1s ease 0.3s, transform 1s ease 0.3s',
      }}>
        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize: '16px',
          color: '#8a7a65',
          fontStyle: 'italic',
          lineHeight: 1.8,
          marginBottom: '12px',
        }}>
          "Laviana ya no es un lugar seguro."
        </p>
        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize: '16px',
          color: '#6a5a48',
          fontStyle: 'italic',
          lineHeight: 1.8,
          marginBottom: '12px',
        }}>
          "La pregunta es…"
        </p>
        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize: '22px',
          fontWeight: '700',
          color: '#c8b89a',
          marginBottom: '48px',
          letterSpacing: '1px',
        }}>
          ¿Sobrevivirás?
        </p>

        <button
          onClick={onBack}
          style={{
            background: 'rgba(42,34,24,0.95)',
            border: '1px solid #8a6840',
            borderRadius: '4px',
            padding: '16px 32px',
            color: '#c8b89a',
            fontFamily: 'Georgia, serif',
            fontSize: '14px',
            letterSpacing: '3px',
            cursor: 'pointer',
            width: '100%',
            maxWidth: '280px',
          }}
        >
          ENTRAR EN LAVIANA
        </button>
      </div>
    </div>
  )
}

const textoNarracion = `
  Laviana era un lugar tranquilo. Hasta que algo despertó en la noche.
  Un pueblo olvidado en las montañas de Asturias, rodeado de bosques densos y caminos que nadie recuerda haber trazado.
  A las afueras, la Central Lechera Asturiana. Demasiadas vacas. Los aldeanos evitan acercarse.
  Zapico, el anciano de la granja. Para muchos, un loco. Para otros, algo peor.
  Consumido por una obsesión, dedicó su vida a crear la criatura perfecta. Rituales antiguos, susurrados entre sangre y tierra húmeda.
  Hasta que una noche lo consiguió. La transformación fue antinatural. Huesos quebrándose. Músculos retorciéndose.
  Así nació el Torok Alpha. De día, uno de vosotros. De noche, caza.
  El pueblo de Laviana ya no es seguro. Esta noche, alguien morirá.
  Laviana ya no es un lugar seguro. La pregunta es: ¿sobrevivirás?
`

export default function Historia({ onBack }: Props) {
  const [narrando, setNarrando] = useState(false)

  function toggleNarracion() {
    if (narrando) {
      window.speechSynthesis.cancel()
      setNarrando(false)
      return
    }
    const utterance = new SpeechSynthesisUtterance(textoNarracion)
    utterance.lang = 'es-ES'
    utterance.rate = 0.8
    utterance.pitch = 0.85
    utterance.onend = () => setNarrando(false)
    window.speechSynthesis.speak(utterance)
    setNarrando(true)
  }

  return (
    <div style={{
      background: '#050608',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>

      {/* Botón narración flotante */}
      <button
        onClick={toggleNarracion}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 100,
          background: narrando ? 'rgba(80,20,20,0.95)' : 'rgba(20,16,12,0.95)',
          border: `1px solid ${narrando ? '#8a2020' : '#3a2e1e'}`,
          borderRadius: '50px',
          padding: '10px 18px',
          color: narrando ? '#e8d0b0' : '#6a5a40',
          fontFamily: 'Georgia, serif',
          fontSize: '11px',
          letterSpacing: '2px',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
        }}
      >
        {narrando ? '◼ DETENER' : '▶ NARRAR'}
      </button>

      {/* HERO */}
      <Hero onBack={onBack} />

      {/* BLOQUE 1 — La calma */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '64px', paddingTop: '80px', paddingBottom: '80px' }}>

        <BloqueImagen imagen="/assets/historia/Pueblo.png">
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '10px', color: '#4a3a28', letterSpacing: '4px', marginBottom: '10px' }}>01 — LA CALMA</p>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: '700', color: '#c8b89a', marginBottom: '12px' }}>El pueblo olvidado</h2>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '14px', color: '#8a7a65', lineHeight: '1.85', margin: 0 }}>
            En lo profundo de las montañas de Asturias se encuentra Laviana. Un pueblo olvidado por el tiempo. Vecinos, rutina, confianza. Todo parecía normal.
          </p>
        </BloqueImagen>

        {/* BLOQUE 2 — El secreto */}
        <BloqueTexto accent>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '10px', color: '#4a3a28', letterSpacing: '4px', marginBottom: '10px' }}>02 — EL SECRETO</p>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '700', color: '#9a8a75', marginBottom: '12px' }}>La Central Lechera</h2>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '14px', color: '#6a5a48', lineHeight: '1.9', marginBottom: '16px' }}>
            A las afueras, una granja. Demasiadas vacas. Los aldeanos evitan acercarse.
          </p>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '16px', color: '#8a7065', lineHeight: '1.7', fontStyle: 'italic' }}>
            "Dicen que por las noches se escuchan ruidos… y algo más."
          </p>
        </BloqueTexto>

        {/* BLOQUE 3 — Zapico */}
        <BloqueTexto>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '10px', color: '#4a3a28', letterSpacing: '4px', marginBottom: '10px' }}>03 — ZAPICO</p>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '700', color: '#9a8a75', marginBottom: '12px' }}>El anciano de la granja</h2>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '14px', color: '#6a5a48', lineHeight: '1.9', marginBottom: '16px' }}>
            Para muchos, un loco. Para otros… algo peor. Pero nadie en Laviana conocía la verdad.
          </p>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '16px', color: '#8a7065', lineHeight: '1.7', fontStyle: 'italic' }}>
            "Consumido por una obsesión enfermiza, dedicó su vida a crear la criatura perfecta."
          </p>
        </BloqueTexto>

        {/* BLOQUE 4 — La granja */}
        <BloqueImagen imagen="/assets/historia/Granja.png" flip>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '10px', color: '#4a3a28', letterSpacing: '4px', marginBottom: '10px' }}>04 — EL CAMBIO</p>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: '700', color: '#c8b89a', marginBottom: '12px' }}>Pero una noche…</h2>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '14px', color: '#8a7a65', lineHeight: '1.85', margin: 0 }}>
            Rituales antiguos, susurrados entre sangre y tierra húmeda. Hasta que una noche… lo consiguió. Algo dejó de ser humano.
          </p>
        </BloqueImagen>

        {/* BLOQUE 5 — El Torok */}
        <BloqueCrimax />

        {/* BLOQUE 6 — La desconfianza */}
        <BloqueDesconfianza />

        {/* BLOQUE 7 — Elección interactiva */}
        <BloqueEleccion
          pregunta="La noche cae sobre Laviana. Escuchas un ruido extraño en la oscuridad. ¿Qué haces?"
          opciones={[
            'Me quedo quieto. No quiero saber.',
            'Despierto a mis vecinos. Juntos estamos a salvo.',
            'Salgo a investigar. Alguien tiene que hacerlo.',
            'Observo en silencio. Necesito información.',
          ]}
        />

        {/* BLOQUE 8 — Climax */}
        <BloqueClimax />

        {/* BLOQUE 9 — Final */}
        <BoqueFinal onBack={onBack} />
      </div>
    </div>
  )
}