import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Sun, Users, Maximize2, ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Wifi, Monitor, FileText, Droplets, Check } from 'lucide-react'
/* Sin framer-motion: el carrusel, la flecha y el acordeón se animan
   con CSS. framer-motion son ~120 kB de JavaScript que el móvil tenía
   que descargar y ejecutar antes de pintar la portada, para tres
   animaciones que el navegador hace solo. Sigue usándose en el wizard
   de reserva, que va en un fichero aparte. */
import { getOptimizedUrl, IMAGE_SIZES } from '../../lib/imageUtils'
import { rutaSala } from '../../lib/seo'
import styles from './RoomCard.module.css'

import teatroSvg   from '../../assets/layouts/teatro.svg?url'
import uSvg        from '../../assets/layouts/u.svg?url'
import imperialSvg from '../../assets/layouts/imperial.svg?url'
import escuelaSvg  from '../../assets/layouts/escuela.svg?url'

const LAYOUT_SVGS = {
  teatro:   teatroSvg,
  u:        uSvg,
  imperial: imperialSvg,
  escuela:  escuelaSvg,
}

const AMENITY_ICONS = {
  wifi:      { icon: Wifi,      label: 'WiFi' },
  proyector: { icon: Monitor,   label: 'Proyector' },
  pantalla:  { icon: Monitor,   label: 'Pantalla' },
  flipchart: { icon: FileText,  label: 'Flip chart' },
  agua:      { icon: Droplets,  label: 'Agua' },
  material:  { icon: FileText,  label: 'Material oficina' },
}

function getCarouselImages(room) {
  return room.images && room.images.length > 0
    ? room.images
    : [room.image]
}

const DEFAULT_BADGE_COLOR = '#B8860B'

