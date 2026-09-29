import type { ReactNode } from 'react'

type MarqueeProps = {
  /** Accessible name for the list of items. */
  label: string
  items: ReactNode[]
  className?: string
}

/**
 * Endless horizontal ticker (BRIEF §3): the item group is rendered twice and
 * the track slides by exactly one group (-50%), so the loop is seamless.
 * Pauses on hover and while anything inside has focus. The second copy is
 * hidden from assistive tech and holds nothing focusable. Under reduced
 * motion only the first group shows, wrapped and static.
 */
export function Marquee({ label, items, className = '' }: MarqueeProps) {
  const group = (copy: 'a' | 'b') => (
    <ul
      className="marquee__group"
      aria-label={copy === 'a' ? label : undefined}
      aria-hidden={copy === 'b' ? true : undefined}
      data-copy={copy}
    >
      {items.map((item, index) => (
        <li key={index} className="marquee__item">
          {item}
        </li>
      ))}
    </ul>
  )

  return (
    <div className={`marquee ${className}`.trim()}>
      <div className="marquee__track">
        {group('a')}
        {group('b')}
      </div>
    </div>
  )
}
