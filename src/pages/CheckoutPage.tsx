import type { FormEvent, ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { SiteHeader } from '../components/SiteHeader'
import {
  BATCHES,
  CURRENCIES,
  FREE_SHIPPING_MIN_BAGS,
  GRINDS,
  PAYMENT_METHODS,
  PRODUCT,
  RATES_AS_OF,
  SHIPPING,
  calcTotals,
  formatMoney,
  formatRoastDate,
  maxQuantityFor
} from '../data/shop'
import type { Batch, CurrencyCode, GrindId, PaymentId, ShippingId } from '../data/shop'
import { Link } from '../lib/router'

type Contact = {
  name: string
  email: string
  phone: string
  address: string
  city: string
  postal: string
  notes: string
}

type ContactErrors = Partial<Record<keyof Contact, string>>

type PlacedOrder = {
  id: string
  batch: Batch
  grind: GrindId
  quantity: number
  payment: PaymentId
  totalIdr: number
  contact: Contact
}

const EMPTY_CONTACT: Contact = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  postal: '',
  notes: ''
}

export function validateContact(contact: Contact): ContactErrors {
  const errors: ContactErrors = {}
  if (contact.name.trim().length < 2) errors.name = 'Enter your full name'
  if (!/^\+?[0-9\s-]{8,16}$/.test(contact.phone.trim())) errors.phone = 'Enter a WhatsApp number'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) errors.email = 'Enter a valid email'
  if (contact.address.trim().length < 8) errors.address = 'Enter your street address'
  if (contact.city.trim().length < 2) errors.city = 'Enter your city'
  if (!/^\d{5}$/.test(contact.postal.trim())) errors.postal = '5-digit postal code'
  return errors
}

function makeOrderId() {
  return `SWG-${Date.now().toString(36).toUpperCase().slice(-6)}`
}

type CheckoutPageProps = {
  /** Simulated payment latency. Tests pass 0. */
  processingDelayMs?: number
}

