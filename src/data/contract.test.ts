import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import type { StoreApiProduct } from './catalog'
import { batchFromStoreApi } from './catalog'

/**
 * Contract test between the WordPress plugin and this site: run the plugin's
 * real Store API data callback (with WordPress stubbed) and feed its JSON
 * through the site's mapper. Skipped where PHP isn't installed.
 */
const harness = resolve(__dirname, '../../wordpress/tests/store-api-harness.php')
const php = spawnSync('php', ['-v'])
const hasPhp = php.status === 0

describe.skipIf(!hasPhp)('WordPress plugin ↔ site contract', () => {
  const run = () => {
    const result = spawnSync('php', [harness], { encoding: 'utf8' })
    expect(result.status, result.stderr).toBe(0)
    return JSON.parse(result.stdout) as { data: NonNullable<StoreApiProduct['extensions']>['sawargi'][] }
  }
  const asProduct = (sawargi: NonNullable<StoreApiProduct['extensions']>['sawargi'], inStock = true): StoreApiProduct => ({
    id: 1,
    name: 'x',
    sku: sawargi?.batch_code ?? '',
    is_in_stock: inStock,
    prices: { price: '150000', currency_code: 'IDR', currency_minor_unit: 0 },
    variations: [{ id: 11, attributes: [{ name: 'Grind', value: 'whole-bean' }] }],
    extensions: { sawargi }
  })

  it('maps a fully filled batch from the plugin into a site batch', () => {
    const [full] = run().data
    expect(batchFromStoreApi(asProduct(full))).toMatchObject({
      code: 'SWG-CN-015',
      roastDate: '2026-10-02',
      cupScore: 86,
      notes: ['jackfruit', 'palm sugar', 'cacao nib'],
      bagsTotal: 60,
      bagsLeft: 41
    })
  })

  it('keeps a batch with missing optional fields, and clamps negative stock', () => {
    const [, sparse] = run().data
    expect(batchFromStoreApi(asProduct(sparse, false))).toMatchObject({ code: 'SWG-CN-014', bagsLeft: 0, bagsTotal: 0, notes: [] })
  })

  it('skips a product without a roast date or managed stock instead of guessing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const [, , unmanaged] = run().data
    expect(batchFromStoreApi(asProduct(unmanaged))).toBeNull()
    expect(batchFromStoreApi(asProduct({ ...unmanaged, roast_date: '2026-10-01' }))).toBeNull()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Manage stock'))
    warn.mockRestore()
  })
})
