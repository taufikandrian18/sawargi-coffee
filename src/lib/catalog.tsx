import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import type { Catalog } from '../data/catalog'
import { STATIC_CATALOG, fetchWooCatalog } from '../data/catalog'
import type { CatalogState } from './useCatalog'
import { CatalogContext } from './useCatalog'

/** An empty catalogue for a store that hasn't answered yet: never show sample stock as if it were real. */
const emptyStoreCatalog = (storeUrl: string): Catalog => ({
  ...STATIC_CATALOG,
  source: 'woocommerce',
  storeUrl,
  batches: []
})

type CatalogProviderProps = {
  children: ReactNode
  /** WooCommerce site URL. Defaults to VITE_WC_URL; empty means the static sample catalogue. */
  storeUrl?: string
  /** Injected in tests. */
  fetchImpl?: typeof fetch
}

export function CatalogProvider({ children, storeUrl = import.meta.env.VITE_WC_URL ?? '', fetchImpl }: CatalogProviderProps) {
  const [state, setState] = useState<CatalogState>(() =>
    storeUrl ? { status: 'loading', catalog: emptyStoreCatalog(storeUrl) } : { status: 'ready', catalog: STATIC_CATALOG }
  )

  useEffect(() => {
    if (!storeUrl) return
    let cancelled = false
    fetchWooCatalog(storeUrl, fetchImpl)
      .then((catalog) => {
        if (!cancelled) setState({ status: 'ready', catalog })
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setState({
            status: 'error',
            catalog: emptyStoreCatalog(storeUrl),
            error: error instanceof Error ? error.message : String(error)
          })
      })
    return () => {
      cancelled = true
    }
  }, [storeUrl, fetchImpl])

  return <CatalogContext.Provider value={state}>{children}</CatalogContext.Provider>
}
