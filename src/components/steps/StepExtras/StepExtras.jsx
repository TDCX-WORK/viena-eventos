import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, Monitor, Tv2, FileText, Droplets, Coffee, UtensilsCrossed, Check, Store, Users, Info } from 'lucide-react'
import styles from './StepExtras.module.css'
import coffeeBg from '../../../assets/coffee-bg.webp'
import menuBg from '../../../assets/menu-bg.webp'

const INCLUDED = [
  { id: 'wifi',      label: 'WiFi',       icon: Wifi },
  { id: 'proyector', label: 'Proyector',  icon: Monitor },
  { id: 'pantalla',  label: 'Pantalla',   icon: Tv2 },
  { id: 'flipchart', label: 'Flip chart', icon: FileText },
  { id: 'agua',      label: 'Agua',       icon: Droplets },
  { id: 'material',  label: 'Material',   icon: FileText },
]

const COFFEE_COLORS = ['#C8973F', '#C86A5A', '#6A9E7A', '#5A7AC8']
const MENU_COLORS   = ['#9B6AC8', '#C86A9B']

/* ── Fallback descriptions (se usan si Supabase no tiene description) ── */
const FALLBACK_DESC = {
  'dulce': [
    'Café Colombia Natural', 'Leche', 'Infusiones',
    '2 Bollería Mini', '1 Mini Croissant de mantequilla',
    '1 Mini Muffin', 'Zumo de naranja natural',
  ],
  'dulce-salado': [
    'Café Colombia Natural', 'Leche', 'Infusiones',
    '2 Bollería Mini', '2 Sandwiches mini',
    '1 Zumo de naranja natural',
  ],
  'fruta': [
    'Café Colombia Natural', 'Leche', 'Infusiones',
    '2 Bollería Mini', '1 Mera (palmerita) de Chocolate Negro',
    '1 Brocheta de Fruta', '1 Zumo de naranja natural',
  ],
  'tentempié': [
    'Café Colombia Natural', 'Leche', 'Infusiones',
    '2 Pastas de té artesanas', '2 Sandwiches mini',
    '1 Mini barrita de jamón con tumaca',
    '1 Brocheta de Fruta', '1 Zumo de naranja natural',
  ],
  'almuerzo': [
    'Entrante (calamares, croquetas…)',
    'Plato principal (atún a la plancha, ragout…)',
    'Postre (tarta Selección Viena o macedonia)',
    'Bebida (cerveza, vino o refresco)',
    'Café / Infusión',
    '',
    'Se sirve en el Café Viena, a 50m del hotel',
    'L-V no festivos · Sujeto a disponibilidad',
  ],
  'grupos': [
    'Entrantes al centro: ensalada, croquetas…',
    'Plato principal: carne o pescado',
    'Postre',
    'Incluye bebida',
    '',
    'En el Café Viena, a 50m del hotel',
  ],
}

function getDescLines(extra) {
  if (extra.description && extra.description.trim()) {
    return extra.description.split('\n').filter(l => l.trim())
  }
  const n = extra.name.toLowerCase()
  if (n.includes('dulce-salado') || n.includes('dulce salado')) return FALLBACK_DESC['dulce-salado']
  if (n.includes('fruta'))       return FALLBACK_DESC['fruta']
  if (n.includes('tentempié') || n.includes('tentempi')) return FALLBACK_DESC['tentempié']
  if (n.includes('dulce'))       return FALLBACK_DESC['dulce']
  if (n.includes('grupo'))       return FALLBACK_DESC['grupos']
  if (n.includes('almuerzo'))    return FALLBACK_DESC['almuerzo']
  return []
}

