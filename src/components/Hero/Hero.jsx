import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Phone, MapPin, ArrowUpRight, Menu, X, Ticket } from 'lucide-react'
// Lucide no trae logos de marca. Tabler sí, con el mismo trazo, y ya
// está instalado por el panel: solo viaja este icono.
import { IconBrandWhatsapp } from '@tabler/icons-react'
import { estadoOferta, etiquetaDescuento } from '../../lib/ofertas'
import { HOTEL_ESTATICO, DATOS_HERO_ESTATICOS } from '../../lib/hotelEstatico'
import styles from './Hero.module.css'

/* Foto de fondo: el Templo de Debod reflejado en el estanque, a cinco
   minutos andando del hotel. Dice "Plaza de España" sin tener que
   escribirlo. Es una foto de día y muy luminosa: el velo y el filtro
   de Hero.module.css están ajustados a ella.

   Vive en /public y NO en Supabase ni en src/assets, a propósito: es el
   elemento LCP de la página.

   · Desde el bucket no se pintaría hasta que arranca React y resuelve
     el fetch de `hotels`. Google mide justo eso.
   · Importada desde src/assets, Vite le pone hash en el nombre y el
     `<link rel="preload">` del index.html no podría apuntarla.

   Para cambiar la foto se sustituyen los ficheros; los nombres no se
   tocan. */
/* VERSIÓN DE LA FOTO. Las fotos se cachean 30 días (public/_headers) y
   se llaman siempre igual, así que al sustituirlas los navegadores
   seguían enseñando la vieja. Al cambiar de foto: sustituir los ficheros
   y SUBIR ESTE NÚMERO aquí y en las dos precargas de index.html (tienen
   que coincidir exactamente o el móvil descarga la foto dos veces).
   Para el navegador es una dirección nueva y la pide al momento. */
const V = '?v=2'

const HERO_SRC = `/hero-2000.webp${V}`
const HERO_SRCSET = `/hero-800.webp${V} 800w, /hero-1280.webp${V} 1280w, /hero-2000.webp${V} 2000w`

/* Recorte vertical para móvil. Con el apaisado, en una pantalla de
   390 px de ancho la tarjeta es tan alta que `object-fit: cover` se
   queda con un trozo del pilono y el templo no se reconoce. */
const HERO_SRCSET_VERT = `/hero-vert-500.webp${V} 500w, /hero-vert-760.webp${V} 760w`

const ID_SALAS = 'salas'

/* Enlace a Google Maps. Se busca por nombre + dirección y no solo por
   la dirección: así el mapa abre la ficha del hotel (fotos, horario,
   reseñas) en lugar de un chincheta sin nombre. */
const urlMapa = (direccion) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Suites Viena Plaza de España, ${direccion}`)}`

/* Los enlaces del menú apuntan a secciones de esta misma página
   (#salas, #faq y #contacto). Si una sección no está pintada todavía,
   el enlace no hace nada en lugar de llevarte a ninguna parte. */
const ENLACES = [
  { id: ID_SALAS,  label: 'Reserva' },
  { id: 'faq',      label: 'Dudas frecuentes' },
  { id: 'contacto', label: 'Contacto' },
]

/** La oferta que se anuncia en el hero: la de mayor prioridad entre las
 *  que hoy están realmente vigentes. `offers_publicas` ya filtra las que
 *  llevan código, pero no las caducadas ni las programadas. */
function ofertaDestacada(ofertas) {
  if (!Array.isArray(ofertas) || ofertas.length === 0) return null
  return (
    ofertas
      .filter(o => estadoOferta(o) === 'activa')
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0] || null
  )
}

