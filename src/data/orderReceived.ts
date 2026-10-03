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

export type InstructionStep = { text: string; sub: string[] }
export type InstructionBlock =
  | { kind: 'text'; text: string; lead: boolean }
  | { kind: 'steps'; start: number; items: InstructionStep[] }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'rule' }

/**
 * Turns the shop's payment instructions (a plain textarea in WooCommerce) into blocks: numbered
 * steps, "- " sub-points under the step above them, separator lines and paragraphs. Text typed
 * on one line is split at "Option N:", numbered steps, " - " points and dashed rules first.
 */
export function parseInstructions(raw: string): InstructionBlock[] {
  let text = raw.replace(/\r\n?/g, '\n').trim()
  if (!text.includes('\n')) {
    text = text
      .replace(/\s*(-{3,}|_{3,}|={3,})\s*/g, '\n$1\n')
      .replace(/\s+(Option \d+\s*:)/gi, '\n$1')
      .replace(/\s+(\d{1,2}[.)])\s+(?=[A-Z'‘"“])/g, '\n$1 ')
      .replace(/\s+-\s+(?=[A-Z'‘"“])/g, '\n- ')
  }

  const blocks: InstructionBlock[] = []
  const last = () => blocks[blocks.length - 1]
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line) {
      blocks.push({ kind: 'text', text: '', lead: false })
      continue
    }
    if (/^([-_=*])\1{2,}$/.test(line)) {
      blocks.push({ kind: 'rule' })
      continue
    }
    const step = /^(\d{1,2})[.)]\s+(.+)$/.exec(line)
    if (step) {
      const current = last()
      if (current?.kind === 'steps') current.items.push({ text: step[2], sub: [] })
      else blocks.push({ kind: 'steps', start: Number(step[1]), items: [{ text: step[2], sub: [] }] })
      continue
    }
    const point = /^[-*•]\s+(.+)$/.exec(line)
    if (point) {
      const current = last()
      if (current?.kind === 'steps') current.items[current.items.length - 1].sub.push(point[1])
      else if (current?.kind === 'bullets') current.items.push(point[1])
      else blocks.push({ kind: 'bullets', items: [point[1]] })
      continue
    }
    const letters = line.replace(/[^A-Za-z]/g, '')
    const lead = /:$/.test(line) || /^Option \d+/i.test(line) || (letters.length > 3 && letters === letters.toUpperCase())
    blocks.push({ kind: 'text', text: line, lead })
  }
  // Blank lines only separate lists; drop them as blocks.
  return blocks.filter((block) => !(block.kind === 'text' && block.text === ''))
}
