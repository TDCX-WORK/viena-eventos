import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, User, Mail, Phone, MessageSquare, Shield } from 'lucide-react'
import { useEmailSend } from '../../../hooks/useEmailSend'
import styles from './StepContacto.module.css'

export default function StepContacto({ booking, updateContacto, hotel, getTotalPrice, onStatusChange }) {
  const [status, setStatus] = useState('idle')
  const [referencia, setReferencia] = useState(null)
  const { sendEmails } = useEmailSend()
  const c = booking.contacto

  const canSubmit =
    c.nombre &&
    c.email &&
    c.telefono &&
    c.privacidad &&
    status === 'idle'

  const canSubmitRef = useRef(canSubmit)
  const bookingRef   = useRef(booking)
  const statusRef    = useRef(status)

  useEffect(() => { canSubmitRef.current = canSubmit }, [canSubmit])
  useEffect(() => { bookingRef.current   = booking   }, [booking])
  useEffect(() => { statusRef.current    = status    }, [status])

  const handleSubmit = useCallback(async () => {
    if (!canSubmitRef.current) return
    if (statusRef.current !== 'idle') return

    setStatus('loading')
    onStatusChange?.('loading')

    try {
      const ref = await sendEmails(bookingRef.current, hotel, getTotalPrice)
      setReferencia(ref)
      setStatus('success')
      onStatusChange?.('success')
    } catch (err) {
      console.error('Error enviando email:', err)
      setStatus('error')
      onStatusChange?.('error')
    }
  }, [hotel, getTotalPrice, onStatusChange, sendEmails])

  useEffect(() => {
    document.addEventListener('viena:submit-contacto', handleSubmit)
    return () => document.removeEventListener('viena:submit-contacto', handleSubmit)
  }, [handleSubmit])

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
          <CheckCircle size={44} color="#5B8C5A" />
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
      <div className={styles.header}>
        <h2 className={styles.title}>Datos de contacto</h2>
        <p className={styles.subtitle}>
          Déjanos tus datos y te contactamos para confirmar todos los detalles
        </p>
      </div>

      <div className={styles.formCard}>

        {/* Nombre */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="contacto-nombre">
            <User size={14} className={styles.labelIcon} />
            Nombre completo
          </label>
          <input
            id="contacto-nombre"
            className={styles.input}
            type="text"
            placeholder="Nombre y apellidos"
            value={c.nombre}
            onChange={e => updateContacto({ nombre: e.target.value })}
          />
        </div>

        <div className={styles.divider} />

        {/* Email y Teléfono */}
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="contacto-email">
              <Mail size={14} className={styles.labelIcon} />
              Email
            </label>
            <input
              id="contacto-email"
              className={styles.input}
              type="email"
              placeholder="correo@empresa.com"
              value={c.email}
              onChange={e => updateContacto({ email: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="contacto-tel">
              <Phone size={14} className={styles.labelIcon} />
              Teléfono
            </label>
            <input
              id="contacto-tel"
              className={styles.input}
              type="tel"
              placeholder="+34 600 000 000"
              value={c.telefono}
              onChange={e => updateContacto({ telefono: e.target.value })}
            />
          </div>
        </div>

        <div className={styles.divider} />

        {/* Comentarios */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="contacto-comentarios">
            <MessageSquare size={14} className={styles.labelIcon} />
            Comentarios <span className={styles.optional}>opcional</span>
          </label>
          <textarea
            id="contacto-comentarios"
            className={styles.textarea}
            placeholder="Cuéntanos cualquier detalle adicional sobre tu evento..."
            value={c.comentarios}
            onChange={e => updateContacto({ comentarios: e.target.value })}
          />
        </div>

      </div>

      {/* Privacidad */}
      <div className={styles.privacyCard}>
        <Shield size={14} className={styles.privacyIcon} />
        <input
          className={styles.checkbox}
          type="checkbox"
          id="privacidad"
          checked={c.privacidad}
          onChange={e => updateContacto({ privacidad: e.target.checked })}
        />
        <label className={styles.privacyText} htmlFor="privacidad">
          He leído y acepto la{' '}
          <a
            href="https://www.suitesviena.com/politica-privacidad/"
            target="_blank"
            rel="noopener noreferrer"
          >
            política de privacidad
          </a>
          {' '}de Suites Viena
        </label>
      </div>

      {status === 'error' && (
        <div className={styles.errorMsg}>
          Ha ocurrido un error al enviar la solicitud. Por favor inténtalo de nuevo o
          contacta directamente con el hotel.
        </div>
      )}

    </motion.div>
  )
}
