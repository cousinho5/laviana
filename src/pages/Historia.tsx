import { useState, useRef, useEffect } from 'react'

type Props = { onBack: () => void }

const capitulos = [
  {
    titulo: 'El pueblo olvidado',
    texto: 'En lo profundo de las montañas de Asturias, aislado de cualquier otro asentamiento, se encuentra Laviana. Un pueblo olvidado por el tiempo, rodeado de bosques densos y caminos que nadie recuerda haber trazado. Aquí, el silencio no es paz. Es advertencia.',
    imagen: '/assets/historia/Pueblo.png',
  },
  {
    titulo: 'La Central Lechera',
    texto: 'A las afueras del pueblo se alza una vieja explotación ganadera conocida como Central Lechera Asturiana. Un lugar extraño, fuera de lugar… donde solo hay vacas. Demasiadas. Los aldeanos evitan acercarse. Dicen que por las noches se escuchan ruidos… y algo más.',
    imagen: null,
  },
  {
    titulo: 'Zapico',
    texto: 'El único humano que habita ese lugar es Zapico. Un anciano solitario, apartado del pueblo al cual solo iba a comprar suministros de vez en cuando. Para muchos, un loco. Para otros… algo peor. Pero nadie en Laviana conocía la verdad.',
    imagen: null,
  },
  {
    titulo: 'El origen',
    texto: 'Consumido por una obsesión enfermiza, Zapico dedicó su vida a una idea imposible: crear la criatura perfecta. No una bestia. No un hombre. Algo superior. Durante años, en la oscuridad de la granja, practicó una magia olvidada. Prohibida. Rituales antiguos, susurrados entre sangre y tierra húmeda.',
    imagen: '/assets/historia/Granja.png',
  },
  {
    titulo: 'La transformación',
    texto: 'Hasta que una noche… lo consiguió. El conjuro fue lanzado sobre uno de sus toros. La carne respondió. Huesos quebrándose. Músculos retorciéndose. Una transformación antinatural. Pero no fue el animal el que cambió. Fue él. Sus piernas se deformaron en pezuñas. Su rostro se alargó en una cabeza de toro. Dos cuernos emergieron de su cráneo como una corona maldita.',
    imagen: null,
  },
  {
    titulo: 'El Torok Alpha',
    texto: 'Así nació el primero de su especie: el Torok Alpha. Al amanecer, todo parecía un error. Zapico volvió a ser humano. O eso creía. Pero la noche no olvida. Cuando cae la oscuridad… la transformación regresa. El Torok Alpha camina entre los aldeanos durante el día. Observa. Espera. Y cuando la noche cae… caza.',
    imagen: '/assets/historia/Torok_pueblo.png',
  },
  {
    titulo: 'La propagación',
    texto: 'El poder del Torok Alpha no termina en su propia transformación. Puede corromper a otros. Convertirlos. Extender la maldición. Los nuevos Toroks mantienen su forma humana durante el día… pero al anochecer, pierden el control. Se vuelven violentos. Instintivos. Implacables. Ya no hay distinción entre hombre y bestia.',
    imagen: null,
  },
  {
    titulo: 'El juego comienza',
    texto: 'El pueblo de Laviana ya no es seguro. Nadie sabe quién sigue siendo humano. Cada noche, los Toroks cazan. Cada día, los aldeanos dudan. Acusaciones. Miedo. Errores. Los humanos deben descubrir quién miente… antes de que sea demasiado tarde. Los Toroks deben eliminar a todos… sin ser descubiertos. En Laviana, la verdad no salva. Solo retrasa la muerte.',
    imagen: '/assets/historia/Puente.png',
  },
]

const textoCompleto = capitulos.map(c => `${c.titulo}. ${c.texto}`).join(' ')

