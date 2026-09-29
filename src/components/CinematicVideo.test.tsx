import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const hlsInstances: Array<{
    config: unknown
    handlers: Record<string, () => void>
    on: ReturnType<typeof vi.fn>
    loadSource: ReturnType<typeof vi.fn>
    attachMedia: ReturnType<typeof vi.fn>
    startLoad: ReturnType<typeof vi.fn>
    destroy: ReturnType<typeof vi.fn>
  }> = []

  const HlsMock = vi.fn(function (this: (typeof hlsInstances)[number], config: unknown) {
    this.config = config
    this.handlers = {}
    this.on = vi.fn((event: string, callback: () => void) => {
      this.handlers[event] = callback
    })
    this.loadSource = vi.fn()
    this.attachMedia = vi.fn()
    this.startLoad = vi.fn()
    this.destroy = vi.fn()
    hlsInstances.push(this)
  }) as unknown as ReturnType<typeof vi.fn> & {
    isSupported: ReturnType<typeof vi.fn>
    Events: { FRAG_BUFFERED: string }
  }

  HlsMock.isSupported = vi.fn(() => true)
  HlsMock.Events = { FRAG_BUFFERED: 'fragBuffered' }

  const quickToSetters: Array<ReturnType<typeof vi.fn>> = []

  return {
    hlsInstances,
    HlsMock,
    quickToSetters,
    quickTo: vi.fn(() => {
      const setter = vi.fn()
      quickToSetters.push(setter)
      return setter
    }),
    killTweensOf: vi.fn(),
    registerPlugin: vi.fn()
  }
})

vi.mock('gsap', () => ({
  default: {
    registerPlugin: mocks.registerPlugin,
    quickTo: mocks.quickTo,
    killTweensOf: mocks.killTweensOf
  }
}))

vi.mock('hls.js', () => ({ default: mocks.HlsMock }))

const smoothScroll = vi.hoisted(() => ({ active: false }))
vi.mock('../lib/smoothScroll', () => ({ isSmoothScrollActive: () => smoothScroll.active }))

import {
  CinematicVideo,
  END_SEEK_PADDING_SECONDS,
  SCRUB_SMOOTHING,
  SCRUB_SMOOTHING_WITH_LENIS,
  pickVideoSource
} from './CinematicVideo'
import { getElementDocumentTop, getSectionScrollProgress } from './scrollProgress'

const getVideo = () => document.querySelector('video') as HTMLVideoElement

// Manual requestAnimationFrame queue so tests can step frames deterministically.
let rafQueue: FrameRequestCallback[] = []
const flushFrames = (count = 1) => {
  for (let i = 0; i < count; i++) {
    const pending = rafQueue
    rafQueue = []
    act(() => pending.forEach((cb) => cb(performance.now())))
  }
}

const mockPlayableVideo = (video: HTMLVideoElement, duration = 8) => {
  Object.defineProperty(video, 'duration', { configurable: true, value: duration })
  let seeking = false
  let currentTime = 0
  Object.defineProperty(video, 'seeking', { configurable: true, get: () => seeking })
  Object.defineProperty(video, 'currentTime', {
    configurable: true,
    get: () => currentTime,
    set: (value: number) => {
      currentTime = value
    }
  })
  return {
    setSeeking: (value: boolean) => {
      seeking = value
    }
  }
}

const setScroll = (scrollY: number, documentHeight = 2000, viewportHeight = 1000) => {
  Object.defineProperty(window, 'scrollY', { configurable: true, value: scrollY })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: viewportHeight })
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    configurable: true,
    value: documentHeight
  })
}

