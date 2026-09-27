import { Link } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { ENLACES_LEGALES } from '../../lib/legal'
import styles from './Footer.module.css'

/* ─────────────────────────────────────────────────────────────────────
   PIE DE PÁGINA

   Estaba escrito dentro de RoomSelector, así que solo existía en la
   portada: desde una ficha de sala o desde una página de uso no había
   forma de llegar a los textos legales. Y eso es justo lo que la LSSI
   pide que sea accesible desde cualquier punto de la web.

   Ahora es un componente y va en las cuatro vistas públicas: portada,
   ficha de sala, página de uso y las propias páginas legales.

   El enlace al panel se queda donde estaba —discreto, a la derecha—,
   pero ya no es lo único que hay aquí.
   ───────────────────────────────────────────────────────────────────── */

/* Precarga del panel al acercarse a la tuerca. El panel (sesión, login
   y cliente de Supabase) ya no va en el JavaScript de la web: se baja
   al entrar en /admin. Empezar la descarga en el hover o al tocar
   ahorra ese tiempo de espera al hacer clic. */
const precargarPanel = () => { import('../admin/AdminRaiz') }

export default function Footer() {
  const año = 2026   // fijo a propósito: new Date() rompería la hidratación

  return (
    <div className={styles.envoltura}>
      <footer className={styles.pie}>
        <nav className={styles.legales} aria-label="Información legal">
          <ul>
            {ENLACES_LEGALES.map(e => (
              <li key={e.ruta}>
                {/* Aviso legal y privacidad son los de la web del hotel
                    (ver lib/legal.js): se abren en pestaña nueva. */}
                {e.externo ? (
                  <a href={e.href} target="_blank" rel="noopener noreferrer">{e.titulo}</a>
                ) : (
                  <Link to={e.href}>{e.titulo}</Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.creditos}>
          <span>© {año} Suites Viena, S.L. · C/ Juan Álvarez Mendizábal, 17 · Madrid</span>
          <Link
            to="/admin"
            className={styles.admin}
            aria-label="Panel de administración"
            onPointerEnter={precargarPanel}
            onFocus={precargarPanel}
          >
            <Settings size={15} />
          </Link>
        </div>
      </footer>
    </div>
  )
}