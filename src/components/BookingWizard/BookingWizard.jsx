import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Check } from 'lucide-react'
import { useBooking } from '../../hooks/useBooking'
import StepJornada from '../steps/StepJornada/StepJornada'
import StepFecha from '../steps/StepFecha/StepFecha'
import StepExtras from '../steps/StepExtras/StepExtras'
import StepContacto from '../steps/StepContacto/StepContacto'
import BookingSummary from '../BookingSummary/BookingSummary'
import styles from './BookingWizard.module.css'

const STEPS = [
  { id: 1, label: 'Jornada' },
  { id: 2, label: 'Fecha' },
  { id: 3, label: 'Extras' },
  { id: 4, label: 'Contacto' },
]

export default function BookingWizard({ hotel, room, onBack }) {
  const [currentStep, setCurrentStep] = useState(1)
  const { booking, updateBooking, updateContacto, getTotalPrice, getJornadaLabel } = useBooking(room)

  const goNext = () => setCurrentStep(s => Math.min(s + 1, STEPS.length))
  const goPrev = () => setCurrentStep(s => Math.max(s - 1, 1))

  const stepProps = {
    booking,
    updateBooking,
    updateContacto,
    hotel,
    onNext: goNext,
    onPrev: goPrev,
    getTotalPrice,
    getJornadaLabel,
  }

  return (
    <div className={styles.wrapper}>

      {/* Back button */}
      <button className={styles.back} onClick={onBack}>
        <ArrowLeft size={14} />
        Volver a salas
      </button>

      {/* Room pill */}
      <div className={styles.roomPill}>
        <img
          src={room.image}
          alt={room.name}
          className={styles.roomPillImage}
        />
        <div>
          <div className={styles.roomPillName}>{room.name}</div>
          <div className={styles.roomPillMeta}>{room.size} m² · hasta {Math.max(...room.layouts.map(l => l.max))} personas</div>
        </div>
      </div>

      {/* Stepper */}
      <div className={styles.stepper}>
        {STEPS.map((step, i) => (
          <div key={step.id} className={styles.step}>
            <div className={`${styles.stepNumber} ${currentStep === step.id ? styles.active : ''} ${currentStep > step.id ? styles.done : ''}`}>
              {currentStep > step.id ? <Check size={12} /> : step.id}
            </div>
            <span className={`${styles.stepLabel} ${currentStep === step.id ? styles.active : ''} ${currentStep > step.id ? styles.done : ''}`}>
              {step.label}
            </span>
            {i < STEPS.length - 1 && <div className={styles.stepDivider} />}
          </div>
        ))}
      </div>

      {/* Layout: main + sidebar */}
      <div className={styles.layout}>

        {/* Step content */}
        <div className={styles.main}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            >
              {currentStep === 1 && <StepJornada {...stepProps} />}
              {currentStep === 2 && <StepFecha {...stepProps} />}
              {currentStep === 3 && <StepExtras {...stepProps} />}
              {currentStep === 4 && <StepContacto {...stepProps} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Sidebar summary */}
        <div className={styles.sidebar}>
          <BookingSummary
  booking={booking}
  room={room}
  getTotalPrice={getTotalPrice}
  getJornadaLabel={getJornadaLabel}
  hotel={hotel}
/>
        </div>

      </div>
    </div>
  )
}