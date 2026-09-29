import type { Batch } from '../data/shop'

/** Link that opens checkout with this batch already selected. */
export const checkoutHref = (batch: Pick<Batch, 'code'>) => `/checkout?batch=${encodeURIComponent(batch.code)}`

/**
 * Batch picked from `?batch=CODE`, falling back to the newest batch with stock.
 * Sold-out or unknown codes are ignored. Returns undefined for an empty catalogue.
 */
export function initialBatchCode(
  batches: readonly Pick<Batch, 'code' | 'bagsLeft'>[],
  search = typeof window === 'undefined' ? '' : window.location.search
) {
  const firstAvailable = batches.find((b) => b.bagsLeft > 0) ?? batches[0]
  const requested = new URLSearchParams(search).get('batch')
  const match = batches.find((b) => b.code === requested && b.bagsLeft > 0)
  return (match ?? firstAvailable)?.code
}