/* ── Inline SVG icons ── */
function CookieIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="8" cy="9" r="1" fill="currentColor" />
      <circle cx="15" cy="8" r="1" fill="currentColor" />
      <circle cx="10" cy="14" r="1" fill="currentColor" />
      <circle cx="16" cy="13" r="1" fill="currentColor" />
      <circle cx="12" cy="18" r="0.8" fill="currentColor" />
    </svg>
  )
}
function CroissantIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5C3 15 3 11 5.5 8.5S11 4 14 5s5.5 4.5 4 8-5 6-8.5 6-3.5-1-5-2.5z" />
      <path d="M8 13c1-2 3-3.5 5.5-3" />
      <path d="M14 5c1 1.5.5 3.5-1 5" />
    </svg>
  )
}
function FruitIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C9 2 7 4.5 7 8c0 5.5 5 12 5 12s5-6.5 5-12c0-3.5-2-6-5-6z" />
      <path d="M12 2c1-.5 3 0 3.5 2" />
      <path d="M10 7c1-1.5 3-1.5 4 0" />
    </svg>
  )
}
function SandwichIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11h18" /><path d="M3 15h18" />
      <path d="M4 11l-1 4h18l-1-4" />
      <path d="M4 11c0-4 3.5-7 8-7s8 3 8 7" />
      <path d="M7 13h2" /><path d="M11 13h2" /><path d="M15 13h2" />
    </svg>
  )
}
function PlateIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="14" rx="9" ry="4" />
      <path d="M3 14v1c0 2.2 4 4 9 4s9-1.8 9-4v-1" />
      <path d="M9 10c0-2 1.5-4 3-4s3 2 3 4" />
      <path d="M8 11h8" />
    </svg>
  )
}
function BanquetIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="3" rx="1.5" />
      <path d="M5 14v3" /><path d="M19 14v3" />
      <path d="M8 11V8c0-1 .5-2 1.5-2" />
      <path d="M16 11V8c0-1-.5-2-1.5-2" />
      <circle cx="12" cy="5" r="1.5" />
    </svg>
  )
}

function getCoffeeIcon(name) {
  const n = name.toLowerCase()
  if (n.includes('fruta'))     return FruitIcon
  if (n.includes('salado'))    return CroissantIcon
  if (n.includes('tentempié') || n.includes('tentempi')) return SandwichIcon
  return CookieIcon
}
function getMenuIcon(name) {
  const n = name.toLowerCase()
  if (n.includes('grupo')) return BanquetIcon
  return PlateIcon
}

