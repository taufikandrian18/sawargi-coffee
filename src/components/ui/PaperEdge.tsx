/**
 * Torn-paper edge for the top or bottom of a cream band (BRIEF §3).
 * The outline is generated here from a seeded random walk, so it is original
 * and identical on every render (no layout shift, no hydration drift).
 */

const WIDTH = 1440
const HEIGHT = 40

function seeded(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

function tornPath(seed: number) {
  const random = seeded(seed)
  const points: string[] = []
  let x = 0
  let y = HEIGHT * 0.55
  while (x < WIDTH) {
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`)
    x += 3 + random() * 9
    // Mostly fine fibres, now and then a deeper tear; a slow drift keeps it from looking like noise.
    const step = random() < 0.05 ? (random() - 0.5) * 18 : (random() - 0.5) * 4.5
    y += (HEIGHT * 0.5 - y) * 0.04
    y = Math.min(HEIGHT - 3, Math.max(3, y + step))
  }
  points.push(`${WIDTH},${y.toFixed(1)}`)
  return `M0,${HEIGHT} L${points.join(' L')} L${WIDTH},${HEIGHT} Z`
}

const PATHS = { top: tornPath(1507), bottom: tornPath(2711) }
// Full class names written out: Tailwind drops @layer components rules it can't find literally.
const SIDE_CLASS = { top: 'paper-edge--top', bottom: 'paper-edge--bottom' } as const

type PaperEdgeProps = {
  /** Which edge of the cream band this sits on. */
  side: 'top' | 'bottom'
  className?: string
}

export function PaperEdge({ side, className = '' }: PaperEdgeProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      className={`paper-edge ${SIDE_CLASS[side]} ${className}`.trim()}
    >
      <path d={PATHS[side]} fill="currentColor" />
    </svg>
  )
}
