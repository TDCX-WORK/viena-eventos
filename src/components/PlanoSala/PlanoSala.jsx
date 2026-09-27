import styles from './PlanoSala.module.css'
import {
  PX, X0, Y0, FONDO, ANCHO_TOTAL, ALTURA, SALAS, VENTANAS, metros,
} from '../../lib/planos'

/* ────────────────────────────────────────────────────────────────────
   PLANO DE LA SALA

   Dibujo propio a partir del plano acotado de la arquitecta (AutoCAD,
   2016). No se incrusta aquel PDF: pesa, no se puede colorear y no
   escala bien en móvil. Aquí solo se usan sus medidas, que viven en
   lib/planos.js.

   LO QUE EL DIBUJO AFIRMA, y que por tanto tiene que ser cierto: las
   dimensiones, dónde están las ventanas, dónde está la pantalla fija y
   por dónde separa el panel móvil. Nada más.

   NO se dibuja el mobiliario a propósito. Colocar mesas y sillas
   obligaría a inventarse una distribución que nadie ha validado, y un
   cliente que cuente las sillas daría por buena una promesa que no
   hemos hecho. Los aforos ya salen en las tarjetas de montajes.

   LAS TRES SALAS SE DIBUJAN SOBRE LA MISMA HUELLA y a la misma escala:
   al cambiar de sala se ve encoger la activa y aparecer la otra en
   gris. Esa relación es justo lo que no se entiende hoy mirando tres
   fichas sueltas.

   SI SE AÑADE UNA SALA con otro slug, el componente devuelve null y la
   página sigue funcionando sin plano.
   ──────────────────────────────────────────────────────────────────── */

const ancho = (m) => m * PX
const ejeX = (u) => X0 + u * PX
const ejeY = (v) => Y0 + v * PX

