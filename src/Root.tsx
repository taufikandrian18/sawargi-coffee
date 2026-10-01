import { lazy, Suspense } from 'react'
import App from './App'
import { CursorDot } from './components/ui/CursorDot'
import { Grain } from './components/ui/Grain'
import { CatalogProvider } from './lib/catalog'
import { usePathname } from './lib/router'
import { useSmoothScroll } from './lib/smoothScroll'
import { CheckoutPage } from './pages/CheckoutPage'
import { OrderReceivedPage } from './pages/OrderReceivedPage'
import { ARTICLE, JournalArticlePage, JournalIndexPage, WordPressArticlePage } from './pages/JournalPage'

// Dev-only gallery for eyeballing the redesign primitives. Vite replaces
// import.meta.env.DEV with false in production, so this chunk never ships.
const PrimitivesPage = import.meta.env.DEV ? lazy(() => import('./pages/PrimitivesPage')) : null

// WordPress slugs are ASCII unless a title has accents; those arrive percent-encoded.
function safeDecode(segment: string) {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

function Page({ pathname }: { pathname: string }) {
  if (pathname === '/checkout') return <CheckoutPage />
  if (pathname === '/order-received') return <OrderReceivedPage />
  if (pathname === '/journal') return <JournalIndexPage />
  if (pathname === `/journal/${ARTICLE.slug}`) return <JournalArticlePage />
  const post = /^\/journal\/([^/]+)$/.exec(pathname)
  if (post) {
    const slug = safeDecode(post[1])
    return <WordPressArticlePage key={slug} slug={slug} />
  }
  if (PrimitivesPage && pathname === '/__primitives') {
    return (
      <Suspense fallback={null}>
        <PrimitivesPage />
      </Suspense>
    )
  }
  return <App />
}

export function Root() {
  const pathname = usePathname().replace(/\/+$/, '') || '/'
  useSmoothScroll()

  return (
    <CatalogProvider>
      <Page pathname={pathname} />
      <Grain />
      <CursorDot />
    </CatalogProvider>
  )
}
