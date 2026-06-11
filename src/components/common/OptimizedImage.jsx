import { useState, useRef, useEffect, memo } from 'react'
import { getOptimizedUrl } from '../../lib/imageUtils'

/**
 * Componente de imagen optimizada con:
 * - Lazy loading real via IntersectionObserver
 * - Placeholder shimmer mientras carga
 * - Transición suave al cargar
 * - URLs transformadas para Supabase
 */
const OptimizedImage = memo(function OptimizedImage({
  src,
  alt = '',
  width,
  height,
  quality = 75,
  resize = 'cover',
  className = '',
  style = {},
  eager = false, // true = no lazy load (para imágenes visibles al inicio)
  onLoad,
}) {
  const [loaded, setLoaded] = useState(false)
  const [inView, setInView] = useState(eager)
  const imgRef = useRef(null)
  const containerRef = useRef(null)

  // IntersectionObserver for true lazy loading
  useEffect(() => {
    if (eager || inView) return

    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' } // start loading 200px before entering viewport
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [eager, inView])

  const optimizedSrc = getOptimizedUrl(src, { width, height, quality, resize })

  const handleLoad = () => {
    setLoaded(true)
    onLoad?.()
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: '#f0ede8',
        ...style,
      }}
      className={className}
    >
      {/* Shimmer placeholder */}
      {!loaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(110deg, #f0ede8 30%, #f7f5f2 50%, #f0ede8 70%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s ease-in-out infinite',
          }}
        />
      )}

      {/* Actual image */}
      {inView && (
        <img
          ref={imgRef}
          src={optimizedSrc}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.35s ease',
          }}
        />
      )}

      {/* Global keyframe (only injected once) */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
})

export default OptimizedImage
