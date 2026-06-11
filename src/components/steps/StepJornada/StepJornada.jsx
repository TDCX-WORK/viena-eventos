import { useRef, useEffect, useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { Sunrise, Sunset, CalendarDays } from 'lucide-react'
import styles from './StepJornada.module.css'

import teatroSvg   from '../../../assets/layouts/teatro.svg?url'
import uSvg        from '../../../assets/layouts/u.svg?url'
import imperialSvg from '../../../assets/layouts/imperial.svg?url'
import escuelaSvg  from '../../../assets/layouts/escuela.svg?url'

const LAYOUT_SVGS = { teatro: teatroSvg, u: uSvg, imperial: imperialSvg, escuela: escuelaSvg }

// Arc parametric: quadratic bezier t∈[0,1] → {x%,y%}
const ARC_P0 = { x: 4,  y: 90 }
const ARC_P1 = { x: 50, y: 22 }
const ARC_P2 = { x: 96, y: 90 }

function arcPt(t) {
  const m = 1 - t
  return {
    x: m*m*ARC_P0.x + 2*m*t*ARC_P1.x + t*t*ARC_P2.x,
    y: m*m*ARC_P0.y + 2*m*t*ARC_P1.y + t*t*ARC_P2.y,
  }
}

function ease(x) {
  return x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3) / 2
}

function lerp(a, b, p) { return a + (b - a) * p }

// Visual style per slot (0=left, 1=center, 2=right)
function vStyle(slot) {
  const c = slot === 1
  return {
    iconSz:    c ? 34 : 22,
    nameSz:    c ? 1.9 : 1.05,
    priceSz:   c ? 1.2 : 0.9,
    nameCol:   c ? '#18120E' : '#a8a29e',
    priceCol:  c ? '#A07848' : '#c4bfba',
    hoursCol:  c ? '#57534e' : '#c4bfba',
    iconCol:   c ? '#A07848' : '#c4bfba',
    opacity:   c ? 1 : 0.55,
  }
}

const T_SLOTS = [0, 0.5, 1]

// The 3 jornadas in fixed order: left, center, right initial
const JORNADAS_DATA = [
  { id: 'manana',   name: 'Mañana',       hours: '9:00–14:00',  priceKey: 'halfDay', Icon: Sunrise },
  { id: 'completo', name: 'Día completo', hours: '9:00–20:00',  priceKey: 'fullDay', Icon: CalendarDays },
  { id: 'tarde',    name: 'Tarde',        hours: '15:00–20:00', priceKey: 'halfDay', Icon: Sunset },
]

// elIdx → jornada index (fixed forever): el0=manana, el1=completo, el2=tarde
// slotOf[elIdx] → current slot (mutable)
const INITIAL_SLOT_OF = [0, 1, 2] // el0→slot0(left), el1→slot1(center), el2→slot2(right)

