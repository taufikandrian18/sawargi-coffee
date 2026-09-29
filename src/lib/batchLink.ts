import type { Batch } from '../data/shop'
import { BATCHES } from '../data/shop'

/** Link that opens checkout with this batch already selected. */
export const checkoutHref = (batch: Batch) => `/checkout?batch=${encodeURIComponent(batch.code)}`

/**
 * Batch picked from `?batch=CODE`, falling back to the newest batch with stock.
 * Sold-out or unknown codes are ignored.
 */
export function initialBatchCode(search = typeof window === 'undefined' ? '' : window.location.search) {
  const firstAvailable = BATCHES.find((b) => b.bagsLeft > 0) ?? BATCHES[0]
  const requested = new URLSearchParams(search).get('batch')
  const match = BATCHES.find((b) => b.code === requested && b.bagsLeft > 0)
  return (match ?? firstAvailable).code
}