export default function Hero({ hotel: hotelReal, ofertas = [] }) {
  /* Mientras no llega Supabase, `hotelReal` es null y se tira de los
     datos estáticos. Ver lib/hotelEstatico.js. */
  const hotel = hotelReal || HOTEL_ESTATICO
  const salas = hotelReal?.rooms
  const [menuAbierto, setMenuAbierto] = useState(false)

  const direccion = hotel.address || HOTEL_ESTATICO.address
  const telefono = hotel.phone?.replace(/\s/g, '')
  const whatsapp = hotel.whatsapp?.replace(/\D/g, '')

  /* Todas las cifras del hero salen de la base de datos. Si mañana se
     cambia un precio o se añade una sala desde el panel, el hero se
     entera solo. */
  const datos = useMemo(() => {
    if (!salas || salas.length === 0) return DATOS_HERO_ESTATICOS

    const tam = salas.map(r => r.size).filter(Boolean)
    const pax = salas.flatMap(r => (r.layouts || []).map(l => l.max)).filter(Boolean)
    const precios = salas.map(r => r.pricing?.halfDay).filter(Boolean)

    return {
      nSalas: salas.length,
      minM2: tam.length ? Math.min(...tam) : null,
      maxM2: tam.length ? Math.max(...tam) : null,
      maxPax: pax.length ? Math.max(...pax) : null,
      desde: precios.length ? Math.min(...precios) : null,
      moneda: salas[0]?.pricing?.currency || '€',
      luzNatural: salas.some(r => r.naturalLight),
    }
  }, [salas])

  const oferta = useMemo(() => ofertaDestacada(ofertas), [ofertas])

  const irA = (id) => (e) => {
    const destino = document.getElementById(id)
    if (!destino) return                  // sección todavía no construida
    e?.preventDefault()
    setMenuAbierto(false)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    destino.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <header className={styles.hero}>
      <div className={styles.card}>

        {/* Fondo. <img> y no background-image: así el navegador lo
            descubre en el HTML inicial y `fetchpriority` tiene efecto. */}
        <picture className={styles.picture}>
          <source media="(max-width: 599px)" srcSet={HERO_SRCSET_VERT} sizes="100vw" />
          <img
            src={HERO_SRC}
            srcSet={HERO_SRCSET}
            sizes="100vw"
            alt=""
            aria-hidden="true"
            className={styles.bg}
            fetchPriority="high"
            decoding="async"
          />
        </picture>
        <div className={styles.veil} aria-hidden="true" />

        <div className={styles.inner}>

          {/* ── Navegación ── */}
          <nav className={styles.nav} aria-label="Principal">
            {/* El logo lleva a la portada de ESTA web, no a la del hotel.
                Como el hero solo está en la portada, además sube arriba
                del todo (Link a la misma ruta no hace scroll solo). */}
            <Link
              to="/"
              className={styles.brand}
              aria-label="Suites Viena: inicio"
              onClick={() => {
                const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
                window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
              }}
            >
              <span className={styles.brandMark} aria-hidden="true">SV</span>
              <span className={styles.brandText}>Suites Viena</span>
            </Link>

            <ul className={styles.navLinks}>
              {ENLACES.map(l => (
                <li key={l.id}>
                  <a className={styles.navLink} href={`#${l.id}`} onClick={irA(l.id)}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className={styles.navRight}>
              {/* ── Contacto: dirección, teléfono y WhatsApp ──
                  Tres píldoras que se abren y cierran como un acordeón:
                  solo una enseña su texto a la vez, así el grupo mide
                  siempre más o menos lo mismo y la barra no baila.

                  · Por defecto está abierta la dirección, cuando cabe
                    (ver .chipDir en el CSS para los anchos).
                  · Con ratón, al pasar por el teléfono o el WhatsApp se
                    abre ese y se cierra la dirección.
                  · En pantallas táctiles no hay hover: cada icono hace
                    directamente su acción (llamar, abrir WhatsApp, abrir
                    el mapa). Pedir dos toques para llamar sería peor.

                  La dirección va la PRIMERA: al estar el grupo pegado a
                  la derecha, las píldoras crecen hacia la izquierda y la
                  que tienes debajo del ratón no se escapa. */}
              <ul className={styles.contacto}>
                {direccion && (
                  <li className={styles.chipItem}>
                    <a
                      className={`${styles.chip} ${styles.chipDir}`}
                      href={urlMapa(direccion)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Cómo llegar: ${direccion} (abre Google Maps)`}
                      title={direccion}
                    >
                      <MapPin size={16} strokeWidth={2.2} aria-hidden="true" />
                      <span className={styles.chipLabel}><span>{direccion}</span></span>
                    </a>
                  </li>
                )}

                {telefono && (
                  <li className={styles.chipItem}>
                    <a
                      className={styles.chip}
                      href={`tel:${telefono}`}
                      aria-label={`Llamar al ${hotel.phone}`}
                    >
                      <Phone size={15} strokeWidth={2.2} aria-hidden="true" />
                      <span className={styles.chipLabel}><span>{hotel.phone}</span></span>
                    </a>
                  </li>
                )}

                {whatsapp && (
                  <li className={styles.chipItem}>
                    <a
                      className={`${styles.chip} ${styles.chipWa}`}
                      href={`https://wa.me/${whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Escribir por WhatsApp al ${hotel.whatsapp}`}
                    >
                      <IconBrandWhatsapp size={17} stroke={2} aria-hidden="true" />
                      <span className={styles.chipLabel}><span>{hotel.whatsapp}</span></span>
                    </a>
                  </li>
                )}
              </ul>

              <button
                type="button"
                className={styles.burger}
                onClick={() => setMenuAbierto(v => !v)}
                aria-expanded={menuAbierto}
                aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
              >
                {menuAbierto ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </nav>

          {/* Menú desplegable. Solo se ve por debajo de 900 px, donde los
              enlaces no caben en la barra. */}
          {menuAbierto && (
            <div className={styles.navPanel}>
              <ul className={styles.navPanelLinks}>
                {ENLACES.map(l => (
                  <li key={l.id}>
                    <a className={styles.navPanelLink} href={`#${l.id}`} onClick={irA(l.id)}>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>

              {/* En móvil los iconos de arriba no enseñan el texto, así
                  que aquí va todo escrito: es donde alguien busca la
                  dirección para copiarla o el número para apuntarlo. */}
              <ul className={styles.navPanelContacto}>
                {direccion && (
                  <li>
                    <a className={styles.navPanelDato} href={urlMapa(direccion)} target="_blank" rel="noopener noreferrer">
                      <MapPin size={16} strokeWidth={2.2} aria-hidden="true" />
                      {direccion}
                    </a>
                  </li>
                )}
                {telefono && (
                  <li>
                    <a className={styles.navPanelDato} href={`tel:${telefono}`}>
                      <Phone size={16} strokeWidth={2.2} aria-hidden="true" />
                      {hotel.phone}
                    </a>
                  </li>
                )}
                {whatsapp && (
                  <li>
                    <a className={styles.navPanelDato} href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">
                      <IconBrandWhatsapp size={17} stroke={2} aria-hidden="true" />
                      WhatsApp · {hotel.whatsapp}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* ── Titular, arriba ── */}
          <div className={styles.top}>
            <p className={styles.eyebrow}>
              <span className={styles.eyebrowMark} aria-hidden="true" />
              {hotel.location || HOTEL_ESTATICO.location}
            </p>

            {/* El h1 lleva la keyword principal tal cual se busca. La de
                cola larga ("Plaza de España") va en el párrafo de abajo,
                que cabe entera sin partir el titular. */}
            <h1 className={styles.title}>
              Salas de reuniones en Madrid centro.
            </h1>

            {/* La oferta vigente, pegada al titular: es lo primero que
                interesa después de saber qué se vende. Solo aparece si
                hay alguna activa hoy. */}
            {oferta && (
              <aside className={styles.oferta}>
                <span className={styles.ofertaIcono} aria-hidden="true">
                  <Ticket size={14} strokeWidth={2.3} />
                </span>
                <span className={styles.ofertaTag}>{etiquetaDescuento(oferta)}</span>
                <p className={styles.ofertaTexto}>
                  <strong>{oferta.name}</strong>
                  {oferta.description ? (
                    <span className={styles.ofertaDesc}> · {oferta.description}</span>
                  ) : null}
                </p>
              </aside>
            )}
          </div>

          {/* ── Pie ──
              El párrafo va justo encima de los botones, a la derecha, y
              los datos sueltos abajo a la izquierda. En móvil todo cae en
              una columna en este mismo orden. */}
          <div className={styles.bottom}>

            <div className={styles.bottomRight}>
              {/* Los espacios explícitos antes de cada <br> son a
                  propósito: en móvil el CSS oculta los saltos y sin
                  ellos las frases se pegarían unas a otras. */}
              <p className={styles.lead}>
                A un paso de Plaza de España.{' '}<br />
                Reuniones, formaciones y presentaciones
                {datos?.maxPax ? ` de hasta ${datos.maxPax} personas` : ''}.{' '}<br />
                Equipamiento completo y catering propio.
              </p>

              {datos?.desde != null && (
                <p className={styles.price}>
                  Desde <strong>{datos.desde} {datos.moneda}</strong> media jornada
                </p>
              )}

              <div className={styles.buttons}>
                <button type="button" className={styles.ctaMain} onClick={irA(ID_SALAS)}>
                  Ver salas y precios
                  <ArrowUpRight size={17} strokeWidth={2.4} />
                </button>

                {whatsapp && (
                  <a
                    className={styles.ctaGhost}
                    href={`https://wa.me/${whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp
                    <ArrowUpRight size={17} strokeWidth={2.4} />
                  </a>
                )}
              </div>
            </div>

            <div className={styles.bottomLeft}>
              {datos && (
                <ul className={styles.facts}>
                  <li className={styles.fact}>
                    <span className={styles.factPlus} aria-hidden="true">+</span>
                    {datos.nSalas} salas de {datos.minM2} a {datos.maxM2} m²
                  </li>
                  <li className={styles.fact}>
                    <span className={styles.factPlus} aria-hidden="true">+</span>
                    Hasta {datos.maxPax} personas
                  </li>
                  <li className={styles.fact}>
                    <span className={styles.factPlus} aria-hidden="true">+</span>
                    {datos.luzNatural ? 'Luz natural y catering' : 'Catering propio'}
                  </li>
                </ul>
              )}
            </div>
          </div>

        </div>
      </div>
    </header>
  )
}

export { ID_SALAS }