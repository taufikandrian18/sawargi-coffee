import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import gsap from 'gsap'
import { fetchWithProgress } from '../lib/fetchWithProgress'
import { isSmoothScrollActive } from '../lib/smoothScroll'
import { getElementDocumentTop, getSectionScrollProgress } from './scrollProgress'

type CinematicVideoProps = {
  src: string
  /** Lighter file for small screens / data-saver. Falls back to `src`. */
  smallSrc?: string
  /** Still frame shown until the video can paint (and if it never can). */
  poster?: string
  className?: string
}

const isHlsSource = (src: string) => /\.m3u8($|\?)/i.test(src)
const VIDEO_SECTION_SELECTOR = '[data-video-section]'
const SMALL_SCREEN_QUERY = '(max-width: 767px)'

/** One frame at 24 fps. Seeks smaller than half a frame are skipped. */
const FRAME_SECONDS = 1 / 24
/** Keep the last seek a frame before the end so browsers don't fire `ended`. */
export const END_SEEK_PADDING_SECONDS = FRAME_SECONDS
/**
 * Fraction of the remaining distance covered per animation frame. Lower is
 * smoother but trails further behind the scrollbar.
 */
export const SCRUB_SMOOTHING = 0.18
/** How long the loader may cover the page before it steps aside regardless. */
export const LOADER_TIMEOUT_MS = 8000
/**
 * With Lenis on, scrollY is already eased, so the scrub eases less to avoid
 * trailing twice (BRIEF §3). Starting value; tune by feel on real devices.
 */
export const SCRUB_SMOOTHING_WITH_LENIS = 0.35

type NetworkInformationLike = { saveData?: boolean }

export const pickVideoSource = (src: string, smallSrc?: string) => {
  if (!smallSrc || typeof window === 'undefined') return src
  const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection
  const small = window.matchMedia?.(SMALL_SCREEN_QUERY).matches ?? false
  return small || connection?.saveData ? smallSrc : src
}

/**
 * Whole-file download for MP4s: real loader progress, and every scrub seek is
 * served from memory instead of a range request. Needs streams and blob URLs.
 */
const canDownloadWhole = () =>
  typeof URL !== 'undefined' &&
  typeof URL.createObjectURL === 'function' &&
  typeof ReadableStream !== 'undefined' &&
  typeof fetch === 'function'

