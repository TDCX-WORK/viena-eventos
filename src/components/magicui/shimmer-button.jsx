import { cn } from '../../lib/utils'

export function ShimmerButton({ className, children, ...props }) {
  return (
    <button
      className={cn(
        'relative overflow-hidden rounded-[1rem]',
        'inline-flex items-center justify-center gap-2',
        'px-6 py-[0.75rem]',
        'text-[0.9rem] font-semibold leading-none tracking-[0.01em]',
        '[font-family:Inter,system-ui,sans-serif]',
        'cursor-pointer select-none',
        'transition-all duration-300',
        'disabled:opacity-25 disabled:cursor-not-allowed disabled:!translate-y-0',
        className
      )}
      style={{
        background: 'linear-gradient(135deg, #3D3530 0%, #2a2420 100%)',
        color: '#fff',
        border: '1px solid rgba(160,120,72,0.25)',
        boxShadow: '0 2px 0 rgba(255,255,255,0.08) inset, 0 4px 16px rgba(61,53,48,0.25)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'linear-gradient(135deg, #A07848 0%, #7a5a34 100%)'
        e.currentTarget.style.boxShadow = '0 2px 0 rgba(255,255,255,0.12) inset, 0 6px 20px rgba(160,120,72,0.35)'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'linear-gradient(135deg, #3D3530 0%, #2a2420 100%)'
        e.currentTarget.style.boxShadow = '0 2px 0 rgba(255,255,255,0.08) inset, 0 4px 16px rgba(61,53,48,0.25)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
      {...props}
    >
      {/* Shimmer sweep */}
      <span
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.12) 50%, transparent 65%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 2.5s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
      {children}
    </button>
  )
}