/* ── Card grid with slide-out / drop-down detail ── */
function CardGrid({ items, colors, selectedExtras, onToggleSelect, iconGetter, hoveredId, onHover }) {
  return (
    <div className={styles.cardGrid}>
      {items.map((extra, i) => {
        const selected  = selectedExtras.includes(extra.id)
        const inactive  = !extra.isActive
        const showPanel = hoveredId === extra.id || selected
        const color     = colors[i % colors.length]
        const Icon      = iconGetter(extra.name)
        const shortName = extra.name.replace('Coffee Break ', '').replace('Menú ', '')
        const descLines = getDescLines(extra)

        return (
          <div
            key={extra.id}
            className={`${styles.cardSlot} ${showPanel && descLines.length > 0 ? styles.cardSlotOpen : ''}`}
            style={{ '--card-color': color }}
          >
            <motion.button
              className={`${styles.extraCard} ${selected ? styles.extraCardSelected : ''} ${inactive ? styles.extraCardInactive : ''}`}
              onClick={() => {
                if (inactive) return
                onToggleSelect(extra.id)
              }}
              onMouseEnter={() => !inactive && onHover(extra.id)}
              onMouseLeave={() => onHover(null)}
              whileTap={!inactive ? { scale: 0.97 } : {}}
              disabled={inactive}
            >
              <span className={`${styles.checkBadge} ${selected ? styles.checkBadgeOn : ''}`}>
                {selected && <Check size={10} strokeWidth={3} />}
              </span>
              <span className={styles.cardIcon}>
                <Icon size={28} />
              </span>
              <span className={styles.cardName}>{shortName}</span>
              <span className={styles.cardPrice}>
                {extra.pricePerPerson}€<span className={styles.pax}>/pax</span>
              </span>
              <span className={styles.cardMeta}>
                <Users size={11} />
                mín. {extra.minPersons}
              </span>
              {/* ── Arrow "ver más" ── */}
              {!inactive && descLines.length > 0 && (
                <span className={`${styles.seeMore} ${showPanel ? styles.seeMoreOpen : ''}`}>
                  ver más
                  <svg className={styles.seeMoreArrow} width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3.5 2L6.5 5L3.5 8" />
                  </svg>
                </span>
              )}
              {inactive && <span className={styles.inactiveLabel}>No disponible</span>}
            </motion.button>

            {/* ── Desktop: detail slides right ── */}
            <AnimatePresence>
              {showPanel && descLines.length > 0 && (
                <motion.div
                  className={styles.detailPanelRight}
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 'auto', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                >
                  <div className={styles.detailInner}>
                    <span className={styles.detailTitle}>
                      <Info size={12} />
                      Incluye
                    </span>
                    <ul className={styles.detailList}>
                      {descLines.map((line, li) =>
                        line === '' ? <li key={li} className={styles.detailSpacer} /> :
                        <li key={li} className={styles.detailItem}>{line}</li>
                      )}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Mobile/narrow: detail drops down ── */}
            <AnimatePresence>
              {showPanel && descLines.length > 0 && (
                <motion.div
                  className={styles.detailPanelDown}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                >
                  <div className={styles.detailInner}>
                    <span className={styles.detailTitle}>
                      <Info size={12} />
                      Incluye
                    </span>
                    <ul className={styles.detailList}>
                      {descLines.map((line, li) =>
                        line === '' ? <li key={li} className={styles.detailSpacer} /> :
                        <li key={li} className={styles.detailItem}>{line}</li>
                      )}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

export default function StepExtras({ booking, updateBooking, hotel }) {
  const selectedExtras = booking.extras || []
  const [hoveredId, setHoveredId] = useState(null)

  const isSelected   = (id) => selectedExtras.includes(id)
  const toggleSelect = (id) => {
    const nowSelected = !isSelected(id)
    updateBooking({
      extras: nowSelected
        ? [...selectedExtras, id]
        : selectedExtras.filter(ex => ex !== id)
    })
  }

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
      <p className={styles.subtitle}>Añade servicios adicionales para que todo esté listo al llegar</p>

      <div className={styles.banner}>
        <Store size={13} className={styles.bannerIcon} />
        <span className={styles.bannerText}>Restauración operada por <strong>Suites Viena</strong></span>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <Check size={12} className={styles.sectionIcon} />
          <span className={styles.sectionLabel}>Incluido en la sala</span>
        </div>
        <div className={styles.includedGrid}>
          {INCLUDED.map(item => {
            const Icon = item.icon
            return (
              <div key={item.id} className={styles.includedItem}>
                <Icon size={13} className={styles.includedIcon} />
                <span>{item.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className={`${styles.section} ${styles.sectionWithBg}`}>
        <img src={coffeeBg} alt="" className={styles.sectionBgImg} aria-hidden="true" />
        <div className={styles.sectionHead}>
          <Coffee size={12} className={styles.sectionIcon} />
          <span className={styles.sectionLabel}>Coffee Break</span>
        </div>
        <CardGrid
          items={coffeeExtras}
          colors={COFFEE_COLORS}
          selectedExtras={selectedExtras}
          onToggleSelect={toggleSelect}
          iconGetter={getCoffeeIcon}
          hoveredId={hoveredId}
          onHover={setHoveredId}
        />
      </div>

      <div className={`${styles.section} ${styles.sectionWithBg}`}>
        <img src={menuBg} alt="" className={styles.sectionBgImg} aria-hidden="true" />
        <div className={styles.sectionHead}>
          <UtensilsCrossed size={12} className={styles.sectionIcon} />
          <span className={styles.sectionLabel}>Menús</span>
        </div>
        <CardGrid
          items={menuExtras}
          colors={MENU_COLORS}
          selectedExtras={selectedExtras}
          onToggleSelect={toggleSelect}
          iconGetter={getMenuIcon}
          hoveredId={hoveredId}
          onHover={setHoveredId}
        />
      </div>
    </motion.div>
  )
}
