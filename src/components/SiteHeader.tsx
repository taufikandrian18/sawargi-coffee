import { asset } from '../lib/basePath'
import { Link } from '../lib/router'

/** Header for sub-pages (checkout, journal). The home page keeps its own nav. */
export function SiteHeader({ current }: { current?: 'journal' | 'checkout' }) {
  const linkClass = (active: boolean) =>
    `nav-focus rounded-full px-4 py-2 text-sm transition-colors ${
      active
        ? 'text-paper underline decoration-cherry decoration-2 underline-offset-8'
        : 'text-paper-mut hover:text-paper'
    }`

  return (
    <header
      className="sticky top-0 z-40 border-b border-paper/10 bg-ink/90 text-paper backdrop-blur"
      style={{ ['--focus-ring' as string]: 'var(--paper)' }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
        <Link to="/" aria-label="sawargi home" className="nav-focus flex min-h-11 items-center">
          <span className="sawargi-composite-logo flex items-center">
            <img
              src={asset('/brand/sawargi-mark-white-cropped.png')}
              alt=""
              className="h-7 w-7 shrink-0 object-contain"
            />
            <img
              src={asset('/brand/sawargi-wordmark-white-cropped.png')}
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
