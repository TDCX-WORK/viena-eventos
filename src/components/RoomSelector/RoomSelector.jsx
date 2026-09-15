import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Images, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'
import RoomCard from './RoomCard'
import { ID_SALAS } from '../Hero/Hero'
import Faq from '../Faq/Faq'
import { ofertaEscaparate } from '../../lib/ofertas'
import Gallery from '../Gallery/Gallery'
import { HOTEL_ESTATICO } from '../../lib/hotelEstatico'
import styles from './RoomSelector.module.css'

/* Compartida con el esqueleto de carga, para que el texto sea el mismo
   antes y después de llegar los datos. */
function CabeceraSalas() {
  return (
    <>
      <h2 className={styles.title}>Elige tu espacio</h2>
      <p className={styles.subtitle}>
        Tres espacios únicos en el corazón de Madrid. Equipados, flexibles y listos para tu evento.
      </p>
    </>
  )
}

/* ─────────────────────────────────────────────────────────────────────
   Lo que ocupa la sección de salas mientras llega Supabase (o si
   falla). Mismo contenedor, misma cabecera y tarjetas del mismo tamaño
   aproximado: cuando aparecen las de verdad, la página no salta.

   El id es el mismo que el de la sección real, así que "Ver salas y
   precios" del hero funciona también durante la carga.
   ───────────────────────────────────────────────────────────────────── */
export function SalasCargando({ error = false }) {
  return (
    <section className={styles.wrapper} id={ID_SALAS} aria-busy={!error}>
      <div className={styles.header}>
        <CabeceraSalas />
      </div>

      {error ? (
        <div className={styles.errorBox} role="alert">
          <p className={styles.errorTitulo}>No se han podido cargar las salas</p>
          <p className={styles.errorTexto}>
            Recarga la página en unos segundos o escríbenos a{' '}
            <a href={`mailto:${HOTEL_ESTATICO.email}`}>{HOTEL_ESTATICO.email}</a>{' '}
            o llama al{' '}
            <a href={`tel:${HOTEL_ESTATICO.phone.replace(/\s/g, '')}`}>{HOTEL_ESTATICO.phone}</a>.
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {[0, 1, 2].map(i => (
            <div key={i} className={styles.skCard} aria-hidden="true">
              <div className={styles.skImagen} />
              <div className={styles.skLinea} />
              <div className={`${styles.skLinea} ${styles.skLineaCorta}`} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default function RoomSelector({ hotel, onSelectRoom, ofertas = [] }) {
  /* Las ofertas llegan de fuera. Antes las pedía este componente, y
     como el wizard hacía lo mismo por su cuenta, cada ida y vuelta
     entre salas y reserva disparaba una consulta nueva.

     El valor por defecto es para ProtectedRoute, que monta esto como
     fondo decorativo detrás del login: ahí no hay escaparate que
     enseñar y no tiene sentido consultar nada.

     Tienen que ser SOLO las automáticas. Ver el comentario de
     `automaticas` en useOfertasPublicas. */
  const salas = hotel?.rooms

  /* El cálculo es puro y solo cambia si cambian las ofertas o las salas.
     Sin este useMemo se rehacía en cada render —y framer-motion provoca
     unos cuantos al hacer scroll—, con el ventilador y los tirones que
     eso trae.

     `salas` va en una variable aparte: con `hotel?.rooms` en el array de
     dependencias, el compilador de React infiere `hotel.rooms`, no le
     cuadra con lo escrito y se salta la optimización del componente
     entero. */
  const ofertaPorSala = useMemo(() => {
    const mapa = {}
    for (const room of salas || []) {
      mapa[room.slug] = ofertaEscaparate(ofertas, {
        roomSlug: room.slug,
        precioMedia: room.pricing.halfDay,
        precioCompleta: room.pricing.fullDay,
      })
    }
    return mapa
  }, [ofertas, salas])

  const [showGallery, setShowGallery] = useState(false)

  return (
    <>
      {/* El hero ya no va aquí: lo pinta PublicApp (App.jsx) para que
          aparezca antes de que responda Supabase y no se desmonte al
          llegar los datos. */}

      <section className={styles.wrapper} id={ID_SALAS}>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className={styles.header}
        >
          {/* h2, no h1: el h1 de la página es el titular del hero. Dos
              h1 compitiendo por la misma keyword es peor que ninguno. */}
          <CabeceraSalas />
        </motion.div>

        <div className={styles.grid}>
          {hotel.rooms.map((room, index) => (
            <RoomCard
              key={room.id}
              room={room}
              index={index}
              oferta={ofertaPorSala[room.slug]}
              onSelect={() => onSelectRoom(room)}
            />
          ))}
        </div>

        {/* Botón ver galería */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className={styles.galleryRow}
        >
          <button className={styles.galleryBtn} onClick={() => setShowGallery(true)}>
            <Images size={18} />
            Ver galería de fotos
          </button>
        </motion.div>

        {/* Modal galería */}
        <AnimatePresence>
          {showGallery && (
            <Gallery
              images={hotel.gallery}
              onClose={() => setShowGallery(false)}
            />
          )}
        </AnimatePresence>

      </section>

      {/* Fuera de .wrapper: el panel de la FAQ va casi a sangre, con el
          mismo margen que la tarjeta del hero, y .wrapper mete hasta 8rem
          de padding lateral en pantallas grandes. */}
      <Faq hotel={hotel} />

      {/* id="contacto": destino del enlace del mismo nombre en la barra
          del hero. */}
      <div className={styles.footerWrapper}>
        <motion.footer
          id="contacto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className={styles.footer}
        >
          <span>
            ¿Dudas? Llámanos al{' '}
            <a href={`tel:${hotel.phone}`}>{hotel.phone}</a>
          </span>
          <span>
            o escríbenos a{' '}
            <a href={`mailto:${hotel.email}`}>{hotel.email}</a>
          </span>
          <Link to="/admin" className={styles.adminLink} aria-label="Panel de administración">
            <Settings size={15} />
          </Link>
        </motion.footer>
      </div>
    </>
  )
}