import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar/Navbar'
import styles from './AdminLayout.module.css'

export default function AdminLayout() {
  const location = useLocation()

  /* El <body> lo comparten el panel y la web pública, y index.css le
     pinta encima los degradados de la web. Mientras hay una pantalla de
     /admin montada, el body se queda gris liso. Se limpia al salir. */
  useEffect(() => {
    document.body.classList.add('admin-activo')
    return () => document.body.classList.remove('admin-activo')
  }, [])

  return (
    <div className={styles.layout}>
      <main className={styles.main}>
        {/* key={pathname} fuerza a React a desmontar y volver a montar
            este div en cada navegación, que es lo que dispara la
            animación de entrada. Sin la key, React reutilizaría el nodo
            y la animación solo se vería la primera vez. */}
        <div key={location.pathname} className={styles.transicion}>
          <Outlet />
        </div>
      </main>

      <Navbar />
    </div>
  )
}