function CapituloItem({ cap, index }: { cap: typeof capitulos[0]; index: number }) {
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

  // Capítulo CON imagen — texto encima de la imagen
  if (cap.imagen) {
    return (
      <div
        ref={ref}
        style={{
          position: 'relative',
          width: '100vw',
          marginLeft: '-24px',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}
      >
        {/* Imagen a ancho completo */}
        <img
          src={cap.imagen}
          alt={cap.titulo}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
          }}
        />

        {/* Gradiente encima — oscuro arriba y abajo para el texto */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(10,12,15,0.85) 0%, rgba(10,12,15,0.3) 40%, rgba(10,12,15,0.3) 60%, rgba(10,12,15,0.95) 100%)',
        }} />

        {/* Texto encima */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '28px 24px',
        }}>
          {/* Título arriba */}
          <div>
            <p style={{
              fontFamily: 'Georgia, serif',
              fontSize: '10px',
              color: '#6a5a45',
              letterSpacing: '4px',
              marginBottom: '6px',
            }}>
              {String(index + 1).padStart(2, '0')}
            </p>
            <h2 style={{
              fontFamily: 'Georgia, serif',
              fontSize: '22px',
              fontWeight: '700',
              color: '#c8b89a',
              margin: 0,
              textShadow: '0 2px 12px rgba(0,0,0,0.8)',
            }}>
              {cap.titulo}
            </h2>
          </div>

          {/* Texto abajo */}
          <p style={{
            fontFamily: 'Georgia, serif',
            fontSize: '13px',
            color: '#c8b89a',
            lineHeight: '1.8',
            margin: 0,
            textShadow: '0 1px 8px rgba(0,0,0,0.9)',
          }}>
            {cap.texto}
          </p>
        </div>
      </div>
    )
  }

  // Capítulo SIN imagen — solo texto con padding lateral
  return (
    <div
      ref={ref}
      style={{
        padding: '0 24px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}
    >
      <p style={{
        fontFamily: 'Georgia, serif',
        fontSize: '10px',
        color: '#4a3a28',
        letterSpacing: '4px',
        marginBottom: '6px',
      }}>
        {String(index + 1).padStart(2, '0')}
      </p>
      <h2 style={{
        fontFamily: 'Georgia, serif',
        fontSize: '20px',
        fontWeight: '700',
        color: '#c8b89a',
        marginBottom: '12px',
        letterSpacing: '1px',
      }}>
        {cap.titulo}
      </h2>
      <p style={{
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
        color: '#8a7a65',
        lineHeight: '1.9',
        margin: 0,
      }}>
        {cap.texto}
      </p>
    </div>
  )
}

export default function Historia({ onBack }: Props) {
  const [narrando, setNarrando] = useState(false)

  function toggleNarracion() {
    if (narrando) {
      window.speechSynthesis.cancel()
      setNarrando(false)
      return
    }
    const utterance = new SpeechSynthesisUtterance(textoCompleto)
    utterance.lang = 'es-ES'
    utterance.rate = 0.85
    utterance.pitch = 0.9
    utterance.onend = () => setNarrando(false)
    window.speechSynthesis.speak(utterance)
    setNarrando(true)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0c0f',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      overflow: 'hidden',
    }}>

      {/* Header con padding */}
      <div style={{ width: '100%', maxWidth: '440px', padding: '24px 24px 0' }}>
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
            marginBottom: '24px',
            display: 'block',
          }}
        >
          ← VOLVER
        </button>

        <div style={{ marginBottom: '20px' }}>
          <p style={{
            fontFamily: 'Georgia, serif',
            fontSize: '11px',
            color: '#6a5a45',
            letterSpacing: '3px',
            marginBottom: '6px',
          }}>
            EL ORIGEN DE LA MALDICIÓN
          </p>
          <h1 style={{
            fontFamily: 'Georgia, serif',
            fontSize: '32px',
            fontWeight: '700',
            color: '#c8b89a',
            margin: '0 0 16px 0',
          }}>
            Historia
          </h1>

          {/* Botón narración */}
          <button
            onClick={toggleNarracion}
            style={{
              background: narrando ? 'rgba(42,34,24,0.9)' : 'rgba(20,20,20,0.9)',
              border: `1px solid ${narrando ? '#5a4830' : '#2a2520'}`,
              borderRadius: '4px',
              padding: '11px 16px',
              color: narrando ? '#c8b89a' : '#7a6a55',
              fontFamily: 'Georgia, serif',
              fontSize: '12px',
              letterSpacing: '2px',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            {narrando ? '◼ DETENER NARRACIÓN' : '▶ ESCUCHAR HISTORIA'}
          </button>
        </div>
      </div>

      {/* Capítulos */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        display: 'flex',
        flexDirection: 'column',
        gap: '48px',
        paddingBottom: '80px',
        paddingTop: '8px',
      }}>
        {capitulos.map((cap, i) => (
          <CapituloItem key={i} cap={cap} index={i} />
        ))}
      </div>
    </div>
  )
}