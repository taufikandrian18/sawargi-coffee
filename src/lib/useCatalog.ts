import { createContext, useContext } from 'react'
import type { Catalog } from '../data/catalog'
import { STATIC_CATALOG } from '../data/catalog'

export type CatalogState =
  | { status: 'ready'; catalog: Catalog }
  | { status: 'loading'; catalog: Catalog }
  | { status: 'error'; catalog: Catalog; error: string }

export const CatalogContext = createContext<CatalogState>({ status: 'ready', catalog: STATIC_CATALOG })

export function useCatalog() {
  return useContext(CatalogContext)
}

/** The batch the site sells right now: the newest one with stock. */
export function useCurrentBatch() {
  const { catalog } = useCatalog()
  return catalog.batches.find((b) => b.bagsLeft > 0)
}
