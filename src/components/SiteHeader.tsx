import { Link } from '../lib/router'

/** Header for sub-pages (checkout, journal). The home page keeps its own nav. */
export function SiteHeader({ current }: { current?: 'journal' | 'checkout' }) {
  const linkClass = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm transition-colors ${
      active ? 'bg-white/10 text-white' : 'text-neutral-400 hover:text-white'
    }`

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
        <Link
          to="/"
          aria-label="sawargi home"
          className="flex min-h-11 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        >
          <span className="sawargi-composite-logo flex items-center">
            <img
              src="/brand/sawargi-mark-white-cropped.png"
              alt=""
              className="h-7 w-7 shrink-0 object-contain"
            />
            <img
              src="/brand/sawargi-wordmark-white-cropped.png"
              alt=""
              className="h-[1.125rem] w-auto object-contain"
            />
          </span>
        </Link>
        <nav aria-label="site" className="flex items-center gap-1">
          <Link to="/journal" className={linkClass(current === 'journal')}>
            journal
          </Link>
          <Link to="/checkout" className={linkClass(current === 'checkout')}>
            checkout
          </Link>
        </nav>
      </div>
    </header>
  )
}