export function CinematicVideo({ src, smallSrc, poster, className = '' }: CinematicVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const [progress, setProgress] = useState(0)
  const [canPlay, setCanPlay] = useState(false)
  /** The loader never blocks the page for good: it also gives way on error or after a timeout. */
  const [loaderGaveUp, setLoaderGaveUp] = useState(false)
  const [activeSrc] = useState(() => pickVideoSource(src, smallSrc))

  // 1. Load the media.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let hls: Hls | undefined
    const sourceIsHls = isHlsSource(activeSrc)

    const reportBuffered = () => {
      if (!video.duration || Number.isNaN(video.duration)) return
      const bufferedEnd = video.buffered.length ? video.buffered.end(video.buffered.length - 1) : 0
      setProgress(Math.min(100, Math.round((bufferedEnd / video.duration) * 100)))
    }

    // Prime the decoder once (iOS Safari only paints seeked frames after a
    // play), then hold still: scroll drives the playhead, not playback.
    // iOS never fires `canplay` before a play() (it doesn't buffer ahead), so
    // this runs on the first decodable frame instead of waiting for it.
    let primed = false
    const prime = () => {
      const playback = video.play()
      if (playback && typeof playback.then === 'function') {
        void playback
          .then(() => {
            primed = true
            video.pause()
          })
          .catch(() => {
            // Low Power Mode and some in-app browsers refuse play() without a
            // gesture; prime on the visitor's first touch instead.
            window.addEventListener('touchstart', primeOnGesture, { once: true, passive: true })
            window.addEventListener('pointerdown', primeOnGesture, { once: true, passive: true })
          })
      } else {
        primed = true
        video.pause()
      }
    }
    const primeOnGesture = () => {
      window.removeEventListener('touchstart', primeOnGesture)
      window.removeEventListener('pointerdown', primeOnGesture)
      if (!primed) prime()
    }

    let ready = false
    const onReady = () => {
      if (ready) return
      ready = true
      setCanPlay(true)
      prime()
    }

    // A browser that can't decode the file (or a stalled network) must still get the site.
    const giveUp = () => setLoaderGaveUp(true)
    const timeout = window.setTimeout(giveUp, LOADER_TIMEOUT_MS)
    video.addEventListener('error', giveUp)

    video.addEventListener('loadeddata', onReady)
    video.addEventListener('canplay', onReady)
    video.addEventListener('progress', reportBuffered)
    video.addEventListener('loadedmetadata', reportBuffered)

    const download = new AbortController()
    let objectUrl: string | undefined

    if (sourceIsHls && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = activeSrc
    } else if (sourceIsHls && Hls.isSupported()) {
      // The clip is short: buffer all of it once and never restart loading on
      // seek. Restarting the loader on every scroll seek caused stalls.
      hls = new Hls({
        maxBufferLength: 600,
        maxMaxBufferLength: 600,
        backBufferLength: Infinity,
        startPosition: 0,
        capLevelToPlayerSize: true,
        startFragPrefetch: true
      })
      hls.on(Hls.Events.FRAG_BUFFERED, reportBuffered)
      hls.loadSource(activeSrc)
      hls.attachMedia(video)
    } else if (!sourceIsHls && canDownloadWhole()) {
      fetchWithProgress(activeSrc, setProgress, download.signal)
        .then((blob) => {
          objectUrl = URL.createObjectURL(blob)
          video.src = objectUrl
          video.load()
        })
        .catch(() => {
          if (download.signal.aborted) return
          // Fall back to letting the browser stream the file itself.
          video.src = activeSrc
        })
    } else {
      video.src = activeSrc
    }

    return () => {
      window.clearTimeout(timeout)
      download.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      window.removeEventListener('touchstart', primeOnGesture)
      window.removeEventListener('pointerdown', primeOnGesture)
      video.removeEventListener('error', giveUp)
      video.removeEventListener('loadeddata', onReady)
      video.removeEventListener('canplay', onReady)
      video.removeEventListener('progress', reportBuffered)
      video.removeEventListener('loadedmetadata', reportBuffered)
      hls?.destroy()
    }
  }, [activeSrc])

  // 2. Scrub the playhead with scroll, smoothed on animation frames.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let sectionTops: number[] = []
    let scrollProgress = 0
    let rendered = -1
    let rafId = 0

    // Measured on load/resize only — reading layout on every scroll event
    // forced a reflow per event and caused jank.
    const measureSections = () => {
      sectionTops = Array.from(document.querySelectorAll<HTMLElement>(VIDEO_SECTION_SELECTOR)).map(
        (section) => getElementDocumentTop(section)
      )
    }

    const readScrollProgress = () => {
      scrollProgress = getSectionScrollProgress({
        scrollY: window.scrollY,
        viewportHeight: window.innerHeight,
        documentHeight: document.documentElement.scrollHeight,
        sectionTops
      })
    }

    const tick = () => {
      rafId = 0
      const duration = video.duration
      if (!duration || Number.isNaN(duration)) return

      const goal = Math.min(Math.max(0, duration - END_SEEK_PADDING_SECONDS), scrollProgress * duration)
      const smoothing = isSmoothScrollActive() ? SCRUB_SMOOTHING_WITH_LENIS : SCRUB_SMOOTHING
      const eased = rendered < 0 ? goal : rendered + (goal - rendered) * smoothing
      const settled = Math.abs(goal - eased) < FRAME_SECONDS / 2
      const next = settled ? goal : eased

      // Never stack a seek on top of a pending seek; retry next frame instead.
      if (!video.seeking) {
        if (Math.abs(video.currentTime - next) >= FRAME_SECONDS / 2) {
          video.currentTime = next
        }
        rendered = next
      }

      if (!settled || video.seeking) rafId = window.requestAnimationFrame(tick)
    }

    const schedule = () => {
      if (!rafId) rafId = window.requestAnimationFrame(tick)
    }

    const onScroll = () => {
      readScrollProgress()
      schedule()
    }

    const onLayoutChange = () => {
      measureSections()
      onScroll()
    }

    const onMetadata = () => {
      video.pause()
      onLayoutChange()
    }

    measureSections()
    readScrollProgress()

    video.addEventListener('loadedmetadata', onMetadata)
    video.addEventListener('seeked', schedule)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onLayoutChange)

    // Section positions shift when fonts and images load; re-measure then.
    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(onLayoutChange)
    resizeObserver?.observe(document.body)

    if (video.readyState >= 1) onMetadata()

    return () => {
      video.removeEventListener('loadedmetadata', onMetadata)
      video.removeEventListener('seeked', schedule)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onLayoutChange)
      resizeObserver?.disconnect()
      if (rafId) window.cancelAnimationFrame(rafId)
    }
  }, [])

  // 3. Subtle mouse parallax. quickTo reuses one tween per axis instead of
  // creating a new tween on every mousemove event.
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    const moveX = gsap.quickTo(wrapper, 'x', { duration: 1.5, ease: 'power2.out' })
    const moveY = gsap.quickTo(wrapper, 'y', { duration: 1.5, ease: 'power2.out' })

    const handleMouseMove = (event: MouseEvent) => {
      moveX((event.clientX / window.innerWidth - 0.5) * 2 * -30)
      moveY((event.clientY / window.innerHeight - 0.5) * 2 * -30)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      gsap.killTweensOf(wrapper)
    }
  }, [])

  return (
    <>
      {!canPlay && !loaderGaveUp && (
        <div role="status" className="video-loader fixed inset-0 z-50 flex items-center justify-center bg-ink">
          <span className="video-loader__stamp">loading... {progress}%</span>
        </div>
      )}
      <div
        ref={wrapperRef}
        className="fixed left-0 top-0 z-0 h-full w-full origin-center scale-[1.05] will-change-transform"
        aria-hidden="true"
      >
        <video
          ref={videoRef}
          className={`w-full h-full object-cover scale-[1.35] ${className}`}
          muted
          playsInline
          disablePictureInPicture
          crossOrigin="anonymous"
          preload="auto"
          poster={poster}
        />
      </div>
    </>
  )
}
