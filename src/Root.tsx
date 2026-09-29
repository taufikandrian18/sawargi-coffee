import App from './App'
import { usePathname } from './lib/router'
import { CheckoutPage } from './pages/CheckoutPage'
import { ARTICLE, JournalArticlePage, JournalIndexPage } from './pages/JournalPage'

export function Root() {
  const pathname = usePathname().replace(/\/+$/, '') || '/'

  if (pathname === '/checkout') return <CheckoutPage />
  if (pathname === '/journal') return <JournalIndexPage />
  if (pathname === `/journal/${ARTICLE.slug}`) return <JournalArticlePage />
  return <App />
}
