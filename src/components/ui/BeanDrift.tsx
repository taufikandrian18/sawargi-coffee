import type { CSSProperties } from 'react'

/**
 * A few original SVG coffee beans that pop and drift in the hero margins
 * (BRIEF §3). Decorative; static under reduced motion.
 */
const BEANS = [
  { top: '14%', left: '6%', size: 34, rotate: -24, delay: 0, duration: 7.5, hideSm: false },
  { top: '26%', left: '84%', size: 22, rotate: 38, delay: -2.1, duration: 6.2, hideSm: false },
  { top: '58%', left: '92%', size: 40, rotate: 12, delay: -4.4, duration: 8.4, hideSm: true },
  { top: '8%', left: '58%', size: 18, rotate: 70, delay: -1.3, duration: 5.6, hideSm: true },
  { top: '70%', left: '3%', size: 26, rotate: -52, delay: -3.2, duration: 6.9, hideSm: true }
] as const

function Bean({ size }: { size: number }) {
  return (
    <svg width={size} height={Math.round(size * 1.35)} viewBox="-15 -20 30 40" aria-hidden="true" focusable="false">
      <ellipse rx="13.5" ry="19" fill="var(--paper-mut)" />
      <path d="M-1 -16.5 C 5 -9, -6 -2, 1 5 S 4 13, -1 16.5" fill="none" stroke="var(--ink)" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

export function BeanDrift() {
  return (
    <div aria-hidden="true" data-testid="bean-drift" className="pointer-events-none absolute inset-0 z-[15] overflow-hidden">
      {BEANS.map((bean, index) => (
        <span
          key={index}
          className={`bean-drift ${bean.hideSm ? 'hidden md:block' : ''}`}
          style={
            {
              top: bean.top,
              left: bean.left,
              '--bean-rotate': `${bean.rotate}deg`,
              animationDelay: `${bean.delay}s`,
              animationDuration: `${bean.duration}s`
            } as CSSProperties
          }
        >
          <Bean size={bean.size} />
        </span>
      ))}
    </div>
  )
}
