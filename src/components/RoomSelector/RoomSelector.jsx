import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Images, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'
import RoomCard from './RoomCard'
import Gallery from '../Gallery/Gallery'
import styles from './RoomSelector.module.css'

export default function RoomSelector({ hotel, onSelectRoom }) {
  const [showGallery, setShowGallery] = useState(false)

  return (
    <section className={styles.wrapper}>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className={styles.header}
      >
        <span className={styles.location}>{hotel.location}</span>
        <h1 className={styles.title}>Elige tu espacio</h1>
        <p className={styles.subtitle}>
          Tres espacios únicos en el corazón de Madrid. Equipados, flexibles y listos para tu evento.
        </p>
      </motion.div>

      <div className={styles.grid}>
        {hotel.rooms.map((room, index) => (
          <RoomCard
            key={room.id}
            room={room}
            index={index}
            onSelect={() => onSelectRoom(room)}
          />
        ))}
      </div>

      {/* Botón ver galería */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className={styles.galleryRow}
      >
        <button className={styles.galleryBtn} onClick={() => setShowGallery(true)}>
          <Images size={18} />
          Ver galería de fotos
        </button>
      </motion.div>

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
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
  )
}