export default function RoomCard({ room, onSelect, oferta = null }) {
  const [isOpen, setIsOpen]     = useState(false)
  /* El contenido del acordeón no se pinta hasta la primera vez que se
     abre: así no engorda el HTML de la portada (lleva los dibujos de
     los montajes). Una vez montado se queda, para que al cerrar se vea
     la animación. */
  const [montado, setMontado]   = useState(false)
  /* Si ya se ha usado el carrusel. Hasta entonces la foto no lleva
     fundido: la primera viene en el HTML y se pinta tal cual. */
  const [navegado, setNavegado] = useState(false)
  const [photoIdx, setPhotoIdx] = useState(0)
  const [imgLoaded, setImgLoaded] = useState({})
  /* Precarga de las fotos vecinas del carrusel, solo cuando hay
     intención de usarlo. Antes se hacía al montar la tarjeta: con 3
     salas y 3 fotos cada una, la portada descargaba las 9 fotos a
     tamaño original nada más abrirse, sin que nadie hubiera bajado a
     verlas ni tocado una flecha. Ver `interesado` más abajo. */
  const [interesado, setInteresado] = useState(false)

  const maxCapacity = Math.max(...room.layouts.map(l => l.max))
  const images = getCarouselImages(room)
  const badgeColor = room.hoverBadgeColor || DEFAULT_BADGE_COLOR

  // Precarga de la foto anterior y la siguiente, una vez hay interés.
  useEffect(() => {
    if (!interesado || images.length < 2) return
    const toPreload = [
      (photoIdx + 1) % images.length,
      (photoIdx - 1 + images.length) % images.length,
    ]
    toPreload.forEach(idx => {
      if (!imgLoaded[idx]) {
        const img = new Image()
        img.src = getOptimizedUrl(images[idx], IMAGE_SIZES.cardImage)
      }
    })
  }, [interesado, photoIdx, images, imgLoaded])

  /* El ratón entra en la foto, un dedo la toca o el teclado llega a una
     flecha. Los pointer events cubren también el táctil: el
     pointerenter salta al empezar el toque, antes del clic. */
  const marcarInteres = () => { if (!interesado) setInteresado(true) }

  /* El brillo de "cargando" solo mientras no hay ninguna foto pintada.
     Era una animación infinita de background-position: no la hace la
     tarjeta gráfica, obliga a repintar la zona en cada fotograma, y
     seguía viva debajo de la foto para siempre. Con tres tarjetas en
     pantalla eran tres repintados por fotograma de una zona que
     contiene fotos de varios megapíxeles: el ventilador. */
  const algunaCargada = Object.keys(imgLoaded).length > 0

  /* Abrir la primera vez: se monta el contenido cerrado y, dos
     fotogramas después, se abre. Con un solo fotograma el navegador
     aún no ha pintado el estado cerrado y no hay transición. */
  const alternar = () => {
    if (!montado) {
      setMontado(true)
      requestAnimationFrame(() => requestAnimationFrame(() => setIsOpen(true)))
      return
    }
    setIsOpen(v => !v)
  }

  const prevPhoto = (e) => {
    e.stopPropagation()
    setNavegado(true)
    setPhotoIdx(i => (i - 1 + images.length) % images.length)
  }
  const nextPhoto = (e) => {
    e.stopPropagation()
    setNavegado(true)
    setPhotoIdx(i => (i + 1) % images.length)
  }

  return (
    <div className={styles.cardOuter} style={{ '--badge-color': badgeColor }}>

      {/* ── Badge hover — sale por arriba de la card ── */}
      {room.hoverBadge && (
        <span className={styles.hoverBadge} aria-hidden="true">
          {room.hoverBadge}
        </span>
      )}

      <article className={styles.card}>

      {/* ── FOTO CON CARRUSEL ── */}
      <div className={styles.imageContainer}>
        <div
          className={`${styles.imageWrapper} ${algunaCargada ? styles.imageWrapperListo : ''}`}
          onPointerEnter={marcarInteres}
          onFocus={marcarInteres}
        >
          {/* key por foto: cada cambio monta un <img> nuevo y la
              animación CSS de entrada (.image) hace el fundido. */}
            <img
              key={photoIdx}
              src={getOptimizedUrl(images[photoIdx], IMAGE_SIZES.cardImage)}
              alt={`${room.name} — foto ${photoIdx + 1}`}
              className={`${styles.image} ${navegado ? styles.imageFundido : ''}`}
              /* lazy: sin esto, el prerender de React 19 mete un preload
                 de cada foto de sala delante del HTML, y compiten con la
                 foto del hero, que es la que mide Google. */
              loading="lazy"
              decoding="async"
              onLoad={() => setImgLoaded(prev => ({ ...prev, [photoIdx]: true }))}
            />

          <div className={styles.imageGradient} />

          {/* La pastilla de "Más solicitada" se quitó: la tapaba la cinta
              de la oferta, que dice algo más útil. El campo `badge` sigue
              en la base de datos y en la pestaña de Fotos por si vuelve. */}

          {/* Flechas carrusel */}
          <button className={`${styles.carouselBtn} ${styles.carouselPrev}`} onClick={prevPhoto} aria-label="Foto anterior">
            <ChevronLeft size={15} strokeWidth={2.5} />
          </button>
          <button className={`${styles.carouselBtn} ${styles.carouselNext}`} onClick={nextPhoto} aria-label="Foto siguiente">
            <ChevronRight size={15} strokeWidth={2.5} />
          </button>

          <div className={styles.dots}>
            {images.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === photoIdx ? styles.dotActive : ''}`}
                onClick={e => { e.stopPropagation(); setNavegado(true); setPhotoIdx(i) }}
                aria-label={`Foto ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Precio — pestaña esquina superior derecha.
          Con oferta se tacha el de siempre y se enseña el rebajado. Es
          un "desde": la oferta puede depender del día o de la jornada,
          así que no vale para toda reserva. */}
      <span className={`${styles.priceBadge} ${oferta ? styles.priceBadgeOferta : ''}`}>
        {oferta && (
          <s className={styles.priceAntes}>
            {room.pricing.halfDay}{room.pricing.currency}
          </s>
        )}
        <span className={styles.priceAhora}>
          {oferta ? oferta.precio : room.pricing.halfDay}{room.pricing.currency}
        </span>
      </span>

      {oferta && (
        <span className={styles.ofertaCinta}>{oferta.oferta.name}</span>
      )}

      {/* ── CONTENT ── */}
      <div className={styles.content}>

        {/* Header clicable — abre/cierra acordeón */}
        <button
          className={styles.headerBtn}
          onClick={alternar}
          aria-expanded={isOpen}
        >
          <div className={styles.nameBlock}>
            <h3 className={styles.name}>{room.name}</h3>
            <div className={styles.meta}>
              <span className={styles.metaItem}>
                <Maximize2 size={13} />
                {room.size} m²
              </span>
              <span className={styles.metaDivider} />
              <span className={styles.metaItem}>
                <Users size={13} />
                hasta {maxCapacity} pax
              </span>
              {room.naturalLight && (
                <>
                  <span className={styles.metaDivider} />
                  <span className={`${styles.metaItem} ${styles.metaLight}`}>
                    <Sun size={13} />
                    Luz natural
                  </span>
                </>
              )}
            </div>
          </div>

          <span className={styles.expandLabel}>
            <span className={styles.expandText}>{isOpen ? 'ver menos' : 'ver más'}</span>
            <span className={`${styles.chevron} ${isOpen ? styles.chevronAbierto : ''}`}>
              <ChevronDown size={20} />
            </span>
          </span>
        </button>

        {/* ── ACORDEÓN ── */}
        {montado && (
            <div
              className={`${styles.acordeon} ${isOpen ? styles.acordeonAbierto : ''}`}
              inert={!isOpen}
            >
             <div className={styles.acordeonRecorte}>
              <div className={styles.accordionInner}>

                {/* Descripción */}
                <p className={styles.description}>{room.description}</p>

                {/* Layouts */}
                <div className={styles.section}>
                  <span className={styles.sectionLabel}>Configuraciones disponibles</span>
                  <div className={styles.layoutsGrid}>
                    {room.layouts.map(layout => (
                      <div key={layout.type} className={styles.layoutItem}>
                        <img
                          src={LAYOUT_SVGS[layout.type]}
                          alt={layout.label}
                          className={styles.layoutSvg}
                        />
                        <span className={styles.layoutMax}>{layout.max} pax</span>
                        <span className={styles.layoutLabel}>{layout.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Amenities */}
                <div className={styles.section}>
                  <span className={styles.sectionLabel}>Incluido en la sala</span>
                  <div className={styles.amenitiesGrid}>
                    {room.amenities.map(id => {
                      const item = AMENITY_ICONS[id]
                      if (!item) return null
                      const Icon = item.icon
                      return (
                        <div key={id} className={styles.amenityItem}>
                          <Check size={10} className={styles.amenityCheck} />
                          <Icon size={11} className={styles.amenityIcon} />
                          <span>{item.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Precios */}
                <div className={styles.priceRow}>
                  <div className={styles.priceItem}>
                    <span className={styles.priceLabel}>Media jornada</span>
                    <span className={styles.priceValue}>
                      {room.pricing.halfDay}<span className={styles.priceCurrency}>{room.pricing.currency}</span>
                    </span>
                    <span className={styles.priceHint}>9–14h · 15–20h</span>
                  </div>
                  <div className={styles.priceDivider} />
                  <div className={styles.priceItem}>
                    <span className={styles.priceLabel}>Jornada completa</span>
                    <span className={styles.priceValue}>
                      {room.pricing.fullDay}<span className={styles.priceCurrency}>{room.pricing.currency}</span>
                    </span>
                    <span className={styles.priceHint}>9–20h</span>
                  </div>
                </div>

                {oferta && (
                  <p className={styles.ofertaNota}>
                    <strong>{oferta.oferta.name}</strong>
                    {oferta.oferta.description ? ` · ${oferta.oferta.description}` : ''}
                    {' '}El descuento se aplica al elegir las fechas.
                  </p>
                )}

              </div>
             </div>
            </div>
        )}

        {/* Separador */}
        <div className={styles.divider} />

        {/* CTA — siempre visible, estilo outline como el original */}
        <button
          className={styles.cta}
          onClick={(e) => { e.stopPropagation(); onSelect() }}
        >
          Elegir esta sala
          <ArrowRight size={15} />
        </button>

        {/* Enlace a la ficha de la sala.

            Antes vivía en una fila suelta debajo de las tres tarjetas,
            en RoomSelector. Era el ÚNICO camino a /salas/<slug>, porque
            esta tarjeta no enlazaba a ninguna parte: el botón de arriba
            abre el formulario. Quien quería leer sobre la sala tenía
            que buscar un enlace pequeño fuera de la tarjeta.

            Deliberadamente discreto: la acción principal sigue siendo
            reservar. Si esto fuera un segundo botón, competirían y la
            tarjeta perdería el foco.

            Sigue siendo el camino por el que Google descubre las
            fichas, así que tiene que ser un <a> real y estar siempre en
            el HTML. Con <Link> de react-router lo es, y el prerender lo
            escribe. */}
        <Link
          to={rutaSala(room.slug)}
          className={styles.verFicha}
          onClick={(e) => e.stopPropagation()}
        >
          Ver ficha de la sala
        </Link>

      </div>
    </article>
    </div>
  )
}