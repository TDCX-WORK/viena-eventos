import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Send, Loader, ChevronUp, X } from 'lucide-react'
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

  /* ── Móvil ──
     `resumenAbierto`: la hoja con el resumen completo. En pantallas de
     menos de 768 px la columna del resumen no se ve, y antes eso quería
     decir que quien reservaba desde el teléfono no veía el precio en
     ningún momento. Ahora hay una barra con el total encima de los
     botones, y al tocarla se abre el resumen entero. */
  const [resumenAbierto, setResumenAbierto] = useState(false)

  /* Cada paso empieza arriba. La zona con scroll es la misma para los
     tres pasos, y sin esto el paso nuevo se abría a la altura a la que
     se había dejado el anterior: Extras aparecía por la mitad de los
     coffee breaks y Contacto por el teléfono. */
  const scrollRef = useRef(null)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [currentStep])

  // Escape cierra la hoja del resumen.
  useEffect(() => {
    if (!resumenAbierto) return
    const alPulsar = (e) => { if (e.key === 'Escape') setResumenAbierto(false) }
    window.addEventListener('keydown', alPulsar)
    return () => window.removeEventListener('keydown', alPulsar)
  }, [resumenAbierto])

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

  /* Qué falta en el paso 1, para escribirlo en el botón en vez de
     dejarlo apagado sin explicación. */
  const faltaPaso1 = () => {
    const fechas = booking.fechas || []
    if (fechas.length === 0) return 'Elige al menos un día'
    if (!fechas.every(f => f.asistentes > 0)) {
      return fechas.length === 1 ? 'Indica los asistentes' : 'Indica los asistentes de cada día'
    }
    return null
  }

  const canGoNext = () => {
    if (currentStep === 1) {
      if (!booking.fechas || booking.fechas.length === 0) return false
      // El montaje (f.layout) es opcional: muchos clientes no lo tienen
      // claro al pedir la sala y se cierra después con la directora.
      return booking.fechas.every(f => f.jornada && f.asistentes > 0)
    }
    if (currentStep === 2) return true
    return false
  }

  const handleSubmit = useCallback(() => {
    document.dispatchEvent(new CustomEvent('viena:submit-contacto'))
  }, [])

  /* El teléfono NO está aquí: es opcional. Si se escribe, lo valida
     StepContacto al enviar (validacionContacto.js). */
  const submitDisabled =
    contactoStatus === 'loading' ||
    !(booking.contacto?.nombre &&
      booking.contacto?.email &&
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

        {/* Móvil: una línea con el paso actual y una barra de progreso.
            El stepper de tres círculos con etiquetas ocupaba casi una
            cuarta parte de la pantalla del teléfono. */}
        <div className={styles.stepperMovil} aria-hidden="true">
          <span className={styles.stepperMovilTexto}>
            Paso {currentStep} de {STEPS.length} · <strong>{STEPS[currentStep - 1].label}</strong>
          </span>
          <span className={styles.stepperMovilBarra}>
            {STEPS.map(st => (
              <span
                key={st.id}
                className={`${styles.stepperMovilTramo} ${currentStep >= st.id ? styles.stepperMovilTramoOn : ''}`}
              />
            ))}
          </span>
        </div>

        {/* Stepper verde (tablet y escritorio) */}
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
          <div className={styles.scrollArea} ref={scrollRef}>
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

          {/* ── Total, solo en móvil ──
              Aparece en cuanto hay una fecha. Toca para ver el resumen
              completo (la misma pieza que la columna de escritorio). */}
          {(booking.fechas || []).length > 0 && contactoStatus !== 'success' && (
            <button
              type="button"
              className={styles.totalMovil}
              onClick={() => setResumenAbierto(true)}
              aria-haspopup="dialog"
            >
              <span className={styles.totalMovilTexto}>
                <span className={styles.totalMovilEtiqueta}>
                  Total · {getJornadaLabel()}
                  {desglose.descuento > 0 && <span className={styles.totalMovilOferta}> · con oferta</span>}
                </span>
                <span className={styles.totalMovilImporte}>
                  {desglose.descuento > 0 && (
                    <s className={styles.totalMovilAntes}>
                      {(desglose.base + desglose.extras).toLocaleString('es-ES')} €
                    </s>
                  )}
                  {desglose.total.toLocaleString('es-ES', { maximumFractionDigits: 2 })} €
                </span>
              </span>
              <span className={styles.totalMovilVer}>
                Ver detalle <ChevronUp size={14} />
              </span>
            </button>
          )}

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
                {currentStep === 1 && (faltaPaso1() || 'Siguiente — Extras')}
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

      {/* ── Hoja del resumen (móvil) ── */}
      {resumenAbierto && (
        <div className={styles.hojaFondo} onClick={() => setResumenAbierto(false)}>
          <div
            className={styles.hoja}
            role="dialog"
            aria-modal="true"
            aria-label="Resumen de la reserva"
            onClick={e => e.stopPropagation()}
          >
            <div className={styles.hojaCabecera}>
              <span className={styles.hojaAsa} aria-hidden="true" />
              <button
                type="button"
                className={styles.hojaCerrar}
                onClick={() => setResumenAbierto(false)}
                aria-label="Cerrar resumen"
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.hojaCuerpo}>
              <BookingSummary
                booking={booking}
                room={room}
                desglose={desglose}
                getJornadaLabel={getJornadaLabel}
                hotel={hotel}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}