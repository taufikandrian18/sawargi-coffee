import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { isCoarsePointer, prefersReducedMotion } from './motion'

const INTERACTIVE = 'a, button, [role="button"], label, summary, select'

/**
 * A 14px cream dot that trails the pointer and grows over interactive
 * elements (BRIEF §3). Decorative only: the native cursor stays visible.
 * Not rendered for touch or reduced motion.
 */
export function CursorDot() {
  const ref = useRef<HTMLDivElement | null>(null)
  const [enabled] = useState(() => !isCoarsePointer() && !prefersReducedMotion())

  useEffect(() => {
    const dot = ref.current
    if (!enabled || !dot) return

    const moveX = gsap.quickTo(dot, 'x', { duration: 0.35, ease: 'power3.out' })
    const moveY = gsap.quickTo(dot, 'y', { duration: 0.35, ease: 'power3.out' })
    let shown = false

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      if (!shown) {
        gsap.set(dot, { x: event.clientX, y: event.clientY })
        dot.dataset.visible = 'true'
        shown = true
      }
      moveX(event.clientX)
      moveY(event.clientY)
    }
    const onOver = (event: PointerEvent) => {
      const target = event.target as Element | null
      dot.dataset.active = target?.closest(INTERACTIVE) ? 'true' : 'false'
    }
    const onLeave = () => {
      dot.dataset.visible = 'false'
      shown = false
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerover', onOver, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)

    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerover', onOver)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      gsap.killTweensOf(dot)
    }
  }, [enabled])

  if (!enabled) return null
  return (
    <div ref={ref} aria-hidden="true" data-testid="cursor-dot" className="cursor-dot">
      <span className="cursor-dot__disc" />
    </div>
  )
}
