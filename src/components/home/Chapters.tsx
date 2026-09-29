import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { copy } from '../../content/copy'
import type { Batch } from '../../data/shop'
import { formatRoastDate } from '../../data/shop'
import { checkoutHref } from '../../lib/batchLink'
import { useCatalog } from '../../lib/useCatalog'
import { Link } from '../../lib/router'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { ARTICLE } from '../../pages/JournalPage'
import { BatchTicket } from '../BatchTicket'
import { InkButton } from '../ui/InkButton'
import { Marquee } from '../ui/Marquee'
import { PaperEdge } from '../ui/PaperEdge'
import { SplitReveal } from '../ui/SplitReveal'
import { Wiggle } from '../ui/Wiggle'
import { MiniCta } from './MiniCta'
import { asset } from '../../lib/basePath'

/*
 * Home page chapters (BRIEF §6). Dark bands let the scrub video show through;
 * cream bands cover it (the scrub keeps running underneath). Every chapter
 * keeps data-video-section so scrub progress still spans the whole page.
 */

gsap.registerPlugin(ScrollTrigger)

const PIN_QUERY = '(min-width: 768px) and (prefers-reduced-motion: no-preference)'

const eyebrow = 'text-[0.8125rem] font-medium uppercase tracking-[0.22em]'
const chapterTitle = 'display-chapter mt-5'

/** Cream band with torn edges. Opaque, so the video is hidden behind it. */
function CreamBand({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      data-nav-tone="light"
      className={`relative z-10 ${className}`}
      style={{ '--focus-ring': 'var(--char)' } as CSSProperties}
    >
      <PaperEdge side="top" />
      <div className="bg-paper text-char">{children}</div>
      <PaperEdge side="bottom" />
    </div>
  )
}

/**
 * §6.1 Proof band: a marquee of the proof items and the batch tickets.
 * Tickets here are display-only (no links) because the ticker moves.
 */
export function ProofBand() {
  const { catalog } = useCatalog()
  const texts = copy.proof.items.map((item) => (
    <span key={item} className="marquee__text">
      {item}
    </span>
  ))
  const tickets = catalog.batches.map((batch) => (
    <div key={batch.code} className="w-[min(640px,86vw)]">
      <BatchTicket batch={batch} variant="strip" as="div" />
    </div>
  ))
  // Alternate text and tickets so neither clumps; keep every item even if the counts differ.
  const mixed = Array.from({ length: Math.max(texts.length, tickets.length) }, (_, i) => [texts[i], tickets[i]])
    .flat()
    .filter(Boolean)

  return (
    <CreamBand>
      <div className="py-10 md:py-14">
        <Marquee label={copy.proof.eyebrow} items={mixed} />
      </div>
    </CreamBand>
  )
}

// Card labels are the opening words of each paragraph, not new copy.
const STORY_LABELS = ['Before 2020', 'Then', 'Sawargi'] as const

/**
 * §6.2 Chapter I: our story. From 768px up with motion allowed, the section
 * pins and the title panel plus three cards slide sideways as you scroll
 * (BRIEF §3 "Pinned timeline"). Below 768px the cards are a native
 * horizontal scroller with snap; under reduced motion they stack.
 */