export default function PlanoSala({ sala }) {
  const geo = SALAS[sala?.slug]
  if (!geo) return null

  const x = ejeX(geo.u0)
  const w = ancho(geo.ancho)
  const h = ancho(FONDO)
  const xPanel = ejeX(5.70)

  /* Alternativa textual del dibujo. Un lector de pantalla no ve el
     SVG, así que la misma información va escrita. */
  const descripcion = [
    `Planta rectangular de ${metros(geo.ancho)} por ${metros(FONDO)} metros`,
    geo.ventanas ? 'con dos ventanas en la pared izquierda' : 'sin ventanas al exterior',
    geo.unida
      ? 'formada por la Sala Viena y la Sala Capellanes con el panel móvil retirado'
      : 'separada de la sala contigua por un panel móvil',
  ].join(', ') + '.'

  return (
    <figure className={styles.plano}>
      <svg
        className={styles.dibujo}
        viewBox={`0 0 ${X0 + ancho(ANCHO_TOTAL) + 24} ${Y0 + h + 18}`}
        role="img"
        aria-labelledby={`plano-t-${sala.slug} plano-d-${sala.slug}`}
      >
        <title id={`plano-t-${sala.slug}`}>Plano de {sala.name}</title>
        <desc id={`plano-d-${sala.slug}`}>{descripcion}</desc>

        {/* Huella completa. Queda de fondo siempre, para que se vea qué
            parte del conjunto es esta sala. */}
        <rect
          x={X0} y={Y0} width={ancho(ANCHO_TOTAL)} height={h} rx="6"
          className={styles.huella}
        />

        {/* La sala activa */}
        <rect x={x} y={Y0} width={w} height={h} rx="6" className={styles.sala} />

        {/* Nombre de la sala contigua, en gris, solo cuando no está unida */}
        {!geo.unida && (
          <text
            x={sala.slug === 'viena' ? ejeX(5.70) + ancho(4.28) / 2 : ejeX(2.85)}
            y={Y0 + h / 2 + 4}
            textAnchor="middle"
            className={styles.contigua}
          >
            {sala.slug === 'viena' ? 'Capellanes' : 'Viena'}
          </text>
        )}

        {/* Ventanas. Van montadas sobre el muro, medio dentro medio
            fuera, que es como se marcan en un plano. */}
        {geo.ventanas && VENTANAS.map((vt, i) => (
          <rect
            key={i}
            x={X0 - 3} y={ejeY(vt.v) + 6}
            width="6" height={ancho(vt.alto) - 12} rx="2"
            className={styles.ventana}
          />
        ))}

        {/* Armario empotrado, esquina superior izquierda */}
        {geo.armario && (
          <>
            <rect
              x={X0 + 5} y={Y0 + 5} width={ancho(1.5)} height={ancho(0.6)}
              rx="3" className={styles.armario}
            />
            <text
              x={X0 + 5 + ancho(1.5) / 2} y={Y0 + 5 + ancho(0.6) / 2 + 4}
              textAnchor="middle" className={styles.microTexto}
            >
              Armario
            </text>
          </>
        )}

        {/* Pantallas fijas: la de Viena en la pared del fondo, la de
            Capellanes en la de la derecha. */}
        {(geo.pantalla === 'sur' || geo.pantalla === 'ambas') && (
          <rect
            x={ejeX(geo.pantalla === 'ambas' ? 0 : geo.u0) + ancho(geo.pantalla === 'ambas' ? 5.70 : geo.ancho) / 2 - 46}
            y={Y0 + h - 4} width="92" height="7" rx="2"
            className={styles.pantalla}
          />
        )}
        {(geo.pantalla === 'este' || geo.pantalla === 'ambas') && (
          <rect
            x={X0 + ancho(ANCHO_TOTAL) - 3} y={Y0 + h / 2 - 46}
            width="7" height="92" rx="2"
            className={styles.pantalla}
          />
        )}

        {/* El panel móvil. Cuando la sala está unida no se dibuja la
            línea entera: se marcan solo los dos tramos pegados a los
            muros, que es donde queda recogido. Además de ser más fiel,
            evita que la línea cruce el rótulo central. */}
        {geo.unida ? (
          <>
            <line
              x1={xPanel} y1={Y0} x2={xPanel} y2={Y0 + 34}
              className={styles.panelRecogido}
            />
            <line
              x1={xPanel} y1={Y0 + h - 34} x2={xPanel} y2={Y0 + h}
              className={styles.panelRecogido}
            />
          </>
        ) : (
          <line
            x1={xPanel} y1={Y0} x2={xPanel} y2={Y0 + h}
            className={styles.panel}
          />
        )}

        {/* Cotas */}
        <line x1={x} y1={Y0 - 12} x2={x + w} y2={Y0 - 12} className={styles.cota} />
        <text x={x + w / 2} y={Y0 - 19} textAnchor="middle" className={styles.medida}>
          {metros(geo.ancho)} m
        </text>
        <line x1={X0 - 14} y1={Y0} x2={X0 - 14} y2={Y0 + h} className={styles.cota} />
        <text x={X0 - 20} y={Y0 + h / 2 + 4} textAnchor="end" className={styles.medida}>
          {metros(FONDO)} m
        </text>

        {/* Rótulo central */}
        <text
          x={x + w / 2} y={Y0 + h / 2 - 4}
          textAnchor="middle" className={styles.titulo}
        >
          {sala.name}
        </text>
        <text
          x={x + w / 2} y={Y0 + h / 2 + 18}
          textAnchor="middle" className={styles.subtitulo}
        >
          {geo.m2} m² · {ALTURA} m de altura
        </text>
      </svg>

      <figcaption className={styles.leyenda}>
        {geo.ventanas && (
          <span><i className={styles.mVentana} aria-hidden="true" />Ventanas</span>
        )}
        <span><i className={styles.mPantalla} aria-hidden="true" />Pantalla fija</span>
        <span><i className={styles.mPanel} aria-hidden="true" />Panel móvil</span>
      </figcaption>
    </figure>
  )
}