import { useMemo, useState } from 'react'
import { Plus, X, ArrowUpRight } from 'lucide-react'
import { construirFaq, faqJsonLd } from '../../lib/faq'
import { useFaqsPublicas } from '../../hooks/useFaqsPublicas'
import { serializarParaScript } from '../../lib/datosIniciales'
import styles from './Faq.module.css'

export default function Faq({ hotel }) {
  const { faqs, cargando } = useFaqsPublicas(hotel?._dbId)

  /* ── De dónde sale el contenido ───────────────────────────────────
     Manda lo que haya escrito el hotel en el panel. Si la tabla está
     vacía —o no existe todavía— se cae en las preguntas automáticas,
     que se generan con los precios y las salas de Supabase y por tanto
     nunca dicen una cifra antigua.

     La ventaja del respaldo es que la sección nunca desaparece: el día
     que alguien borre todas las preguntas desde el panel, la web sigue
     respondiendo lo básico en lugar de quedarse sin bloque de FAQ y sin
     el marcado que lee Google. */
  const preguntas = useMemo(() => {
    if (faqs.length > 0) {
      return faqs.map(f => ({ id: f.id, pregunta: f.question, respuesta: f.answer }))
    }
    return construirFaq(hotel)
  }, [faqs, hotel])

  /* Una abierta como mucho. Con varias abiertas el bloque crece tanto
     que hay que hacer scroll para ver que había más preguntas debajo. */
  const [abierta, setAbierta] = useState(null)

  /* Mientras se comprueba si hay preguntas propias no se pinta nada. Sin
     esto se verían primero las automáticas y luego, de golpe, otras
     distintas. */
  if (cargando || preguntas.length === 0) return null

  return (
    <section className={styles.seccion} id="faq" aria-labelledby="faq-titulo">
      <div className={styles.panel}>

        <div className={styles.cabecera}>
          <span className={styles.pastilla}>
            <span className={styles.punto} aria-hidden="true" />
            Dudas frecuentes
          </span>
          <h2 className={styles.titulo} id="faq-titulo">
            Lo que suelen preguntarnos
          </h2>
        </div>

        <ul className={styles.lista}>
          {preguntas.map((p, i) => {
            const activa = abierta === p.id
            return (
              <li
                key={p.id}
                className={`${styles.fila} ${activa ? styles.filaAbierta : ''}`}
              >
                <button
                  type="button"
                  className={styles.cabezal}
                  onClick={() => setAbierta(activa ? null : p.id)}
                  aria-expanded={activa}
                  aria-controls={`faq-panel-${p.id}`}
                >
                  <span className={styles.numero} aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className={styles.pregunta}>{p.pregunta}</span>
                  <span className={styles.boton} aria-hidden="true">
                    {activa ? <X size={16} strokeWidth={2.4} /> : <Plus size={16} strokeWidth={2.4} />}
                  </span>
                </button>

                {/* La respuesta está SIEMPRE en el HTML, plegada con CSS.

                    Antes framer-motion la creaba al abrir y la
                    destruía al cerrar: en el HTML prerenderizado no
                    había ninguna respuesta, y Google pide que el texto
                    del marcado FAQPage (el <script> de abajo) esté
                    también en la página. Además, framer-motion eran
                    ~120 kB de JavaScript en la portada para esto.

                    `inert` cuando está cerrada: ni el tabulador ni el
                    lector de pantalla entran en una respuesta que no
                    se ve. */}
                <div
                  id={`faq-panel-${p.id}`}
                  className={`${styles.panelRespuesta} ${activa ? styles.panelRespuestaAbierto : ''}`}
                  inert={!activa}
                >
                  <div className={styles.recorte}>
                    <p className={styles.respuesta}>{p.respuesta}</p>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        <p className={styles.pie}>
          ¿Se te ocurre otra cosa?{' '}
          {hotel?.email && (
            <a className={styles.pieEnlace} href={`mailto:${hotel.email}`}>
              Escríbenos
              <ArrowUpRight size={14} strokeWidth={2.4} />
            </a>
          )}
        </p>
      </div>

      {/* Mismo contenido que el acordeón, en formato schema.org. Google
          exige que la respuesta del marcado exista también en la página
          visible; por eso los dos salen de construirFaq() y no de dos
          listas separadas. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializarParaScript(faqJsonLd(preguntas)) }}
      />
    </section>
  )
}