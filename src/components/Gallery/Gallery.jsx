import { useState, useEffect, useCallback, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { getOptimizedUrl, IMAGE_SIZES } from '../../lib/imageUtils'
import styles from './Gallery.module.css'

/* Distancia mínima, en px, para que un deslizamiento cuente como
   "pasar de foto" y no como un toque. */
const UMBRAL_SWIPE = 50

export default function Gallery({ images, onClose }) {
  const [lightbox, setLightbox] = useState(null)

  /* Deslizar con el dedo en el visor. Pointer events y no touch events:
     funcionan igual con dedo, lápiz o ratón arrastrando. `arrastre`
     recuerda si el último gesto fue un deslizamiento, para que el clic
     que el navegador lanza al soltar no cierre el visor. */
  const inicioGesto = useRef(null)
  const arrastre = useRef(false)

  const goTo = useCallback((dir) => {
    setLightbox(prev => {
      if (prev === null) return null
      const next = prev + dir
      if (next < 0) return images.length - 1
      if (next >= images.length) return 0
      return next
    })
  }, [images.length])

  // Preload adjacent lightbox images
  useEffect(() => {
    if (lightbox === null) return
    const toPreload = [
      (lightbox + 1) % images.length,
      (lightbox - 1 + images.length) % images.length,
    ]
    toPreload.forEach(idx => {
      const img = new Image()
      img.src = getOptimizedUrl(images[idx], IMAGE_SIZES.lightbox)
    })
  }, [lightbox, images])

  const alEmpezarGesto = (e) => {
    inicioGesto.current = { x: e.clientX, y: e.clientY }
    arrastre.current = false
  }
  const alAcabarGesto = (e) => {
    const ini = inicioGesto.current
    inicioGesto.current = null
    if (!ini) return
    const dx = e.clientX - ini.x
    const dy = e.clientY - ini.y
    // Horizontal y suficientemente largo. Un gesto vertical se ignora.
    if (Math.abs(dx) > UMBRAL_SWIPE && Math.abs(dx) > Math.abs(dy)) {
      arrastre.current = true
      goTo(dx < 0 ? 1 : -1)
    }
  }
  const cerrarVisor = () => {
    if (arrastre.current) { arrastre.current = false; return }
    setLightbox(null)
  }

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (lightbox !== null) setLightbox(null)
        else onClose()
      }
      if (e.key === 'ArrowLeft' && lightbox !== null) goTo(-1)
      if (e.key === 'ArrowRight' && lightbox !== null) goTo(1)
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [lightbox, onClose, goTo])

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h2 className={styles.headerTitle}>Galería</h2>
          <span className={styles.headerCount}>{images.length} fotos</span>
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar galería">
          <X size={20} />
        </button>
      </div>

      {/* Grid */}
      <div className={styles.gridScroll}>
        <div className={styles.grid}>
          {images.map((src, i) => (
            <GalleryThumb
              key={`${src}-${i}`}
              src={src}
              index={i}
              onClick={() => setLightbox(i)}
            />
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            className={styles.lightbox}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={cerrarVisor}
            onPointerDown={alEmpezarGesto}
            onPointerUp={alAcabarGesto}
            onPointerCancel={() => { inicioGesto.current = null }}
          >
            <button
              className={`${styles.lbNav} ${styles.lbPrev}`}
              onClick={(e) => { e.stopPropagation(); goTo(-1) }}
              aria-label="Anterior"
            >
              <ChevronLeft size={28} />
            </button>

            {/* key por foto: al cambiar de foto React crea un
                LightboxImage nuevo y su estado "cargada" empieza en
                false desde el primer fotograma. Antes se reiniciaba en
                un efecto, un fotograma tarde, y la foto nueva se veía,
                desaparecía y volvía a aparecer. */}
            <LightboxImage
              key={images[lightbox]}
              src={images[lightbox]}
              index={lightbox}
              total={images.length}
            />

            <button
              className={`${styles.lbNav} ${styles.lbNext}`}
              onClick={(e) => { e.stopPropagation(); goTo(1) }}
              aria-label="Siguiente"
            >
              <ChevronRight size={28} />
            </button>

            <div className={styles.lbCounter}>
              {lightbox + 1} / {images.length}
            </div>

            <button
              className={styles.lbClose}
              onClick={() => setLightbox(null)}
              aria-label="Cerrar"
            >
              <X size={22} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Miniatura ──
/* Antes: IntersectionObserver a mano + una animación de framer-motion
   por miniatura. Con 18 fotos eran 18 animaciones de JavaScript en el
   hilo principal justo mientras el navegador decodificaba las fotos, y
   se notaba al abrir la galería.

   Ahora la carga diferida es la nativa del navegador (loading="lazy",
   que funciona dentro de un contenedor con scroll) y la entrada es una
   animación CSS de opacity + transform, que la hace la tarjeta gráfica
   sin tocar el hilo principal. El escalonado va en animation-delay. */
const GalleryThumb = memo(function GalleryThumb({ src, index, onClick }) {
  const [loaded, setLoaded] = useState(false)
  const thumbUrl = getOptimizedUrl(src, IMAGE_SIZES.galleryThumb)

  return (
    <button
      type="button"
      className={styles.thumb}
      onClick={onClick}
      style={{ animationDelay: `${Math.min(index * 30, 450)}ms` }}
      aria-label={`Ampliar foto ${index + 1}`}
    >
      <div className={`${styles.thumbPlaceholder} ${loaded ? styles.thumbPlaceholderDone : ''}`} />
      <img
        src={thumbUrl}
        alt=""
        className={`${styles.thumbImg} ${loaded ? styles.thumbImgLoaded : ''}`}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
      />
    </button>
  )
})

// ── Foto del visor ──
/* Se monta de nuevo con cada foto (key en el padre), así que `loaded`
   empieza siempre en false. El fundido es una transición CSS de
   opacity, sin framer-motion. */
const LightboxImage = memo(function LightboxImage({ src, index, total }) {
  const [loaded, setLoaded] = useState(false)
  const fullUrl = getOptimizedUrl(src, IMAGE_SIZES.lightbox)

  return (
    <div className={styles.lbImageWrap} onClick={(e) => e.stopPropagation()}>
      {!loaded && <div className={styles.lbSpinner} />}
      <img
        src={fullUrl}
        alt={`Foto ${index + 1} de ${total}`}
        className={`${styles.lbImg} ${loaded ? styles.lbImgLoaded : ''}`}
        decoding="async"
        draggable={false}
        onLoad={() => setLoaded(true)}
      />
    </div>
  )
})