export default function StepJornada({ booking, updateBooking }) {
  const room = booking.room
  const maxCapacity = Math.max(...room.layouts.map(l => l.max))
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 600)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const handleLayout     = (type) => updateBooking({ layout: type })
  const handleAsistentes = (delta) => {
    const current = parseInt(booking.asistentes) || 1
    const next = Math.min(Math.max(current + delta, 1), maxCapacity)
    updateBooking({ asistentes: next })
  }

  const canContinue = !!(booking.jornada && booking.asistentes && booking.layout)

  // Arc state managed in refs to avoid re-render during animation
  const slotOfRef  = useRef([...INITIAL_SLOT_OF]) // slotOfRef.current[elIdx] = slot
  const busyRef    = useRef(false)
  const stageRef   = useRef(null)
  const elRefs     = useRef([null, null, null])
  const arcSvgRef  = useRef(null)

  // Which elIdx is at a given slot?
  const elAtSlot = useCallback((slot) => {
    return slotOfRef.current.findIndex(s => s === slot)
  }, [])

  const renderEl = useCallback((elIdx, slot, opacity) => {
    const el = elRefs.current[elIdx]
    if (!el) return
    const j = JORNADAS_DATA[elIdx]
    const v = vStyle(slot)
    const op = opacity !== undefined ? opacity : v.opacity
    const pt = arcPt(T_SLOTS[slot])
    const price = room.pricing[j.priceKey]

    el.style.cssText = `
      position:absolute;
      left:${pt.x}%;
      top:${pt.y}%;
      transform:translate(-50%,-50%);
      opacity:${op};
      z-index:${slot === 1 ? 10 : 5};
      display:flex;
      flex-direction:column;
      align-items:center;
      gap:3px;
      cursor:${slot !== 1 ? 'pointer' : 'default'};
      user-select:none;
    `
    el.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;color:${v.iconCol}">
        ${iconSvg(elIdx, v.iconSz)}
      </div>
      <div style="font-family:'Playfair Display',Georgia,serif;font-weight:600;font-size:${v.nameSz}rem;color:${v.nameCol};letter-spacing:-0.02em;text-align:center;line-height:1.1">${j.name}</div>
      <div style="font-size:0.68rem;color:${v.hoursCol};text-align:center;font-variant-numeric:tabular-nums">${j.hours}</div>
      <div style="font-family:'Playfair Display',Georgia,serif;font-weight:700;font-size:${v.priceSz}rem;color:${v.priceCol};letter-spacing:-0.03em">${price}€</div>
    `
    el.onclick = slot !== 1 && !busyRef.current ? () => handleArcClick(slot) : null
  }, [room])

  function iconSvg(elIdx, sz) {
    const paths = [
      // Sunrise (manana)
      'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41 M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
      // CalendarDays (completo)
      'M3 4h18v16H3zM3 9h18M8 4v5M16 4v5',
      // Sunset (tarde)
      'M17 18a5 5 0 0 0-10 0M12 2v9m-7.78 8.22 1.42-1.42M2 17h2m17.78.22-1.42-1.42M22 17h-2',
    ]
    return `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[elIdx]}"/></svg>`
  }

  function animateEl(elIdx, fromSlot, toSlot, dur, onDone) {
    const el = elRefs.current[elIdx]
    if (!el) return
    const j  = JORNADAS_DATA[elIdx]
    const vs = vStyle(fromSlot)
    const ve = vStyle(toSlot)
    const tFrom = T_SLOTS[fromSlot]
    const tTo   = T_SLOTS[toSlot]
    const price = room.pricing[j.priceKey]
    const start = performance.now()

    function frame(now) {
      const raw = Math.min((now - start) / dur, 1)
      const p   = ease(raw)
      const t   = lerp(tFrom, tTo, p)
      const pt  = arcPt(t)

      const iconSz  = Math.round(lerp(vs.iconSz, ve.iconSz, p))
      const nameSz  = lerp(vs.nameSz, ve.nameSz, p)
      const priceSz = lerp(vs.priceSz, ve.priceSz, p)
      const op      = lerp(vs.opacity, ve.opacity, p)
      const mid     = p > 0.5
      const nc = mid ? ve.nameCol  : vs.nameCol
      const pc = mid ? ve.priceCol : vs.priceCol
      const hc = mid ? ve.hoursCol : vs.hoursCol
      const ic = mid ? ve.iconCol  : vs.iconCol

      el.style.left    = pt.x + '%'
      el.style.top     = pt.y + '%'
      el.style.opacity = op
      el.style.zIndex  = toSlot === 1 ? 10 : 5
      el.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;color:${ic}">
          ${iconSvg(elIdx, iconSz)}
        </div>
        <div style="font-family:'Playfair Display',Georgia,serif;font-weight:600;font-size:${nameSz.toFixed(3)}rem;color:${nc};letter-spacing:-0.02em;text-align:center;line-height:1.1">${j.name}</div>
        <div style="font-size:0.68rem;color:${hc};text-align:center;font-variant-numeric:tabular-nums">${j.hours}</div>
        <div style="font-family:'Playfair Display',Georgia,serif;font-weight:700;font-size:${priceSz.toFixed(3)}rem;color:${pc};letter-spacing:-0.03em">${price}€</div>
      `
      if (raw < 1) {
        requestAnimationFrame(frame)
      } else {
        renderEl(elIdx, toSlot)
        if (onDone) onDone()
      }
    }
    requestAnimationFrame(frame)
  }

  function attachClicks() {
    elRefs.current.forEach((el, elIdx) => {
      if (!el) return
      const slot = slotOfRef.current[elIdx]
      el.style.cursor = slot !== 1 ? 'pointer' : 'default'
      el.onclick = slot !== 1 && !busyRef.current ? () => handleArcClick(slot) : null
    })
  }

  function handleArcClick(clickedSlot) {
    if (busyRef.current) return
    busyRef.current = true

    const centerElIdx  = elAtSlot(1)
    const clickedElIdx = elAtSlot(clickedSlot)
    const otherSlot    = clickedSlot === 0 ? 2 : 0

    // Remove all clicks
    elRefs.current.forEach(el => { if (el) { el.onclick = null; el.style.cursor = 'default' } })

    // Update state
    slotOfRef.current[centerElIdx]  = clickedSlot
    slotOfRef.current[clickedElIdx] = 1

    // Update booking
    const newCenterJornada = JORNADAS_DATA[clickedElIdx]
    updateBooking({ jornada: newCenterJornada.id })

    let d1 = false, d2 = false
    function done() {
      if (d1 && d2) {
        busyRef.current = false
        // Re-render static element
        const otherElIdx = elAtSlot(otherSlot)
        renderEl(otherElIdx, otherSlot)
        attachClicks()
      }
    }

    animateEl(centerElIdx,  1,           clickedSlot, 650, () => { d1 = true; done() })
    animateEl(clickedElIdx, clickedSlot, 1,           650, () => { d2 = true; done() })
  }

  function buildArcPath() {
    let d = ''
    for (let i = 0; i <= 80; i++) {
      const p = arcPt(i / 80)
      d += `${i ? 'L' : 'M'} ${(p.x / 100 * 100).toFixed(2)}% ${(p.y / 100 * 100).toFixed(2)}% `
    }
    return d
  }

  // Init arc SVG and elements
  useEffect(() => {
    if (!stageRef.current) return

    // Draw arc as SVG polyline using % coordinates via foreignObject trick
    // Actually use a canvas-less approach: absolute positioned SVG
    const svg = arcSvgRef.current
    if (svg) {
      // Build points as percentage-based SVG path inside a 100x100 viewBox
      let d = ''
      for (let i = 0; i <= 80; i++) {
        const p = arcPt(i / 80)
        d += `${i ? 'L' : 'M'} ${p.x.toFixed(2)} ${p.y.toFixed(2)} `
      }
      svg.querySelector('path').setAttribute('d', d)
    }

    // Initial render of all 3 elements
    slotOfRef.current = [...INITIAL_SLOT_OF]
    elRefs.current.forEach((_, elIdx) => renderEl(elIdx, slotOfRef.current[elIdx]))
    attachClicks()

    // Set initial booking jornada to center (completo)
    updateBooking({ jornada: 'completo' })
  }, [])

  const centerElIdx = elAtSlot(1)
  const centerJ = JORNADAS_DATA[centerElIdx] || JORNADAS_DATA[1]
  const centerPrice = room.pricing[centerJ.priceKey]

  return (
    <motion.div
      className={styles.wrapper}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <h2 className={styles.title}>Elige tu jornada</h2>
        <p className={styles.subtitle}>Toca mañana o tarde para cambiar la selección</p>
      </div>

      {/* Arc selector (desktop) / Cards (mobile) */}
      {!isMobile ? (
        <div className={styles.arcOuter}>
          <div className={styles.arcStage} ref={stageRef}>
            <svg
              ref={arcSvgRef}
              className={styles.arcSvg}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <path fill="none" stroke="rgba(24,18,14,0.12)" strokeWidth="0.8" strokeDasharray="2 2" />
            </svg>
            <div ref={el => elRefs.current[0] = el} />
            <div ref={el => elRefs.current[1] = el} />
            <div ref={el => elRefs.current[2] = el} />
          </div>
          <div className={styles.arcInfo}>
            <span className={styles.arcInfoName}>
              {booking.jornada ? JORNADAS_DATA.find(j => j.id === booking.jornada)?.name : centerJ.name}
            </span>
            <span className={styles.arcInfoDot} />
            <span className={styles.arcInfoHours}>
              {booking.jornada ? JORNADAS_DATA.find(j => j.id === booking.jornada)?.hours : centerJ.hours}
            </span>
            <span className={styles.arcInfoDot} />
            <span className={styles.arcInfoPrice}>
              {booking.jornada ? room.pricing[JORNADAS_DATA.find(j => j.id === booking.jornada)?.priceKey] : centerPrice}€
            </span>
          </div>
        </div>
      ) : (
        <div className={styles.mobileJornadas}>
          {JORNADAS_DATA.map(j => {
            const isSelected = booking.jornada === j.id
            const price = room.pricing[j.priceKey]
            return (
              <button
                key={j.id}
                className={`${styles.mobileJornadaCard} ${isSelected ? styles.mobileSelected : ''}`}
                onClick={() => updateBooking({ jornada: j.id })}
              >
                <div className={styles.mobileJornadaLeft}>
                  <span className={styles.mobileJornadaName}>{j.name}</span>
                  <span className={styles.mobileJornadaHours}>{j.hours}</span>
                </div>
                <span className={styles.mobileJornadaPrice}>{price}€</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Layout grid */}
      <div className={styles.section}>
        <div className={styles.colLabel}>Configuración de sala</div>
        <div className={styles.layoutGrid}>
          {room.layouts.map(layout => (
            <button
              key={layout.type}
              className={`${styles.layoutCard} ${booking.layout === layout.type ? styles.selected : ''}`}
              data-type={layout.type}
              onClick={() => handleLayout(layout.type)}
            >
              <img src={LAYOUT_SVGS[layout.type]} alt={layout.label} className={styles.layoutSvg} aria-hidden="true" />
              <span className={styles.layoutName}>{layout.label}</span>
              <span className={styles.layoutMax}>hasta {layout.max} pax</span>
            </button>
          ))}
        </div>
      </div>

      {/* Asistentes */}
      <div className={styles.counterSection}>
        <span className={styles.counterLabel}>Número de asistentes</span>
        <div className={styles.counterRow}>
          <button
            className={styles.counterBtn}
            onClick={() => handleAsistentes(-1)}
            disabled={!booking.asistentes || booking.asistentes <= 1}
            aria-label="Restar"
          >−</button>
          <span className={styles.counterValue}>{booking.asistentes || '—'}</span>
          <button
            className={styles.counterBtn}
            onClick={() => handleAsistentes(1)}
            disabled={booking.asistentes >= maxCapacity}
            aria-label="Sumar"
          >+</button>
        </div>
        <span className={styles.counterMax}>máximo {maxCapacity} personas</span>
      </div>

    </motion.div>
  )
}
