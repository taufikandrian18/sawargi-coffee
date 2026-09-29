import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Guards BRIEF §0.5: under reduced motion every animated element renders its final state.
// A broken CSS edit once deleted this block without failing anything else.
const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8')
const block = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'))

describe('reduced-motion CSS', () => {
  it.each(['.sw-wiggle', '.sr-word', '.bean-drift', "[data-section-panel='hero']"])('pins %s to its final state', (selector) => {
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(block).toContain(selector)
  })
})
