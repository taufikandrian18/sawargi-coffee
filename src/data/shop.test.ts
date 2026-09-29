import { BATCHES, PRODUCT, calcTotals, formatMoney, maxQuantityFor } from './shop'

describe('shop pricing', () => {
  it('prices one 1 kg bag at Rp150.000', () => {
    expect(PRODUCT.priceIdr).toBe(150_000)
    expect(formatMoney(150_000, 'IDR')).toMatch(/Rp\s?150\.000/)
  })

  it('charges shipping below the free-shipping threshold and waives regular shipping above it', () => {
    expect(calcTotals(1, 'regular')).toMatchObject({ subtotal: 150_000, shipping: 20_000, total: 170_000 })
    expect(calcTotals(3, 'regular')).toMatchObject({ shipping: 0, freeShipping: true, total: 450_000 })
    expect(calcTotals(3, 'express')).toMatchObject({ shipping: 35_000, total: 485_000 })
  })

  it('converts IDR into display currencies', () => {
    expect(formatMoney(179_500, 'USD')).toBe('$10.00')
  })

  it('caps quantity at the bags left in a batch', () => {
    const lowStock = BATCHES.find((b) => b.bagsLeft > 0 && b.bagsLeft < 10)!
    expect(maxQuantityFor(lowStock)).toBe(lowStock.bagsLeft)
  })
})
