import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Clock, CalendarDays, Users, LayoutGrid, Coffee } from 'lucide-react'
import styles from './BookingSummary.module.css'

const JORNADA_LABELS = {
  manana:   'Mañana (9:00–14:00)',
  tarde:    'Tarde (15:00–20:00)',
  completo: 'Día completo (9:00–20:00)',
}

const LAYOUT_LABELS = {
  teatro:   'Teatro',
  u:        'En U',
  escuela:  'Escuela',
  imperial: 'Imperial',
}

export default function BookingSummary({ booking, room, getTotalPrice, hotel }) {
  const total = getTotalPrice()

  const selectedExtras = (booking.extras || [])
    .map(id => hotel.extras.find(e => e.id === id))
    .filter(Boolean)

  return (
    <div className={styles.wrapper}>

      {/* Header */}
      <div className={styles.header}>
        <p className={styles.headerTitle}>Resumen de solicitud</p>
      </div>

      {/* Room card con foto grande */}
      <div className={styles.roomCard}>
        <img src={room.image} alt={room.name} className={styles.roomImage} />
        <div className={styles.roomOverlay} />
        <div className={styles.roomInfo}>
          <p className={styles.roomName}>{room.name}</p>
          <p className={styles.roomMeta}>
            {room.size} m² · hasta {Math.max(...room.layouts.map(l => l.max))} personas
          </p>
        </div>
      </div>

      {/* Details */}
      <div className={styles.rows}>
        <div className={styles.row}>
          <span className={styles.rowLabel}><Clock size={12} /> Jornada</span>
          {booking.jornada
            ? <span className={styles.rowValue}>{JORNADA_LABELS[booking.jornada]}</span>
            : <span className={styles.empty}>Sin seleccionar</span>}
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}><CalendarDays size={12} /> Fecha</span>
          {booking.fecha
            ? <span className={styles.rowValue}>
                {format(booking.fecha, "d MMM yyyy", { locale: es })}
              </span>
            : <span className={styles.empty}>Sin seleccionar</span>}
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}><Users size={12} /> Asistentes</span>
          {booking.asistentes
            ? <span className={styles.rowValue}>{booking.asistentes} personas</span>
            : <span className={styles.empty}>Sin indicar</span>}
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}><LayoutGrid size={12} /> Montaje</span>
          {booking.layout
            ? <span className={styles.rowValue}>{LAYOUT_LABELS[booking.layout]}</span>
            : <span className={styles.empty}>Sin seleccionar</span>}
        </div>
        {selectedExtras.length > 0 && (
          <div className={styles.row}>
            <span className={styles.rowLabel}><Coffee size={12} /> Extras</span>
            <div className={styles.extrasList}>
              {selectedExtras.map(extra => (
                <span key={extra.id} className={styles.extraItem}>
                  <span className={styles.extraDot} />
                  {extra.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Total */}
      {total > 0 && (
        <div className={styles.totalBlock}>
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Total estimado</span>
            <div>
              <div className={styles.totalPrice}>{total}€</div>
            </div>
          </div>
          <div className={styles.totalSub}>IVA incluido · sujeto a confirmación</div>
        </div>
      )}

      {/* Nota */}
      <div className={styles.nota}>
        Recibirás un email de confirmación con tu número de referencia. Nos pondremos en contacto contigo para verificar disponibilidad.
      </div>

    </div>
  )
}