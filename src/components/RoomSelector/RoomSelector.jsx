import { useState, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Images } from 'lucide-react'
import { Link } from 'react-router-dom'
import RoomCard from './RoomCard'
import { ID_SALAS } from '../Hero/Hero'
import Faq from '../Faq/Faq'
import Contacto from '../Contacto/Contacto'
import { ofertaEscaparate } from '../../lib/ofertas'
import Gallery from '../Gallery/Gallery'
import Footer from '../Footer/Footer'
import { HOTEL_ESTATICO } from '../../lib/hotelEstatico'
import { rutaSala } from '../../lib/seo'
import { USOS } from '../../lib/usos'
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

        {/* Aparición al hacer scroll: CSS puro (clase .aparece), ver
            RoomSelector.module.css. Con framer-motion el HTML
            prerenderizado salía con opacity:0 y sin JavaScript no se
            veía nada. */}
        <div className={`${styles.header} ${styles.aparece}`}>
          {/* h2, no h1: el h1 de la página es el titular del hero. Dos
              h1 compitiendo por la misma keyword es peor que ninguno. */}
          <CabeceraSalas />
        </div>

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

        {/* Enlaces a las fichas de cada sala. Además de servir al
            cliente, son el camino por el que Google descubre esas
            páginas: tienen que ser <a> reales y estar siempre en el
            HTML, no dentro de un acordeón. */}
        <nav className={styles.fichas} aria-label="Fichas de las salas">
          <span>Ficha completa de cada sala:</span>
          <ul>
            {hotel.rooms.map(room => (
              <li key={room.slug}>
                <Link to={rutaSala(room.slug)}>{room.name}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav className={styles.fichas} aria-label="Salas por tipo de evento">
          <span>Ideal para:</span>
          <ul>
            {USOS.map(u => (
              <li key={u.slug}>
                <Link to={u.ruta}>{u.etiqueta}</Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Botón ver galería */}
        <div className={`${styles.galleryRow} ${styles.aparece}`}>
          <button className={styles.galleryBtn} onClick={() => setShowGallery(true)}>
            <Images size={18} />
            Ver galería de fotos
          </button>
        </div>

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

      {/* id="contacto" lo pone la propia sección: es el destino del
          enlace del mismo nombre en la barra del hero. */}
      <Contacto hotel={hotel} />

      {/* El pie ya no se escribe aquí: es un componente, porque tiene
          que estar también en las fichas de sala, en las páginas de uso
          y en las legales. Los enlaces a aviso legal, privacidad,
          cookies y condiciones salen de lib/legal.js. */}
      <Footer />
    </>
  )
}