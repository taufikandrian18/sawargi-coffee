import { useEffect, useState } from 'react'
import { SiteHeader } from '../components/SiteHeader'
import { InkButton } from '../components/ui/InkButton'
import type { OrderRef, ReceivedOrder } from '../data/orderReceived'
import { fetchReceivedOrder, formatOrderMoney, orderRefFromSearch, wooOrderReceivedUrl } from '../data/orderReceived'
import { useCatalog } from '../lib/useCatalog'

type State =
  | { status: 'loading' }
  | { status: 'ready'; order: ReceivedOrder }
  | { status: 'missing' }
  | { status: 'error' }

/**
 * Where buyers land after placing an offline-payment order (bank transfer):
 * the shop redirects here from WooCommerce's order-received page.
 */
export function OrderReceivedPage({ fetchImpl }: { fetchImpl?: typeof fetch }) {
  const { catalog } = useCatalog()
  const storeUrl = catalog.storeUrl ?? ''
  const [ref] = useState<OrderRef | null>(() => orderRefFromSearch(window.location.search))
  const [state, setState] = useState<State>(() => (ref && storeUrl ? { status: 'loading' } : { status: 'missing' }))

  useEffect(() => {
    if (!ref || !storeUrl) return
    let cancelled = false
    fetchReceivedOrder(storeUrl, ref, fetchImpl)
      .then((order) => !cancelled && setState({ status: 'ready', order }))
      .catch(() => !cancelled && setState({ status: 'error' }))
    return () => {
      cancelled = true
    }
  }, [ref, storeUrl, fetchImpl])

  return (
    <div className="min-h-screen bg-ink text-paper">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 md:px-8 md:py-24">
        <p className="font-plex text-[0.8125rem] uppercase tracking-[0.18em] text-paper-mut">order received</p>
        {state.status === 'loading' && (
          <p role="status" className="mt-8 font-plex text-sm uppercase tracking-[0.08em] text-paper-mut">
            Loading your order…
          </p>
        )}
        {state.status === 'missing' && (
          <>
            <h1 className="display-chapter mt-4">No order to show</h1>
            <p className="mt-6 text-paper-mut">This page shows an order right after it's placed.</p>
            <div className="mt-10">
              <InkButton href="/" variant="cherry">
                Back to Sawargi
              </InkButton>
            </div>
          </>
        )}
        {state.status === 'error' && ref && (
          <>
            <h1 className="display-chapter mt-4">Order placed</h1>
            <p role="status" className="mt-6 text-paper-mut">
              We couldn't load its details here.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <InkButton href={wooOrderReceivedUrl(storeUrl, ref)} variant="cherry">
                See the order details
              </InkButton>
            </div>
          </>
        )}
        {state.status === 'ready' && <OrderDetails order={state.order} />}
      </main>
    </div>
  )
}

function OrderDetails({ order }: { order: ReceivedOrder }) {
  const money = (amount: number) => formatOrderMoney(amount, order.currency)
  const date = order.date
    ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(order.date))
    : null
  const payNow = order.needs_payment && order.bank_accounts.length > 0

  return (
    <>
      <h1 className="display-chapter mt-4">Thank you</h1>
      <p className="mt-6 font-plex text-sm uppercase tracking-[0.08em] text-paper-mut">
        Order {order.number}
        {date ? ` · ${date}` : ''} · {order.status_label}
      </p>

      {payNow && (
        <section aria-labelledby="pay-title" className="mt-10 rounded-[2rem] bg-paper p-6 text-char shadow-[8px_8px_0_var(--cherry)] md:p-8">
          <h2 id="pay-title" className="display-step">
            Transfer {money(order.total)}
          </h2>
          {order.instructions && <p className="mt-3 text-ink-mut">{order.instructions}</p>}
          <ul className="mt-6 space-y-4">
            {order.bank_accounts.map((account) => (
              <li key={`${account.bank_name}-${account.account_number}`} className="rounded-2xl border border-char/15 p-4">
                <p className="font-plex text-xs uppercase tracking-[0.12em] text-ink-mut">{account.bank_name}</p>
                <p className="mt-2 flex flex-wrap items-center gap-3 font-plex text-2xl tabular-nums">
                  {account.account_number}
                  <CopyButton value={account.account_number} label={`Copy ${account.bank_name} account number`} />
                </p>
                <p className="mt-1 text-sm text-ink-mut">{account.account_name}</p>
                {account.iban && <p className="mt-1 font-plex text-xs text-ink-mut">IBAN {account.iban}</p>}
                {account.bic && <p className="mt-1 font-plex text-xs text-ink-mut">BIC/SWIFT {account.bic}</p>}
              </li>
            ))}
          </ul>
          <p className="mt-6 font-plex text-sm">
            Payment reference: <strong>{order.number}</strong>
          </p>
        </section>
      )}

      <section aria-labelledby="summary-title" className="mt-10 rounded-[2rem] border border-paper/15 p-6 md:p-8">
        <h2 id="summary-title" className="font-plex text-[0.8125rem] uppercase tracking-[0.18em] text-paper-mut">
          Your order
        </h2>
        <ul className="mt-4 divide-y divide-paper/10">
          {order.items.map((item, index) => (
            <li key={index} className="flex justify-between gap-4 py-4">
              <div>
                <p>{item.name}</p>
                <p className="mt-1 text-sm text-paper-mut">
                  {[`× ${item.quantity}`, ...item.details.map((d) => `${d.label}: ${d.value}`)].join(' · ')}
                </p>
              </div>
              <p className="shrink-0 font-plex tabular-nums">{money(item.total)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-paper/10 pt-4 font-plex text-sm">
          <div className="flex justify-between">
            <dt className="text-paper-mut">Shipping</dt>
            <dd className="tabular-nums">{money(order.shipping_total)}</dd>
          </div>
          <div className="flex justify-between text-base">
            <dt>Total</dt>
            <dd className="tabular-nums">{money(order.total)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-paper-mut">Payment</dt>
            <dd>{order.payment_title}</dd>
          </div>
        </dl>
      </section>

      <div className="mt-10">
        <InkButton href="/" variant="paper">
          Back to Sawargi
        </InkButton>
      </div>
    </>
  )
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  if (typeof navigator === 'undefined' || !navigator.clipboard) return null
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => setCopied(true))
      }}
      className="nav-focus rounded-full border border-char/25 px-3 py-1 font-sans text-xs uppercase tracking-[0.14em] text-char hover:border-char"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}
