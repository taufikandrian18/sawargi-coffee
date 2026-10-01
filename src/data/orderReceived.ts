/**
 * The order-received page's data: one order's summary from the shop
 * (wordpress/mu-plugins/sawargi-order-received.php), fetched with the order's
 * own key, the same credential WooCommerce puts in its order-received link.
 */

export type BankAccount = {
  bank_name: string
  account_name: string
  account_number: string
  sort_code: string
  iban: string
  bic: string
}

export type ReceivedOrder = {
  number: string
  date: string | null
  status: string
  status_label: string
  items: { name: string; quantity: number; total: number; details: { label: string; value: string }[] }[]
  currency: string
  subtotal: number
  shipping_total: number
  total: number
  payment_method: string
  payment_title: string
  needs_payment: boolean
  bank_accounts: BankAccount[]
  instructions: string
}

export type OrderRef = { id: string; key: string }

/** `?order=12&key=wc_order_…` from the URL WooCommerce redirects to. */
export function orderRefFromSearch(search: string): OrderRef | null {
  const params = new URLSearchParams(search)
  const id = params.get('order') ?? ''
  const key = params.get('key') ?? ''
  return /^\d+$/.test(id) && /^wc_order_[A-Za-z0-9]+$/.test(key) ? { id, key } : null
}

export async function fetchReceivedOrder(storeUrl: string, ref: OrderRef, fetchImpl: typeof fetch = fetch) {
  const base = storeUrl.replace(/\/+$/, '')
  const params = new URLSearchParams({ order: ref.id, key: ref.key })
  const response = await fetchImpl(`${base}/wp-json/sawargi/v1/order-received?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store'
  })
  if (!response.ok) throw new Error(`Order lookup responded ${response.status}`)
  const order = (await response.json()) as ReceivedOrder
  if (!order || typeof order.number !== 'string' || !Array.isArray(order.items)) {
    throw new Error('Order lookup returned an unexpected shape')
  }
  return order
}

/** WooCommerce's own order-received page; `sawargi_stay` stops it bouncing back here. */
export function wooOrderReceivedUrl(storeUrl: string, ref: OrderRef) {
  const base = storeUrl.replace(/\/+$/, '')
  const params = new URLSearchParams({ key: ref.key, sawargi_stay: '1' })
  return `${base}/checkout/order-received/${ref.id}/?${params.toString()}`
}

export function formatOrderMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(currency === 'IDR' ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'IDR' ? 0 : 2,
      maximumFractionDigits: currency === 'IDR' ? 0 : 2
    }).format(amount)
  } catch {
    return `${currency} ${amount}`
  }
}
