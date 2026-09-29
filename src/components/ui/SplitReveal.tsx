import type { CSSProperties, ElementType } from 'react'
import { useLayoutEffect, useRef } from 'react'
import { prefersReducedMotion } from './motion'

type SplitRevealProps = {
  text: string
  as?: ElementType
  className?: string
  /** Words (exact match) that also get the wiggle treatment. */
  wiggle?: readonly string[]
  /** Extra delay before the first word, in seconds. */
  delay?: number
}

/**
 * Headline reveal: each word rises out of its own mask, staggered 60ms
 * (BRIEF §3). Headlines only — keep it under ~8 words.
 *
 * Renders readable by default. Words are hidden only once JS confirms motion
 * is allowed ("armed"), then revealed once when 15% of the heading is visible.
 * Screen readers get the plain string; the split words are aria-hidden.
 */
export function SplitReveal({ text, as: Tag = 'h2', className = '', wiggle = [], delay = 0 }: SplitRevealProps) {
  const ref = useRef<HTMLElement | null>(null)
  const words = text.split(/\s+/).filter(Boolean)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return

    element.dataset.reveal = 'armed'
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          element.dataset.reveal = 'in'
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(element)

    return () => {
      observer.disconnect()
      delete element.dataset.reveal
    }
  }, [text])

  let wiggleIndex = 0

  return (
    <Tag ref={ref} className={`split-reveal ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, index) => {
          const wiggles = wiggle.includes(word)
          const style = {
            '--i': index,
            '--sr-delay': `${delay}s`,
            ...(wiggles ? { animationDelay: `${wiggleIndex++ * -0.18}s` } : {})
          } as CSSProperties
          return (
            <span key={`${word}-${index}`}>
              <span className="sr-mask">
                <span className={`sr-word${wiggles ? ' sw-wiggle' : ''}`} style={style}>
                  {word}
                </span>
              </span>
              {index < words.length - 1 ? ' ' : null}
            </span>
          )
        })}
      </span>
    </Tag>
  )
}
