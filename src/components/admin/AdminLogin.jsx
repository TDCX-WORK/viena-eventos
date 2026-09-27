import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Mail, Eye, EyeOff, AlertCircle, X, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import styles from './AdminLogin.module.css'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  /* Cerrar = volver a la web. Si se ha llegado desde la propia web (la
     tuerca del pie), se vuelve atrás en el historial y el visitante
     queda donde estaba. Si se ha entrado escribiendo /admin o desde un
     marcador, no hay "atrás" dentro de la web: a la portada.
     react-router guarda la posición en history.state.idx. */
  const cerrar = useCallback(() => {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1)
    else navigate('/', { replace: true })
  }, [navigate])

  // Escape cierra, como cualquier ventana modal.
  useEffect(() => {
    const alPulsar = (e) => { if (e.key === 'Escape') cerrar() }
    window.addEventListener('keydown', alPulsar)
    return () => window.removeEventListener('keydown', alPulsar)
  }, [cerrar])

  /* Clic fuera de la tarjeta. Se mira dónde EMPIEZA el clic (mousedown)
     y no dónde acaba: si alguien selecciona el email arrastrando y
     suelta fuera de la tarjeta, no debe cerrarse el formulario. */
  const alPulsarFondo = (e) => {
    if (e.target === e.currentTarget) cerrar()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await signIn(email, password)
    } catch (err) {
      setError(
        err.code === 'SIN_PERMISO'
          ? 'Esta cuenta no tiene acceso al panel.'
          : err.message === 'Invalid login credentials'
            ? 'Email o contraseña incorrectos'
            : 'Error al iniciar sesión. Inténtalo de nuevo.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay} onMouseDown={alPulsarFondo}>
      <div
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-titulo"
      >
        <div className={styles.header}>
          <button
            type="button"
            className={styles.cerrar}
            onClick={cerrar}
            aria-label="Cerrar y volver a la web"
            title="Cerrar (Esc)"
          >
            <X size={18} />
          </button>

          <div className={styles.lockIcon}>
            <Lock size={20} />
          </div>
          <h1 id="login-titulo" className={styles.title}>Suites Viena</h1>
          <p className={styles.subtitle}>Panel de dirección</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.error}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-email">
              <Mail size={14} />
              Email
            </label>
            <input
              id="login-email"
              className={styles.input}
              type="email"
              placeholder="admin@suitesviena.es"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-pass">
              <Lock size={14} />
              Contraseña
            </label>
            <div className={styles.passWrap}>
              <input
                id="login-pass"
                className={styles.input}
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPass(v => !v)}
                tabIndex={-1}
                aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading || !email || !password}
          >
            {loading ? 'Entrando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className={styles.footer}>
          Acceso exclusivo para dirección del hotel
        </p>
        <button type="button" className={styles.volver} onClick={cerrar}>
          <ArrowLeft size={14} />
          Volver a la web
        </button>
      </div>
    </div>
  )
}