import products from './__fixtures__/storeApiProducts.json'
import type { StoreApiProduct } from './catalog'
import { STATIC_CATALOG, catalogFromStoreApi, fetchWooCatalog, matchGrind, priceFromStoreApi, wooCheckoutUrl } from './catalog'

const fixture = products as StoreApiProduct[]

describe('WooCommerce Store API → catalogue', () => {
  it('maps each batch product, newest roast first, and skips non-batch products', () => {
    const catalog = catalogFromStoreApi(fixture, 'https://shop.example.com')

    expect(catalog.source).toBe('woocommerce')
    expect(catalog.batches.map((b) => b.code)).toEqual(['SWG-CN-015', 'SWG-CN-014'])
    const [current, soldOut] = catalog.batches
    expect(current).toMatchObject({
      roastDate: '2026-10-02',
      harvest: '2026 main crop',
      cupScore: 86,
      bagsTotal: 60,
      bagsLeft: 41,
      priceIdr: 165000,
      productId: 101,
      notes: ['jackfruit', 'palm sugar', 'cacao nib']
    })
    expect(current.grinds.map((g) => [g.id, g.variationId])).toEqual([
      ['whole', 1011],
      ['coarse', 1012],
      ['medium', 1013],
      ['fine', 1014]
    ])
    // Out of stock in WooCommerce wins over any stale meta.
    expect(soldOut.bagsLeft).toBe(0)
    expect(catalog.product.priceIdr).toBe(165000)
  })

  it('reads prices in minor units and refuses a non-IDR store', () => {
    expect(priceFromStoreApi({ price: '16500000', currency_code: 'IDR', currency_minor_unit: 2 })).toBe(165000)
    expect(() => priceFromStoreApi({ price: '1000', currency_code: 'USD', currency_minor_unit: 2 })).toThrow(/IDR/)
  })

  it('matches grind names written a few different ways', () => {
    expect(matchGrind('Whole bean')?.id).toBe('whole')
    expect(matchGrind('whole-bean')?.id).toBe('whole')
    expect(matchGrind('Medium')?.id).toBe('medium')
    expect(matchGrind('espresso')).toBeUndefined()
  })

  it('fetches the batch category from the Store API and fails loudly on errors', async () => {
    const ok = vi.fn().mockResolvedValue({ ok: true, json: async () => fixture })
    const catalog = await fetchWooCatalog('https://shop.example.com/', ok as unknown as typeof fetch)

    expect(ok.mock.calls[0][0]).toBe(
      'https://shop.example.com/wp-json/wc/store/v1/products?category=batch&per_page=50&orderby=date&order=desc'
    )
    expect(catalog.storeUrl).toBe('https://shop.example.com')

    const down = vi.fn().mockResolvedValue({ ok: false, status: 502 })
    await expect(fetchWooCatalog('https://shop.example.com', down as unknown as typeof fetch)).rejects.toThrow('502')
  })

  it('hands off to the WooCommerce checkout with the chosen grind in the cart', () => {
    expect(wooCheckoutUrl('https://shop.example.com/', 1012, 3)).toBe(
      'https://shop.example.com/checkout/?add-to-cart=1012&quantity=3'
    )
  })

  it('keeps the sample catalogue for local dev and tests', () => {
    expect(STATIC_CATALOG.source).toBe('static')
    expect(STATIC_CATALOG.batches[0].grinds).toHaveLength(4)
  })
})
