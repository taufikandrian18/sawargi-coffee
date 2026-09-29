/**
 * The catalogue the site renders: product facts, batches with live stock, and
 * the grind options each batch can be bought in.
 *
 * Two sources, same shape:
 * - `static`: the sample data in ./shop.ts (local dev, tests, and the demo
 *   checkout). Used when VITE_WC_URL is not set.
 * - `woocommerce`: a WordPress + WooCommerce store, read from its public
 *   Store API (no keys in the browser). Batch facts come from the
 *   `extensions.sawargi` block added by wordpress/sawargi-headless.php.
 *   See docs/cms/WORDPRESS.md.
 */
import type { Batch, GrindId } from './shop'
import { BATCHES, GRINDS, PRODUCT } from './shop'

export type CatalogSource = 'static' | 'woocommerce'

export type ProductInfo = {
  name: string
  origin: string
  process: string
  sizeLabel: string
  priceIdr: number
}

/** A grind this batch can be bought in. `variationId` is set for WooCommerce batches. */
export type BatchGrind = { id: GrindId; label: string; hint: string; variationId?: number }

export type CatalogBatch = Batch & {
  priceIdr: number
  grinds: BatchGrind[]
  /** WooCommerce product id (the batch), for building the checkout hand-off. */
  productId?: number
}

export type Catalog = {
  source: CatalogSource
  product: ProductInfo
  batches: CatalogBatch[]
  /** Where WooCommerce lives, for the checkout hand-off. Only for `woocommerce`. */
  storeUrl?: string
}

export const STATIC_CATALOG: Catalog = {
  source: 'static',
  product: { ...PRODUCT },
  batches: BATCHES.map((batch) => ({ ...batch, priceIdr: PRODUCT.priceIdr, grinds: GRINDS.map((g) => ({ ...g })) }))
}

/* ------------------------------------------------------------------ */
/* WooCommerce Store API → Catalog                                     */
/* ------------------------------------------------------------------ */

/** The parts of a Store API product (`/wp-json/wc/store/v1/products`) this site reads. */
export type StoreApiProduct = {
  id: number
  name: string
  sku: string
  is_in_stock: boolean
  prices: { price: string; currency_code: string; currency_minor_unit: number }
  variations: { id: number; attributes: { name: string; value: string }[] }[]
  extensions?: {
    sawargi?: {
      batch_code?: string
      roast_date?: string
      harvest?: string
      cup_score?: number | string
      tasting_notes?: string[]
      bags_total?: number | string
      bags_left?: number | string | null
      origin?: string
      process?: string
      size_label?: string
    }
  }
}

const toNumber = (value: unknown, fallback = 0) => {
  const n = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''))
  return Number.isFinite(n) ? n : fallback
}

/** Match a WooCommerce grind value ("Whole bean", "whole-bean", "coarse") to a site grind. */
export function matchGrind(value: string): (typeof GRINDS)[number] | undefined {
  const v = value.toLowerCase()
  return GRINDS.find((g) => v.startsWith(g.id) || v === g.label.toLowerCase() || v.includes(g.id))
}

export function priceFromStoreApi(prices: StoreApiProduct['prices']) {
  if (prices.currency_code && prices.currency_code !== 'IDR') {
    throw new Error(`Store currency is ${prices.currency_code}; this site prices in IDR.`)
  }
  return toNumber(prices.price) / 10 ** toNumber(prices.currency_minor_unit)
}

/** One Store API product (a batch) → a site batch. Returns null if it isn't a Sawargi batch. */
export function batchFromStoreApi(product: StoreApiProduct): CatalogBatch | null {
  const meta = product.extensions?.sawargi
  const code = meta?.batch_code || product.sku
  if (!meta || !code || !meta.roast_date) return null

  // Stock must be managed on the product in WooCommerce; without it there's no honest count to show.
  if (meta.bags_left === null || meta.bags_left === undefined || meta.bags_left === '') {
    console.warn(`Sawargi: batch ${code} has no stock count. Turn on "Manage stock" for it in WooCommerce.`)
    return null
  }
  const bagsLeft = product.is_in_stock ? Math.max(0, Math.floor(toNumber(meta.bags_left))) : 0
  const grinds: BatchGrind[] = []
  for (const variation of product.variations) {
    const attribute = variation.attributes.find((a) => /grind/i.test(a.name)) ?? variation.attributes[0]
    const grind = attribute && matchGrind(attribute.value)
    if (grind && !grinds.some((g) => g.id === grind.id)) grinds.push({ ...grind, variationId: variation.id })
  }

  return {
    code,
    roastDate: meta.roast_date,
    harvest: meta.harvest ?? '',
    bagsTotal: Math.max(bagsLeft, Math.floor(toNumber(meta.bags_total, bagsLeft))),
    bagsLeft,
    cupScore: toNumber(meta.cup_score),
    notes: (meta.tasting_notes ?? []).filter(Boolean),
    priceIdr: priceFromStoreApi(product.prices),
    grinds,
    productId: product.id
  }
}

/** Newest roast first, like the static data. */
const byRoastDateDesc = (a: CatalogBatch, b: CatalogBatch) => b.roastDate.localeCompare(a.roastDate)

export function catalogFromStoreApi(products: StoreApiProduct[], storeUrl: string): Catalog {
  const batches = products.map(batchFromStoreApi).filter((b): b is CatalogBatch => b !== null).sort(byRoastDateDesc)
  const first = products.find((p) => p.extensions?.sawargi)?.extensions?.sawargi
  const current = batches.find((b) => b.bagsLeft > 0) ?? batches[0]
  return {
    source: 'woocommerce',
    storeUrl,
    batches,
    product: {
      name: PRODUCT.name,
      origin: first?.origin || PRODUCT.origin,
      process: first?.process || PRODUCT.process,
      sizeLabel: first?.size_label || PRODUCT.sizeLabel,
      priceIdr: current?.priceIdr ?? PRODUCT.priceIdr
    }
  }
}

/** Category slug the batches live in on WooCommerce (see docs/cms/WORDPRESS.md). */
export const BATCH_CATEGORY = 'batch'

export async function fetchWooCatalog(storeUrl: string, fetchImpl: typeof fetch = fetch): Promise<Catalog> {
  const base = storeUrl.replace(/\/+$/, '')
  const url = `${base}/wp-json/wc/store/v1/products?category=${BATCH_CATEGORY}&per_page=50&orderby=date&order=desc`
  const response = await fetchImpl(url, { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Store API responded ${response.status}`)
  const products = (await response.json()) as StoreApiProduct[]
  if (!Array.isArray(products)) throw new Error('Store API returned an unexpected shape')
  return catalogFromStoreApi(products, base)
}

/**
 * Where WooCommerce takes over: its own checkout page, with the chosen grind
 * (a variation) added to the cart on the store's domain. Payment plugins
 * (Midtrans, Xendit, …) all run on this page.
 */
export function wooCheckoutUrl(storeUrl: string, variationId: number, quantity: number) {
  const base = storeUrl.replace(/\/+$/, '')
  const params = new URLSearchParams({ 'add-to-cart': String(variationId), quantity: String(quantity) })
  return `${base}/checkout/?${params.toString()}`
}
