import { isSmoothScrollActive, startSmoothScroll } from './smoothScroll'

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

describe('smooth scroll', () => {
  afterEach(() => setMedia([]))

  it('starts Lenis on fine pointers and tears it down cleanly', () => {
    setMedia([])
    const stop = startSmoothScroll()
    expect(isSmoothScrollActive()).toBe(true)
    expect(document.documentElement).toHaveClass('lenis')

    stop()
    expect(isSmoothScrollActive()).toBe(false)
    expect(document.documentElement).not.toHaveClass('lenis')
  })

  it.each([['(prefers-reduced-motion: reduce)'], ['(pointer: coarse)']])('stays off for %s', (query) => {
    setMedia([query])
    const stop = startSmoothScroll()

    expect(isSmoothScrollActive()).toBe(false)
    stop()
  })
})
