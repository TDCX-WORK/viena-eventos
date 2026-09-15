import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  IconLayoutDashboard,
  IconBook,
  IconCalendarOff,
  IconCurrencyEuro,
  IconTag,
  IconPhoto,
  IconSettings,
  IconHelpCircle,
  IconPlus,
  IconExternalLink,
  IconLogout,
} from '@tabler/icons-react'
import { useAuth } from '../../../contexts/AuthContext'
import styles from './Navbar.module.css'

/* ─────────────────────────────────────────────────────────────────────
   Navegación del panel: píldora flotante centrada abajo, con un
   indicador granate que se desliza bajo el elemento activo. Sustituye a
   la barra lateral.

   Cómo funciona el indicador: es un div en position absolute cuyo left y
   width se calculan en JS midiendo el botón activo. No se puede hacer
   solo con CSS porque cada elemento tiene un ancho distinto (el texto
   manda). Arranca con opacity 0 y solo se enciende cuando ya se ha
   medido, para que no dé el salto desde la esquina izquierda en el
   primer pintado.

   Se vuelve a medir en tres momentos: al cambiar de ruta, al
   redimensionar la ventana y cuando termina de cargar la tipografía.
   Este último importa: hasta que Inter no está lista el navegador pinta
   con la fuente de sistema, los anchos son otros y el indicador se
   queda descolocado unos milisegundos.
   ───────────────────────────────────────────────────────────────────── */

/* 1140 y no los 768 del sistema de diseño: son OCHO elementos con
   etiqueta, y "Disponibilidad" es larga. Por debajo de ese ancho la
   píldora no cabe y se desborda por los lados, así que entra el modo
   móvil, que sí encaja siempre.

   Estaba en 1024 con siete elementos. Al añadir "Dudas" hubo que
   subirlo: si se añade otra pantalla más, hay que volver a subirlo o
   pasar a acortar etiquetas. */
const ANCHO_ESCRITORIO = 1140

const ITEMS = [
  { path: '/admin',                icon: IconLayoutDashboard, label: 'Inicio', exacto: true },
  { path: '/admin/reservas',       icon: IconBook,            label: 'Reservas' },
  { path: '/admin/disponibilidad', icon: IconCalendarOff,     label: 'Disponibilidad' },
  { path: '/admin/precios',        icon: IconCurrencyEuro,    label: 'Precios' },
  { path: '/admin/ofertas',        icon: IconTag,             label: 'Ofertas' },
  { path: '/admin/fotos',          icon: IconPhoto,           label: 'Fotos' },
  { path: '/admin/faq',            icon: IconHelpCircle,      label: 'Dudas' },
  { path: '/admin/config',         icon: IconSettings,        label: 'Ajustes' },
]

/* En móvil solo caben dos en la barra; el resto vive detrás del "+".
   Se dejan fuera las dos pantallas del trabajo diario. */
const MOVIL_PRINCIPAL = ['/admin', '/admin/reservas']

/* Qué elemento está activo. No vale con comparar pathname === path
   porque "/admin" sería activo en todas las rutas hijas; y si algún día
   hay un detalle tipo /admin/reservas/:id, la barra se quedaría sin
   nada marcado. Gana la coincidencia más larga. */
function indiceActivo(items, pathname) {
  let mejor = -1
  let largo = -1
  items.forEach((item, i) => {
    const coincide = item.exacto
      ? pathname === item.path
      : pathname === item.path || pathname.startsWith(item.path + '/')
    if (coincide && item.path.length > largo) {
      mejor = i
      largo = item.path.length
    }
  })
  return mejor
}

