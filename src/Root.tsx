import { lazy, Suspense } from 'react'
import App from './App'
import { CursorDot } from './components/ui/CursorDot'
import { Grain } from './components/ui/Grain'
import { CatalogProvider } from './lib/catalog'
import { usePathname } from './lib/router'
import { useSmoothScroll } from './lib/smoothScroll'
import { CheckoutPage } from './pages/CheckoutPage'
import { ARTICLE, JournalArticlePage, JournalIndexPage } from './pages/JournalPage'

// Dev-only gallery for eyeballing the redesign primitives. Vite replaces
// import.meta.env.DEV with false in production, so this chunk never ships.
const PrimitivesPage = import.meta.env.DEV ? lazy(() => import('./pages/PrimitivesPage')) : null

function Page({ pathname }: { pathname: string }) {
  if (pathname === '/checkout') return <CheckoutPage />
  if (pathname === '/journal') return <JournalIndexPage />
  if (pathname === `/journal/${ARTICLE.slug}`) return <JournalArticlePage />
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
