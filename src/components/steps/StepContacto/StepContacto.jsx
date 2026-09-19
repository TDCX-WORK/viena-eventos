import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, User, Mail, Phone, MessageSquare, Shield, AlertTriangle, Clock } from 'lucide-react'
import { useEmailSend } from '../../../hooks/useEmailSend'
import { validarContacto, validarCampo } from '../../../lib/validacionContacto'
import { CAPA_1 } from '../../../lib/legal'
import styles from './StepContacto.module.css'

export default function StepContacto({ booking, updateContacto, hotel, desglose, onStatusChange }) {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [referencia, setReferencia] = useState(null)
  const [emailOk, setEmailOk] = useState(true)
  const { sendEmails } = useEmailSend()
  const c = booking.contacto

  /* ── Errores por campo ────────────────────────────────────────────
     `errores` son los mensajes; `tocados` es qué campos ha visitado ya
     el cliente.

     Los dos hacen falta. Si solo se guardaran los errores, el
     formulario aparecería en rojo nada más abrirlo: está vacío, o sea
     que está mal, pero nadie ha hecho nada todavía. Marcar en rojo algo
     que el cliente aún no ha tenido ocasión de rellenar es regañarle
     por adelantado.

     Un campo se marca como tocado al salir de él, o todos de golpe al
     intentar enviar. */
  const [errores, setErrores] = useState({})
  const [tocados, setTocados] = useState({})

  const bookingRef  = useRef(booking)
  const statusRef   = useRef(status)
  const desgloseRef = useRef(desglose)

  useEffect(() => { bookingRef.current  = booking  }, [booking])
  useEffect(() => { statusRef.current   = status   }, [status])
  useEffect(() => { desgloseRef.current = desglose }, [desglose])

  /** Al salir de un campo: se marca como tocado y se valida solo ese. */
  const alSalir = (campo) => () => {
    setTocados(prev => ({ ...prev, [campo]: true }))
    setErrores(prev => ({ ...prev, [campo]: validarCampo(campo, c) }))
  }

  /** Al escribir: solo se QUITA el error, nunca se pone.
   *
   *  Poner errores mientras se teclea es de las cosas más molestas que
   *  puede hacer un formulario: escribes la primera letra del email y ya
   *  te está diciendo que está mal. Pero quitarlo en cuanto el campo
   *  pasa a ser correcto sí se agradece, porque el rojo desaparece sin
   *  tener que salir del campo. */
  const alEscribir = (campo) => (valor) => {
    updateContacto({ [campo]: valor })

    if (errores[campo]) {
      const contactoNuevo = { ...c, [campo]: valor }
      if (!validarCampo(campo, contactoNuevo)) {
        setErrores(prev => ({ ...prev, [campo]: null }))
      }
    }
  }

  const handleSubmit = useCallback(async () => {
    if (statusRef.current !== 'idle') return

    /* ── Validación ──
       Antes de tocar la red. Si algo falla se marcan TODOS los campos
       como tocados: si no, los que el cliente no llegó a visitar se
       quedarían sin explicación y parecería que el botón no responde. */
    const { ok, errores: nuevos } = validarContacto(bookingRef.current.contacto)

    if (!ok) {
      setErrores(nuevos)
      setTocados({ nombre: true, email: true, telefono: true, comentarios: true, privacidad: true })
      setError(null)

      // Foco en el primer campo con problema, para que se vea sin tener
      // que buscarlo a ojo.
      const primero = ['nombre', 'email', 'telefono', 'privacidad'].find(k => nuevos[k])
      if (primero) {
        document.getElementById(
          primero === 'privacidad' ? 'privacidad' : `contacto-${primero}`
        )?.focus()
      }
      return
    }

    setStatus('loading')
    statusRef.current = 'loading'   // el ref se actualiza en un efecto,
                                    // o sea después del render: sin esto
                                    // dos clics rápidos entran los dos
    setError(null)
    onStatusChange?.('loading')

    try {
      const resultado = await sendEmails(bookingRef.current, hotel, desgloseRef.current)
      setReferencia(resultado.referencia)
      setEmailOk(resultado.emailOk)
      setStatus('success')
      onStatusChange?.('success')
    } catch (err) {
      /* Llegar aquí significa una cosa concreta: la reserva NO se ha
         guardado. Si se hubiera guardado y solo hubieran fallado los
         correos, sendEmails habría devuelto emailOk en false en vez de
         lanzar. Por eso aquí no hay número de referencia que enseñar. */
      console.error('No se ha podido registrar la reserva:', err)
      setError(err?.message || null)
      setStatus('idle')
      statusRef.current = 'idle'
      onStatusChange?.('idle')
    }
  }, [hotel, onStatusChange, sendEmails])

  useEffect(() => {
    document.addEventListener('viena:submit-contacto', handleSubmit)
    return () => document.removeEventListener('viena:submit-contacto', handleSubmit)
  }, [handleSubmit])

  /** Un campo enseña error solo si ya se ha visitado. */
  const fallo = (campo) => (tocados[campo] ? errores[campo] : null)

  /** Clase del input, con el borde rojo si toca. */
  const claseInput = (campo, base) =>
    [base, fallo(campo) ? styles.inputError : ''].filter(Boolean).join(' ')

  /** El mensaje bajo el campo.
   *
   *  Es una función que devuelve JSX, NO un componente, y por eso se
   *  llama con paréntesis: {aviso('nombre')} y no <Aviso campo="..." />.
   *
   *  La diferencia importa. Un componente declarado dentro del cuerpo de
   *  otro es una función distinta en cada render, así que React lo ve
   *  como un tipo nuevo cada vez: en lugar de actualizar el <span>, lo
   *  desmonta y monta otro. Con un span sin estado el efecto visible es
   *  cero, pero el día que alguien le meta una animación de entrada,
   *  parpadearía en cada tecla. */
  const aviso = (campo) => {
    const mensaje = fallo(campo)
    if (!mensaje) return null
    return (
      <span className={styles.fieldError} id={`error-${campo}`}>
        {mensaje}
      </span>
    )
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
          <CheckCircle size={44} color="#5B8C5A" />
        </div>
        <h2 className={styles.successTitle}>¡Solicitud recibida!</h2>

        {/* Que quede claro que NO es una reserva cerrada: la directora la
            revisa y habla con el cliente antes de confirmarla. */}
        <span className={styles.estadoPendiente}>
          <Clock size={14} strokeWidth={2.4} />
          Pendiente de confirmación
        </span>

        {/* El texto cambia según hayan salido los correos o no. Prometer
            un email que no se ha mandado es peor que no prometer nada:
            el cliente se queda esperando y no llama. */}
        <p className={styles.successSub}>
          Tu reserva <strong>todavía no está confirmada</strong>. Revisaremos tu solicitud
          y te escribiremos en las próximas horas para cerrar los detalles.
          {emailOk
            ? ' Te hemos enviado un email con el resumen.'
            : ''}
        </p>

        <div className={styles.successRef}>
          <span className={styles.successRefLabel}>Tu número de referencia</span>
          <span className={styles.successRefNumber}>{referencia}</span>
        </div>

        <p className={styles.successNote}>
          {emailOk ? (
            <>Si no recibes el email en los próximos minutos, revisa tu carpeta de spam.</>
          ) : (
            <>
              Guarda este número: no hemos podido enviarte el email con el resumen,
              pero tu solicitud está registrada.
              {hotel?.phone && <> Si tienes dudas, llámanos al {hotel.phone}.</>}
            </>
          )}
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
          Esto es una solicitud, no una reserva cerrada: la revisamos y te contactamos
          para confirmar disponibilidad y detalles.
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
            className={claseInput('nombre', styles.input)}
            type="text"
            placeholder="Nombre y apellidos"
            value={c.nombre}
            onChange={e => alEscribir('nombre')(e.target.value)}
            onBlur={alSalir('nombre')}
            aria-invalid={Boolean(fallo('nombre'))}
            aria-describedby={fallo('nombre') ? 'error-nombre' : undefined}
          />
          {aviso('nombre')}
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
              className={claseInput('email', styles.input)}
              type="email"
              placeholder="correo@empresa.com"
              value={c.email}
              onChange={e => alEscribir('email')(e.target.value)}
              onBlur={alSalir('email')}
              aria-invalid={Boolean(fallo('email'))}
              aria-describedby={fallo('email') ? 'error-email' : undefined}
            />
            {aviso('email')}
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="contacto-telefono">
              <Phone size={14} className={styles.labelIcon} />
              Teléfono <span className={styles.optional}>opcional</span>
            </label>
            <input
              id="contacto-telefono"
              className={claseInput('telefono', styles.input)}
              type="tel"
              placeholder="+34 600 000 000"
              value={c.telefono}
              onChange={e => alEscribir('telefono')(e.target.value)}
              onBlur={alSalir('telefono')}
              aria-invalid={Boolean(fallo('telefono'))}
              aria-describedby={fallo('telefono') ? 'error-telefono' : undefined}
            />
            {aviso('telefono')}
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
            className={claseInput('comentarios', styles.textarea)}
            placeholder="Cuéntanos cualquier detalle adicional sobre tu evento..."
            value={c.comentarios}
            onChange={e => alEscribir('comentarios')(e.target.value)}
            onBlur={alSalir('comentarios')}
          />
          {aviso('comentarios')}
        </div>

      </div>

      {/* Privacidad */}
      <div className={`${styles.privacyCard} ${fallo('privacidad') ? styles.privacyCardError : ''}`}>
        <Shield size={14} className={styles.privacyIcon} />
        <input
          className={styles.checkbox}
          type="checkbox"
          id="privacidad"
          checked={c.privacidad}
          onChange={e => {
            const marcado = e.target.checked
            updateContacto({ privacidad: marcado })
            setTocados(prev => ({ ...prev, privacidad: true }))
            setErrores(prev => ({
              ...prev,
              privacidad: marcado ? null : 'Tienes que aceptar la política de privacidad',
            }))
          }}
        />
        {/* Enlaces con <a> y no con <Link>: abrir el documento en una
            pestaña nueva con una carga completa deja intacto el wizard
            de esta pestaña. Con react-router, navegar desmontaría el
            formulario y el cliente perdería lo que lleva escrito. */}
        <label className={styles.privacyText} htmlFor="privacidad">
          He leído y acepto la{' '}
          <a href="/politica-privacidad" target="_blank" rel="noopener noreferrer">
            política de privacidad
          </a>
          {' '}y las{' '}
          <a href="/condiciones-reserva" target="_blank" rel="noopener noreferrer">
            condiciones de reserva
          </a>
          {' '}de Suites Viena
        </label>
      </div>
      {aviso('privacidad')}

      {/* Información básica de protección de datos.

          El RGPD pide que lo esencial esté a la vista en el momento de
          recoger los datos, no solo detrás de un enlace. Va plegado
          para no romper el formulario, pero es HTML de verdad: se ve
          sin JavaScript y el buscador del navegador lo encuentra.

          El contenido sale de CAPA_1 (lib/legal.js), la misma fuente
          que la política completa, para que no puedan decir cosas
          distintas. */}
      <details className={styles.infoDatos}>
        <summary>Información básica sobre protección de datos</summary>
        <dl>
          {CAPA_1.map(([clave, valor]) => (
            <div key={clave}>
              <dt>{clave}</dt>
              <dd>{valor}</dd>
            </div>
          ))}
        </dl>
        <p>
          Puedes consultar la{' '}
          <a href="/politica-privacidad" target="_blank" rel="noopener noreferrer">
            información adicional y detallada
          </a>
          {' '}en nuestra política de privacidad.
        </p>
      </details>

      {error !== null && (
        <div className={styles.errorMsg} role="alert">
          <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>No se ha podido registrar tu solicitud.</strong>{' '}
            Tus datos siguen aquí: vuelve a pulsar «Enviar solicitud».
            {hotel?.phone && (
              <> Si sigue sin funcionar, llámanos al {hotel.phone} y lo hacemos por teléfono.</>
            )}
          </div>
        </div>
      )}

    </motion.div>
  )
}