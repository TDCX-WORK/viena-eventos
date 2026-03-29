import { cn } from '../../lib/utils'

export function ShimmerButton({ className, children, ...props }) {
  return (
    <button
      className={cn(
        'relative overflow-hidden rounded-[1rem]',
        'inline-flex items-center justify-center gap-2',
        'bg-[#18120E] px-6 py-[1rem]',
        'text-[0.9rem] font-semibold text-white leading-none tracking-[0.01em]',
        '[font-family:Inter,system-ui,sans-serif]',
        'cursor-pointer select-none',
        'transition-all duration-300',
        'hover:bg-[#2C1F14] hover:-translate-y-px',
        'disabled:opacity-25 disabled:cursor-not-allowed disabled:!translate-y-0',
        "after:content-[''] after:absolute after:inset-0",
        'after:-translate-x-full after:animate-[shimmer_2.5s_ease-in-out_infinite]',
        'after:bg-gradient-to-r after:from-transparent after:via-white/[0.07] after:to-transparent',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
