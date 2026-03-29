import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, CheckCircle, Loader } from 'lucide-react'
import { ShimmerButton } from '../../magicui/shimmer-button'
import { useEmailSend } from '../../../hooks/useEmailSend'
import styles from './StepContacto.module.css'

export default function StepContacto({ booking, updateContacto, hotel, onPrev }) {
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [referencia, setReferencia] = useState(null)
  const { sendEmails } = useEmailSend()
  const c = booking.contacto

  const canSubmit =
    c.tipoEvento &&
    c.nombre &&
    c.email &&
    c.telefono &&
    c.privacidad &&
    status === 'idle'

  const handleSubmit = async () => {
    if (!canSubmit) return
    setStatus('loading')
    try {
      const ref = await sendEmails(booking, hotel, () => {
        if (!booking.room || !booking.jornada) return 0
        return booking.jornada === 'completo'
          ? booking.room.pricing.fullDay
          : booking.room.pricing.halfDay
      })
      setReferencia(ref)
      setStatus('success')
    } catch (err) {
      console.error('Error enviando email:', err)
      setStatus('error')
    }
  }

  // Pantalla de éxito
  if (status === 'success') {
    return (
      <motion.div
        className={styles.successWrapper}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className={styles.successIcon}>
          <CheckCircle size={40} color="#B8935A" />
        </div>
        <h2 className={styles.successTitle}>¡Solicitud enviada!</h2>
        <p className={styles.successSub}>
          Hemos recibido tu solicitud y te hemos enviado un email de confirmación.
          Nos pondremos en contacto contigo en las próximas horas.
        </p>
        <div className={styles.successRef}>
          <span className={styles.successRefLabel}>Tu número de referencia</span>
          <span className={styles.successRefNumber}>{referencia}</span>
        </div>
        <p className={styles.successNote}>
          Si no recibes el email en los próximos minutos, revisa tu carpeta de spam.
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      className={styles.wrapper}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className={styles.title}>Tus datos de contacto</h2>
      <p className={styles.subtitle}>
        Rellena el formulario y te contactamos para confirmar todos los detalles
      </p>

      <div className={styles.form}>

        <div className={styles.field}>
          <label className={styles.label}>
            Tipo de evento <span className={styles.required}>*</span>
          </label>
          <select
            className={styles.select}
            value={c.tipoEvento}
            onChange={e => updateContacto({ tipoEvento: e.target.value })}
          >
            <option value="">Selecciona...</option>
            {hotel.eventTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Nombre del evento</label>
          <input
            className={styles.input}
            type="text"
            placeholder="Ej: Reunion Q1 2026"
            value={c.nombreEvento}
            onChange={e => updateContacto({ nombreEvento: e.target.value })}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>
              Persona de contacto <span className={styles.required}>*</span>
            </label>
            <input
              className={styles.input}
              type="text"
              placeholder="Nombre y apellidos"
              value={c.nombre}
              onChange={e => updateContacto({ nombre: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Empresa</label>
            <input
              className={styles.input}
              type="text"
              placeholder="Nombre de la empresa"
              value={c.empresa}
              onChange={e => updateContacto({ empresa: e.target.value })}
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>
              Email <span className={styles.required}>*</span>
            </label>
            <input
              className={styles.input}
              type="email"
              placeholder="correo@empresa.com"
              value={c.email}
              onChange={e => updateContacto({ email: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>
              Telefono <span className={styles.required}>*</span>
            </label>
            <input
              className={styles.input}
              type="tel"
              placeholder="+34 600 000 000"
              value={c.telefono}
              onChange={e => updateContacto({ telefono: e.target.value })}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Comentarios</label>
          <textarea
            className={styles.textarea}
            placeholder="Cuentanos cualquier detalle adicional sobre tu evento..."
            value={c.comentarios}
            onChange={e => updateContacto({ comentarios: e.target.value })}
          />
        </div>

        <div className={styles.privacyRow}>
          <input
            className={styles.checkbox}
            type="checkbox"
            id="privacidad"
            checked={c.privacidad}
            onChange={e => updateContacto({ privacidad: e.target.checked })}
          />
          <label className={styles.privacyText} htmlFor="privacidad">
            He leido y acepto la{' '}
            <a href="https://www.suitesviena.com/politica-privacidad/" target="_blank" rel="noopener noreferrer">
              politica de privacidad
            </a>
            {' '}de Suites Viena
          </label>
        </div>

      </div>

      {status === 'error' && (
        <div className={styles.errorMsg}>
          Ha ocurrido un error al enviar la solicitud. Por favor intentalo de nuevo o contacta directamente al hotel.
        </div>
      )}

      <div className={styles.buttons}>
        <button
          className={styles.btnSecondary}
          onClick={onPrev}
          disabled={status === 'loading'}
        >
          <ArrowLeft size={15} />
          Anterior
        </button>
        <ShimmerButton
          style={{ flex: 2 }}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {status === 'loading' ? (
            <>
              <Loader size={15} className={styles.spinner} />
              Enviando...
            </>
          ) : (
            <>
              <Send size={15} />
              Enviar solicitud
            </>
          )}
        </ShimmerButton>
      </div>

    </motion.div>
  )
}