import { motion } from 'framer-motion'
import { Wifi, Monitor, FileText, Droplets, Coffee, UtensilsCrossed, Check, ArrowLeft, ArrowRight, Store } from 'lucide-react'
import styles from './StepExtras.module.css'

const INCLUDED = [
  { id: 'wifi',      label: 'WiFi gratuito',   icon: Wifi },
  { id: 'proyector', label: 'Proyector',        icon: Monitor },
  { id: 'pantalla',  label: 'Pantalla',         icon: Monitor },
  { id: 'flipchart', label: 'Flip chart',       icon: FileText },
  { id: 'agua',      label: 'Agua',             icon: Droplets },
  { id: 'material',  label: 'Material oficina', icon: FileText },
]

const CATEGORY_ICONS = {
  coffee: Coffee,
  menu: UtensilsCrossed,
}

export default function StepExtras({ booking, updateBooking, hotel, onNext, onPrev }) {
  const selectedExtras = booking.extras || []

  const toggleExtra = (e, id) => {
    e.preventDefault()
    e.stopPropagation()
    const already = selectedExtras.includes(id)
    updateBooking({
      extras: already
        ? selectedExtras.filter(ex => ex !== id)
        : [...selectedExtras, id]
    })
  }

  const isSelected = (id) => selectedExtras.includes(id)

  const coffeeExtras = hotel.extras.filter(e => e.category === 'coffee')
  const menuExtras   = hotel.extras.filter(e => e.category === 'menu')

  return (
    <motion.div
      className={styles.wrapper}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className={styles.title}>Personaliza tu evento</h2>
      <p className={styles.subtitle}>
        Añade servicios adicionales para que todo esté listo al llegar
      </p>

      {/* Operado por */}
      <div className={styles.operadoBanner}>
        <div className={styles.operadoIcon}>
          <Store size={16} />
        </div>
        <div>
          <div className={styles.operadoText}>Servicio de restauración operado por</div>
          <div className={styles.operadoName}>Café Viena — a 50 metros del hotel</div>
        </div>
      </div>

      {/* Incluido */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}>
            <Check size={13} />
          </div>
          <span className={styles.sectionLabel}>Incluido en la sala</span>
        </div>
        <div className={styles.includedGrid}>
          {INCLUDED.map(item => {
            const Icon = item.icon
            return (
              <div key={item.id} className={styles.includedItem}>
                <Icon size={13} className={styles.includedIcon} />
                {item.label}
              </div>
            )
          })}
        </div>
      </div>

      {/* Coffee Breaks */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}>
            <Coffee size={13} />
          </div>
          <span className={styles.sectionLabel}>Coffee Break</span>
        </div>
        <div className={styles.extraGrid}>
          {coffeeExtras.map(extra => (
            <div
              key={extra.id}
              className={`${styles.extraCard} ${isSelected(extra.id) ? styles.selected : ''}`}
              onClick={(e) => toggleExtra(e, extra.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && toggleExtra(e, extra.id)}
            >
              <div className={styles.extraCardIcon}>
                <Coffee size={15} />
              </div>
              <div className={styles.extraCardBody}>
                <div className={styles.extraCardName}>{extra.name}</div>
                <div className={styles.extraCardDesc}>{extra.description}</div>
                <div className={styles.extraCardMeta}>Mín. {extra.minPersons} personas</div>
              </div>
              <div className={styles.extraCardRight}>
                <div className={styles.extraCardPrice}>{extra.pricePerPerson}€</div>
                <div className={styles.extraCardPriceSub}>por persona</div>
              </div>
              <div className={styles.checkCircle}>
                {isSelected(extra.id) && <Check size={11} color="#ffffff" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Menús */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}>
            <UtensilsCrossed size={13} />
          </div>
          <span className={styles.sectionLabel}>Menús</span>
        </div>
        <div className={styles.extraGrid}>
          {menuExtras.map(extra => (
            <div
              key={extra.id}
              className={`${styles.extraCard} ${isSelected(extra.id) ? styles.selected : ''}`}
              onClick={(e) => toggleExtra(e, extra.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && toggleExtra(e, extra.id)}
            >
              <div className={styles.extraCardIcon}>
                <UtensilsCrossed size={15} />
              </div>
              <div className={styles.extraCardBody}>
                <div className={styles.extraCardName}>{extra.name}</div>
                <div className={styles.extraCardDesc}>{extra.description}</div>
                <div className={styles.extraCardMeta}>Mín. {extra.minPersons} personas</div>
              </div>
              <div className={styles.extraCardRight}>
                <div className={styles.extraCardPrice}>{extra.pricePerPerson}€</div>
                <div className={styles.extraCardPriceSub}>por persona</div>
              </div>
              <div className={styles.checkCircle}>
                {isSelected(extra.id) && <Check size={11} color="#ffffff" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className={styles.buttons}>
        <button className={styles.btnSecondary} onClick={onPrev}>
          <ArrowLeft size={15} />
          Anterior
        </button>
        <button className={styles.btnPrimary} onClick={onNext}>
          Siguiente — Contacto
          <ArrowRight size={15} />
        </button>
      </div>

    </motion.div>
  )
}