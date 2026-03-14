import { motion } from 'framer-motion'
import RoomCard from './RoomCard'
import styles from './RoomSelector.module.css'

export default function RoomSelector({ hotel, onSelectRoom }) {
  return (
    <div className={styles.wrapper}>

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

      <motion.div
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
      </motion.div>

    </div>
  )
}