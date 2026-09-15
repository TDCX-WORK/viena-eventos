import styles from './ToggleSwitch.module.css'

/* Interruptor compartido del panel. Lo estrena Ofertas y lo usará
   Precios, que hoy tiene el suyo propio copiado dentro de la pantalla.
   Es un <button> con aria-pressed, no un checkbox disfrazado: así
   funciona con teclado y los lectores de pantalla lo anuncian bien. */

export default function ToggleSwitch({ activo, onCambio, etiqueta, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      disabled={disabled}
      onClick={() => onCambio(!activo)}
      className={`${styles.pista} ${activo ? styles.encendida : ''}`}
    >
      <span className={styles.bolita} />
    </button>
  )
}
