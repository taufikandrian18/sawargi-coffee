import type { CSSProperties } from 'react'
import { SiteHeader } from '../components/SiteHeader'
import { InkButton } from '../components/ui/InkButton'
import { Link } from '../lib/router'

type Reference = { id: number; text: string; href: string }

/** Every claim in the article points to one of these. Keep numbering stable. */
const REFERENCES: Reference[] = [
  {
    id: 1,
    text: 'Slow Food Foundation, Ark of Taste — "Ciwidey Arabica Coffee" (entry last updated 2018).',
    href: 'https://www.fondazioneslowfood.com/en/ark-of-taste-slow-food/ciwidey-arabica-coffee/'
  },
  {
    id: 2,
    text: 'Preangerstelsel — Wikipedia bahasa Indonesia (tertiary overview of the Priangan forced-coffee system).',
    href: 'https://id.wikipedia.org/wiki/Preangerstelsel'
  },
  {
    id: 3,
    text: 'Covoya Coffee, "Indonesia Java – Gunung Patuha" green-coffee listing (seller-reported farm data).',
    href: 'https://www.covoyacoffee.com/p612700-3-indonesia-java-gunung-patuha.html'
  },
  {
    id: 4,
    text: 'Knopp, S., Bytof, G. & Selmar, D. (2006). Influence of processing on the content of sugars in green Arabica coffee beans. European Food Research and Technology, 223, 195–201.',
    href: 'https://link.springer.com/article/10.1007/s00217-005-0172-1'
  },
  {
    id: 5,
    text: 'Selmar, D. et al. (2006). Germination of coffee seeds and its significance for coffee quality. Plant Biology.',
    href: 'https://onlinelibrary.wiley.com/doi/10.1055/s-2006-923845'
  },
  {
    id: 6,
    text: 'Barista Hustle (2019). "Sugars in Natural Processing" — secondary summary of refs 4, 5, 7 and 8.',
    href: 'https://www.baristahustle.com/sugars-in-natural-processing/'
  },
  {
    id: 7,
    text: 'de Melo Pereira, G. V. et al. (2019). Exploring the impacts of postharvest processing on the aroma formation of coffee beans – A review. Food Chemistry, 272.',
    href: 'https://doi.org/10.1016/j.foodchem.2018.08.061'
  },
  {
    id: 8,
    text: 'Labbe, D. et al. (2007). Subthreshold olfactory stimulation can enhance sweetness. Chemical Senses, 32, 205–214.',
    href: 'https://doi.org/10.1093/chemse/bjl040'
  },
  {
    id: 9,
    text: '"Microbial Characteristics and Functions in Coffee Fermentation: A Review" (2025). Fermentation, 11(1), 5.',
    href: 'https://www.mdpi.com/2311-5637/11/1/5'
  },
  {
    id: 10,
    text: '"The Relationship between Microbial Communities in Coffee Fermentation and Aroma with Metabolite Attributes of Finished Products" (2024), PubMed 39123524.',
    href: 'https://pubmed.ncbi.nlm.nih.gov/39123524/'
  },
  {
    id: 11,
    text: '"Reduction in Ochratoxin A Occurrence in Coffee: From Good Practices to Biocontrol Agents" (2024), review.',
    href: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11355758/'
  },
  {
    id: 12,
    text: '"Ochratoxin A in coffee beans (Coffea arabica L.) processed by dry and wet methods." Food Control.',
    href: 'https://www.sciencedirect.com/science/article/abs/pii/S0956713508002818'
  }
]

function Ref({ n }: { n: number }) {
  return (
    <sup>
      <a href={`#ref-${n}`} aria-label={`source ${n}`}>
        [{n}]
      </a>
    </sup>
  )
}

export const ARTICLE = {
  slug: 'ciwidey-natural',
  title: 'Dried in the Fruit',
  subtitle: 'What natural processing actually does to a Ciwidey coffee — and what it doesn’t.',
  date: '29 September 2026',
  readingTime: '9 min read'
}