function useEsMovil() {
  const [esMovil, setEsMovil] = useState(
    () => window.matchMedia(`(max-width: ${ANCHO_ESCRITORIO - 1}px)`).matches
  )
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${ANCHO_ESCRITORIO - 1}px)`)
    const alCambiar = (e) => setEsMovil(e.matches)
    mq.addEventListener('change', alCambiar)
    return () => mq.removeEventListener('change', alCambiar)
  }, [])
  return esMovil
}

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const esMovil = useEsMovil()
  const { signOut } = useAuth()

  const [menuAbierto, setMenuAbierto] = useState(false)

  const navRef = useRef(null)
  const indicadorRef = useRef(null)

  const itemsMovil = ITEMS.filter(i => MOVIL_PRINCIPAL.includes(i.path))
  const itemsExtra = ITEMS.filter(i => !MOVIL_PRINCIPAL.includes(i.path))

  const listaVisible = esMovil ? itemsMovil : ITEMS
  const activo = indiceActivo(listaVisible, location.pathname)

  const colocarIndicador = useCallback(() => {
    const nav = navRef.current
    const ind = indicadorRef.current
    if (!nav || !ind) return

    // Sin coincidencia (por ejemplo, en móvil estando en Precios) el
    // indicador se apaga en lugar de quedarse señalando algo que no es.
    if (activo === -1) {
      ind.style.opacity = '0'
      return
    }

    const botones = nav.querySelectorAll('[data-navitem]')
    const el = botones[activo]
    if (!el) return

    const cajaNav = nav.getBoundingClientRect()
    const cajaEl = el.getBoundingClientRect()
    ind.style.left = `${cajaEl.left - cajaNav.left}px`
    ind.style.width = `${cajaEl.width}px`
    // La opacidad se toca por DOM y no con un useState: llamar a
    // setState dentro de un efecto encadena un render extra en cada
    // medición, que es justo lo que avisa
    // react-hooks/set-state-in-effect. El indicador ya se coloca
    // manipulando el nodo, así que encenderlo igual es coherente.
    ind.style.opacity = '1'
  }, [activo])

  // useLayoutEffect y no useEffect: coloca el indicador antes del
  // pintado, así no se ve nunca en una posición equivocada.
  useLayoutEffect(() => {
    colocarIndicador()
  }, [colocarIndicador, esMovil])

  useEffect(() => {
    window.addEventListener('resize', colocarIndicador)
    document.fonts?.ready.then(colocarIndicador)
    return () => window.removeEventListener('resize', colocarIndicador)
  }, [colocarIndicador])

  function irA(path) {
    setMenuAbierto(false)
    navigate(path)
  }

  async function cerrarSesion() {
    setMenuAbierto(false)
    try {
      await signOut()
    } finally {
      navigate('/', { replace: true })
    }
  }

  const acciones = (
    <>
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.accion}
        title="Ver la web pública"
        aria-label="Ver la web pública"
      >
        <IconExternalLink size={18} stroke={1.75} />
      </a>
      <button
        type="button"
        className={`${styles.accion} ${styles.accionSalir}`}
        onClick={cerrarSesion}
        title="Cerrar sesión"
        aria-label="Cerrar sesión"
      >
        <IconLogout size={18} stroke={1.75} />
      </button>
    </>
  )

  if (!esMovil) {
    return (
      <div className={styles.escritorioWrap}>
        <nav className={styles.escritorioNav} ref={navRef} aria-label="Secciones del panel">
          <div
            ref={indicadorRef}
            className={styles.indicador}
            aria-hidden="true"
          />
          {ITEMS.map((item, i) => {
            const Icono = item.icon
            const esActivo = i === activo
            return (
              <button
                key={item.path}
                type="button"
                data-navitem
                className={`${styles.item} ${esActivo ? styles.activo : ''}`}
                onClick={() => irA(item.path)}
                aria-current={esActivo ? 'page' : undefined}
              >
                <Icono size={20} stroke={1.75} />
                {item.label}
              </button>
            )
          })}

          <span className={styles.separador} aria-hidden="true" />
          {acciones}
        </nav>
      </div>
    )
  }

  return (
    <div className={styles.movilWrap}>
      <div
        className={`${styles.movilDesplegable} ${menuAbierto ? styles.abierto : ''}`}
        /* inert quita del foco y del lector de pantalla todo lo que hay
           dentro mientras el panel está plegado. Sin esto se puede
           tabular a botones invisibles. */
        inert={menuAbierto ? undefined : ''}
      >
        {itemsExtra.map(item => {
          const Icono = item.icon
          const esActivo = indiceActivo([item], location.pathname) === 0
          return (
            <button
              key={item.path}
              type="button"
              className={`${styles.itemDesplegable} ${esActivo ? styles.itemDesplegableActivo : ''}`}
              onClick={() => irA(item.path)}
              aria-current={esActivo ? 'page' : undefined}
            >
              <Icono size={22} stroke={1.75} />
              {item.label}
            </button>
          )
        })}

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.itemDesplegable}
          onClick={() => setMenuAbierto(false)}
        >
          <IconExternalLink size={22} stroke={1.75} />
          Ver la web
        </a>

        <button
          type="button"
          className={`${styles.itemDesplegable} ${styles.itemSalir}`}
          onClick={cerrarSesion}
        >
          <IconLogout size={22} stroke={1.75} />
          Cerrar sesión
        </button>
      </div>

      <nav className={styles.movilNav} ref={navRef} aria-label="Secciones del panel">
        <div
          ref={indicadorRef}
          className={styles.indicadorMovil}
          aria-hidden="true"
        />
        {itemsMovil.map((item, i) => {
          const Icono = item.icon
          const esActivo = i === activo
          return (
            <button
              key={item.path}
              type="button"
              data-navitem
              className={`${styles.itemMovil} ${esActivo ? styles.activo : ''}`}
              onClick={() => irA(item.path)}
              aria-current={esActivo ? 'page' : undefined}
            >
              <Icono size={26} stroke={1.75} />
              <span>{item.label}</span>
            </button>
          )
        })}

        <button
          type="button"
          className={`${styles.masBtn} ${menuAbierto ? styles.masActivo : ''}`}
          onClick={() => setMenuAbierto(v => !v)}
          aria-label={menuAbierto ? 'Cerrar el menú' : 'Más secciones'}
          aria-expanded={menuAbierto}
        >
          <IconPlus
            size={26}
            stroke={1.75}
            className={`${styles.mas} ${menuAbierto ? styles.masGirado : ''}`}
          />
        </button>
      </nav>
    </div>
  )
}
