import type { AnchorHTMLAttributes, MouseEvent } from 'react'
import { useEffect, useState } from 'react'
import { jumpToTop } from './smoothScroll'

/**
 * Minimal pushState router. The site has three routes, so a full router
 * dependency isn't worth it. Production hosting must rewrite unknown paths
 * to /index.html (SPA fallback) for deep links like /checkout to work.
 */
const NAVIGATE_EVENT = 'sawargi:navigate'

export function navigate(to: string) {
  if (to === window.location.pathname + window.location.hash) return
  window.history.pushState({}, '', to)
  window.dispatchEvent(new Event(NAVIGATE_EVENT))
  if (!to.includes('#')) jumpToTop()
}

export function usePathname() {
  const [pathname, setPathname] = useState(() => window.location.pathname)

  useEffect(() => {
    const update = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', update)
    window.addEventListener(NAVIGATE_EVENT, update)
    return () => {
      window.removeEventListener('popstate', update)
      window.removeEventListener(NAVIGATE_EVENT, update)
    }
  }, [])

  return pathname
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }

export function Link({ to, onClick, ...rest }: LinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }
    event.preventDefault()
    navigate(to)
  }

  return <a href={to} onClick={handleClick} {...rest} />
}
