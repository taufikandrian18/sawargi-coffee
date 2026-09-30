import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { copy } from '../../content/copy'
import type { Batch } from '../../data/shop'
import { BATCHES } from '../../data/shop'
import { BatchTicket } from '../BatchTicket'
import { checkoutHref } from '../../lib/batchLink'
import { BeanDrift } from '../ui/BeanDrift'
import { InkButton } from '../ui/InkButton'
import { prefersReducedMotion } from '../ui/motion'
import { SplitReveal } from '../ui/SplitReveal'

gsap.registerPlugin(ScrollTrigger)

const line1 = `${copy.hero.line1.thin} ${copy.hero.line1.bold}`
const line2 = `${copy.hero.line2.thin} ${copy.hero.line2.bold}`

/**
 * §6 section 0: the thesis. Sticky under the content layer; as you scroll,
 * the two lines part left and right (the original GSAP exit, kept).
 */
/**
 * While the live stock loads, an invisible stand-in ticket holds the strip's
 * space, so the headline doesn't jump up when the real batch arrives (CLS).
 */
const PLACEHOLDER_BATCH = BATCHES[0]

export function Hero({ batch, pending = false }: { batch?: Batch; pending?: boolean }) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const line1Ref = useRef<HTMLDivElement | null>(null)
  const line2Ref = useRef<HTMLDivElement | null>(null)
  const stripRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const section = sectionRef.current
    const first = line1Ref.current
    const second = line2Ref.current
    const strip = stripRef.current
    if (!section || !first || !second || prefersReducedMotion()) return

    const exit = gsap.timeline({ paused: true })
    exit
      .to(first, { opacity: 0, x: -180, y: -44, filter: 'blur(10px)', ease: 'none', duration: 1 }, 0)
      .to(second, { opacity: 0, x: 180, y: -44, filter: 'blur(10px)', ease: 'none', duration: 1 }, 0)
    // The strip sits lowest, so the incoming proof band reaches it first: clear it in the first third.
    if (strip) exit.to(strip, { opacity: 0, y: 24, ease: 'none', duration: 0.33 }, 0)
    const beans = section.querySelector('[data-testid="bean-drift"]')
    if (beans) exit.to(beans, { opacity: 0, ease: 'none', duration: 1 }, 0)

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      // Done by the time the hero is ~65% scrolled, so no half-faded ghost sits behind the story title.
      end: 'bottom 35%',
      scrub: 0.8,
      animation: exit
    })

    return () => {
      trigger.kill()
      exit.kill()
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      data-testid="hero-section"
      data-video-section
      data-section-panel="hero"
      className="sticky top-0 z-10 h-[100svh] w-full overflow-hidden"
    >
      <BeanDrift />
      <div className="relative z-20 flex h-full flex-col justify-end px-4 pb-8 pt-28 md:px-10 md:pb-12">
        <div
          ref={line1Ref}
          data-testid="hero-word-quietly"
          data-parallax-object="hero-word"
          data-scroll-exit="left"
          className="will-change-transform"
        >
          <SplitReveal as="h1" text={line1} className="display-hero readable-heading" />
        </div>
        <div
          ref={line2Ref}
          data-testid="hero-word-never"
          data-parallax-object="hero-word"
          data-scroll-exit="right"
          className="self-end text-right will-change-transform"
        >
          <SplitReveal
            as="p"
            text={line2}
            wiggle={[copy.hero.line2.thin]}
            delay={0.18}
            className="display-hero readable-heading"
          />
        </div>

        {/* Always mounted: the live batch arrives from the store after the scroll exit is
            built, and the exit has to hold on to this wrapper to fade it out. */}
        <div
          ref={stripRef}
          data-testid="hero-strip"
          className={batch || pending ? 'mt-8 w-full max-w-4xl md:mt-12' : 'w-full max-w-4xl'}
        >
          {batch ? (
            <BatchTicket
              batch={batch}
              variant="strip"
              action={
                <InkButton href={checkoutHref(batch)} variant="cherry">
                  {copy.cta.button}
                </InkButton>
              }
            />
          ) : (
            pending && (
              <div data-testid="hero-strip-placeholder" aria-hidden="true" className="invisible">
                <BatchTicket
                  batch={PLACEHOLDER_BATCH}
                  variant="strip"
                  action={<span className="ink-btn ink-btn--cherry">{copy.cta.button}</span>}
                />
              </div>
            )
          )}
        </div>
      </div>
    </section>
  )
}
