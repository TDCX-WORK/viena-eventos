import { useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, ChevronDown } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import { es } from 'date-fns/locale'
import { format, isBefore, startOfDay, isSameDay, addDays } from 'date-fns'
import 'react-day-picker/dist/style.css'
import { JORNADAS } from '../../../lib/constants'
import styles from './StepJornadaFecha.module.css'

import teatroSvg   from '../../../assets/layouts/teatro.svg?url'
import uSvg        from '../../../assets/layouts/u.svg?url'
import imperialSvg from '../../../assets/layouts/imperial.svg?url'
import escuelaSvg  from '../../../assets/layouts/escuela.svg?url'

const LAYOUT_SVGS = { teatro: teatroSvg, u: uSvg, imperial: imperialSvg, escuela: escuelaSvg }

/**
 * Calcula qué días están totalmente bloqueados (no se puede reservar ninguna jornada)
 * y qué jornadas están bloqueadas por día.
 */
function useBlockedInfo(blockedDates) {
  return useMemo(() => {
    if (!blockedDates || blockedDates.length === 0) {
      return { fullyBlockedDays: [], blockedJornadasByDate: {} }
    }

    // Agrupar bloqueos por fecha
    const byDate = {}
    blockedDates.forEach(b => {
      const key = b.dateStr
      if (!byDate[key]) byDate[key] = []
      byDate[key].push(b.jornada)
    })

    const fullyBlockedDays = []
    const blockedJornadasByDate = {}

    Object.entries(byDate).forEach(([dateStr, jornadas]) => {
      const date = new Date(dateStr + 'T00:00:00')
      blockedJornadasByDate[dateStr] = jornadas

      // El día está completamente bloqueado si:
      // - tiene un bloqueo 'completo', o
      // - tiene bloqueos para AMBAS 'manana' Y 'tarde'
      const hasCompleto = jornadas.includes('completo')
      const hasManana = jornadas.includes('manana')
      const hasTarde = jornadas.includes('tarde')

      if (hasCompleto || (hasManana && hasTarde)) {
        fullyBlockedDays.push(date)
      }
    })

    return { fullyBlockedDays, blockedJornadasByDate }
  }, [blockedDates])
}