export function CheckoutPage({ processingDelayMs = 1200 }: CheckoutPageProps) {
  const firstAvailable = BATCHES.find((b) => b.bagsLeft > 0) ?? BATCHES[0]

  const [batchCode, setBatchCode] = useState(firstAvailable.code)
  const [grind, setGrind] = useState<GrindId>('whole')
  const [quantity, setQuantity] = useState(1)
  const [currency, setCurrency] = useState<CurrencyCode>('IDR')
  const [shipping, setShipping] = useState<ShippingId>('regular')
  const [payment, setPayment] = useState<PaymentId>('qris')
  const [contact, setContact] = useState<Contact>(EMPTY_CONTACT)
  const [errors, setErrors] = useState<ContactErrors>({})
  const [status, setStatus] = useState<'form' | 'processing' | 'done'>('form')
  const [order, setOrder] = useState<PlacedOrder | null>(null)

  const batch = BATCHES.find((b) => b.code === batchCode) ?? firstAvailable
  const maxQty = maxQuantityFor(batch)
  const totals = useMemo(() => calcTotals(quantity, shipping), [quantity, shipping])
  const money = (idr: number) => formatMoney(idr, currency)

  const selectBatch = (next: Batch) => {
    if (next.bagsLeft === 0) return
    setBatchCode(next.code)
    setQuantity((q) => Math.min(q, maxQuantityFor(next)))
  }

  const updateContact = (field: keyof Contact, value: string) => {
    setContact((c) => ({ ...c, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (status === 'processing') return
    const found = validateContact(contact)
    setErrors(found)
    const firstField = Object.keys(found)[0]
    if (firstField) {
      document.getElementById(`field-${firstField}`)?.focus()
      return
    }

    setStatus('processing')
    const placed: PlacedOrder = {
      id: makeOrderId(),
      batch,
      grind,
      quantity,
      payment,
      totalIdr: totals.total,
      contact
    }
    window.setTimeout(() => {
      setOrder(placed)
      setStatus('done')
      try {
        window.scrollTo({ top: 0 })
      } catch {
        // jsdom does not implement scrollTo
      }
    }, processingDelayMs)
  }

  if (status === 'done' && order) {
    return (
      <div className="min-h-screen bg-black text-white">
        <SiteHeader current="checkout" />
        <OrderConfirmation order={order} currency={currency} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <SiteHeader current="checkout" />

      <div className="border-b border-amber-200/20 bg-amber-200/[0.06] px-4 py-2.5 text-center text-xs tracking-wide text-amber-100/90">
        Demo checkout — no payment is taken and no order is shipped.
      </div>

      <form
        noValidate
        onSubmit={handleSubmit}
        aria-label="checkout"
        className="mx-auto grid max-w-7xl gap-10 px-4 py-10 md:px-8 md:py-14 lg:grid-cols-[1fr_400px] lg:gap-16"
      >
        <div className="min-w-0 space-y-12">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.32em] text-white/60">
              one coffee, many batches
            </p>
            <h1 className="mt-3 text-[clamp(2.5rem,6vw,4.5rem)] font-light leading-[0.95] tracking-[-0.04em]">
              {PRODUCT.name}
            </h1>
            <p className="mt-4 max-w-xl text-white/70">
              {PRODUCT.origin} · {PRODUCT.process} · {PRODUCT.sizeLabel} bag ·{' '}
              <span className="text-white">{money(PRODUCT.priceIdr)}</span>
            </p>
          </div>

          <Step number="01" title="Choose your batch">
            <div role="radiogroup" aria-label="batch" className="grid gap-3">
              {BATCHES.map((b) => {
                const soldOut = b.bagsLeft === 0
                const selected = b.code === batch.code
                return (
                  <label
                    key={b.code}
                    className={`relative block rounded-2xl border p-5 transition-colors focus-within:ring-2 focus-within:ring-white/70 ${
                      soldOut
                        ? 'cursor-not-allowed border-white/10 opacity-45'
                        : selected
                          ? 'cursor-pointer border-white bg-white/[0.06]'
                          : 'cursor-pointer border-white/20 hover:border-white/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="batch"
                      value={b.code}
                      aria-label={`Batch ${b.code}`}
                      checked={selected}
                      disabled={soldOut}
                      onChange={() => selectBatch(b)}
                      className="sr-only"
                    />
                    <div className="flex flex-wrap items-baseline justify-between gap-2 pr-6">
                      <span className="font-medium tracking-wide">Batch {b.code}</span>
                      <span className="text-sm text-white/60">
                        {soldOut ? 'Sold out' : `${b.bagsLeft} of ${b.bagsTotal} bags left`}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-white/70">
                      Roasted {formatRoastDate(b.roastDate)} · {b.harvest} · Cup score{' '}
                      {b.cupScore.toFixed(1)}
                    </p>
                    <p className="mt-3 flex flex-wrap gap-2">
                      {b.notes.map((note) => (
                        <span
                          key={note}
                          className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/75"
                        >
                          {note}
                        </span>
                      ))}
                    </p>
                    {selected && !soldOut && (
                      <span
                        aria-hidden="true"
                        className="absolute right-5 top-6 h-2.5 w-2.5 rounded-full bg-white"
                      />
                    )}
                  </label>
                )
              })}
            </div>
          </Step>

          <Step number="02" title="Grind & quantity">
            <div role="radiogroup" aria-label="grind" className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {GRINDS.map((g) => (
                <ChoiceCard
                  key={g.id}
                  name="grind"
                  checked={grind === g.id}
                  onChange={() => setGrind(g.id)}
                  title={g.label}
                  hint={g.hint}
                />
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-5">
              <span id="qty-label" className="text-sm text-white/70">
                Bags (1 kg each)
              </span>
              <div
                role="group"
                aria-labelledby="qty-label"
                className="flex items-center rounded-full border border-white/25"
              >
                <button
                  type="button"
                  aria-label="decrease quantity"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="h-11 w-11 rounded-full text-lg disabled:opacity-30"
                >
                  −
                </button>
                <output aria-live="polite" data-testid="quantity" className="w-8 text-center tabular-nums">
                  {quantity}
                </output>
                <button
                  type="button"
                  aria-label="increase quantity"
                  onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                  disabled={quantity >= maxQty}
                  className="h-11 w-11 rounded-full text-lg disabled:opacity-30"
                >
                  +
                </button>
              </div>
              {quantity >= maxQty && (
                <span className="text-xs text-white/50">
                  {maxQty === batch.bagsLeft ? 'All remaining bags in this batch' : `Max ${maxQty} per order`}
                </span>
              )}
            </div>
          </Step>

          <Step number="03" title="Delivery">
            <div className="grid gap-4 md:grid-cols-2">
              <Field id="name" label="Full name" error={errors.name}>
                <input
                  id="field-name"
                  autoComplete="name"
                  value={contact.name}
                  onChange={(e) => updateContact('name', e.target.value)}
                />
              </Field>
              <Field id="phone" label="WhatsApp number" error={errors.phone}>
                <input
                  id="field-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+62 812 0000 0000"
                  value={contact.phone}
                  onChange={(e) => updateContact('phone', e.target.value)}
                />
              </Field>
              <Field id="email" label="Email" error={errors.email} className="md:col-span-2">
                <input
                  id="field-email"
                  type="email"
                  autoComplete="email"
                  value={contact.email}
                  onChange={(e) => updateContact('email', e.target.value)}
                />
              </Field>
              <Field id="address" label="Street address" error={errors.address} className="md:col-span-2">
                <input
                  id="field-address"
                  autoComplete="street-address"
                  value={contact.address}
                  onChange={(e) => updateContact('address', e.target.value)}
                />
              </Field>
              <Field id="city" label="City" error={errors.city}>
                <input
                  id="field-city"
                  autoComplete="address-level2"
                  value={contact.city}
                  onChange={(e) => updateContact('city', e.target.value)}
                />
              </Field>
              <Field id="postal" label="Postal code" error={errors.postal}>
                <input
                  id="field-postal"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  value={contact.postal}
                  onChange={(e) => updateContact('postal', e.target.value)}
                />
              </Field>
              <Field id="notes" label="Notes for courier (optional)" className="md:col-span-2">
                <input
                  id="field-notes"
                  value={contact.notes}
                  onChange={(e) => updateContact('notes', e.target.value)}
                />
              </Field>
            </div>

            <div role="radiogroup" aria-label="shipping" className="mt-6 grid gap-3 md:grid-cols-2">
              {SHIPPING.map((s) => {
                const free = s.id === 'regular' && quantity >= FREE_SHIPPING_MIN_BAGS
                return (
                  <ChoiceCard
                    key={s.id}
                    name="shipping"
                    checked={shipping === s.id}
                    onChange={() => setShipping(s.id)}
                    title={`${s.label} · ${free ? 'Free' : money(s.costIdr)}`}
                    hint={s.eta}
                  />
                )
              })}
            </div>
            <p className="mt-3 text-xs text-white/50">
              Free regular shipping from {FREE_SHIPPING_MIN_BAGS} bags.
            </p>
          </Step>

          <Step number="04" title="Payment">
            <div role="radiogroup" aria-label="payment method" className="grid gap-3 md:grid-cols-3">
              {PAYMENT_METHODS.map((p) => (
                <ChoiceCard
                  key={p.id}
                  name="payment"
                  checked={payment === p.id}
                  onChange={() => setPayment(p.id)}
                  title={p.label}
                  hint={p.hint}
                />
              ))}
            </div>
            <p className="mt-3 text-xs text-white/50">
              Demo mode: you'll see simulated payment instructions after placing the order.
            </p>
          </Step>
        </div>

        <aside aria-label="order summary" className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-white/15 bg-white/[0.03] p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-medium">Order summary</h2>
              <label className="flex items-center gap-2 text-xs text-white/60">
                <span>Currency</span>
                <select
                  aria-label="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="rounded-full border border-white/20 bg-black px-3 py-1.5 text-sm text-white"
                >
                  {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-6 border-t border-white/10 pt-5 text-sm">
              <p className="font-medium">
                {PRODUCT.name} · {PRODUCT.sizeLabel}
              </p>
              <p className="mt-1 text-white/60">
                Batch {batch.code} · {GRINDS.find((g) => g.id === grind)?.label}
              </p>
            </div>

            <dl className="mt-5 space-y-2.5 border-t border-white/10 pt-5 text-sm">
              <Row label={`${quantity} × ${money(PRODUCT.priceIdr)}`} value={money(totals.subtotal)} />
              <Row label="Shipping" value={totals.freeShipping ? 'Free' : money(totals.shipping)} />
              <div className="flex items-baseline justify-between border-t border-white/10 pt-4 text-base">
                <dt>Total</dt>
                <dd data-testid="order-total" className="text-2xl font-light tabular-nums">
                  {money(totals.total)}
                </dd>
              </div>
            </dl>

            {currency !== 'IDR' && (
              <p className="mt-3 text-xs leading-5 text-white/50">
                Charged in IDR: {formatMoney(totals.total, 'IDR')}. {currency} is an indicative
                conversion (rates as of {RATES_AS_OF}).
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'processing'}
              className="mt-6 w-full rounded-full bg-white px-6 py-4 text-sm text-black transition-colors hover:bg-neutral-200 disabled:cursor-wait disabled:opacity-60"
            >
              {status === 'processing' ? 'Processing…' : `Place order · ${money(totals.total)}`}
            </button>
            <p className="mt-4 text-center text-xs text-white/45">
              Small batch. Every bag dated and numbered.
            </p>
          </div>
        </aside>
      </form>
    </div>
  )
}

function Step({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <section aria-label={title.toLowerCase()} className="border-t border-white/15 pt-8">
      <h2 className="mb-6 flex items-baseline gap-4 text-xl font-light">
        <span className="text-xs tracking-[0.3em] text-white/45">{number}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

function ChoiceCard({
  name,
  checked,
  onChange,
  title,
  hint
}: {
  name: string
  checked: boolean
  onChange: () => void
  title: string
  hint: string
}) {
  return (
    <label
      className={`block cursor-pointer rounded-2xl border p-4 transition-colors focus-within:ring-2 focus-within:ring-white/70 ${
        checked ? 'border-white bg-white/[0.06]' : 'border-white/20 hover:border-white/50'
      }`}
    >
      <input
        type="radio"
        name={name}
        aria-label={title}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span className="block text-sm font-medium">{title}</span>
      <span className="mt-1 block text-xs leading-5 text-white/55">{hint}</span>
    </label>
  )
}

function Field({
  id,
  label,
  error,
  className = '',
  children
}: {
  id: string
  label: string
  error?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`checkout-field ${error ? 'has-error' : ''} ${className}`}>
      <label
        htmlFor={`field-${id}`}
        className="mb-1.5 block text-xs uppercase tracking-[0.18em] text-white/55"
      >
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-white/65">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  )
}

function OrderConfirmation({ order, currency }: { order: PlacedOrder; currency: CurrencyCode }) {
  const grindLabel = GRINDS.find((g) => g.id === order.grind)?.label ?? ''
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 md:py-24">
      <p className="text-xs font-medium uppercase tracking-[0.32em] text-white/60">
        order placed · demo
      </p>
      <h1 className="mt-4 text-[clamp(2.5rem,7vw,5rem)] font-light leading-[0.95] tracking-[-0.04em]">
        Thank you, {order.contact.name.trim().split(' ')[0]}.
      </h1>
      <p className="mt-6 text-white/75">
        Order <span className="text-white">{order.id}</span> · {order.quantity} × {PRODUCT.sizeLabel}{' '}
        {PRODUCT.name}, batch {order.batch.code}, {grindLabel.toLowerCase()}. Total{' '}
        <span className="text-white">{formatMoney(order.totalIdr, 'IDR')}</span>
        {currency !== 'IDR' && <> (≈ {formatMoney(order.totalIdr, currency)})</>}.
      </p>

      <div className="mt-10 rounded-3xl border border-white/15 bg-white/[0.03] p-6 md:p-8">
        <PaymentInstructions order={order} />
      </div>

      <p className="mt-8 text-sm text-white/55">
        In the live shop, a confirmation would go to {order.contact.email} and WhatsApp{' '}
        {order.contact.phone}. This demo stores nothing.
      </p>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/" className="rounded-full bg-white px-8 py-3.5 text-sm text-black hover:bg-neutral-200">
          Back to home
        </Link>
        <Link
          to="/journal/ciwidey-natural"
          className="rounded-full border border-white/30 px-8 py-3.5 text-sm hover:border-white"
        >
          Read about this coffee
        </Link>
      </div>
    </main>
  )
}

function PaymentInstructions({ order }: { order: PlacedOrder }) {
  const amount = formatMoney(order.totalIdr, 'IDR')
  if (order.payment === 'qris') {
    return (
      <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
        <DemoQr seed={order.id} />
        <div>
          <h2 className="text-lg font-medium">Scan with any QRIS app</h2>
          <p className="mt-2 text-sm text-white/65">
            Demo QR — scanning it does nothing. Amount {amount}.
          </p>
        </div>
      </div>
    )
  }
  if (order.payment === 'va') {
    return (
      <div>
        <h2 className="text-lg font-medium">Transfer to BCA virtual account</h2>
        <p className="mt-4 font-mono text-2xl tracking-wider">8277 0000 0000 0000</p>
        <p className="mt-3 text-sm text-white/65">
          Demo number — do not transfer. Amount {amount}.
        </p>
      </div>
    )
  }
  return (
    <div>
      <h2 className="text-lg font-medium">Card payment (simulated)</h2>
      <p className="mt-2 text-sm text-white/65">
        In the live shop you'd be sent to the payment gateway's secure card page for {amount}. No
        card details are collected on this site.
      </p>
    </div>
  )
}

/** Decorative, deterministic QR-like grid. Not a scannable code. */
function DemoQr({ seed }: { seed: string }) {
  const size = 21
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const cells: boolean[] = []
  for (let i = 0; i < size * size; i++) {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0
    cells.push(((h >>> 16) & 1) === 1)
  }
  const inFinder = (x: number, y: number) =>
    (x < 8 && y < 8) || (x >= size - 8 && y < 8) || (x < 8 && y >= size - 8)
  const finders = [
    [0, 0],
    [size - 7, 0],
    [0, size - 7]
  ]
  return (
    <svg
      role="img"
      aria-label="demo QRIS code"
      viewBox={`-2 -2 ${size + 4} ${size + 4}`}
      className="h-40 w-40 shrink-0 rounded-xl bg-white"
    >
      {cells.map((on, i) => {
        const x = i % size
        const y = Math.floor(i / size)
        if (!on || inFinder(x, y)) return null
        return <rect key={i} x={x} y={y} width={1} height={1} fill="#000" />
      })}
      {finders.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width={7} height={7} fill="#000" />
          <rect x={x + 1} y={y + 1} width={5} height={5} fill="#fff" />
          <rect x={x + 2} y={y + 2} width={3} height={3} fill="#000" />
        </g>
      ))}
    </svg>
  )
}
