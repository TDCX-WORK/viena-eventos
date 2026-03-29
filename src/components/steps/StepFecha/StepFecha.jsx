import { motion } from 'framer-motion'
import { DayPicker } from 'react-day-picker'
import { es } from 'date-fns/locale'
import { format, isBefore, startOfDay } from 'date-fns'
import { CalendarDays, ArrowLeft, ArrowRight } from 'lucide-react'
import { ShimmerButton } from '../../magicui/shimmer-button'
import 'react-day-picker/dist/style.css'
import styles from './StepFecha.module.css'

export default function StepFecha({ booking, updateBooking, onNext, onPrev }) {
  const today = startOfDay(new Date())

  const handleDayClick = (day) => {
    if (isBefore(day, today)) return
    updateBooking({ fecha: day })
  }

  const canContinue = !!booking.fecha

  const formatFecha = (date) => {
    if (!date) return null
    return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
  }

  return (
    <motion.div
      className={styles.wrapper}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className={styles.title}>Elige la fecha</h2>
      <p className={styles.subtitle}>Selecciona el día para tu evento</p>

      {/* Calendar */}
      <div className={styles.calendarWrapper}>
        <DayPicker
          mode="single"
          selected={booking.fecha}
          onSelect={(day) => handleDayClick(day)}
          locale={es}
          disabled={{ before: today }}
          showOutsideDays={false}
        />
      </div>

      {/* Selected date display */}
      {booking.fecha && (
        <motion.div
          className={styles.selectedDate}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <CalendarDays size={18} className={styles.selectedDateIcon} />
          <div>
            <div className={styles.selectedDateText}>
              {formatFecha(booking.fecha)}
            </div>
            <div className={styles.selectedDateSub}>
              {booking.jornada === 'manana' && '9:00 – 14:00'}
              {booking.jornada === 'tarde' && '15:00 – 20:00'}
              {booking.jornada === 'completo' && '9:00 – 20:00'}
            </div>
          </div>
        </motion.div>
      )}

      {/* Buttons */}
      <div className={styles.buttons}>
        <button className={styles.btnSecondary} onClick={onPrev}>
          <ArrowLeft size={15} />
          Anterior
        </button>
        <ShimmerButton
          style={{ flex: 2 }}
          onClick={onNext}
          disabled={!canContinue}
        >
          Siguiente — Extras
          <ArrowRight size={15} />
        </ShimmerButton>
      </div>

    </motion.div>
  )
}