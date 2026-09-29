/**
 * Home page copy. LOCKED: these strings are verbatim marketing copy
 * (docs/redesign/BRIEF.md §5). Layout may change; the words may not.
 * Ask Taufik before editing any string here — `copy.test.tsx` pins them.
 */

export const navItems = [
  { label: 'story', href: '#story' },
  { label: 'one roast', href: '#why-one' },
  { label: 'process', href: '#process' },
  { label: 'order', href: '#order' },
  { label: 'journal', href: '/journal' }
] as const

export const copy = {
  nav: {
    buyNow: 'Buy Now'
  },
  hero: {
    // BRIEF §9 D1: was "Quitely" (typo); Taufik approved "Quietly" on 29 Sep 2026.
    line1: { thin: 'Quietly', bold: 'Roasted' },
    line2: { thin: 'Never', bold: 'Rushed' }
  },
  story: {
    eyebrow: 'our story',
    title: 'Born When the Cafes Went Quiet',
    paragraphs: [
      "Before 2020, coffee in Bandung wasn't something you drank alone - it was something you did with people. A cup outside, a bit of time, a few friends.",
      'Then the streets emptied and bean prices collapsed. We had time, cheap beans, and no excuse left, so we learned the process one failed cup at a time.',
      "Sawargi started with that refusal to serve anything we wouldn't drink ourselves. That habit is why every batch still has to earn the name."
    ]
  },
  one: {
    eyebrow: 'why just one',
    title: 'Master One Coffee Completely',
    p1: 'Most coffee brands spread thin across a dozen blends, hoping one sticks. We never had that luxury, so mastering one coffee became the standard we kept on purpose.',
    pull: 'Every harvest. Every roast. Every bag. Held to the same standard - refined, never replaced.'
  },
  process: {
    eyebrow: "tasted before it's trusted",
    title: 'Cupped, Scored, Then Released',
    p1: "Before any batch leaves our roastery, it's cupped and scored against our own benchmark: body, acidity, sweetness, finish. If it misses the profile, it doesn't ship.",
    pull: 'Every batch cupped. Every batch scored. Every batch dated.'
  },
  clean: {
    eyebrow: 'clean hands, careful process',
    title: 'Care Starts Before the Cup',
    p1: "From drying to packing, our process runs on one rule: nothing touches your coffee that wouldn't touch our own cup. Sanitized equipment, sealed packaging, and a facility standard we don't negotiate on."
  },
  proof: {
    eyebrow: 'proof, not promises',
    title: 'Freshness You Can Audit',
    // BRIEF §9 D2: "[X]" is a placeholder Taufik still has to fill in.
    items: [
      'Roast date printed on every bag',
      'Batch number for full traceability',
      'One-way valve packaging to lock in aroma',
      'Best enjoyed within [X] days of roast'
    ]
  },
  scarcity: {
    // BRIEF §9 D3: eyebrow reads like an internal label; kept verbatim.
    eyebrow: 'the scarcity angle',
    title: 'No New Flavor to Hide Behind',
    p1: "We don't launch a new flavor every season. When this batch sells out, the next one waits for proof, not a deadline."
  },
  cta: {
    // BRIEF §9 D3: eyebrow reads like an internal label; kept verbatim.
    eyebrow: 'call to action',
    title: 'Bring the Table Back',
    p1: 'The pandemic took the cup we used to share with friends. This is the one we built to bring it back - cupped, dated, and roasted the same unhurried way since the year cheap beans were all we had.',
    button: 'Order This Batch',
    meta: (batch: { code: string; date: string; total: number; left: number }) =>
      `Batch ${batch.code} roasted ${batch.date}. Limited to ${batch.total} bags — ${batch.left} left.`
  },
  footer:
    "Small batch. Fully traceable. Cupped before it's sold. Best enjoyed with someone else in the room."
} as const
