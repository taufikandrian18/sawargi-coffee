import type { CSSProperties } from 'react'

type WiggleProps = {
  text: string
  className?: string
}

/**
 * Accent words that rock ±2deg, each word offset so they never move in step
 * (BRIEF §3). Use on 1–2 phrases on the whole site. Reduced motion: static.
 */
export function Wiggle({ text, className = '' }: WiggleProps) {
  const words = text.split(/\s+/).filter(Boolean)

  return (
    <span className={className}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`}>
          <span className="sw-wiggle" style={{ animationDelay: `${index * -0.18}s` } as CSSProperties}>
            {word}
          </span>
          {index < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </span>
  )
}
