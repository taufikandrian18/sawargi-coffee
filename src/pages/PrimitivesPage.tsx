import { copy } from '../content/copy'
import { BATCHES } from '../data/shop'
import { InkButton } from '../components/ui/InkButton'
import { PaperEdge } from '../components/ui/PaperEdge'
import { SplitReveal } from '../components/ui/SplitReveal'
import { Wiggle } from '../components/ui/Wiggle'

/**
 * Dev-only gallery (/__primitives) for reviewing the redesign primitives in a
 * browser before they land on real pages. Uses locked copy only; the small
 * labels naming each component are internal.
 */

const label = 'font-plex text-xs uppercase tracking-[0.22em] opacity-70'
const display = 'font-display font-extrabold uppercase leading-[0.9] tracking-[0.01em]'

export default function PrimitivesPage() {
  const [pullLead] = copy.one.pull.split(' Held')

  return (
    <main className="min-h-screen bg-ink text-paper">
      <section className="px-4 pb-24 pt-28 md:px-10">
        <p className={label}>SplitReveal · hero scale · wiggle on one word</p>
        <SplitReveal
          as="h1"
          text={`${copy.hero.line2.thin} ${copy.hero.line2.bold}`}
          wiggle={[copy.hero.line2.thin]}
          className={`${display} mt-6 text-[clamp(4rem,13vw,13rem)]`}
        />
        <p className={`${label} mt-16`}>SplitReveal · chapter scale</p>
        <SplitReveal text={copy.cta.title} className={`${display} mt-6 text-[clamp(3.5rem,9vw,9rem)]`} />
        <div className="mt-16 flex flex-wrap items-center gap-6">
          <InkButton href="/checkout">{copy.cta.button}</InkButton>
          <InkButton href="/checkout" variant="cherry">
            {copy.nav.buyNow}
          </InkButton>
          <InkButton onClick={() => undefined}>{copy.cta.button}</InkButton>
        </div>
        <p className="mt-6 max-w-xl text-paper-mut">{copy.proof.items[1]}</p>
      </section>

      <div style={{ ['--focus-ring' as string]: 'var(--char)' }}>
        <PaperEdge side="top" />
        <section className="bg-paper px-4 py-24 text-char md:px-10">
          <p className={label}>Cream band · PaperEdge top and bottom</p>
          <SplitReveal text={copy.one.title} className={`${display} mt-6 text-[clamp(3.5rem,9vw,9rem)]`} />
          <p className="mt-10 max-w-2xl text-lg leading-8">{copy.one.p1}</p>
          <p className="mt-8 font-display text-4xl font-bold uppercase leading-none md:text-6xl">
            <Wiggle text={pullLead} />
          </p>
          <p className="mt-6 max-w-2xl text-ink-mut">{copy.one.pull}</p>
          <div className="mt-12 flex flex-wrap gap-6">
            <InkButton href="/checkout" variant="cherry">
              {copy.cta.button}
            </InkButton>
          </div>
        </section>
        <PaperEdge side="bottom" />
      </div>

      <section className="px-4 py-32 md:px-10">
        <p className={label}>Batch data face · IBM Plex Mono</p>
        <p className="mt-6 font-plex text-3xl text-paper">
          {BATCHES[0].code} · {BATCHES[0].cupScore}
        </p>
      </section>
    </main>
  )
}
