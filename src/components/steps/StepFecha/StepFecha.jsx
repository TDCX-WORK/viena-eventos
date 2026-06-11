import { motion } from 'framer-motion'
import { DayPicker } from 'react-day-picker'
import { es } from 'date-fns/locale'
import { format, isBefore, startOfDay, addDays, isToday, isSameDay } from 'date-fns'
import 'react-day-picker/dist/style.css'
import styles from './StepFecha.module.css'

export default function StepFecha({ booking, updateBooking, onNext, onPrev }) {
  const today = startOfDay(new Date())

  // Próximos 7 días (excluye hoy — reservas con al menos 1 día de antelación)
  const nextDays = Array.from({ length: 7 }, (_, i) => addDays(today, i + 1))

  const handleDayClick = (day) => {
    if (!day || isBefore(day, today)) return
    updateBooking({ fecha: day })
  }

  const handleStripClick = (day) => {
    updateBooking({ fecha: day })
  }

  const canContinue = !!booking.fecha

  const formatFecha = (date) => {
    if (!date) return null
    return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
  }

  const getDayName  = (date) => format(date, 'EEE', { locale: es }).toUpperCase().slice(0, 2)
  const getMonthName = (date) => format(date, 'MMM', { locale: es }).toUpperCase()

  return (
    <motion.div
      className={styles.wrapper}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className={styles.title}>Elige la fecha</h2>
      <p className={styles.subtitle}>Selecciona el día para tu evento</p>

      {/* Strip — próximos 7 días */}
      <div className={styles.strip}>
        {nextDays.map((day) => {
          const isSelected = booking.fecha && isSameDay(booking.fecha, day)
          return (
            <button
              key={day.toISOString()}
              className={`${styles.stripDay} ${isSelected ? styles.stripSelected : ''}`}
              onClick={() => handleStripClick(day)}
            >
              <span className={styles.stripDayName}>{getDayName(day)}</span>
              <span className={styles.stripDayNumber}>{format(day, 'd')}</span>
              <span className={styles.stripDayMonth}>{getMonthName(day)}</span>
              {isToday(day) && <span className={styles.stripDayToday} />}
            </button>
          )
        })}
      </div>

      {/* Separador */}
      <div className={styles.separator}>
        <div className={styles.separatorLine} />
        <span className={styles.separatorText}>O elige otro día</span>
        <div className={styles.separatorLine} />
      </div>

      {/* Calendario */}
      <div className={styles.calendarWrapper}>
        <DayPicker
          mode="single"
          selected={booking.fecha}
          onSelect={handleDayClick}
          locale={es}
          disabled={{ before: today }}
          showOutsideDays={false}
        />
      </div>




    </motion.div>
  )
}
