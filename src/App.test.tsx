import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { BATCHES } from './data/shop'

// Behaviour tests for the home page (BRIEF G7). Copy is pinned separately in content/copy.test.tsx.

describe('home page', () => {
  it('renders the logo, Buy Now and a menu whose links all have working targets', async () => {
    const user = userEvent.setup()
    render(<App />)
    const nav = screen.getByRole('navigation', { name: 'primary' })

    expect(within(nav).getByRole('link', { name: 'sawargi home' })).toHaveAttribute('href', '#top')
    expect(screen.getByTestId('sawargi-logo-mark')).toHaveAttribute('src', '/brand/sawargi-mark-white-cropped.png')
    expect(screen.getByTestId('sawargi-logo-wordmark')).toHaveAttribute(
      'src',
      '/brand/sawargi-wordmark-white-cropped.png'
    )
    expect(within(nav).getByRole('link', { name: 'Buy Now' })).toHaveAttribute('href', '/checkout')
    // The centre link pill is gone; sections live in the menu at every width.
    expect(within(nav).queryByRole('link', { name: 'story' })).not.toBeInTheDocument()
    expect(screen.getByTestId('scroll-progress')).toBeInTheDocument()

    await user.click(within(nav).getByRole('button', { name: 'menu' }))
    const menu = screen.getByRole('dialog', { name: 'menu' })
    expect(within(menu).getByRole('link', { name: 'story' })).toHaveAttribute('href', '#story')
    expect(within(menu).getByRole('link', { name: 'one roast' })).toHaveAttribute('href', '#why-one')
    expect(within(menu).getByRole('link', { name: 'process' })).toHaveAttribute('href', '#process')
    expect(within(menu).getByRole('link', { name: 'order' })).toHaveAttribute('href', '#order')
    expect(within(menu).getByRole('link', { name: 'journal' })).toHaveAttribute('href', '/journal')
    expect(within(menu).getByRole('link', { name: 'Buy Now' })).toHaveAttribute('href', '/checkout')
  })

  it('keeps the nav fixed above the content layer, outside the hero', () => {
    render(<App />)
    const nav = screen.getByRole('navigation', { name: 'primary' })

    expect(nav).toHaveClass('fixed', 'z-50')
    expect(nav).toHaveAttribute('data-tone', 'dark')
    expect(document.querySelectorAll('[data-nav-tone="light"]').length).toBeGreaterThanOrEqual(4)
    expect(screen.getByTestId('hero-section')).not.toContainElement(nav)
    expect(screen.getByTestId('story-sections-layer')).toHaveClass('z-20')
  })

  it('opens the hero with the thesis, the parting exit hooks and the current batch', () => {
    render(<App />)
    const hero = screen.getByTestId('hero-section')

    expect(within(hero).getByRole('heading', { level: 1, name: 'Quietly Roasted' })).toBeInTheDocument()
    expect(screen.getByTestId('hero-word-quietly')).toHaveAttribute('data-scroll-exit', 'left')
    expect(screen.getByTestId('hero-word-never')).toHaveAttribute('data-scroll-exit', 'right')
    expect(screen.getByTestId('hero-word-never')).toHaveTextContent('Never Rushed')
    expect(document.querySelectorAll('[data-parallax-object="hero-word"]')).toHaveLength(2)

    const current = BATCHES.find((b) => b.bagsLeft > 0)!
    const strip = within(hero).getByRole('article', { name: `Batch ${current.code}` })
    expect(within(strip).getByRole('link', { name: 'Order This Batch' })).toHaveAttribute(
      'href',
      `/checkout?batch=${current.code}`
    )
    expect(within(hero).getByTestId('bean-drift')).toHaveAttribute('aria-hidden', 'true')
  })

  it('keeps the scroll-scrubbed video behind the page', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise<Response>(() => undefined))
    render(<App />)

    // Downloaded whole (real loader progress); a still frame shows until it can paint.
    expect(fetchSpy).toHaveBeenCalledWith('/media/scrub/coffee-scrub-1080.mp4', expect.anything())
    expect(document.querySelector('video')).toHaveAttribute('poster', '/media/scrub/coffee-scrub-poster.webp')
    fetchSpy.mockRestore()
    expect(screen.getByTestId('video-readability-scrim')).toHaveAttribute('aria-hidden', 'true')
    expect(document.querySelectorAll('[data-video-section]').length).toBeGreaterThanOrEqual(6)
    expect(screen.getByTestId('hero-section')).toHaveAttribute('data-section-panel', 'hero')
  })

  it('lays the chapters out in the BRIEF §6 order', () => {
    render(<App />)
    const order = ['our story', 'why just one', "tasted before it's trusted", 'the scarcity angle', 'journal', 'bring the table back']
    const regions = order.map((name) => screen.getByRole('region', { name }))

    regions.slice(1).forEach((region, index) => {
      expect(regions[index].compareDocumentPosition(region) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })
    expect(regions[0]).toHaveAttribute('id', 'story')
    expect(regions[1]).toHaveAttribute('id', 'why-one')
    expect(regions[2]).toHaveAttribute('id', 'process')
    expect(regions[3]).toHaveAttribute('id', 'batch')
    expect(regions[5]).toHaveAttribute('id', 'order')
  })

  it('never links to a dead anchor, and every CTA goes to checkout or the batch', () => {
    render(<App />)

    for (const link of document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')) {
      expect(document.querySelector(link.getAttribute('href')!), link.outerHTML).not.toBeNull()
    }
    for (const link of screen.getAllByRole('link', { name: 'Order This Batch' })) {
      expect(link.getAttribute('href')).toMatch(/^\/checkout\?batch=SWG-CN-\d+$/)
    }
    const miniCtas = screen.getAllByRole('link', { name: 'Choose a batch' })
    expect(miniCtas).toHaveLength(3)
    miniCtas.forEach((link) => expect(link).toHaveAttribute('href', '#batch'))
  })

  it('numbers the process steps and shows a still for each', () => {
    render(<App />)
    const process = screen.getByRole('region', { name: "tasted before it's trusted" })
    const steps = within(process).getAllByRole('listitem').filter((li) => li.classList.contains('process-step'))

    expect(steps.map((step) => step.querySelector('.process-step__number')?.textContent)).toEqual(['01', '02', '03'])
    const stills = process.querySelectorAll('img')
    expect([...stills].map((img) => img.getAttribute('src'))).toEqual([
      '/media/stills/step-1.webp',
      '/media/stills/step-2.webp',
      '/media/stills/step-3.webp'
    ])
    stills.forEach((img) => expect(img).toHaveAttribute('alt', ''))
  })

  it('shows every batch as a ticket and sends the journal teaser to the article', () => {
    render(<App />)
    const batchSection = screen.getByRole('region', { name: 'the scarcity angle' })

    for (const batch of BATCHES) {
      const ticket = within(batchSection).getByRole('article', { name: `Batch ${batch.code}` })
      const order = within(ticket).queryByRole('link', { name: 'Order This Batch' })
      // In-stock tickets open checkout with their own batch; sold-out ones offer nothing.
      if (batch.bagsLeft > 0) expect(order).toHaveAttribute('href', `/checkout?batch=${batch.code}`)
      else expect(order).toBeNull()
    }
    expect(
      within(screen.getByRole('region', { name: 'journal' })).getByRole('link', { name: /Dried in the Fruit/ })
    ).toHaveAttribute('href', '/journal/ciwidey-natural')
  })

  it('does not ship leftover template copy', () => {
    render(<App />)

    for (const text of [/we haven't changed how we roast since 2019/i, /\+65k/, /rooted in tradition/i, /\+1\.5b/, /gb data was protected/i, /\+300k/, /securify/i]) {
      expect(screen.queryByText(text)).not.toBeInTheDocument()
    }
  })
})

describe('mobile menu', () => {
  it('traps focus, closes on Escape and returns focus to the menu button', async () => {
    const user = userEvent.setup()
    render(<App />)
    const button = screen.getByRole('button', { name: 'menu' })
    expect(button).toHaveAttribute('aria-expanded', 'false')

    await user.click(button)
    const dialog = screen.getByRole('dialog', { name: 'menu' })
    expect(button).toHaveAttribute('aria-expanded', 'true')
    const focusable = within(dialog).getAllByRole('link').concat(within(dialog).getAllByRole('button'))
    expect(dialog).toContainElement(document.activeElement as HTMLElement)
    expect(focusable.length).toBeGreaterThan(1)

    // Tab past the last control wraps to the first.
    const items = Array.from(dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))
    act(() => items[items.length - 1].focus())
    await user.tab()
    expect(document.activeElement).toBe(items[0])
    await user.tab({ shift: true })
    expect(document.activeElement).toBe(items[items.length - 1])

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'menu' })).not.toBeInTheDocument()
    expect(document.activeElement).toBe(button)
  })
})
