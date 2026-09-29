import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Root } from './Root'
import { navigate } from './lib/router'

describe('routing', () => {
  afterEach(() => {
    act(() => navigate('/'))
  })

  it('renders the journal article with its sources', () => {
    window.history.pushState({}, '', '/journal/ciwidey-natural')
    render(<Root />)

    expect(screen.getByRole('heading', { level: 1, name: 'Dried in the Fruit' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'sources' })).toBeInTheDocument()
    expect(screen.getByText(/no peer-reviewed study of natural-processed coffee/i)).toBeInTheDocument()
  })

  it('navigates from the journal index to checkout without a reload', async () => {
    const user = userEvent.setup()
    window.history.pushState({}, '', '/journal')
    render(<Root />)

    await user.click(screen.getByRole('link', { name: 'checkout' }))

    expect(window.location.pathname).toBe('/checkout')
    expect(screen.getByRole('form', { name: 'checkout' })).toBeInTheDocument()
  })
})
