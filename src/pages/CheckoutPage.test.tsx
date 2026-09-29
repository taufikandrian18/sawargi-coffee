import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BATCHES } from '../data/shop'
import { initialBatchCode } from '../lib/batchLink'
import { CheckoutPage } from './CheckoutPage'

describe('checkout', () => {
  it('defaults to the newest available batch and blocks sold-out batches', () => {
    render(<CheckoutPage processingDelayMs={0} />)

    expect(screen.getByRole('radio', { name: 'Batch SWG-CN-014' })).toBeChecked()
    const soldOut = screen.getByRole('radio', { name: 'Batch SWG-CN-012' })
    expect(soldOut).toBeDisabled()
    // The ticket beside the radio says why (stamp and stock line).
    expect(within(soldOut.closest('label') as HTMLElement).getAllByText('Sold out').length).toBeGreaterThan(0)
  })

  it('preselects the batch named in ?batch= (the home page tickets link here)', () => {
    window.history.pushState({}, '', '/checkout?batch=SWG-CN-013')
    render(<CheckoutPage processingDelayMs={0} />)

    expect(screen.getByRole('radio', { name: 'Batch SWG-CN-013' })).toBeChecked()
    window.history.pushState({}, '', '/')
  })

  it('ignores ?batch= for sold-out or unknown batches', () => {
    expect(initialBatchCode(BATCHES, '?batch=SWG-CN-012')).toBe('SWG-CN-014')
    expect(initialBatchCode(BATCHES, '?batch=NOPE')).toBe('SWG-CN-014')
    expect(initialBatchCode(BATCHES, '')).toBe('SWG-CN-014')
    expect(initialBatchCode([], '?batch=SWG-CN-014')).toBeUndefined()
  })

  it('updates the total with quantity and currency', async () => {
    const user = userEvent.setup()
    render(<CheckoutPage processingDelayMs={0} />)

    expect(screen.getByTestId('order-total')).toHaveTextContent(/Rp\s?170\.000/)

    await user.click(screen.getByRole('button', { name: 'increase quantity' }))
    await user.click(screen.getByRole('button', { name: 'increase quantity' }))
    expect(screen.getByTestId('quantity')).toHaveTextContent('3')
    expect(screen.getByTestId('order-total')).toHaveTextContent(/Rp\s?450\.000/)

    await user.selectOptions(screen.getByRole('combobox', { name: 'currency' }), 'USD')
    expect(screen.getByTestId('order-total')).toHaveTextContent('$25.07')
    expect(screen.getByText(/Charged in IDR/)).toBeInTheDocument()
  })

  it('caps quantity at the bags left in a low-stock batch', async () => {
    const user = userEvent.setup()
    render(<CheckoutPage processingDelayMs={0} />)

    await user.click(screen.getByRole('radio', { name: 'Batch SWG-CN-013' }))
    const plus = screen.getByRole('button', { name: 'increase quantity' })
    for (let i = 0; i < 10; i++) {
      if ((plus as HTMLButtonElement).disabled) break
      await user.click(plus)
    }

    expect(screen.getByTestId('quantity')).toHaveTextContent('6')
    expect(plus).toBeDisabled()
  })

  it('shows validation errors and does not place an empty order', async () => {
    const user = userEvent.setup()
    render(<CheckoutPage processingDelayMs={0} />)

    await user.click(screen.getByRole('button', { name: /Place order/ }))

    expect(screen.getByText('Enter your full name')).toBeInTheDocument()
    expect(screen.getByText('5-digit postal code')).toBeInTheDocument()
    expect(screen.queryByText(/Thank you/)).not.toBeInTheDocument()
  })

  it('places a demo order and shows payment instructions', async () => {
    const user = userEvent.setup()
    render(<CheckoutPage processingDelayMs={0} />)

    await user.type(screen.getByLabelText('Full name'), 'Rina Kusuma')
    await user.type(screen.getByLabelText('WhatsApp number'), '+62 812 1111 2222')
    await user.type(screen.getByLabelText('Email'), 'rina@example.com')
    await user.type(screen.getByLabelText('Street address'), 'Jl. Raya Ciwidey No. 10')
    await user.type(screen.getByLabelText('City'), 'Bandung')
    await user.type(screen.getByLabelText('Postal code'), '40973')
    await user.click(screen.getByRole('radio', { name: 'Bank transfer' }))
    await user.click(screen.getByRole('button', { name: /Place order/ }))

    await waitFor(() => expect(screen.getByText('Thank you, Rina.')).toBeInTheDocument())
    expect(screen.getByText('Transfer to BCA virtual account')).toBeInTheDocument()
    expect(screen.getByText(/This demo stores nothing/)).toBeInTheDocument()
  })
})
