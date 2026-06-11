import { ArrowLeft, ArrowRight, Send, Loader } from 'lucide-react'
import styles from './WizardNav.module.css'

/**
 * WizardNav — barra de navegación sticky compartida por todos los steps.
 *
 * Props:
 *  onPrev       — función para ir atrás (si undefined, no se muestra el botón back)
 *  onNext       — función para ir al siguiente paso
 *  canNext      — boolean, desactiva el botón primario si false
 *  nextLabel    — texto del botón primario (default: "Siguiente")
 *  isSubmit     — si true, muestra icono Send y semántica de envío
 *  isLoading    — muestra spinner en el botón primario
 *  loadingLabel — texto mientras carga (default: "Enviando...")
 */
export default function WizardNav({
  onPrev,
  onNext,
  canNext = true,
  nextLabel = 'Siguiente',
  isSubmit = false,
  isLoading = false,
  loadingLabel = 'Enviando...',
}) {
  return (
    <div className={styles.bar}>
      {onPrev && (
        <button
          className={styles.back}
          onClick={onPrev}
          disabled={isLoading}
          aria-label="Paso anterior"
        >
          <ArrowLeft size={14} />
          <span>Volver</span>
        </button>
      )}

      <button
        className={`${styles.next} ${isSubmit ? styles.submit : ''}`}
        onClick={onNext}
        disabled={!canNext || isLoading}
        aria-label={nextLabel}
      >
        {isLoading ? (
          <>
            <Loader size={14} className={styles.spinner} />
            <span>{loadingLabel}</span>
          </>
        ) : (
          <>
            <span>{nextLabel}</span>
            {isSubmit ? <Send size={14} /> : <ArrowRight size={14} />}
          </>
        )}
      </button>
    </div>
  )
}
