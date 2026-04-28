import { useState, useRef, useEffect } from 'react'

type Props = { onBack: () => void }

function useVisible(threshold = 0.1) {
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

const lineasParte1 = [
  { texto: 'En lo profundo de las montañas de Asturias, aislado de cualquier otro asentamiento, se encuentra Laviana.', grande: false },
  { texto: 'Un pueblo olvidado por el tiempo, rodeado de bosques densos y caminos que nadie recuerda haber trazado.', grande: false },
  { texto: 'Aquí, el silencio no es paz. Es advertencia.', grande: true },
  { texto: 'A las afueras del pueblo se alza una vieja explotación ganadera conocida como Central Lechera Asturiana.', grande: false },
  { texto: 'Un lugar extraño, fuera de lugar… donde solo hay vacas. Demasiadas.', grande: false },
  { texto: 'Los aldeanos evitan acercarse.', grande: true },
  { texto: 'Dicen que por las noches se escuchan ruidos… y algo más.', grande: false },
  { texto: 'El único humano que habita ese lugar es Zapico.', grande: false },
  { texto: 'Un anciano solitario, apartado del pueblo al cual solo iba a comprar suministros de vez en cuando.', grande: false },
  { texto: 'Para muchos, un loco. Para otros… algo peor.', grande: true },
  { texto: 'Pero nadie en Laviana conocía la verdad.', grande: false },
  { texto: 'Consumido por una obsesión enfermiza, Zapico dedicó su vida a una idea imposible:', grande: false },
  { texto: 'crear la criatura perfecta.', grande: true },
  { texto: 'No una bestia.', grande: false },
  { texto: 'No un hombre.', grande: false },
  { texto: 'Algo superior.', grande: true },
  { texto: 'Durante años, en la oscuridad de la granja, practicó una magia olvidada. Prohibida.', grande: false },
  { texto: 'Rituales antiguos, susurrados entre sangre y tierra húmeda.', grande: false },
  { texto: 'Hasta que una noche… lo consiguió.', grande: true },
  { texto: 'El conjuro fue lanzado sobre uno de sus toros.', grande: false },
  { texto: 'La carne respondió.', grande: false },
  { texto: 'Huesos quebrándose.', grande: false },
  { texto: 'Músculos retorciéndose.', grande: false },
  { texto: 'Una transformación antinatural.', grande: false },
  { texto: 'Pero no fue el animal el que cambió.', grande: false },
  { texto: 'Fue él.', grande: true },
  { texto: 'Sus piernas se deformaron en pezuñas.', grande: false },
  { texto: 'Su rostro se alargó en una cabeza de toro.', grande: false },
  { texto: 'Dos cuernos emergieron de su cráneo como una corona maldita.', grande: false },
  { texto: 'Así nació el primero de su especie:', grande: true },
]

const lineasParte2 = [
  { texto: 'Al amanecer, todo parecía un error.', grande: false },
  { texto: 'Zapico volvió a ser humano.', grande: false },
  { texto: 'O eso creía.', grande: true },
  { texto: 'Pero la noche no olvida.', grande: false },
  { texto: 'Cuando cae la oscuridad… la transformación regresa.', grande: true },
  { texto: 'El poder del Torok Alpha no termina en su propia transformación.', grande: false },
  { texto: 'Puede corromper a otros.', grande: false },
  { texto: 'Convertirlos.', grande: false },
  { texto: 'Extender la maldición.', grande: true },
  { texto: 'Los nuevos Toroks mantienen su forma humana durante el día…', grande: false },
  { texto: 'pero al anochecer, pierden el control.', grande: false },
  { texto: 'Se vuelven violentos.', grande: false },
  { texto: 'Instintivos.', grande: false },
  { texto: 'Implacables.', grande: false },
  { texto: 'Ya no hay distinción entre hombre y bestia.', grande: true },
]

function Linea({ texto, grande, delay }: { texto: string; grande: boolean; delay: number }) {
  const { ref, visible } = useVisible(0.3)
  return (
    <p
      ref={ref}
      style={{
        fontFamily: 'Georgia, serif',
        fontSize: grande ? 'clamp(20px, 5vw, 28px)' : '15px',
        color: grande ? '#c8b89a' : '#6a5a48',
        lineHeight: grande ? 1.3 : 1.9,
        margin: 0,
        fontWeight: grande ? '700' : '400',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 0.9s ease ${delay}s, transform 0.9s ease ${delay}s`,
      }}
    >
      {texto}
    </p>
  )
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
      position: 'relative', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes fogDrift {
          0% { transform: translateX(-3%) scale(1.06); }
          50% { transform: translateX(3%) scale(1.1); }
          100% { transform: translateX(-3%) scale(1.06); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>

      <div style={{
        position: 'absolute', inset: '-10%',
        backgroundImage: 'url(/assets/historia/Pueblo.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'brightness(0.55) saturate(0.8)',
        animation: 'fogDrift 20s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, rgba(5,6,8,0.3) 0%, rgba(5,6,8,0.75) 80%, rgba(5,6,8,1) 100%)',
      }} />

      <button onClick={onBack} style={{
        position: 'absolute', top: '24px', left: '24px',
        background: 'transparent', border: 'none', color: '#4a3f30',
        fontFamily: 'Georgia, serif', fontSize: '12px', letterSpacing: '2px',
        cursor: 'pointer', padding: 0, zIndex: 10,
      }}>← VOLVER</button>

      <div style={{ position: 'relative', zIndex: 5, textAlign: 'center', padding: '0 32px', maxWidth: '480px' }}>
        <p style={{
          fontFamily: 'Georgia, serif', fontSize: '11px', color: '#6a5a45',
          letterSpacing: '5px', marginBottom: '24px',
          opacity: step >= 1 ? 1 : 0, transition: 'opacity 1.5s ease',
        }}>LAVIANA · ASTURIAS</p>

        <h1 style={{
          fontFamily: 'Georgia, serif', fontSize: 'clamp(32px, 8vw, 52px)',
          fontWeight: '700', color: '#e8d8b8', lineHeight: 1.2, marginBottom: '24px',
          opacity: step >= 1 ? 1 : 0,
          filter: step >= 1 ? 'blur(0px)' : 'blur(8px)',
          transition: 'opacity 1.8s ease 0.3s, filter 1.8s ease 0.3s',
        }}>Laviana era un lugar tranquilo…</h1>

        <p style={{
          fontFamily: 'Georgia, serif', fontSize: '18px', color: '#8a6a50',
          fontStyle: 'italic', marginBottom: '48px',
          opacity: step >= 2 ? 1 : 0,
          filter: step >= 2 ? 'blur(0px)' : 'blur(6px)',
          transition: 'opacity 1.5s ease, filter 1.5s ease',
        }}>Hasta que algo despertó en la noche.</p>

        <div style={{ opacity: step >= 3 ? 1 : 0, transition: 'opacity 1s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '10px', color: '#4a3a28', letterSpacing: '3px' }}>DESCUBRE LO QUE OCURRIÓ</p>
          <div style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom, #8a6840, transparent)', animation: 'pulse 2s ease-in-out infinite' }} />
        </div>
      </div>
    </div>
  )
}

function BloqueTorok() {
  const { ref, visible } = useVisible(0.08)

  return (
    <div ref={ref} style={{
      position: 'relative', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
      overflow: 'hidden', padding: '60px 28px',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/assets/historia/Torok_pueblo.png)',
        backgroundSize: 'cover', backgroundPosition: 'center top',
        filter: 'brightness(0.5) saturate(0.7)',
        opacity: visible ? 1 : 0, transition: 'opacity 2s ease',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, rgba(100,10,10,0.5) 0%, rgba(5,6,8,0.6) 60%, rgba(5,6,8,0.95) 100%)',
      }} />

      <div style={{
        position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '420px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 1s ease 0.6s, transform 1s ease 0.6s',
      }}>
        <p style={{
          fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 8vw, 48px)',
          fontWeight: '700', color: '#c04040', lineHeight: 1.1,
          marginBottom: '32px', letterSpacing: '2px',
          textShadow: '0 0 60px rgba(180,40,40,0.8)',
        }}>EL TOROK ALPHA</p>

        <h2 style={{
          fontFamily: 'Georgia, serif', fontSize: 'clamp(22px, 5vw, 34px)',
          fontWeight: '700', color: '#e8d8b8', lineHeight: 1.2, marginBottom: '12px',
          textShadow: '0 0 40px rgba(180,40,40,0.4)',
        }}>De día, uno de vosotros.</h2>
        <h2 style={{
          fontFamily: 'Georgia, serif', fontSize: 'clamp(22px, 5vw, 34px)',
          fontWeight: '700', color: '#c04040', lineHeight: 1.2, marginBottom: '28px',
          textShadow: '0 0 60px rgba(180,40,40,0.7)',
        }}>De noche… el Torok.</h2>
        <p style={{
          fontFamily: 'Georgia, serif', fontSize: '15px',
          color: '#8a7a65', lineHeight: 1.8,
        }}>
          Camina entre vosotros. Observa. Espera. Y cuando la oscuridad cae… caza sin piedad.
        </p>
      </div>
    </div>
  )
}

function BloqueClimax() {
  const { ref, visible } = useVisible(0.1)

  return (
    <div ref={ref} style={{
      position: 'relative', minHeight: '70vh',
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
      padding: '60px 28px', background: '#030404', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, rgba(120,10,10,0.2) 0%, transparent 70%)',
        opacity: visible ? 1 : 0, transition: 'opacity 2s ease',
      }} />
      <div style={{
        position: 'relative', zIndex: 2, textAlign: 'center',
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 1s ease 0.3s, transform 1s ease 0.3s',
      }}>
        <div style={{ width: '1px', height: '80px', background: 'linear-gradient(to bottom, transparent, #8a2020)', margin: '0 auto 40px' }} />
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '11px', color: '#8a2020', letterSpacing: '6px', marginBottom: '24px' }}>ESTA NOCHE</p>
        <h2 style={{
          fontFamily: 'Georgia, serif', fontSize: 'clamp(36px, 10vw, 64px)',
          fontWeight: '700', color: '#e8d8b8', lineHeight: 1.1,
          textShadow: '0 0 80px rgba(180,40,40,0.4)',
        }}>Alguien morirá.</h2>
        <div style={{ width: '1px', height: '80px', background: 'linear-gradient(to top, transparent, #8a2020)', margin: '32px auto 0' }} />
      </div>
    </div>
  )
}

function BloqueFinal({ onBack }: { onBack: () => void }) {
  const { ref, visible } = useVisible(0.1)

  return (
    <div ref={ref} style={{
      minHeight: '100vh', background: '#050608',
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
      padding: '60px 28px',
    }}>
      <div style={{
        textAlign: 'center', maxWidth: '380px',
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 1s ease 0.3s, transform 1s ease 0.3s',
      }}>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '17px', color: '#6a5a48', fontStyle: 'italic', lineHeight: 1.8, marginBottom: '8px' }}>
          "Laviana ya no es un lugar seguro."
        </p>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '17px', color: '#5a4a38', fontStyle: 'italic', lineHeight: 1.8, marginBottom: '16px' }}>
          "La pregunta es…"
        </p>
        <h2 style={{
          fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 7vw, 44px)',
          fontWeight: '700', color: '#c8b89a', marginBottom: '48px',
        }}>¿Sobrevivirás?</h2>

        <button onClick={onBack} style={{
          background: 'rgba(42,34,24,0.95)', border: '1px solid #8a6840',
          borderRadius: '4px', padding: '16px 32px', color: '#c8b89a',
          fontFamily: 'Georgia, serif', fontSize: '13px', letterSpacing: '3px',
          cursor: 'pointer', width: '100%', maxWidth: '280px',
        }}>ENTRAR EN LAVIANA</button>
      </div>
    </div>
  )
}

const textoNarracion = `Laviana era un lugar tranquilo. Hasta que algo despertó en la noche. En lo profundo de las montañas de Asturias, aislado de cualquier otro asentamiento, se encuentra Laviana. Un pueblo olvidado por el tiempo. Aquí, el silencio no es paz. Es advertencia. A las afueras, la Central Lechera Asturiana. Un lugar extraño. Demasiadas vacas. Los aldeanos evitan acercarse. El único humano que habita ese lugar es Zapico. Para muchos, un loco. Para otros, algo peor. Consumido por una obsesión, dedicó su vida a crear la criatura perfecta. No una bestia. No un hombre. Algo superior. Hasta que una noche lo consiguió. Fue él. Así nació el primero de su especie: el Torok Alpha. De día, uno de vosotros. De noche, el Torok. Al amanecer, todo parecía un error. Pero la noche no olvida. Puede corromper a otros. Extender la maldición. Ya no hay distinción entre hombre y bestia. Esta noche, alguien morirá. Laviana ya no es un lugar seguro. ¿Sobrevivirás?`

export default function Historia({ onBack }: Props) {
  const [narrando, setNarrando] = useState(false)
const audioRef = useRef<HTMLAudioElement | null>(null)

function toggleNarracion() {
  if (narrando) {
    audioRef.current?.pause()
    if (audioRef.current) audioRef.current.currentTime = 0
    setNarrando(false)
    return
  }
  const audio = new Audio('/assets/historia/historia_narrada.mp3')
  audioRef.current = audio
  audio.play()
  audio.onended = () => setNarrando(false)
  setNarrando(true)
}

  return (
    <div style={{ background: '#050608', minHeight: '100vh', overflow: 'hidden' }}>

      {/* Botón narración flotante */}
      <button onClick={toggleNarracion} style={{
        position: 'fixed', bottom: '24px', right: '24px', zIndex: 100,
        background: narrando ? 'rgba(80,20,20,0.95)' : 'rgba(20,16,12,0.95)',
        border: `1px solid ${narrando ? '#8a2020' : '#3a2e1e'}`,
        borderRadius: '50px', padding: '10px 20px',
        color: narrando ? '#e8d0b0' : '#6a5a40',
        fontFamily: 'Georgia, serif', fontSize: '11px', letterSpacing: '2px',
        cursor: 'pointer', backdropFilter: 'blur(8px)',
      }}>
        {narrando ? '◼ DETENER' : '▶ NARRAR'}
      </button>

      {/* HERO */}
      <Hero onBack={onBack} />

      {/* PARTE 1 — Narración línea a línea */}
      <div style={{
        padding: '80px 32px',
        display: 'flex', flexDirection: 'column', gap: '28px',
        maxWidth: '520px', margin: '0 auto',
      }}>
        {lineasParte1.map((linea, i) => (
          <Linea key={i} texto={linea.texto} grande={linea.grande} delay={0} />
        ))}
      </div>

      {/* BLOQUE TOROK ALPHA */}
      <BloqueTorok />

      {/* PARTE 2 — Narración continuada */}
      <div style={{
        padding: '80px 32px',
        display: 'flex', flexDirection: 'column', gap: '28px',
        maxWidth: '520px', margin: '0 auto',
      }}>
        {lineasParte2.map((linea, i) => (
          <Linea key={i} texto={linea.texto} grande={linea.grande} delay={0} />
        ))}
      </div>

      {/* CLIMAX */}
      <BloqueClimax />

      {/* FINAL */}
      <BloqueFinal onBack={onBack} />
    </div>
  )
}