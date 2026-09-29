import { render, screen, within } from '@testing-library/react'
import { BATCHES, formatRoastDate } from '../data/shop'
import { BatchTicket } from './BatchTicket'
import { InkButton } from './ui/InkButton'

const [current, lowStock, soldOut] = BATCHES

describe('BatchTicket', () => {
  it('shows every field from shop.ts for an available batch', () => {
    render(<BatchTicket batch={current} />)
    const ticket = screen.getByRole('article', { name: `Batch ${current.code}` })

    expect(within(ticket).getByText(current.code)).toBeInTheDocument()
    expect(within(ticket).getByTestId('batch-stamp')).toHaveTextContent(
      `Roasted ${formatRoastDate(current.roastDate)}`
    )
    expect(ticket).toHaveTextContent(`${current.harvest} · Cup score ${current.cupScore.toFixed(1)}`)
    expect(ticket).toHaveTextContent(`${current.bagsLeft} of ${current.bagsTotal} bags left`)
    const notes = within(ticket).getByRole('list', { name: 'tasting notes' })
    expect(within(notes).getAllByRole('listitem').map((li) => li.textContent)).toEqual(current.notes)
  })

  it('draws the bags-left meter from the real stock level', () => {
    const { container } = render(<BatchTicket batch={lowStock} />)
    const fill = container.querySelector<HTMLElement>('.batch-ticket__meter > span')

    expect(fill?.style.width).toBe(`${Math.round((lowStock.bagsLeft / lowStock.bagsTotal) * 100)}%`)
    expect(fill?.parentElement).toHaveAttribute('aria-hidden', 'true')
  })

  it('marks a sold-out batch in the stamp and counter, keeps its roast date, and never lifts', () => {
    render(<BatchTicket batch={soldOut} interactive />)
    const ticket = screen.getByRole('article', { name: `Batch ${soldOut.code}` })

    expect(within(ticket).getByTestId('batch-stamp')).toHaveTextContent('Sold out')
    expect(ticket).toHaveTextContent(`Roasted ${formatRoastDate(soldOut.roastDate)}`)
    expect(ticket).toHaveClass('batch-ticket--sold-out')
    expect(ticket).not.toHaveClass('batch-ticket--interactive')
  })

  it('renders the strip with its action, and a plain div when nested in a control', () => {
    const { container } = render(
      <>
        <BatchTicket
          batch={current}
          variant="strip"
          action={<InkButton href="/checkout">Order This Batch</InkButton>}
        />
        <label>
          <input type="radio" name="batch" />
          <BatchTicket batch={lowStock} as="div" interactive selected />
        </label>
      </>
    )

    const strip = screen.getByRole('article', { name: `Batch ${current.code}` })
    expect(strip).toHaveClass('batch-ticket--strip')
    expect(within(strip).getByRole('link', { name: 'Order This Batch' })).toHaveAttribute('href', '/checkout')

    const nested = container.querySelector('label .batch-ticket')
    expect(nested?.tagName).toBe('DIV')
    expect(nested).not.toHaveAttribute('aria-label')
    expect(nested).toHaveClass('batch-ticket--selected', 'batch-ticket--interactive')
  })
})
