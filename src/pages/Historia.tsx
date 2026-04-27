type Props = { onBack: () => void }

const capitulos = [
  {
    titulo: 'El pueblo olvidado',
    texto: 'En lo profundo de las montañas de Asturias, aislado de cualquier otro asentamiento, se encuentra Laviana. Un pueblo olvidado por el tiempo, rodeado de bosques densos y caminos que nadie recuerda haber trazado. Aquí, el silencio no es paz. Es advertencia.',
  },
  {
    titulo: 'La Central Lechera',
    texto: 'A las afueras del pueblo se alza una vieja explotación ganadera conocida como Central Lechera Asturiana. Un lugar extraño, fuera de lugar… donde solo hay vacas. Demasiadas. Los aldeanos evitan acercarse. Dicen que por las noches se escuchan ruidos… y algo más.',
  },
  {
    titulo: 'Zapico',
    texto: 'El único humano que habita ese lugar es Zapico. Un anciano solitario, apartado del pueblo al cual solo iba a comprar suministros de vez en cuando. Para muchos, un loco. Para otros… algo peor. Pero nadie en Laviana conocía la verdad.',
  },
  {
    titulo: 'El origen',
    texto: 'Consumido por una obsesión enfermiza, Zapico dedicó su vida a una idea imposible: crear la criatura perfecta. No una bestia. No un hombre. Algo superior. Durante años, en la oscuridad de la granja, practicó una magia olvidada. Prohibida. Rituales antiguos, susurrados entre sangre y tierra húmeda.',
  },
  {
    titulo: 'La transformación',
    texto: 'Hasta que una noche… lo consiguió. El conjuro fue lanzado sobre uno de sus toros. La carne respondió. Huesos quebrándose. Músculos retorciéndose. Una transformación antinatural. Pero no fue el animal el que cambió. Fue él. Sus piernas se deformaron en pezuñas. Su rostro se alargó en una cabeza de toro. Dos cuernos emergieron de su cráneo como una corona maldita.',
  },
  {
    titulo: 'El Torok Alpha',
    texto: 'Así nació el primero de su especie: el Torok Alpha. Al amanecer, todo parecía un error. Zapico volvió a ser humano. O eso creía. Pero la noche no olvida. Cuando cae la oscuridad… la transformación regresa. El Torok Alpha camina entre los aldeanos durante el día. Observa. Espera. Y cuando la noche cae… caza.',
  },
  {
    titulo: 'La propagación',
    texto: 'El poder del Torok Alpha no termina en su propia transformación. Puede corromper a otros. Convertirlos. Extender la maldición. Los nuevos Toroks mantienen su forma humana durante el día… pero al anochecer, pierden el control. Se vuelven violentos. Instintivos. Implacables. Ya no hay distinción entre hombre y bestia.',
  },
  {
    titulo: 'El juego comienza',
    texto: 'El pueblo de Laviana ya no es seguro. Nadie sabe quién sigue siendo humano. Cada noche, los Toroks cazan. Cada día, los aldeanos dudan. Acusaciones. Miedo. Errores. Los humanos deben descubrir quién miente… antes de que sea demasiado tarde. Los Toroks deben eliminar a todos… sin ser descubiertos. En Laviana, la verdad no salva. Solo retrasa la muerte.',
  },
]

export default function Historia({ onBack }: Props) {
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
      `}</style>

      {/* Header */}
      <div style={{ width: '100%', maxWidth: '340px', marginBottom: '32px' }}>
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
          }}
        >
          ← VOLVER
        </button>
        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize: '11px',
          color: '#6a5a45',
          letterSpacing: '3px',
          marginBottom: '8px',
        }}>
          EL ORIGEN DE LA MALDICIÓN
        </p>
        <h1 style={{
          fontFamily: 'Georgia, serif',
          fontSize: '32px',
          fontWeight: '700',
          color: '#c8b89a',
          margin: 0,
        }}>
          Historia
        </h1>
      </div>

      {/* Capítulos */}
      <div style={{
        width: '100%',
        maxWidth: '340px',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
        paddingBottom: '64px',
      }}>
        {capitulos.map((cap, i) => (
          <div
            key={i}
            style={{
              animation: `fadeUp 0.6s ease ${i * 0.1}s forwards`,
              opacity: 0,
            }}
          >
            <p style={{
              fontFamily: 'Georgia, serif',
              fontSize: '11px',
              color: '#6a5a45',
              letterSpacing: '3px',
              marginBottom: '8px',
            }}>
              {cap.titulo.toUpperCase()}
            </p>
            <p style={{
              fontFamily: 'Georgia, serif',
              fontSize: '14px',
              color: '#8a7a65',
              lineHeight: '1.8',
              margin: 0,
            }}>
              {cap.texto}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}