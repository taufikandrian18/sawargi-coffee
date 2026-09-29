import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CursorDot } from './CursorDot'
import { Grain } from './Grain'
import { InkButton } from './InkButton'
import { PaperEdge } from './PaperEdge'
import { SplitReveal } from './SplitReveal'
import { Wiggle } from './Wiggle'

type ObserverCallback = (entries: Array<{ isIntersecting: boolean }>) => void

const observers: Array<{ callback: ObserverCallback; disconnect: ReturnType<typeof vi.fn> }> = []

class IntersectionObserverMock {
  callback: ObserverCallback
  disconnect = vi.fn()
  constructor(callback: ObserverCallback) {
    this.callback = callback
    observers.push(this)
  }
  observe() {}
  unobserve() {}
  takeRecords() {
    return []
  }
}

const setMedia = (matching: string[]) => {
  vi.mocked(window.matchMedia).mockImplementation(
    (query: string) =>
      ({
        matches: matching.includes(query),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }) as unknown as MediaQueryList
  )
}

beforeEach(() => {
  observers.length = 0
  vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)
  setMedia([])
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('SplitReveal', () => {
  it('gives the heading its full text as the accessible name and hides the split words', () => {
    render(<SplitReveal as="h2" text="Bring the Table Back" />)

    const heading = screen.getByRole('heading', { level: 2, name: 'Bring the Table Back' })
    const words = heading.querySelectorAll('.sr-word')
    expect(words).toHaveLength(4)
    expect(words[0].closest('[aria-hidden="true"]')).not.toBeNull()
    expect((words[2] as HTMLElement).style.getPropertyValue('--i')).toBe('2')
  })

  it('arms before paint and reveals once when it scrolls into view', () => {
    render(<SplitReveal text="Master One Coffee Completely" />)
    const heading = screen.getByRole('heading')

    expect(heading).toHaveAttribute('data-reveal', 'armed')
    observers[0].callback([{ isIntersecting: true }])
    expect(heading).toHaveAttribute('data-reveal', 'in')
    expect(observers[0].disconnect).toHaveBeenCalled()
  })

  it('stays in its readable final state under reduced motion', () => {
    setMedia(['(prefers-reduced-motion: reduce)'])
    render(<SplitReveal text="Never Rushed" />)

    expect(screen.getByRole('heading')).not.toHaveAttribute('data-reveal')
    expect(observers).toHaveLength(0)
  })

  it('adds the wiggle to the chosen words only', () => {
    render(<SplitReveal text="Never Rushed" wiggle={['Never']} />)
    const words = screen.getByRole('heading').querySelectorAll('.sr-word')

    expect(words[0]).toHaveClass('sw-wiggle')
    expect(words[1]).not.toHaveClass('sw-wiggle')
  })
})

describe('Wiggle', () => {
  it('keeps the phrase readable and offsets each word', () => {
    const { container } = render(<Wiggle text="Every harvest. Every roast." />)

    expect(container).toHaveTextContent('Every harvest. Every roast.')
    const words = container.querySelectorAll<HTMLElement>('.sw-wiggle')
    expect(words).toHaveLength(4)
    expect(words[1].style.animationDelay).toBe('-0.18s')
  })
})

describe('InkButton', () => {
  it('routes internal paths through the SPA link', async () => {
    const user = userEvent.setup()
    render(<InkButton href="/checkout">Order This Batch</InkButton>)

    const link = screen.getByRole('link', { name: 'Order This Batch' })
    expect(link).toHaveAttribute('href', '/checkout')
    expect(link).toHaveClass('ink-btn', 'ink-btn--paper')
    await user.click(link)
    expect(window.location.pathname).toBe('/checkout')
    window.history.pushState({}, '', '/')
  })

  it('renders hash links as plain anchors and buttons as type=button', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <>
        <InkButton href="#batch" variant="cherry">
          Buy Now
        </InkButton>
        <InkButton onClick={onClick}>Order This Batch</InkButton>
      </>
    )

    expect(screen.getByRole('link', { name: 'Buy Now' })).toHaveAttribute('href', '#batch')
    const button = screen.getByRole('button', { name: 'Order This Batch' })
    expect(button).toHaveAttribute('type', 'button')
    await user.click(button)
    expect(onClick).toHaveBeenCalledOnce()
  })
})

describe('PaperEdge', () => {
  it('is decorative and deterministic', () => {
    const first = render(<PaperEdge side="top" />).container.querySelector('path')?.getAttribute('d')
    const second = render(<PaperEdge side="top" />).container.querySelector('path')?.getAttribute('d')

    expect(first).toBeTruthy()
    expect(first).toBe(second)
    expect(document.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('CursorDot and Grain', () => {
  it('renders decorative layers that never take pointer events', () => {
    render(
      <>
        <CursorDot />
        <Grain />
      </>
    )

    expect(screen.getByTestId('cursor-dot')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByTestId('grain')).toHaveClass('grain')
  })

  it('skips the cursor on touch and under reduced motion', () => {
    setMedia(['(pointer: coarse)'])
    const { unmount } = render(<CursorDot />)
    expect(screen.queryByTestId('cursor-dot')).not.toBeInTheDocument()
    unmount()

    setMedia(['(prefers-reduced-motion: reduce)'])
    render(<CursorDot />)
    expect(screen.queryByTestId('cursor-dot')).not.toBeInTheDocument()
  })
})