export default function StepJornadaFecha({ booking, updateBooking, updateFecha, hotel }) {
  const room  = booking.room
  const today = startOfDay(new Date())
  const tomorrow = addDays(today, 1)
  const fechas = booking.fechas || []

  // Fechas bloqueadas para esta sala (ahora con jornada)
  const rawBlocked = hotel?.blockedDates?.[room.slug] || []
  const { fullyBlockedDays, blockedJornadasByDate } = useBlockedInfo(rawBlocked)

  useEffect(() => {
    if (!booking.jornada) {
      updateBooking({ fechas: [], jornada: 'completo' })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const globalJornada = booking.jornada || 'completo'

  // ── Helpers ──
  const isJornadaBlocked = (date, jornadaId) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const blocked = blockedJornadasByDate[dateStr]
    if (!blocked) return false

    // Si hay bloqueo 'completo', todas las jornadas están bloqueadas
    if (blocked.includes('completo')) return true

    // Si la jornada específica está bloqueada
    if (blocked.includes(jornadaId)) return true

    // Si se intenta reservar 'completo' pero mañana o tarde está bloqueada
    if (jornadaId === 'completo' && (blocked.includes('manana') || blocked.includes('tarde'))) return true

    return false
  }

  // ── Handlers de fecha ──
  const handleCalendarSelect = (days) => {
    if (!days) { updateBooking({ fechas: [], fecha: null }); return }

    const toAdd    = days.filter(d => !isBefore(d, today) && !fechas.some(f => isSameDay(f.date, d)))
    const toRemove = fechas.filter(f => !days.some(d => isSameDay(d, f.date)))

    const lastFecha = fechas[fechas.length - 1]

    // Para la jornada por defecto, buscar la primera disponible
    const getDefaultJornada = (date) => {
      const preferred = lastFecha?.jornada || globalJornada
      if (!isJornadaBlocked(date, preferred)) return preferred
      // Si la preferida está bloqueada, buscar la primera disponible
      for (const j of JORNADAS) {
        if (!isJornadaBlocked(date, j.id)) return j.id
      }
      return preferred
    }

    const defaults = {
      layout: lastFecha?.layout || null,
      asistentes: lastFecha?.asistentes || '',
    }

    const nf = fechas
      .filter(f => !toRemove.some(r => isSameDay(r.date, f.date)))
      .concat(toAdd.map(d => ({
        date: d,
        jornada: getDefaultJornada(d),
        ...defaults,
      })))
      .sort((a, b) => a.date - b.date)

    updateBooking({ fechas: nf, fecha: nf[0]?.date || null })
  }

  const removeDate = (day) => {
    const nf = fechas.filter(f => !isSameDay(f.date, day))
    updateBooking({ fechas: nf, fecha: nf[0]?.date || null })
  }

  // ── Handlers por fecha ──
  const setFechaJornada = (date, jornada) => updateFecha(date, { jornada })

  const setFechaLayout = (date, layout) => {
    const f = fechas.find(ff => isSameDay(ff.date, date))
    const lo = room.layouts.find(l => l.type === layout)
    const maxPax = lo ? lo.max : Math.max(...room.layouts.map(l => l.max))
    const asistentes = (f?.asistentes && f.asistentes > maxPax) ? maxPax : f?.asistentes
    updateFecha(date, { layout, asistentes })
  }

  const handlePaxBtn = (date, delta) => {
    const f = fechas.find(ff => isSameDay(ff.date, date))
    if (!f) return
    const lo = f.layout ? room.layouts.find(l => l.type === f.layout) : null
    const maxPax = lo ? lo.max : Math.max(...room.layouts.map(l => l.max))
    const cur = parseInt(f.asistentes) || 1
    updateFecha(date, { asistentes: Math.min(Math.max(cur + delta, 1), maxPax) })
  }

  const handlePaxInput = (date, value) => {
    const f = fechas.find(ff => isSameDay(ff.date, date))
    if (!f) return
    if (value === '') { updateFecha(date, { asistentes: '' }); return }
    const lo = f.layout ? room.layouts.find(l => l.type === f.layout) : null
    const maxPax = lo ? lo.max : Math.max(...room.layouts.map(l => l.max))
    const n = parseInt(value)
    if (!isNaN(n)) updateFecha(date, { asistentes: Math.min(Math.max(n, 1), maxPax) })
  }

  const datesRef = useRef(null)

  const scrollToDates = () => {
    datesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <motion.div className={styles.wrapper} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>

      <div className={styles.topRow}>
        <h2 className={styles.title}>Fecha y configuración</h2>
        <p className={styles.subtitle}>Selecciona los días y configura cada uno de forma independiente.</p>
      </div>

      <div className={styles.mainRow}>

        {/* ── COLUMNA IZQUIERDA: Calendario ── */}
        <div className={styles.calCol}>
          <div className={styles.calWrap}>
            <DayPicker
              mode="multiple"
              selected={fechas.map(f => f.date)}
              onSelect={handleCalendarSelect}
              locale={es}
              disabled={[{ before: tomorrow }, ...fullyBlockedDays]}
              modifiers={{ blocked: fullyBlockedDays }}
              modifiersClassNames={{ blocked: styles.blockedDay }}
              showOutsideDays={false}
            />
          </div>

          {/* Scroll hint — solo visible en layout apilado cuando hay fechas */}
          {fechas.length > 0 && (
            <motion.button
              className={styles.scrollHint}
              onClick={scrollToDates}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span>Configurar {fechas.length} {fechas.length === 1 ? 'fecha' : 'fechas'}</span>
              <ChevronDown size={15} />
            </motion.button>
          )}
        </div>

        {/* ── COLUMNA DERECHA: Fechas seleccionadas con config ── */}
        <div className={styles.datesCol} ref={datesRef}>
          <AnimatePresence mode="wait">
            {fechas.length === 0 ? (
              <motion.div
                key="empty"
                className={styles.emptyDates}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <span className={styles.emptyIcon}>📅</span>
                <span className={styles.emptyText}>Selecciona uno o varios días en el calendario</span>
              </motion.div>
            ) : (
              <motion.div
                key="filled"
                className={styles.dateList}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
              >
                {fechas.map(f => {
                  const j     = JORNADAS.find(jj => jj.id === f.jornada) || JORNADAS[1]
                  const price = room.pricing[j.priceKey]
                  const selectedLayout = f.layout ? room.layouts.find(l => l.type === f.layout) : null
                  const maxPax = selectedLayout ? selectedLayout.max : Math.max(...room.layouts.map(l => l.max))

                  return (
                    <div key={f.date.toISOString()} className={styles.dateCard}>

                      {/* Header de la fecha */}
                      <div className={styles.dateCardHeader}>
                        <div className={styles.dateCardInfo}>
                          <span className={styles.dateCardDate}>
                            {format(f.date, "EEEE d 'de' MMMM", { locale: es })}
                          </span>
                          <div className={styles.dateCardMeta}>
                            <span className={styles.dateCardJornada}>{j.name}</span>
                            <span className={styles.metaDot} />
                            <span className={styles.dateCardHours}>{j.hours}</span>
                            <span className={styles.metaDot} />
                            <span className={styles.dateCardPrice}>{price}€</span>
                          </div>
                        </div>
                        <button className={styles.removeBtn} onClick={() => removeDate(f.date)} title="Quitar fecha">
                          <X size={13} />
                        </button>
                      </div>

                      {/* Jornada pills — disabled si bloqueada */}
                      <div className={styles.dateSection}>
                        <span className={styles.dateSectionLabel}>Jornada</span>
                        <div className={styles.jornadaPills}>
                          {JORNADAS.map(jj => {
                            const blocked = isJornadaBlocked(f.date, jj.id)
                            return (
                              <button
                                key={jj.id}
                                className={`${styles.jornadaPill} ${f.jornada === jj.id ? styles.jornadaPillOn : ''} ${blocked ? styles.jornadaPillBlocked : ''}`}
                                onClick={() => setFechaJornada(f.date, jj.id)}
                                disabled={blocked}
                                title={blocked ? 'No disponible' : ''}
                              >
                                <span className={styles.jornadaPillName}>{jj.name}</span>
                                <span className={styles.jornadaPillPrice}>
                                  {blocked ? 'No disponible' : `${room.pricing[jj.priceKey]}€`}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Layout selector */}
                      <div className={styles.dateSection}>
                        <span className={styles.dateSectionLabel}>Configuración de sala</span>
                        <div className={styles.layoutGrid}>
                          {room.layouts.map(layout => (
                            <button
                              key={layout.type}
                              className={`${styles.layoutCard} ${f.layout === layout.type ? styles.layoutOn : ''}`}
                              data-type={layout.type}
                              onClick={() => setFechaLayout(f.date, layout.type)}
                            >
                              <img src={LAYOUT_SVGS[layout.type]} alt={layout.label} className={styles.layoutSvg} />
                              <span className={styles.layoutName}>{layout.label}</span>
                              <span className={styles.layoutMax}>{layout.max} pax</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Asistentes */}
                      <div className={styles.dateSection}>
                        <span className={styles.dateSectionLabel}>Asistentes</span>
                        <div className={styles.counterRow}>
                          <button
                            className={styles.counterBtn}
                            onClick={() => handlePaxBtn(f.date, -1)}
                            disabled={!f.asistentes || f.asistentes <= 1}
                          ><Minus size={14} /></button>
                          <input
                            type="number"
                            className={styles.counterInput}
                            value={f.asistentes || ''}
                            onChange={e => handlePaxInput(f.date, e.target.value)}
                            min={1}
                            max={maxPax}
                            placeholder="—"
                          />
                          <button
                            className={styles.counterBtn}
                            onClick={() => handlePaxBtn(f.date, 1)}
                            disabled={!!f.asistentes && f.asistentes >= maxPax}
                          ><Plus size={14} /></button>
                          <span className={styles.counterHint}>máx. {maxPax}</span>
                        </div>
                      </div>

                    </div>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </motion.div>
  )
}
