import { useEffect, useRef } from 'react'
import { useMotionValue, useSpring } from 'framer-motion'
import { cn } from '../../lib/utils'

export function NumberTicker({ value, className }) {
  const ref = useRef(null)
  const motionValue = useMotionValue(value)
  const springValue = useSpring(motionValue, { damping: 60, stiffness: 100 })

  useEffect(() => {
    motionValue.set(value)
  }, [motionValue, value])

  useEffect(() => {
    return springValue.on('change', (latest) => {
      if (ref.current) {
        ref.current.textContent = Math.round(latest).toLocaleString('es-ES')
      }
    })
  }, [springValue])

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {value}
    </span>
  )
}
