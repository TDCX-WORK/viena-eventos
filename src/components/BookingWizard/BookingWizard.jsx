import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Send, Loader } from 'lucide-react'
import { useBooking } from '../../hooks/useBooking'
import StepJornadaFecha from '../steps/StepJornadaFecha/StepJornadaFecha'
import StepExtras       from '../steps/StepExtras/StepExtras'
import StepContacto     from '../steps/StepContacto/StepContacto'
import BookingSummary   from '../BookingSummary/BookingSummary'
import styles from './BookingWizard.module.css'

const STEPS = [
  { id: 1, label: 'Jornada & Fecha' },
  { id: 2, label: 'Extras' },
  { id: 3, label: 'Contacto' },
]

export default function BookingWizard({ hotel, room, onBack, ofertasApi }) {
  const [currentStep, setCurrentStep] = useState(1)
  const { booking, updateBooking, updateFecha, updateContacto, getDesglose, getJornadaLabel } = useBooking(room)
  const [contactoStatus, setContactoStatus] = useState('idle')

  /* Ofertas: las automáticas más, si el cliente escribe un código
     válido, la suya. El motor elige la que más rebaje; aquí no se
     decide nada.

     El estado viene de PublicApp y no de un hook propio: así la portada
     y el wizard comparten una sola consulta, y un código aplicado sigue
     aplicado si el cliente vuelve atrás a cambiar de sala.

     `registrarUso` ya no está: el contador de la oferta lo lleva ahora
     crear_reserva, dentro de la misma transacción que la reserva. */
  const {
    ofertas = [], codigo, ofertaCodigo, estadoCodigo, aplicarCodigo, quitarCodigo,
  } = ofertasApi || {}

  const desglose = getDesglose(hotel, ofertas, codigo)

  const goNext = () => setCurrentStep(s => Math.min(s + 1, STEPS.length))
  const goPrev = () => setCurrentStep(s => Math.max(s - 1, 1))

  const stepProps = {
    booking, updateBooking, updateFecha, updateContacto, hotel,
    getJornadaLabel, desglose, ofertas,
    codigo, ofertaCodigo, estadoCodigo, aplicarCodigo, quitarCodigo,
  }

  const canGoNext = () => {
    if (currentStep === 1) {
      if (!booking.fechas || booking.fechas.length === 0) return false
      return booking.fechas.every(f => f.jornada && f.layout && f.asistentes > 0)
    }
    if (currentStep === 2) return true
    return false
  }

  const handleSubmit = useCallback(() => {
    document.dispatchEvent(new CustomEvent('viena:submit-contacto'))
  }, [])

  const submitDisabled =
    contactoStatus === 'loading' ||
    !(booking.contacto?.nombre &&
      booking.contacto?.email &&
      booking.contacto?.telefono &&
      booking.contacto?.privacidad)

  return (
    <div className={styles.wrapper}>

      {/* ── HEADER ── */}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <button className={styles.back} onClick={onBack}>
            <ArrowLeft size={14} /> Volver a salas
          </button>
          <span className={styles.headerTitle}>{room.name}</span>
        </div>

        {/* Stepper verde */}
        <div className={styles.stepper}>
          {STEPS.map((step, i) => (
            <div key={step.id} className={styles.stepGroup}>
              <div className={styles.stepItem}>
                <div className={[
                  styles.stepCircle,
                  currentStep === step.id ? styles.stepActive : '',
                  currentStep > step.id  ? styles.stepDone   : '',
                ].join(' ')}>
                  {currentStep > step.id ? <Check size={13} strokeWidth={3} /> : step.id}
                </div>
                <span className={[
                  styles.stepLabel,
                  currentStep >= step.id ? styles.stepLabelVisible : '',
                ].join(' ')}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={styles.stepLine}>
                  <motion.div
                    className={styles.stepLineFill}
                    initial={false}
                    animate={{ scaleX: currentStep > step.id ? 1 : 0 }}
                    transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </header>

      {/* ── BODY ── */}
      <div className={styles.body}>
        <div className={styles.mainCol}>
          <div className={styles.scrollArea}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              >
                {currentStep === 1 && <StepJornadaFecha {...stepProps} />}
                {currentStep === 2 && <StepExtras {...stepProps} />}
                {currentStep === 3 && (
                  <StepContacto {...stepProps} onStatusChange={setContactoStatus} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── NAV — limpio, sin barra beige ── */}
          <nav className={styles.navBar}>
            {currentStep > 1 && (
              <button className={styles.navBack} onClick={goPrev}>
                <ArrowLeft size={13} /> Volver
              </button>
            )}

            {currentStep < STEPS.length && (
              <button
                className={styles.navNext}
                onClick={goNext}
                disabled={!canGoNext()}
              >
                {currentStep === 1 && 'Siguiente — Extras'}
                {currentStep === 2 && 'Siguiente — Contacto'}
                <ArrowRight size={13} />
              </button>
            )}

            {currentStep === STEPS.length && contactoStatus !== 'success' && (
              <button
                className={`${styles.navNext} ${styles.navSubmit}`}
                onClick={handleSubmit}
                disabled={submitDisabled}
              >
                {contactoStatus === 'loading' ? (
                  <><Loader size={13} className={styles.spinner} /> Enviando...</>
                ) : (
                  <>Enviar solicitud <Send size={13} /></>
                )}
              </button>
            )}
          </nav>
        </div>

        <aside className={styles.sidebar}>
          <BookingSummary
            booking={booking}
            room={room}
            desglose={desglose}
            getJornadaLabel={getJornadaLabel}
            hotel={hotel}
          />
        </aside>
      </div>
    </div>
  )
}
