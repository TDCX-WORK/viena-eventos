import { useState, useEffect, useCallback, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { getOptimizedUrl, IMAGE_SIZES } from '../../lib/imageUtils'
import styles from './Gallery.module.css'

export default function Gallery({ images, onClose }) {
  const [lightbox, setLightbox] = useState(null)

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
            onClick={() => setLightbox(null)}
          >
            <button
              className={`${styles.lbNav} ${styles.lbPrev}`}
              onClick={(e) => { e.stopPropagation(); goTo(-1) }}
              aria-label="Anterior"
            >
              <ChevronLeft size={28} />
            </button>

            <LightboxImage
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

// ── Thumbnail with lazy loading ──
const GalleryThumb = memo(function GalleryThumb({ src, index, onClick }) {
  const [loaded, setLoaded] = useState(false)
  const [inView, setInView] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect() } },
      { rootMargin: '300px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const thumbUrl = getOptimizedUrl(src, IMAGE_SIZES.galleryThumb)

  return (
    <motion.button
      ref={ref}
      className={styles.thumb}
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.6) }}
    >
      <div className={`${styles.thumbPlaceholder} ${loaded ? styles.thumbPlaceholderDone : ''}`} />
      {inView && (
        <img
          src={thumbUrl}
          alt={`Foto ${index + 1}`}
          className={`${styles.thumbImg} ${loaded ? styles.thumbImgLoaded : ''}`}
          decoding="async"
          onLoad={() => setLoaded(true)}
        />
      )}
    </motion.button>
  )
})

// ── Lightbox image with loading state ──
const LightboxImage = memo(function LightboxImage({ src, index, total }) {
  const [loaded, setLoaded] = useState(false)
  const fullUrl = getOptimizedUrl(src, IMAGE_SIZES.lightbox)

  // Reset loaded state when src changes
  useEffect(() => { setLoaded(false) }, [src])

  return (
    <div className={styles.lbImageWrap} onClick={(e) => e.stopPropagation()}>
      {!loaded && <div className={styles.lbSpinner} />}
      <motion.img
        key={src}
        src={fullUrl}
        alt={`Foto ${index + 1}`}
        className={styles.lbImg}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: loaded ? 1 : 0, scale: loaded ? 1 : 0.97 }}
        transition={{ duration: 0.25 }}
        decoding="async"
        onLoad={() => setLoaded(true)}
      />
    </div>
  )
})
