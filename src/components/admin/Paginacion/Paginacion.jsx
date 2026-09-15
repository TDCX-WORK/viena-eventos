import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import styles from './Paginacion.module.css'

/* ─────────────────────────────────────────────────────────────────────
   Paginación compartida del panel. La estrena el Inicio y la usarán
   Reservas y Fotos.

   PAGINA LO QUE SE PINTA, NO LO QUE SE CONSULTA. La consulta trae la
   lista entera y aquí solo se dibuja un trozo. Es a propósito: los
   contadores de arriba y cualquier exportación futura tienen que ver
   TODO, y si la consulta trajera solo una página darían cifras falsas
   sin avisar. El volumen de este proyecto no justifica lo contrario.

   ES UN COMPONENTE TONTO. No guarda la página: la recibe y avisa. Así
   quien lo usa decide cuándo volver a la primera, que es lo que hay que
   hacer cada vez que cambia un filtro.
   ───────────────────────────────────────────────────────────────────── */

// Cuántos números se enseñan a cada lado del actual antes de recortar.
const VENTANA = 1

function construirPaginas(actual, ultima) {
  if (ultima <= 7) {
    return Array.from({ length: ultima }, (_, i) => i + 1)
  }

  const paginas = new Set([1, ultima, actual])
  for (let i = 1; i <= VENTANA; i++) {
    if (actual - i > 1) paginas.add(actual - i)
    if (actual + i < ultima) paginas.add(actual + i)
  }

  const ordenadas = [...paginas].sort((a, b) => a - b)

  const conHuecos = []
  ordenadas.forEach((p, i) => {
    if (i > 0 && p - ordenadas[i - 1] > 1) conHuecos.push('…')
    conHuecos.push(p)
  })
  return conHuecos
}

export default function Paginacion({
  total,
  pagina,
  porPagina,
  onCambio,
  etiqueta = 'registros',
}) {
  const ultima = Math.ceil(total / porPagina)

  // Con una sola página no hay nada que paginar y solo estorbaría.
  if (ultima <= 1) return null

  const desde = (pagina - 1) * porPagina + 1
  const hasta = Math.min(pagina * porPagina, total)

  function ir(p) {
    if (p < 1 || p > ultima || p === pagina) return
    onCambio(p)
  }

  return (
    <div className={styles.wrap}>
      <span className={styles.info}>
        Mostrando {desde}–{hasta} de {total} {etiqueta}
      </span>

      <div className={styles.controles}>
        <button
          type="button"
          className={styles.flecha}
          onClick={() => ir(pagina - 1)}
          disabled={pagina === 1}
          aria-label="Página anterior"
        >
          <IconChevronLeft size={16} stroke={2} />
        </button>

        {construirPaginas(pagina, ultima).map((p, i) => (
          p === '…' ? (
            <span key={`hueco-${i}`} className={styles.hueco}>…</span>
          ) : (
            <button
              key={p}
              type="button"
              className={`${styles.numero} ${p === pagina ? styles.activo : ''}`}
              onClick={() => ir(p)}
              aria-label={`Página ${p}`}
              aria-current={p === pagina ? 'page' : undefined}
            >
              {p}
            </button>
          )
        ))}

        <button
          type="button"
          className={styles.flecha}
          onClick={() => ir(pagina + 1)}
          disabled={pagina === ultima}
          aria-label="Página siguiente"
        >
          <IconChevronRight size={16} stroke={2} />
        </button>
      </div>
    </div>
  )
}
