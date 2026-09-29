import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { BATCHES, formatRoastDate } from '../data/shop'
import { copy, navItems } from './copy'

// BRIEF §5, verbatim. Duplicated on purpose: if copy.ts drifts, this list catches it.
const LOCKED_COPY = [
  'story',
  'one roast',
  'process',
  'order',
  'journal',
  'Buy Now',
  'Quietly',
  'Roasted',
  'Never',
  'Rushed',
  'our story',
  'Born When the Cafes Went Quiet',
  "Before 2020, coffee in Bandung wasn't something you drank alone - it was something you did with people. A cup outside, a bit of time, a few friends.",
  'Then the streets emptied and bean prices collapsed. We had time, cheap beans, and no excuse left, so we learned the process one failed cup at a time.',
  "Sawargi started with that refusal to serve anything we wouldn't drink ourselves. That habit is why every batch still has to earn the name.",
  'why just one',
  'Master One Coffee Completely',
  'Most coffee brands spread thin across a dozen blends, hoping one sticks. We never had that luxury, so mastering one coffee became the standard we kept on purpose.',
  'Every harvest. Every roast. Every bag. Held to the same standard - refined, never replaced.',
  "tasted before it's trusted",
  'Cupped, Scored, Then Released',
  "We roast by hand in a small pan, a little at a time, and never hurry the heat. Then every roast is cupped and scored against our own benchmark: body, acidity, sweetness, finish. If it misses the profile, it doesn't ship.",
  'Every batch cupped. Every batch scored. Every batch dated.',
  'clean hands, careful process',
  'Care Starts Before the Cup',
  "It starts at the cherry. Ciwidey Natural dries whole, fruit still on the bean, and from drying to packing our rule doesn't change: nothing touches your coffee that wouldn't touch our own cup.",
  'proof, not promises',
  'Freshness You Can Audit',
  'Everything we just told you is printed on the bag in your hand.',
  'Roast date printed on every bag',
  'Batch number for full traceability',
  'One-way valve packaging to lock in aroma',
  'the scarcity angle',
  'No New Flavor to Hide Behind',
  "We don't launch a new flavor every season. When this batch sells out, the next one waits for proof, not a deadline.",
  'call to action',
  'Bring the Table Back',
  'The pandemic took the cup we used to share with friends. This is the one we built to bring it back - cupped, dated, and roasted the same unhurried way since the year cheap beans were all we had.',
  'Order This Batch',
  "Small batch. Fully traceable. Cupped before it's sold. Best enjoyed with someone else in the room."
]

function collectStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(collectStrings)
  if (value && typeof value === 'object') return Object.values(value).flatMap(collectStrings)
  return []
}

const normalise = (text: string) => text.replace(/\s+/g, ' ').trim()

describe('locked copy (BRIEF §5)', () => {
  it('copy map holds exactly the verbatim strings', () => {
    const fromMap = [...navItems.map((item) => item.label), ...collectStrings(copy)]

    expect([...fromMap].sort()).toEqual([...LOCKED_COPY].sort())
  })

  it('renders every locked string on the home page (nav labels via the menu)', async () => {
    render(<App />)
    // Section links live in the menu, so open it before reading the page.
    await userEvent.setup().click(screen.getByRole('button', { name: 'menu' }))
    const pageText = normalise(document.body.textContent ?? '')

    for (const text of LOCKED_COPY) {
      expect(pageText, `missing on /: "${text}"`).toContain(text)
    }
  })

  it('renders the data-driven batch line with the verbatim template', () => {
    render(<App />)
    const batch = BATCHES.find((b) => b.bagsLeft > 0)
    expect(batch).toBeDefined()
    if (!batch) return

    const expected = `Batch ${batch.code} roasted ${formatRoastDate(batch.roastDate)}. Limited to ${batch.bagsTotal} bags — ${batch.bagsLeft} left.`

    expect(copy.cta.meta({
      code: batch.code,
      date: formatRoastDate(batch.roastDate),
      total: batch.bagsTotal,
      left: batch.bagsLeft
    })).toBe(expected)
    expect(normalise(document.body.textContent ?? '')).toContain(expected)
  })
})

describe('cut copy (BRIEF §9)', () => {
  it('no longer renders the unfinished "[X] days" proof item (D2)', () => {
    render(<App />)
    expect(document.body.textContent).not.toContain('[X]')
  })
})
