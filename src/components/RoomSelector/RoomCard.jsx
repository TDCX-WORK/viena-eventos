import { useState, useEffect } from 'react'
import { Sun, Users, Maximize2, ArrowUpRight, ArrowRight } from 'lucide-react'
import styles from './RoomCard.module.css'

const layoutIcons = {
  teatro:   '⊞',
  u:        '⊓',
  escuela:  '≡',
  imperial: '▬',
}

export default function RoomCard({ room, index, onSelect }) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const maxCapacity = Math.max(...room.layouts.map(l => l.max))

  return (
    <div className={styles.card}>

      {/* Price badge */}
      <span className={styles.priceBadge}>
        {room.pricing.halfDay}{room.pricing.currency}
      </span>

      {/* Image */}
      <div className={styles.imageContainer}>
        <div className={styles.imageWrapper}>
          <img src={room.image} alt={room.name} className={styles.image} />
          <div className={styles.imageGradient} />
          {room.badge && <span className={styles.badge}>{room.badge}</span>}
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>

        {/* Nombre + meta */}
        <div className={styles.titleRow}>
          <div>
            <h2 className={styles.name}>{room.name}</h2>
            <div className={styles.meta}>
              <span className={styles.metaItem}>
                <Maximize2 size={10} />
                {room.size} m²
              </span>
              <span className={styles.metaDivider} />
              <span className={styles.metaItem}>
                <Users size={10} />
                hasta {maxCapacity} pax
              </span>
              {room.naturalLight && (
                <>
                  <span className={styles.metaDivider} />
                  <span className={`${styles.metaItem} ${styles.metaLight}`}>
                    <Sun size={10} />
                    Luz natural
                  </span>
                </>
              )}
            </div>
          </div>
          <div className={styles.arrow}>
            <ArrowUpRight size={15} />
          </div>
        </div>

        {/* Expandable */}
        <div className={`${styles.expandable} ${isMobile ? styles.alwaysOpen : ''}`}>
          <div className={styles.divider} />
          <p className={styles.description}>{room.description}</p>
          <div className={styles.layoutsLabel}>Configuraciones</div>
          <div className={styles.layouts}>
            {room.layouts.map(layout => (
              <div key={layout.type} className={styles.layoutItem}>
                <span className={styles.layoutIcon}>{layoutIcons[layout.type]}</span>
                <span className={styles.layoutMax}>{layout.max}</span>
                <span className={styles.layoutLabel}>{layout.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          className={styles.cta}
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
        >
          Elegir esta sala
          <ArrowRight size={13} />
        </button>

      </div>
    </div>
  )
}