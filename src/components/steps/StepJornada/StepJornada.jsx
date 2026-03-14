import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sunrise, Sunset, CalendarDays, ArrowRight, Minus, Plus } from 'lucide-react'
import styles from './StepJornada.module.css'

const JORNADAS = [
  {
    id: 'manana',
    label: 'Mañana',
    hours: '9:00 – 14:00',
    icon: Sunrise,
    priceKey: 'halfDay',
  },
  {
    id: 'tarde',
    label: 'Tarde',
    hours: '15:00 – 20:00',
    icon: Sunset,
    priceKey: 'halfDay',
  },
  {
    id: 'completo',
    label: 'Día completo',
    hours: '9:00 – 20:00',
    icon: CalendarDays,
    priceKey: 'fullDay',
  },
]

const LAYOUT_ICONS = {
  teatro:   '⊞',
  u:        '⊓',
  escuela:  '≡',
  imperial: '▬',
}

export default function StepJornada({ booking, updateBooking, onNext }) {
  const room = booking.room
  const maxCapacity = Math.max(...room.layouts.map(l => l.max))

  const handleJornada = (id) => updateBooking({ jornada: id })
  const handleLayout = (type) => updateBooking({ layout: type })

  const handleAsistentes = (delta) => {
    const current = parseInt(booking.asistentes) || 1
    const next = Math.min(Math.max(current + delta, 1), maxCapacity)
    updateBooking({ asistentes: next })
  }

  const canContinue = booking.jornada && booking.asistentes && booking.layout

  return (
    <motion.div
      className={styles.wrapper}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className={styles.title}>Elige tu jornada</h2>
      <p className={styles.subtitle}>Selecciona el horario que mejor se adapta a tu evento</p>

      {/* Jornada cards */}
      <div className={styles.cards}>
        {JORNADAS.map(j => {
          const Icon = j.icon
          const price = room.pricing[j.priceKey]
          const isSelected = booking.jornada === j.id
          return (
            <button
              key={j.id}
              className={`${styles.card} ${isSelected ? styles.selected : ''}`}
              onClick={() => handleJornada(j.id)}
            >
              <div className={styles.cardLeft}>
                <div className={styles.cardIcon}>
                  <Icon size={18} />
                </div>
                <div>
                  <div className={styles.cardName}>{j.label}</div>
                  <div className={styles.cardHours}>{j.hours}</div>
                </div>
              </div>
              <div className={styles.cardRight}>
                <div className={styles.cardPrice}>{price}{room.pricing.currency}</div>
                <span className={styles.cardPriceSub}>IVA incluido</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Asistentes — centrado */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>Número de asistentes</div>
        <div className={styles.counterWrapper}>
          <div className={styles.counter}>
            <button
              className={styles.counterBtn}
              onClick={() => handleAsistentes(-1)}
              disabled={!booking.asistentes || booking.asistentes <= 1}
            >
              <Minus size={14} />
            </button>
            <span className={styles.counterValue}>
              {booking.asistentes || '—'}
            </span>
            <button
              className={styles.counterBtn}
              onClick={() => handleAsistentes(1)}
              disabled={booking.asistentes >= maxCapacity}
            >
              <Plus size={14} />
            </button>
          </div>
          <span className={styles.counterMax}>máximo {maxCapacity} personas</span>
        </div>
      </div>

      {/* Layout */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>Configuración de sala</div>
        <div className={styles.layoutGrid}>
          {room.layouts.map(layout => (
            <button
              key={layout.type}
              className={`${styles.layoutCard} ${booking.layout === layout.type ? styles.selected : ''}`}
              onClick={() => handleLayout(layout.type)}
            >
              <span className={styles.layoutEmoji}>{LAYOUT_ICONS[layout.type]}</span>
              <span className={styles.layoutName}>{layout.label}</span>
              <span className={styles.layoutMax}>hasta {layout.max} pax</span>
            </button>
          ))}
        </div>
      </div>

      <button
        className={styles.cta}
        onClick={onNext}
        disabled={!canContinue}
      >
        Siguiente — Elegir fecha
        <ArrowRight size={16} />
      </button>
    </motion.div>
  )
}