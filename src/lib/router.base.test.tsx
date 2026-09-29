import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

// The base path is read once at module load, so each case imports fresh modules.
async function loadWithBase(base: string) {
  vi.resetModules()
  vi.stubEnv('BASE_URL', base)
  return { ...(await import('./router')), ...(await import('./basePath')) }
}

afterEach(() => {
  vi.unstubAllEnvs()
  window.history.replaceState(null, '', '/')
})

describe('router under a base path (/sawargi-coffee)', () => {
  it('adds the base to links and assets, and strips it from the route', async () => {
    const { withBase, stripBase, asset } = await loadWithBase('/sawargi-coffee/')
    expect(withBase('/checkout?batch=SWG-CN-015')).toBe('/sawargi-coffee/checkout?batch=SWG-CN-015')
    expect(withBase('#batch')).toBe('#batch')
    expect(stripBase('/sawargi-coffee')).toBe('/')
    expect(stripBase('/sawargi-coffee/')).toBe('/')
    expect(stripBase('/sawargi-coffee/journal/ciwidey-natural')).toBe('/journal/ciwidey-natural')
    expect(asset('/media/scrub/coffee-scrub-720.mp4')).toBe('/sawargi-coffee/media/scrub/coffee-scrub-720.mp4')
  })

  it('renders base-prefixed hrefs and navigates within the base', async () => {
    const { Link, usePathname } = await loadWithBase('/sawargi-coffee/')
    window.history.replaceState(null, '', '/sawargi-coffee/')
    function Probe() {
      return (
        <>
          <span data-testid="route">{usePathname()}</span>
          <Link to="/journal">journal</Link>
        </>
      )
    }
    render(<Probe />)
    expect(screen.getByTestId('route')).toHaveTextContent(/^\/$/)
    const link = screen.getByRole('link', { name: 'journal' })
    expect(link).toHaveAttribute('href', '/sawargi-coffee/journal')
    fireEvent.click(link)
    expect(window.location.pathname).toBe('/sawargi-coffee/journal')
    expect(screen.getByTestId('route')).toHaveTextContent('/journal')
  })

  it('is a no-op at the domain root', async () => {
    const { withBase, stripBase, asset } = await loadWithBase('/')
    expect(withBase('/checkout')).toBe('/checkout')
    expect(stripBase('/journal')).toBe('/journal')
    expect(asset('/brand/x.png')).toBe('/brand/x.png')
  })
})