export function JournalIndexPage() {
  return (
    <div className="journal-surface min-h-screen bg-paper text-char">
      <SiteHeader current="journal" />
      <main className="mx-auto max-w-5xl px-4 py-16 md:px-8 md:py-24">
        <p className="text-[0.8125rem] font-medium uppercase tracking-[0.22em] text-ink-mut">journal</p>
        <h1 className="display-chapter mt-4">
          Notes from one coffee
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-ink-mut">
          We only roast one coffee, so we can afford to know it properly. This is where we write
          down what we learn — with sources.
        </p>

        <Link
          to={`/journal/${ARTICLE.slug}`}
          className="group mt-14 block border-t border-char/20 py-10 transition-colors hover:border-char"
        >
          <p className="font-plex text-[0.8125rem] uppercase tracking-[0.08em] text-ink-mut">
            {ARTICLE.date} · {ARTICLE.readingTime}
          </p>
          <h2 className="display-step mt-4">
            {ARTICLE.title}
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-ink-mut">{ARTICLE.subtitle}</p>
          <span className="mt-6 inline-block text-sm font-medium uppercase tracking-[0.22em] text-cherry transition-colors group-hover:text-char">
            Read the article →
          </span>
        </Link>
      </main>
    </div>
  )
}

export function JournalArticlePage() {
  return (
    <div className="journal-surface min-h-screen bg-paper text-char">
      <SiteHeader current="journal" />
      <article className="mx-auto max-w-3xl px-4 py-16 md:px-8 md:py-24">
        <header>
          <p className="text-[0.8125rem] font-medium uppercase tracking-[0.22em] text-ink-mut">
            <Link to="/journal" className="underline decoration-cherry/50 underline-offset-4 hover:text-char">
              journal
            </Link>{' '}
            · origin & process
          </p>
          <h1 className="display-chapter mt-5">
            {ARTICLE.title}
          </h1>
          <p className="mt-6 text-xl leading-8 text-char">{ARTICLE.subtitle}</p>
          <p className="mt-6 font-plex text-sm text-ink-mut">
            Sawargi · {ARTICLE.date} · {ARTICLE.readingTime}
          </p>
        </header>

        <div className="journal-prose mt-14 border-t border-char/15 pt-12">
          <p>
            On its own mountain, our coffee is the exception. The Slow Food Foundation’s record of
            Ciwidey arabica says it plainly: most coffee from Ciwidey is{' '}
            <strong>wet processed or semi-washed</strong>.<Ref n={1} /> The fruit comes off soon
            after picking, and the bean is dried clean.
          </p>
          <p>
            A natural goes the other way. The whole cherry — skin, pulp, sticky mucilage and all —
            is laid out to dry with the seed still inside, and only hulled once it’s bone dry. It is
            the oldest way to process coffee and, in a humid highland, the easiest one to get wrong.
            This piece is about why anyone bothers, what the chemistry says is really happening
            inside that drying fruit, and where the evidence runs out.
          </p>

          <h2>Where Ciwidey is, and why it matters</h2>
          <p>
            Ciwidey is a highland town south of Bandung, in the part of West Java the Dutch called
            the Preanger (Priangan). Slow Food places some of the first Dutch coffee plantations
            here, notes that the Dutch East India Company began exporting Indonesian coffee to
            Europe in 1711, and records coffee in Ciwidey grown{' '}
            <strong>above 1,200 metres</strong> on volcanic soils.<Ref n={1} /> From the 1720s the
            company ran the Preangerstelsel, a system that obliged Priangan communities to plant
            coffee and deliver the harvest — part of why “Java” became a word for coffee, and a
            history built on coercion, not romance.<Ref n={2} />
          </p>
          <p>
            Arabica didn’t hold on. Late-19th-century coffee leaf rust pushed much of West Java
            toward more resistant robusta and liberica.<Ref n={1} /> What survives around Ciwidey
            today is small: Slow Food’s entry counts about 315 hectares, only around a fifth of it
            well maintained, with farmers drifting to vegetables.<Ref n={1} /> Green-coffee sellers
            listing lots from the slopes of nearby Gunung Patuha report farms at 1,500–1,800
            metres, growing Ateng-type varieties alongside older Typica.<Ref n={3} /> Treat those
            as seller figures, not survey data.
          </p>
          <p>
            Altitude matters for the same reason everywhere: cooler nights slow ripening. What
            matters specifically for a natural is the other half of highland weather — cloud and
            rain during the weeks the fruit is supposed to be drying.
          </p>

          <h2>The sweetness myth</h2>
          <p>
            The usual story is that a natural tastes sweeter because sugar from the fruit soaks
            into the bean while it dries. It’s a good story. The chemistry doesn’t support it.
          </p>
          <p>
            In 2006, Knopp, Bytof and Selmar measured sugars in green arabica processed different
            ways. Dry-processed (natural) beans did carry{' '}
            <strong>significantly more glucose and fructose</strong> than washed beans — but the
            gap came from washed beans <em>losing</em> those sugars, not naturals gaining them. In
            dry processing, the levels stayed unchanged or rose slightly.<Ref n={4} />
          </p>
          <p>
            The explanation is germination. Coffee seeds have no dormant phase: once the pulp is
            stripped off in washed processing, the seed starts preparing to sprout and burns
            through its simplest sugars first. Left inside the cherry, the seed stays in check
            until drying shuts its metabolism down.<Ref n={5} /> Sucrose — by far the largest sugar
            in the bean — isn’t meaningfully changed by processing either way.<Ref n={6} />
          </p>
          <blockquote>
            A natural isn’t sweeter because it absorbed the fruit. It’s sweeter partly because it
            never started to grow.
          </blockquote>

          <h2>What the fruit does leave behind</h2>
          <p>
            Something does cross from fruit to seed: not sugar, but volatile compounds made by the
            microbes fermenting the pulp. A 2019 review in <em>Food Chemistry</em> describes
            post-harvest processing — including the fermentation inside a drying cherry — as a
            direct driver of aroma formation in the bean.<Ref n={7} /> Esters produced during that
            fermentation can survive roasting and read in the cup as fruit and florals.<Ref n={6} />
          </p>
          <p>
            Some of those aromas also change how sweet coffee <em>tastes</em>. In a 2007 sensory
            study, aroma compounds presented below the level people could consciously smell still
            increased perceived sweetness.<Ref n={8} /> Most sugar itself is destroyed in roasting,
            where it feeds caramelisation — so “sweet” in a natural is largely aroma chemistry
            doing its work.
          </p>

          <h2>A fermentation you don’t control</h2>
          <p>
            A natural is a spontaneous fermentation in a closed container: the cherry skin. Inside,
            enzymes and microbes break down pulp and mucilage while the fruit dries.<Ref n={9} />{' '}
            Studies of dry processing find a crowded community — bacteria such as{' '}
            <em>Enterobacter</em> and <em>Klebsiella</em>, yeasts such as <em>Pichia</em> and{' '}
            <em>Debaryomyces</em>, and filamentous fungi.<Ref n={9} />
          </p>
          <p>
            Which of them win matters. A 2024 study linking fermentation microbes to finished-coffee
            aroma found yeasts and lactic acid bacteria correlated with desirable compounds such as
            linalool and geraniol — floral, citrus-leaning aromatics.<Ref n={10} /> The review
            literature is direct about the other side: fermentation isn’t passive decay, it is an
            active stage of flavour production, and it can go well or badly.<Ref n={9} />
          </p>

          <h2>The price of doing it this way</h2>
          <p>
            Here is the part most product pages skip. Natural coffee dries slower, and slow, damp
            drying is exactly when moulds get their chance.
          </p>
          <ul>
            <li>
              One review of ochratoxin A (OTA) control cites total drying of roughly{' '}
              <strong>12 days for dry-processed coffee versus 7 after wet processing</strong> — a
              longer window for contamination.<Ref n={11} />
            </li>
            <li>
              The same review sets the finish line: coffee should reach{' '}
              <strong>12% moisture or lower</strong> (water activity around 0.60) before storage,
              to stop fermentation and mould growth.<Ref n={11} />
            </li>
            <li>
              A study comparing processing methods found dry-processed beans retained more OTA
              than wet-processed ones.<Ref n={12} />
            </li>
          </ul>
          <p>
            None of this makes naturals unsafe; OTA problems trace back to poorly controlled
            harvesting, drying and storage.<Ref n={11} /> It does help explain why most Ciwidey
            farmers wash their coffee. Where afternoon cloud can roll over a drying bed, a natural
            asks for more attention, more turning, and more rejected lots.
          </p>

          <h2>What to expect in the cup</h2>
          <p>
            Slow Food describes Ciwidey arabica — mostly washed — as rich, smooth, relatively
            full-bodied and fruity, with medium acidity, sweeter and more herbal than arabica from
            East Java.<Ref n={1} /> Natural processing tends to push that toward heavier body and
            riper fruit, for the reasons above.
          </p>
          <p>
            It also pushes variation up. A spontaneous fermentation doesn’t repeat itself
            perfectly, so two batches from the same hillside will not taste identical. That’s why
            we number every batch, print its roast date, and cup and score each one against the
            same benchmark before it ships. If a batch misses, it doesn’t go out. The tasting notes
            on each batch describe that batch — not a promise about the next one.
          </p>

          <h2>Brewing it</h2>
          <p>
            Locally, Ciwidey coffee is traditionally brewed simply: medium-ground coffee straight
            into a mug or glass, hot water on top, then 3–5 minutes for the grounds to settle before
            you sip carefully around the “mud” at the bottom.<Ref n={1} /> It suits a natural’s
            weight. For something cleaner, start a pour-over at about 1 gram of coffee to 15 of
            water and adjust grind and ratio to taste from there.
          </p>

          <h2>Where the evidence runs out</h2>
          <p>
            We looked and found <strong>no peer-reviewed study of natural-processed coffee from
            Ciwidey specifically</strong>. The sugar, aroma and microbiology findings above come
            from arabica processed in other origins; they describe mechanisms, and mechanisms
            travel, but local climate and microbes will shift the details. The regional picture
            leans on a single Slow Food record from 2018 and seller-reported farm figures. If you
            know of better local research, we want to read it.
          </p>
        </div>

        <div className="mt-16 rounded-[2rem] bg-char p-8 text-center text-paper md:p-10" style={{ '--focus-ring': 'var(--paper)' } as CSSProperties}>
          <p className="text-[0.8125rem] font-medium uppercase tracking-[0.22em] text-paper-mut">the coffee in this article</p>
          <p className="display-step mt-3">Ciwidey Natural · 1 kg</p>
          <div className="mt-8">
            <InkButton href="/checkout" variant="cherry">
              Choose a batch
            </InkButton>
          </div>
        </div>

        <section aria-label="sources" className="mt-16 border-t border-char/15 pt-10">
          <h2 className="text-[0.8125rem] font-medium uppercase tracking-[0.22em] text-ink-mut">Sources</h2>
          <ol className="mt-6 space-y-3 text-sm leading-6 text-char">
            {REFERENCES.map((ref) => (
              <li key={ref.id} id={`ref-${ref.id}`} className="scroll-mt-28">
                <span className="mr-2 font-plex font-medium tabular-nums text-cherry">[{ref.id}]</span>
                <a
                  href={ref.href}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-char/25 underline-offset-2 hover:decoration-cherry"
                >
                  {ref.text}
                </a>
              </li>
            ))}
          </ol>
        </section>
      </article>
    </div>
  )
}
