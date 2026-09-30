import type { MouseEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { copy, navItems } from '../../content/copy'
import { Link } from '../../lib/router'
import { asset } from '../../lib/basePath'
import { scrollToHash, setScrollLocked } from '../../lib/smoothScroll'
import { InkButton } from '../ui/InkButton'

gsap.registerPlugin(ScrollTrigger)

/** Height of the line (px from the top) the nav reads its colour from. */
const NAV_LINE = 48
const FOCUSABLE = 'a[href], button:not([disabled])'

type NavTone = 'dark' | 'light'

function Logo() {
  return (
    <a href="#top" aria-label="sawargi home" className="nav-focus nav-logo flex min-h-11 items-center py-2 pr-2 md:min-h-12">
      <span data-testid="sawargi-logo" className="sawargi-composite-logo flex items-center">
        <img
          src={asset('/brand/sawargi-mark-white-cropped.webp')}
          alt=""
          data-testid="sawargi-logo-mark"
          className="h-7 w-7 shrink-0 object-contain md:h-8 md:w-8"
        />
        <img
          src={asset('/brand/sawargi-wordmark-white-cropped.webp')}
          alt=""
          data-testid="sawargi-logo-wordmark"
          className="h-[1.125rem] w-auto object-contain md:h-6"
        />
      </span>
    </a>
  )
}

/**
 * Minimal nav: logo sitting straight on the scrub video, Buy Now, and a menu
 * button (every width) that opens a full-screen menu. The logo and menu
 * button flip to ink while a cream band ([data-nav-tone="light"]) passes
 * under them, so they never vanish. A thin --cherry line along the top edge
 * shows scroll progress.
 */
export function HomeNav() {
  const progressRef = useRef<HTMLSpanElement | null>(null)
  const menuButtonRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)
  const [tone, setTone] = useState<NavTone>('dark')

  // Scroll progress: a direct mapping, not an animation, so it stays on under reduced motion.
  useEffect(() => {
    const bar = progressRef.current
    if (!bar) return
    const setScale = gsap.quickSetter(bar, 'scaleX')
    const trigger = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => setScale(self.progress)
    })
    return () => trigger.kill()
  }, [])

  // Nav tone follows whichever band is under the nav line.
  useEffect(() => {
    const bands = Array.from(document.querySelectorAll<HTMLElement>('[data-nav-tone="light"]'))
    const inside = new Set<HTMLElement>()
    const triggers = bands.map((band) =>
      ScrollTrigger.create({
        trigger: band,
        start: `top ${NAV_LINE}px`,
        end: `bottom ${NAV_LINE}px`,
        onToggle: (self) => {
          if (self.isActive) inside.add(band)
          else inside.delete(band)
          setTone(inside.size > 0 ? 'light' : 'dark')
        }
      })
    )
    return () => triggers.forEach((trigger) => trigger.kill())
  }, [])

  useEffect(() => {
    if (!open) return
    const menu = menuRef.current
    const button = menuButtonRef.current
    setScrollLocked(true)
    menu?.querySelector<HTMLElement>(FOCUSABLE)?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        return
      }
      if (event.key !== 'Tab' || !menu) return
      const items = Array.from(menu.querySelectorAll<HTMLElement>(FOCUSABLE))
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      setScrollLocked(false)
      button?.focus()
    }
  }, [open])

  const onMenuLink = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith('#')) {
      setOpen(false)
      return
    }
    event.preventDefault()
    setOpen(false)
    // Wait a frame so scrolling is unlocked before we move.
    requestAnimationFrame(() => scrollToHash(href))
  }

  return (
    <>
      <span className="scroll-progress" aria-hidden="true">
        <span ref={progressRef} data-testid="scroll-progress" />
      </span>

      <nav
        aria-label="primary"
        data-tone={tone}
        className="home-nav fixed left-0 right-0 top-0 z-50 flex items-center justify-between gap-4 px-4 py-4 md:px-8 md:py-6"
      >
        <Logo />

        <div className="flex items-center gap-2 md:gap-3">
          <InkButton href="/checkout" variant="cherry" className="ink-btn--small">
            {copy.nav.buyNow}
          </InkButton>
          <button
            ref={menuButtonRef}
            type="button"
            className="nav-focus nav-menu-btn"
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label="menu"
            onClick={() => setOpen(true)}
          >
            <span className="hidden text-[0.8125rem] font-medium uppercase tracking-[0.22em] md:inline">menu</span>
            <svg aria-hidden="true" width="18" height="12" viewBox="0 0 18 12" fill="none">
              <path d="M0 1h18M0 6h18M0 11h18" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div
          ref={menuRef}
          id="site-menu"
          role="dialog"
          aria-modal="true"
          aria-label="menu"
          className="mobile-menu fixed inset-0 z-[60] flex flex-col bg-ink px-4 pb-10 pt-4 text-paper md:px-10 md:pb-14 md:pt-6"
        >
          <div className="flex items-center justify-end">
            <button
              type="button"
              className="nav-focus inline-flex h-11 min-w-11 items-center justify-center rounded-full border border-paper/30 px-4 text-sm uppercase tracking-[0.22em]"
              onClick={() => setOpen(false)}
            >
              close
            </button>
          </div>
          <ul className="mt-10 flex flex-col gap-2 md:mt-16">
            {navItems.map((item) => (
              <li key={item.href}>
                {item.href.startsWith('/') ? (
                  <Link to={item.href} className="mobile-menu__link" onClick={(e) => onMenuLink(e, item.href)}>
                    {item.label}
                  </Link>
                ) : (
                  <a href={item.href} className="mobile-menu__link" onClick={(e) => onMenuLink(e, item.href)}>
                    {item.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-auto">
            <InkButton href="/checkout" variant="cherry" onClick={() => setOpen(false)}>
              {copy.nav.buyNow}
            </InkButton>
          </div>
        </div>
      )}
    </>
  )
}
