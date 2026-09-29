import { act, render, screen, within } from '@testing-library/react'
import { ProcessChapter, ProofBand } from './Chapters'

type IOCallback = (entries: Array<{ isIntersecting: boolean; target: Element }>) => void
let ioCallback: IOCallback | null = null

class IntersectionObserverMock {
  constructor(callback: IOCallback) {
    ioCallback = callback
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

const setMedia = (matching: (query: string) => boolean) => {
  vi.mocked(window.matchMedia).mockImplementation(
    (query: string) =>
      ({
        matches: matching(query),
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
  ioCallback = null
  vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  setMedia(() => false)
})

describe('proof marquee', () => {
  it('exposes one labelled list and hides the looping copy, which holds nothing focusable', () => {
    render(<ProofBand />)

    const list = screen.getByRole('list', { name: 'proof, not promises' })
    expect(within(list).getByText('Roast date printed on every bag')).toBeInTheDocument()
    const copies = document.querySelectorAll('.marquee__group')
    expect(copies).toHaveLength(2)
    expect(copies[1]).toHaveAttribute('aria-hidden', 'true')
    expect(copies[1].querySelectorAll('a, button, input, [tabindex]')).toHaveLength(0)
    expect(copies[0].innerHTML).toBe(copies[1].innerHTML)
  })
})

describe('sticky process steps', () => {
  it('stacks each step with its own still when sticky mode is off (mobile, reduced motion)', () => {
    setMedia(() => false)
    render(<ProcessChapter />)
    const section = screen.getByRole('region', { name: "tasted before it's trusted" })

    expect(section).toHaveAttribute('data-layout', 'stack')
    expect(section.querySelectorAll('.process-step[data-status="active"]')).toHaveLength(3)
    expect(section.querySelector('.process-sticky')).toBeNull()
    expect(section.querySelectorAll('.process-step img')).toHaveLength(3)
  })

  it('pins one still and moves the active step as each crosses the middle band', () => {
    setMedia((query) => query.includes('min-width: 768px'))
    render(<ProcessChapter />)
    const section = screen.getByRole('region', { name: "tasted before it's trusted" })
    const steps = Array.from(section.querySelectorAll<HTMLElement>('.process-step'))
    const stills = () => Array.from(section.querySelectorAll('.process-sticky img')).map((img) => img.getAttribute('data-active'))

    expect(section).toHaveAttribute('data-layout', 'sticky')
    expect(steps.map((s) => s.dataset.status)).toEqual(['active', 'after', 'after'])
    expect(stills()).toEqual(['true', 'false', 'false'])
    expect(section.querySelector('.process-sticky')).toHaveAttribute('aria-hidden', 'true')

    act(() => ioCallback?.([{ isIntersecting: true, target: steps[2] }]))
    expect(steps.map((s) => s.dataset.status)).toEqual(['before', 'before', 'active'])
    expect(stills()).toEqual(['false', 'false', 'true'])
  })
})
