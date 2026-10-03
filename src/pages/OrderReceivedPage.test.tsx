import { render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ReceivedOrder } from '../data/orderReceived'
import { orderRefFromSearch, parseInstructions, wooOrderReceivedUrl } from '../data/orderReceived'
import { CatalogProvider } from '../lib/catalog'
import { OrderReceivedPage } from './OrderReceivedPage'

const ORDER: ReceivedOrder = {
  number: '12',
  date: '2026-10-01T20:00:00+07:00',
  status: 'on-hold',
  status_label: 'On hold',
  items: [{ name: 'Ciwidey Natural · SWG-CN-015', quantity: 2, total: 300000, details: [{ label: 'Grind', value: 'Fine' }] }],
  currency: 'IDR',
  subtotal: 300000,
  shipping_total: 20000,
  total: 320000,
  payment_method: 'bacs',
  payment_title: 'Direct bank transfer',
  needs_payment: true,
  bank_accounts: [{ bank_name: 'BCA', account_name: 'SAWARGI', account_number: '1234567890', sort_code: '', iban: '', bic: '' }],
  instructions: 'Use your order number as the payment reference.'
}

const STORE = 'https://shop.example.com/sawargi-coffee/shop'
const catalogFetch = vi.fn(async () => new Response('[]', { headers: { 'content-type': 'application/json' } }))

function renderAt(search: string, orderFetch: typeof fetch) {
  window.history.replaceState(null, '', `/order-received${search}`)
  return render(
    <CatalogProvider storeUrl={STORE} fetchImpl={catalogFetch as unknown as typeof fetch}>
      <OrderReceivedPage fetchImpl={orderFetch} />
    </CatalogProvider>
  )
}

afterEach(() => window.history.replaceState(null, '', '/'))

describe('order received', () => {
  it('reads only well-formed order references from the URL', () => {
    expect(orderRefFromSearch('?order=12&key=wc_order_abc123')).toEqual({ id: '12', key: 'wc_order_abc123' })
    expect(orderRefFromSearch('?order=12')).toBeNull()
    expect(orderRefFromSearch('?order=12&key=<script>')).toBeNull()
    expect(orderRefFromSearch('?order=abc&key=wc_order_abc')).toBeNull()
  })

  it('shows the order and what to transfer, fetched with the order key', async () => {
    const orderFetch = vi.fn(async () => new Response(JSON.stringify(ORDER), { headers: { 'content-type': 'application/json' } }))
    renderAt('?order=12&key=wc_order_abc123', orderFetch as unknown as typeof fetch)

    expect(await screen.findByRole('heading', { name: 'Thank you' })).toBeInTheDocument()
    expect(orderFetch).toHaveBeenCalledWith(
      `${STORE}/wp-json/sawargi/v1/order-received?order=12&key=wc_order_abc123`,
      expect.objectContaining({ cache: 'no-store' })
    )
    expect(screen.getByText(/Order 12 · 1 October 2026 · On hold/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Transfer Rp\s?320\.000/ })).toBeInTheDocument()
    expect(screen.getByText('1234567890')).toBeInTheDocument()
    expect(screen.getByText('Use your order number as the payment reference.')).toBeInTheDocument()
    expect(screen.getByText(/× 2 · Grind: Fine/)).toBeInTheDocument()
  })

  it('does not ask for a transfer once the order is paid', async () => {
    const paid = { ...ORDER, status: 'processing', status_label: 'Processing', needs_payment: false }
    const orderFetch = vi.fn(async () => new Response(JSON.stringify(paid)))
    renderAt('?order=12&key=wc_order_abc123', orderFetch as unknown as typeof fetch)
    expect(await screen.findByText(/Processing/)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /Transfer/ })).not.toBeInTheDocument()
  })

  it("falls back to the shop's own order page when the details can't load", async () => {
    const orderFetch = vi.fn(async () => new Response('{}', { status: 404 }))
    renderAt('?order=12&key=wc_order_abc123', orderFetch as unknown as typeof fetch)
    await waitFor(() => expect(screen.getByText("We couldn't load its details here.")).toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'See the order details' })).toHaveAttribute(
      'href',
      wooOrderReceivedUrl(STORE, { id: '12', key: 'wc_order_abc123' })
    )
    expect(wooOrderReceivedUrl(STORE, { id: '12', key: 'wc_order_abc123' })).toBe(
      `${STORE}/checkout/order-received/12/?key=wc_order_abc123&sawargi_stay=1`
    )
  })

  it('shows a plain message without an order reference', () => {
    const orderFetch = vi.fn()
    renderAt('', orderFetch as unknown as typeof fetch)
    expect(screen.getByRole('heading', { name: 'No order to show' })).toBeInTheDocument()
    expect(orderFetch).not.toHaveBeenCalled()
  })
})

const STEPS = [
  'BANK TRANSFER INSTRUCTIONS',
  'Option 1: Using the mobile app',
  '1. Log in to the app.',
  '2. Enter the details:',
  '- Same bank: type the account number.',
  '- Other banks: pick the bank first.',
  '3. Confirm with your PIN.',
  '----------',
  'Option 2: At an ATM',
  "1. Choose 'Other' > 'Transfer'.",
  '2. Take your receipt.'
]

describe('payment instructions', () => {
  const expected = [
    { kind: 'text', text: 'BANK TRANSFER INSTRUCTIONS', lead: true },
    { kind: 'text', text: 'Option 1: Using the mobile app', lead: true },
    {
      kind: 'steps',
      start: 1,
      items: [
        { text: 'Log in to the app.', sub: [] },
        { text: 'Enter the details:', sub: ['Same bank: type the account number.', 'Other banks: pick the bank first.'] },
        { text: 'Confirm with your PIN.', sub: [] }
      ]
    },
    { kind: 'rule' },
    { kind: 'text', text: 'Option 2: At an ATM', lead: true },
    {
      kind: 'steps',
      start: 1,
      items: [
        { text: "Choose 'Other' > 'Transfer'.", sub: [] },
        { text: 'Take your receipt.', sub: [] }
      ]
    }
  ]

  it('turns typed lines into steps, sub-points, rules and headings', () => {
    expect(parseInstructions(STEPS.join('\r\n'))).toEqual(expected)
  })

  it('finds the same structure when everything was typed on one line', () => {
    expect(parseInstructions(STEPS.join(' '))).toEqual(expected)
  })

  it('leaves plain prose as one paragraph', () => {
    expect(parseInstructions('Use your order number as the payment reference.')).toEqual([
      { kind: 'text', text: 'Use your order number as the payment reference.', lead: false }
    ])
  })

  it('renders the steps as lists on the page', async () => {
    const order = { ...ORDER, instructions: STEPS.join('\n') }
    const orderFetch = vi.fn(async () => new Response(JSON.stringify(order)))
    renderAt('?order=12&key=wc_order_abc123', orderFetch as unknown as typeof fetch)
    const steps = await screen.findByRole('heading', { name: 'How to transfer' })
    const section = steps.parentElement as HTMLElement
    const lists = within(section).getAllByRole('list')
    expect(lists.map((list) => list.tagName)).toEqual(['OL', 'UL', 'OL'])
    expect(within(lists[0]).getByText('Confirm with your PIN.')).toBeInTheDocument()
    expect(within(lists[1]).getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText(/Payment reference:/)).toBeInTheDocument()
  })
})
