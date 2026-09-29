import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import products from '../data/__fixtures__/storeApiProducts.json'
import { CheckoutPage } from '../pages/CheckoutPage'
import { CatalogProvider } from './catalog'
import { useCatalog } from './useCatalog'

function Probe() {
  const state = useCatalog()
  return (
    <p data-testid="probe">
      {state.status}:{state.catalog.source}:{state.catalog.batches.map((b) => b.code).join(',')}
    </p>
  )
}

const okFetch = () => vi.fn().mockResolvedValue({ ok: true, json: async () => products }) as unknown as typeof fetch

describe('CatalogProvider', () => {
  it('uses the sample catalogue when no store is configured', () => {
    render(
      <CatalogProvider storeUrl="">
        <Probe />
      </CatalogProvider>
    )
    expect(screen.getByTestId('probe')).toHaveTextContent('ready:static:SWG-CN-014,SWG-CN-013,SWG-CN-012')
  })

  it('never shows sample stock while the store loads, then shows the store’s batches', async () => {
    render(
      <CatalogProvider storeUrl="https://shop.example.com" fetchImpl={okFetch()}>
        <Probe />
      </CatalogProvider>
    )
    expect(screen.getByTestId('probe')).toHaveTextContent('loading:woocommerce:')
    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('ready:woocommerce:SWG-CN-015,SWG-CN-014'))
  })

  it('reports an error with no batches if the store is down', async () => {
    const down = vi.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch
    render(
      <CatalogProvider storeUrl="https://shop.example.com" fetchImpl={down}>
        <Probe />
      </CatalogProvider>
    )
    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('error:woocommerce:'))
  })
})

describe('checkout with WooCommerce', () => {
  it('hides the demo steps and hands the chosen batch, grind and quantity to the store checkout', async () => {
    const user = userEvent.setup()
    const redirect = vi.fn()
    render(
      <CatalogProvider storeUrl="https://shop.example.com" fetchImpl={okFetch()}>
        <CheckoutPage processingDelayMs={0} redirect={redirect} />
      </CatalogProvider>
    )

    await screen.findByRole('radio', { name: 'Batch SWG-CN-015' })
    expect(screen.queryByText(/Demo checkout/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Full name')).not.toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Batch SWG-CN-014' })).toBeDisabled()

    await user.click(screen.getByRole('radio', { name: 'Coarse' }))
    await user.click(screen.getByRole('button', { name: 'increase quantity' }))
    expect(screen.getByTestId('order-total')).toHaveTextContent(/Rp\s?330\.000/)

    await user.click(screen.getByRole('button', { name: /Continue to payment/ }))
    expect(redirect).toHaveBeenCalledWith('https://shop.example.com/checkout/?add-to-cart=1012&quantity=2')
  })

  it('says stock is unavailable instead of showing a form when the store is down', async () => {
    const down = vi.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch
    render(
      <CatalogProvider storeUrl="https://shop.example.com" fetchImpl={down}>
        <CheckoutPage processingDelayMs={0} />
      </CatalogProvider>
    )
    expect(await screen.findByText(/Stock is unavailable right now/)).toBeInTheDocument()
    expect(screen.queryByRole('form', { name: 'checkout' })).not.toBeInTheDocument()
  })
})
