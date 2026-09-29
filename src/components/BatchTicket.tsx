import type { ReactNode } from 'react'
import type { Batch } from '../data/shop'
import { formatRoastDate } from '../data/shop'

type BatchTicketProps = {
  batch: Batch
  /** `full` for the batch chapter and checkout; `strip` for the hero and marquee. */
  variant?: 'full' | 'strip'
  /** Use `div` when the ticket sits inside a <label> or <a> (checkout picker). */
  as?: 'article' | 'div'
  /** Lift on hover: set when the ticket itself is (inside) something clickable. */
  interactive?: boolean
  selected?: boolean
  /** Optional CTA, e.g. an InkButton. Omit when the whole ticket is the control. */
  action?: ReactNode
  className?: string
}

// Full class names written out: Tailwind drops @layer components rules it can't find literally.
const VARIANT_CLASS = { full: 'batch-ticket--full', strip: 'batch-ticket--strip' } as const

/**
 * The signature element (BRIEF §4): a cream paper ticket for one batch, with
 * a perforated stub, the batch code in Plex Mono, a rotated roast-date stamp,
 * tasting notes and a bags-left counter. All values come from src/data/shop.ts;
 * the labels match the ones checkout already uses.
 */
export function BatchTicket({
  batch,
  variant = 'full',
  as: Tag = 'article',
  interactive = false,
  selected = false,
  action,
  className = ''
}: BatchTicketProps) {
  const soldOut = batch.bagsLeft === 0
  const roasted = `Roasted ${formatRoastDate(batch.roastDate)}`
  const stock = soldOut ? 'Sold out' : `${batch.bagsLeft} of ${batch.bagsTotal} bags left`
  const classes = [
    'batch-ticket',
    VARIANT_CLASS[variant],
    interactive && !soldOut ? 'batch-ticket--interactive' : '',
    selected ? 'batch-ticket--selected' : '',
    soldOut ? 'batch-ticket--sold-out' : '',
    className
  ]
    .filter(Boolean)
    .join(' ')

  const stamp = (
    <span className="batch-ticket__stamp" data-testid="batch-stamp">
      {soldOut ? 'Sold out' : roasted}
    </span>
  )

  if (variant === 'strip') {
    return (
      <Tag className={classes} aria-label={Tag === 'article' ? `Batch ${batch.code}` : undefined}>
        <div className="batch-ticket__paper">
          <p className="batch-ticket__code">
            <span className="batch-ticket__label">Batch</span> {batch.code}
          </p>
          <p className="batch-ticket__meta">{soldOut ? roasted : stamp}</p>
          <p className="batch-ticket__stock">{stock}</p>
          {action ? <div className="batch-ticket__action">{action}</div> : null}
        </div>
      </Tag>
    )
  }

  const fraction = batch.bagsTotal > 0 ? batch.bagsLeft / batch.bagsTotal : 0

  return (
    <Tag className={classes} aria-label={Tag === 'article' ? `Batch ${batch.code}` : undefined}>
      <div className="batch-ticket__paper">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <p className="batch-ticket__label">Batch</p>
          {stamp}
        </div>
        <p className="batch-ticket__code">{batch.code}</p>
        <p className="batch-ticket__meta">
          {soldOut ? `${roasted} · ` : ''}
          {batch.harvest} · Cup score {batch.cupScore.toFixed(1)}
        </p>

        <ul className="batch-ticket__notes" aria-label="tasting notes">
          {batch.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>

        <div className="batch-ticket__counter">
          <p className="batch-ticket__stock">{stock}</p>
          <span className="batch-ticket__meter" aria-hidden="true">
            <span style={{ width: `${Math.round(fraction * 100)}%` }} />
          </span>
        </div>

        {action ? <div className="batch-ticket__action">{action}</div> : null}
      </div>
    </Tag>
  )
}
