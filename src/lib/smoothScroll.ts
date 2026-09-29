import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Lenis smooth scroll, driven by gsap.ticker so Lenis, ScrollTrigger and GSAP
 * tweens share one requestAnimationFrame loop (BRIEF §3, G8).
 *
 * Off under prefers-reduced-motion and on coarse pointers (touch keeps native
 * momentum scrolling). CinematicVideo reads window.scrollY, which Lenis keeps
 * in sync, and asks `isSmoothScrollActive()` to pick its scrub smoothing.
 */

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const COARSE_POINTER_QUERY = '(pointer: coarse)'

let lenis: Lenis | null = null

const matches = (query: string) => window.matchMedia?.(query).matches ?? false

export const shouldSmoothScroll = () =>
  typeof window !== 'undefined' && !matches(REDUCED_MOTION_QUERY) && !matches(COARSE_POINTER_QUERY)

export const isSmoothScrollActive = () => lenis !== null

/** Jump to the top instantly, e.g. after a route change. */
export function jumpToTop() {
  if (lenis) {
    lenis.scrollTo(0, { immediate: true, force: true })
    return
  }
  try {
    window.scrollTo({ top: 0 })
  } catch {
    // jsdom does not implement scrollTo
  }
}

export function startSmoothScroll(): () => void {
  if (lenis || !shouldSmoothScroll()) return () => undefined

  const instance = new Lenis({ lerp: 0.07, autoRaf: false, anchors: true })
  lenis = instance

  const onScroll = () => ScrollTrigger.update()
  instance.on('scroll', onScroll)

  const raf = (time: number) => instance.raf(time * 1000)
  gsap.ticker.add(raf)
  gsap.ticker.lagSmoothing(0)

  // Section positions move once the web fonts swap in.
  let cancelled = false
  void document.fonts?.ready.then(() => {
    if (!cancelled) ScrollTrigger.refresh()
  })

  return () => {
    cancelled = true
    gsap.ticker.remove(raf)
    gsap.ticker.lagSmoothing(500, 33)
    instance.destroy()
    if (lenis === instance) lenis = null
  }
}

/** Mount once near the root of the app. */
export function useSmoothScroll() {
  useEffect(() => startSmoothScroll(), [])
}