export function StoryChapter() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    if (!section || !track) return

    const mm = gsap.matchMedia()
    mm.add(PIN_QUERY, () => {
      section.dataset.layout = 'pinned'
      // Travel until the rail's right edge (incl. its trailing padding) meets the viewport edge.
      const distance = () => Math.max(0, track.offsetLeft + track.scrollWidth - window.innerWidth)
      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true
        }
      })
      // Card widths depend on the web fonts; re-measure once they land.
      void document.fonts?.ready.then(() => ScrollTrigger.refresh())
      return () => {
        tween.scrollTrigger?.kill()
        tween.kill()
        delete section.dataset.layout
      }
    })
    return () => mm.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="story"
      aria-label={copy.story.eyebrow}
      data-video-section
      className="chapter chapter-story"
    >
      {/* The rail moves as one piece when pinned; on phones only the card row scrolls sideways. */}
      <div ref={trackRef} className="story-rail">
        <div className="story-intro">
          <p className={`${eyebrow} readable-kicker text-paper`}>{copy.story.eyebrow}</p>
          <SplitReveal text={copy.story.title} className={`${chapterTitle} readable-heading`} />
          <MiniCta />
        </div>
        <div className="story-cards">
          {copy.story.paragraphs.map((paragraph, index) => (
            <article key={paragraph} className="paper-card story-card">
              <p className="paper-card__label">{STORY_LABELS[index]}</p>
              <p className="mt-6 text-lg leading-8">{paragraph}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/** §6.3 Chapter II: why just one (cream). */
export function OneChapter() {
  const [lead, ...rest] = copy.one.pull.split(' Held')
  const tail = rest.length ? `Held${rest.join(' Held')}` : ''

  return (
    <CreamBand>
      <section id="why-one" aria-label={copy.one.eyebrow} data-video-section className="chapter chapter--cream">
        <p className={`${eyebrow} text-ink-mut`}>{copy.one.eyebrow}</p>
        <SplitReveal text={copy.one.title} className={`${chapterTitle} max-w-6xl`} />
        <div className="mt-14 grid gap-12 md:mt-20 md:grid-cols-2 md:gap-16">
          <p className="max-w-xl text-lg leading-8">{copy.one.p1}</p>
          <blockquote className="pull-quote">
            <Wiggle text={lead} className="pull-quote__lead" /> <span>{tail}</span>
          </blockquote>
        </div>
        <MiniCta variant="cherry" />
      </section>
    </CreamBand>
  )
}

// Real order of the work (BRIEF §9 D9): cherry → roast and cup → the bag.
const PROCESS_STEPS = [
  { key: 'clean', still: asset('/media/stills/step-1.webp') },
  { key: 'process', still: asset('/media/stills/step-2.webp') },
  { key: 'proof', still: asset('/media/stills/step-3.webp') }
] as const

type StepStatus = 'before' | 'active' | 'after'

/**
 * §6.4 Chapter III: process. Numbered because it's a real sequence.
 * Desktop with motion: sticky steps (BRIEF §3). The text scrolls on the left,
 * one still stays pinned on the right and swaps as each step crosses the
 * middle of the screen. Mobile and reduced motion: each step carries its own
 * still, stacked.
 */
export function ProcessChapter() {
  const sticky = useMediaQuery(PIN_QUERY)
  const listRef = useRef<HTMLOListElement | null>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const list = listRef.current
    if (!sticky || !list || typeof IntersectionObserver === 'undefined') return
    const steps = Array.from(list.querySelectorAll<HTMLElement>('.process-step'))
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(steps.indexOf(entry.target as HTMLElement))
        }
      },
      // Only the band across the middle 10% of the viewport counts as "active".
      { rootMargin: '-45% 0px -45% 0px' }
    )
    steps.forEach((step) => observer.observe(step))
    return () => observer.disconnect()
  }, [sticky])

  const statusOf = (index: number): StepStatus =>
    !sticky || index === active ? 'active' : index < active ? 'before' : 'after'

  return (
    <section
      id="process"
      aria-label={copy.process.eyebrow}
      data-video-section
      data-layout={sticky ? 'sticky' : 'stack'}
      className="chapter chapter-process"
    >
      <div className="process-grid">
        <ol ref={listRef} className="process-steps">
          {PROCESS_STEPS.map(({ key, still }, index) => {
            const step = copy[key]
            return (
              <li key={key} className="process-step" data-status={statusOf(index)}>
                <div className="process-step__text">
                  <p className="process-step__number">{String(index + 1).padStart(2, '0')}</p>
                  <p className={`${eyebrow} readable-kicker mt-6 text-paper`}>{step.eyebrow}</p>
                  <SplitReveal as="h2" text={step.title} className="display-step readable-heading mt-4" />
                  {'p1' in step && <p className="on-video mt-8 max-w-xl text-lg leading-8">{step.p1}</p>}
                  {'pull' in step && <p className="process-step__pull on-video">{step.pull}</p>}
                  {'items' in step && (
                    <ul className="proof-list">
                      {step.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
                {!sticky && (
                  <figure className="process-frame">
                    <img src={still} alt="" width={800} height={1000} loading="lazy" decoding="async" />
                    <span className="process-frame__chip" aria-hidden="true">
                      {String(index + 1).padStart(2, '0')} / {String(PROCESS_STEPS.length).padStart(2, '0')}
                    </span>
                  </figure>
                )}
              </li>
            )
          })}
        </ol>
        {sticky && (
          <div className="process-sticky" aria-hidden="true">
            <figure className="process-frame process-frame--sticky">
              {PROCESS_STEPS.map(({ key, still }, index) => (
                <img
                  key={key}
                  src={still}
                  alt=""
                  width={800}
                  height={1000}
                  decoding="async"
                  data-active={index === active ? 'true' : 'false'}
                />
              ))}
              <span className="process-frame__chip">
                {String(active + 1).padStart(2, '0')} / {String(PROCESS_STEPS.length).padStart(2, '0')}
              </span>
            </figure>
          </div>
        )}
      </div>
      <MiniCta />
    </section>
  )
}

/** §6.5 The batch (cream): the signature section. */
export function BatchChapter({ current }: { current?: Batch }) {
  const state = useCatalog()
  const { catalog } = state
  return (
    <CreamBand>
      <section id="batch" aria-label={copy.scarcity.eyebrow} data-video-section className="chapter chapter--cream">
        <p className={`${eyebrow} text-ink-mut`}>{copy.scarcity.eyebrow}</p>
        <SplitReveal text={copy.scarcity.title} className={`${chapterTitle} max-w-6xl`} />
        <p className="mt-10 max-w-2xl text-lg leading-8">{copy.scarcity.p1}</p>
        {state.status !== 'ready' && (
          <p role="status" className="mt-14 font-plex text-sm uppercase tracking-[0.08em] text-ink-mut md:mt-20">
            {state.status === 'loading' ? 'Checking stock…' : 'Stock is unavailable right now. Please try again shortly.'}
          </p>
        )}
        <div className="batch-grid mt-14 md:mt-20">
          {catalog.batches.map((batch) => (
            <BatchTicket
              key={batch.code}
              batch={batch}
              selected={batch.code === current?.code}
              action={
                batch.bagsLeft > 0 ? (
                  <InkButton href={checkoutHref(batch)} variant="cherry">
                    {copy.cta.button}
                  </InkButton>
                ) : undefined
              }
            />
          ))}
        </div>
      </section>
    </CreamBand>
  )
}

/** §6.6 Journal teaser (dark). Uses the article's own title and subtitle. */
export function JournalTeaser() {
  return (
    <section aria-label="journal" data-video-section className="chapter">
      <p className={`${eyebrow} readable-kicker text-paper`}>journal</p>
      <Link to={`/journal/${ARTICLE.slug}`} className="paper-card paper-card--link mt-10 block max-w-3xl">
        <p className="paper-card__label">
          {ARTICLE.date} · {ARTICLE.readingTime}
        </p>
        <h2 className="display-step mt-5">{ARTICLE.title}</h2>
        <p className="mt-4 max-w-xl text-lg leading-8 text-ink-mut">{ARTICLE.subtitle}</p>
      </Link>
    </section>
  )
}

/** §6.7 Climax CTA (dark, full-bleed). */
export function ClimaxCta({ batch }: { batch?: Batch }) {
  return (
    <section
      id="order"
      aria-label={copy.cta.title.toLowerCase()}
      data-video-section
      className="chapter flex min-h-[100svh] flex-col items-center justify-center text-center"
    >
      <p className={`${eyebrow} readable-kicker text-paper`}>{copy.cta.eyebrow}</p>
      <SplitReveal text={copy.cta.title} className="display-climax readable-heading mt-6" />
      <p className="on-video mx-auto mt-10 max-w-3xl text-lg leading-8">{copy.cta.p1}</p>
      <div className="mt-12">
        <InkButton href={batch ? checkoutHref(batch) : '/checkout'} variant="cherry">
          {copy.cta.button}
        </InkButton>
      </div>
      {batch && (
        <p className="readable-kicker mt-6 font-plex text-sm text-paper">
          {copy.cta.meta({
            code: batch.code,
            date: formatRoastDate(batch.roastDate),
            total: batch.bagsTotal,
            left: batch.bagsLeft
          })}
        </p>
      )}
    </section>
  )
}

/** §6.8 Footer (cream, torn top edge). */
export function HomeFooter() {
  return (
    <div data-nav-tone="light" className="relative z-10" style={{ '--focus-ring': 'var(--char)' } as CSSProperties}>
      <PaperEdge side="top" />
      <footer className="bg-paper px-4 pb-10 pt-16 text-char md:px-10 md:pt-24">
        <p className="display-step max-w-4xl">{copy.footer}</p>
        <nav aria-label="footer" className="mt-14 flex flex-wrap gap-x-8 gap-y-3 text-sm uppercase tracking-[0.22em]">
          <a href="#top" className="footer-link">
            top
          </a>
          <Link to="/journal" className="footer-link">
            journal
          </Link>
          <Link to="/checkout" className="footer-link">
            checkout
          </Link>
        </nav>
      </footer>
    </div>
  )
}
