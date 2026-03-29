import { cn } from '../../lib/utils'

export function BorderBeam({
  size = 80,
  duration = 10,
  colorFrom = '#A07848',
  colorTo = 'rgba(160,120,72,0)',
  borderRadius = '1.25rem',
  className,
}) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]',
        className
      )}
    >
      <div
        style={{
          position: 'absolute',
          width: `${size}px`,
          height: `${size}px`,
          background: `radial-gradient(closest-side, ${colorFrom}, ${colorTo})`,
          offsetPath: `rect(0px auto auto 0px round ${borderRadius})`,
          offsetDistance: '0%',
          offsetAnchor: 'center',
          animation: `border-beam-travel ${duration}s linear infinite`,
          opacity: 0.65,
          filter: 'blur(4px)',
        }}
      />
    </div>
  )
}
