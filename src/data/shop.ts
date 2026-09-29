/**
 * Single source of truth for the shop. Edit prices, batches, shipping and
 * exchange rates here — the checkout reads everything from this file.
 *
 * NOTE: batch data below is SAMPLE DATA for the demo checkout.
 * Replace with real roast dates, bag counts and cupping scores before launch.
 */

export const PRODUCT = {
  id: 'ciwidey-natural-1kg',
  name: 'Ciwidey Natural',
  origin: 'Ciwidey, West Java',
  process: 'Natural (dried in the cherry)',
  sizeLabel: '1 kg',
  priceIdr: 150_000
} as const

export type Batch = {
  code: string
  roastDate: string // ISO date
  harvest: string
  bagsTotal: number
  bagsLeft: number
  cupScore: number
  notes: string[]
}

export const BATCHES: Batch[] = [
  {
    code: 'SWG-CN-014',
    roastDate: '2026-09-24',
    harvest: '2026 main crop',
    bagsTotal: 60,
    bagsLeft: 23,
    cupScore: 85.5,
    notes: ['jackfruit', 'palm sugar', 'cacao nib']
  },
  {
    code: 'SWG-CN-013',
    roastDate: '2026-09-17',
    harvest: '2026 main crop',
    bagsTotal: 60,
    bagsLeft: 6,
    cupScore: 85.0,
    notes: ['red grape', 'brown sugar', 'clove']
  },
  {
    code: 'SWG-CN-012',
    roastDate: '2026-09-09',
    harvest: '2026 early crop',
    bagsTotal: 48,
    bagsLeft: 0,
    cupScore: 84.5,
    notes: ['dried mango', 'molasses', 'black tea']
  }
]

export type GrindId = 'whole' | 'coarse' | 'medium' | 'fine'

export const GRINDS: { id: GrindId; label: string; hint: string }[] = [
  { id: 'whole', label: 'Whole bean', hint: 'Grind at home, stays fresh longest' },
  { id: 'coarse', label: 'Coarse', hint: 'French press, cold brew, tubruk' },
  { id: 'medium', label: 'Medium', hint: 'Pour-over, drip, AeroPress' },
  { id: 'fine', label: 'Fine', hint: 'Espresso, moka pot' }
]

export type ShippingId = 'regular' | 'express'

export const SHIPPING: { id: ShippingId; label: string; eta: string; costIdr: number }[] = [
  { id: 'regular', label: 'Regular', eta: '2–4 days', costIdr: 20_000 },
  { id: 'express', label: 'Express', eta: 'Next day (Java)', costIdr: 35_000 }
]

/** Regular shipping is free from this many bags. */
export const FREE_SHIPPING_MIN_BAGS = 3

export const MAX_BAGS_PER_ORDER = 10

export type CurrencyCode = 'IDR' | 'USD' | 'SGD' | 'EUR'

/**
 * Indicative mid-market rates (IDR per 1 unit), checked 29 Sep 2026.
 * Orders are always charged in IDR; other currencies are display only.
 */
export const RATES_AS_OF = '29 Sep 2026'

export const CURRENCIES: Record<
  CurrencyCode,
  { idrPerUnit: number; locale: string; fractionDigits: number }
> = {
  IDR: { idrPerUnit: 1, locale: 'id-ID', fractionDigits: 0 },
  USD: { idrPerUnit: 17_950, locale: 'en-US', fractionDigits: 2 },
  SGD: { idrPerUnit: 14_080, locale: 'en-SG', fractionDigits: 2 },
  EUR: { idrPerUnit: 20_400, locale: 'de-DE', fractionDigits: 2 }
}

export type PaymentId = 'qris' | 'va' | 'card'

export const PAYMENT_METHODS: { id: PaymentId; label: string; hint: string }[] = [
  { id: 'qris', label: 'QRIS', hint: 'GoPay, OVO, DANA, ShopeePay, m-banking' },
  { id: 'va', label: 'Bank transfer', hint: 'BCA virtual account' },
  { id: 'card', label: 'Card', hint: 'Visa / Mastercard' }
]

export function formatMoney(amountIdr: number, currency: CurrencyCode): string {
  const { idrPerUnit, locale, fractionDigits } = CURRENCIES[currency]
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(amountIdr / idrPerUnit)
}

export function calcTotals(quantity: number, shippingId: ShippingId) {
  const subtotal = PRODUCT.priceIdr * quantity
  const option = SHIPPING.find((s) => s.id === shippingId) ?? SHIPPING[0]
  const freeShipping = option.id === 'regular' && quantity >= FREE_SHIPPING_MIN_BAGS
  const shipping = freeShipping ? 0 : option.costIdr
  return { subtotal, shipping, freeShipping, total: subtotal + shipping }
}

export function maxQuantityFor(batch: Batch) {
  return Math.min(batch.bagsLeft, MAX_BAGS_PER_ORDER)
}

export function formatRoastDate(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(`${iso}T00:00:00`))
}
