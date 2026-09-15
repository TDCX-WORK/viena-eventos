import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { IconX } from '@tabler/icons-react'
import styles from './Modal.module.css'

/* ─────────────────────────────────────────────────────────────────────
   La ventana modal del panel, escrita UNA vez.

   Se crea ahora, con Reservas, y la usarán también Disponibilidad,
   Fotos y Config. El objetivo es no repetir el overlay en cada pantalla:
   cuando eso pasa, un solo fallo obliga a tocar ocho hojas de estilo.

   DOS FORMAS:
     variante="panel"     Cabecera con título y aspa, cuerpo con scroll y
                          pie fijo de botones. Para formularios.
     variante="centrado"  Tarjeta corta y centrada, sin cabecera ni pie.
                          El icono, el título, el texto y las acciones
                          los pone la pantalla. Para confirmaciones.

   POR QUÉ VA POR PORTAL A document.body: así ningún contexto de apilado
   la puede encerrar. El div de la transición de página de AdminLayout
   crearía uno si animara transform, y el modal quedaría por debajo de la
   navbar sin poder pulsarse.

   CUIDADO AL USARLA CON onEnviar: dentro de un <form>, un <button> sin
   type es type="submit". Los botones de cancelar necesitan
   type="button" explícito o cerrarán enviando el formulario.
   ───────────────────────────────────────────────────────────────────── */

export default function Modal({
  abierto,
  onCerrar,
  titulo,
  pie,
  ancho = 520,
  variante = 'panel',
  bloqueado = false,
  onEnviar,
  children,
}) {
  useEffect(() => {
    if (!abierto) return

    function alPulsar(e) {
      if (e.key === 'Escape' && !bloqueado) onCerrar?.()
    }

    document.addEventListener('keydown', alPulsar)

    // Se guarda el valor anterior y se restaura tal cual, en vez de
    // ponerlo a '': si algo más estaba controlando el overflow del body,
    // no se le pisa.
    const overflowPrevio = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', alPulsar)
      document.body.style.overflow = overflowPrevio
    }
  }, [abierto, bloqueado, onCerrar])

  if (!abierto) return null

  const Contenedor = onEnviar ? 'form' : 'div'
  const propsContenedor = onEnviar
    ? { onSubmit: (e) => { e.preventDefault(); onEnviar() } }
    : {}

  return createPortal(
    <div
      className={styles.overlay}
      onClick={() => { if (!bloqueado) onCerrar?.() }}
    >
      <Contenedor
        {...propsContenedor}
        className={`${styles.modal} ${variante === 'centrado' ? styles.centrado : styles.panel}`}
        style={{ maxWidth: `${ancho}px` }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {titulo && (
          <div className={styles.header}>
            <h2 className={styles.titulo}>{titulo}</h2>
            {/* Con bloqueado, el aspa NO se pinta. Un botón visible que
                no responde parece roto. */}
            {!bloqueado && (
              <button
                type="button"
                className={styles.cerrar}
                onClick={() => onCerrar?.()}
                aria-label="Cerrar"
              >
                <IconX size={20} stroke={1.75} />
              </button>
            )}
          </div>
        )}

        <div className={styles.body}>{children}</div>

        {pie && <div className={styles.pie}>{pie}</div>}
      </Contenedor>
    </div>,
    document.body,
  )
}