describe('CinematicVideo', () => {
  beforeEach(() => {
    rafQueue = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafQueue.push(cb)
      return rafQueue.length
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined)
    mocks.hlsInstances.length = 0
    mocks.HlsMock.mockClear()
    mocks.HlsMock.isSupported.mockReturnValue(true)
    mocks.quickTo.mockClear()
    mocks.quickToSetters.length = 0
    mocks.killTweensOf.mockClear()
    vi.mocked(window.HTMLMediaElement.prototype.play).mockClear()
    vi.mocked(window.HTMLMediaElement.prototype.pause).mockClear()
    Object.defineProperty(window.HTMLMediaElement.prototype, 'canPlayType', {
      configurable: true,
      value: vi.fn(() => '')
    })
    setScroll(0)
  })

  afterEach(() => {
    cleanup()
    vi.mocked(window.requestAnimationFrame).mockRestore()
    vi.mocked(window.cancelAnimationFrame).mockRestore()
  })

  it('renders a direct video source muted and inline, without looping or autoplaying', () => {
    render(<CinematicVideo src="/media/scrub/clip.mp4" className="custom-video" />)

    const video = getVideo()
    expect(video.getAttribute('src')).toBe('/media/scrub/clip.mp4')
    expect(video.muted).toBe(true)
    expect(video.playsInline).toBe(true)
    expect(video.loop).toBe(false)
    expect(video.className).toContain('object-cover')
    expect(video.className).toContain('custom-video')
    expect(window.HTMLMediaElement.prototype.play).not.toHaveBeenCalled()
    expect(screen.getByText('loading... 0%')).toBeInTheDocument()
  })

  it('hides the loader on canplay and primes the decoder with play then pause', async () => {
    render(<CinematicVideo src="/clip.mp4" />)

    fireEvent.canPlay(getVideo())
    await act(async () => {
      await Promise.resolve()
    })

    expect(screen.queryByText(/loading\.\.\./)).not.toBeInTheDocument()
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1)
    expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalled()
  })

  it('reports buffered progress from the TimeRanges API', () => {
    render(<CinematicVideo src="/clip.mp4" />)

    const video = getVideo()
    Object.defineProperty(video, 'duration', { configurable: true, value: 100 })
    Object.defineProperty(video, 'buffered', {
      configurable: true,
      value: { length: 1, end: () => 42 }
    })
    fireEvent.progress(video)

    expect(screen.getByText('loading... 42%')).toBeInTheDocument()
  })

  it('uses the small source on narrow screens only', () => {
    vi.mocked(window.matchMedia).mockImplementationOnce(
      (query: string) => ({ matches: query.includes('max-width'), media: query }) as MediaQueryList
    )
    expect(pickVideoSource('/big.mp4', '/small.mp4')).toBe('/small.mp4')
    expect(pickVideoSource('/big.mp4', '/small.mp4')).toBe('/big.mp4')
    expect(pickVideoSource('/big.mp4')).toBe('/big.mp4')
  })

  it('uses native HLS on Safari and hls.js elsewhere without restarting loads on seek', () => {
    Object.defineProperty(window.HTMLMediaElement.prototype, 'canPlayType', {
      configurable: true,
      value: vi.fn(() => 'probably')
    })
    const { unmount } = render(<CinematicVideo src="/stream/master.m3u8" />)
    expect(getVideo().getAttribute('src')).toBe('/stream/master.m3u8')
    expect(mocks.HlsMock).not.toHaveBeenCalled()
    unmount()

    Object.defineProperty(window.HTMLMediaElement.prototype, 'canPlayType', {
      configurable: true,
      value: vi.fn(() => '')
    })
    render(<CinematicVideo src="/stream/master.m3u8" />)
    const video = getVideo()
    mockPlayableVideo(video)
    const hls = mocks.hlsInstances[0]
    expect(hls.loadSource).toHaveBeenCalledWith('/stream/master.m3u8')
    expect(hls.attachMedia).toHaveBeenCalledWith(video)

    fireEvent.loadedMetadata(video)
    setScroll(500)
    fireEvent.scroll(window)
    flushFrames(60)

    expect(video.currentTime).toBeGreaterThan(0)
    expect(hls.startLoad).not.toHaveBeenCalled()
  })

  it('eases the playhead toward the scroll position over animation frames', () => {
    render(<CinematicVideo src="/clip.mp4" />)
    const video = getVideo()
    mockPlayableVideo(video, 8)
    fireEvent.loadedMetadata(video)
    flushFrames()
    expect(video.currentTime).toBe(0)

    // Half-way down a page with no marked sections → 4s.
    setScroll(500)
    fireEvent.scroll(window)
    flushFrames()
    expect(video.currentTime).toBeCloseTo(4 * SCRUB_SMOOTHING)

    flushFrames(60)
    expect(video.currentTime).toBeCloseTo(4)
    expect(rafQueue).toHaveLength(0) // loop stops once settled
  })

  it('eases less when Lenis is already smoothing the scroll', () => {
    smoothScroll.active = true
    render(<CinematicVideo src="/clip.mp4" />)
    const video = getVideo()
    mockPlayableVideo(video, 8)
    fireEvent.loadedMetadata(video)
    flushFrames()

    setScroll(500)
    fireEvent.scroll(window)
    flushFrames()
    smoothScroll.active = false

    expect(SCRUB_SMOOTHING_WITH_LENIS).toBeGreaterThan(SCRUB_SMOOTHING)
    expect(video.currentTime).toBeCloseTo(4 * SCRUB_SMOOTHING_WITH_LENIS)
  })

  it('does not stack seeks while the browser is still seeking', () => {
    render(<CinematicVideo src="/clip.mp4" />)
    const video = getVideo()
    const control = mockPlayableVideo(video, 8)
    fireEvent.loadedMetadata(video)
    flushFrames()

    control.setSeeking(true)
    setScroll(1000)
    fireEvent.scroll(window)
    flushFrames(5)
    expect(video.currentTime).toBe(0)

    control.setSeeking(false)
    fireEvent(video, new Event('seeked'))
    flushFrames(60)
    expect(video.currentTime).toBeCloseTo(8 - END_SEEK_PADDING_SECONDS)
  })

  it('maps scroll position across marked sections instead of the whole document', () => {
    const tops = [0, 1000, 2000, 3000, 4000]
    const at = (scrollY: number) =>
      getSectionScrollProgress({ scrollY, viewportHeight: 1000, documentHeight: 5000, sectionTops: tops })

    expect(at(0)).toBe(0)
    expect(at(1500)).toBeCloseTo(0.375)
    expect(at(4000)).toBe(1)
  })

  it('reads stable offsets for sticky hero panels and normal sections', () => {
    const hero = document.createElement('section')
    hero.dataset.sectionPanel = 'hero'
    expect(getElementDocumentTop(hero)).toBe(0)

    const child = document.createElement('section')
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 840 })
    child.getBoundingClientRect = vi.fn(() => ({ top: 20 }) as DOMRect)
    expect(getElementDocumentTop(child)).toBe(860)
  })

  it('drives mouse parallax through reusable quickTo setters and cleans up', () => {
    const { unmount } = render(<CinematicVideo src="/clip.mp4" />)

    expect(mocks.quickTo).toHaveBeenCalledTimes(2)
    fireEvent.mouseMove(window, { clientX: window.innerWidth, clientY: 0 })
    expect(mocks.quickToSetters[0]).toHaveBeenCalledWith(-30)
    expect(mocks.quickToSetters[1]).toHaveBeenCalledWith(30)

    unmount()
    expect(mocks.killTweensOf).toHaveBeenCalledWith(expect.any(HTMLDivElement))
  })
})
