import { useState, useEffect } from 'react'
import { Sun, Users, Maximize2, ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Wifi, Monitor, FileText, Droplets, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getOptimizedUrl, IMAGE_SIZES } from '../../lib/imageUtils'
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

export default function RoomCard({ room, onSelect, index = 0 }) {
  const [isOpen, setIsOpen]     = useState(false)
  const [photoIdx, setPhotoIdx] = useState(0)
  const [imgLoaded, setImgLoaded] = useState({})

  const maxCapacity = Math.max(...room.layouts.map(l => l.max))
  const images = getCarouselImages(room)
  const badgeColor = room.hoverBadgeColor || DEFAULT_BADGE_COLOR

  // Preload adjacent carousel images
  useEffect(() => {
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
  }, [photoIdx, images, imgLoaded])

  const prevPhoto = (e) => {
    e.stopPropagation()
    setPhotoIdx(i => (i - 1 + images.length) % images.length)
  }
  const nextPhoto = (e) => {
    e.stopPropagation()
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
        <div className={styles.imageWrapper}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.img
              key={photoIdx}
              src={getOptimizedUrl(images[photoIdx], IMAGE_SIZES.cardImage)}
              alt={`${room.name} — foto ${photoIdx + 1}`}
              className={styles.image}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
              decoding="async"
              onLoad={() => setImgLoaded(prev => ({ ...prev, [photoIdx]: true }))}
            />
          </AnimatePresence>

          <div className={styles.imageGradient} />

          {room.badge && (
            <span className={styles.badge}>{room.badge}</span>
          )}

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
                onClick={e => { e.stopPropagation(); setPhotoIdx(i) }}
                aria-label={`Foto ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Precio — pestaña esquina superior derecha */}
      <span className={styles.priceBadge}>
        {room.pricing.halfDay}{room.pricing.currency}
      </span>

      {/* ── CONTENT ── */}
      <div className={styles.content}>

        {/* Header clicable — abre/cierra acordeón */}
        <button
          className={styles.headerBtn}
          onClick={() => setIsOpen(v => !v)}
          aria-expanded={isOpen}
        >
          <div className={styles.nameBlock}>
            <h2 className={styles.name}>{room.name}</h2>
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
            <motion.span
              className={styles.chevron}
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            >
              <ChevronDown size={20} />
            </motion.span>
          </span>
        </button>

        {/* ── ACORDEÓN ── */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              style={{ overflow: 'hidden' }}
            >
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

              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

      </div>
    </article>
    </div>
  )
}
