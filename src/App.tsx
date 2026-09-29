import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CinematicVideo } from './components/CinematicVideo'
import { BATCHES, formatRoastDate } from './data/shop'
import { Link } from './lib/router'

gsap.registerPlugin(ScrollTrigger)

// All-keyframe MP4s re-encoded for scroll scrubbing (see docs/video-scrub.md).
const videoSrc = '/media/scrub/coffee-scrub-1080.mp4'
const videoSmallSrc = '/media/scrub/coffee-scrub-720.mp4'
const navItems = [
  { label: 'story', href: '#story' },
  { label: 'one roast', href: '#why-one' },
  { label: 'process', href: '#process' },
  { label: 'order', href: '#order' },
  { label: 'journal', href: '/journal' }
]

const currentBatch = BATCHES.find((batch) => batch.bagsLeft > 0)

const proofItems = [
  'Roast date printed on every bag',
  'Batch number for full traceability',
  'One-way valve packaging to lock in aroma',
  'Best enjoyed within [X] days of roast'
]

function Navigation() {
  return (
    <nav className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between gap-4 px-4 py-4 md:px-8 md:py-6">
      <a
        href="#top"
        aria-label="sawargi home"
        className="flex min-h-11 items-center py-2 pr-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-4 focus-visible:ring-offset-black md:min-h-12 md:pr-3"
      >
        <span data-testid="sawargi-logo" className="sawargi-composite-logo flex items-center">
          <img
            src="/brand/sawargi-mark-white-cropped.png"
            alt=""
            data-testid="sawargi-logo-mark"
            className="h-7 w-7 shrink-0 object-contain md:h-8 md:w-8"
          />
          <img
            src="/brand/sawargi-wordmark-white-cropped.png"
            alt=""
            data-testid="sawargi-logo-wordmark"
            className="h-[1.125rem] w-auto object-contain md:h-6"
          />
        </span>
      </a>

      <div className="hidden items-center gap-1 rounded-full bg-neutral-900/90 px-3 py-2 backdrop-blur md:flex">
        {navItems.map((item) =>
          item.href.startsWith('/') ? (
            <Link
              key={item.href}
              to={item.href}
              className="rounded-full px-5 py-2 text-sm text-neutral-300 transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          ) : (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-5 py-2 text-sm text-neutral-300 transition-colors hover:text-white"
            >
              {item.label}
            </a>
          )
        )}
      </div>

      <Link
        to="/checkout"
        className="rounded-full bg-white px-6 py-3 text-sm font-normal text-black transition-colors hover:bg-neutral-200"
      >
        Buy Now
      </Link>
    </nav>
  )
}

type StorySectionProps = {
  id?: string
  ariaLabel: string
  eyebrow: string
  title: string
  children: ReactNode
  align?: 'left' | 'right'
}

function StorySection({
  id,
  ariaLabel,
  eyebrow,
  title,
  children,
  align = 'left'
}: StorySectionProps) {
  return (
    <section
      id={id}
      aria-label={ariaLabel}
      data-video-section
      data-section-panel="content"
      className={`content-readability min-h-[100svh] border-t border-white/20 py-14 md:items-center md:py-16 ${
        align === 'right' ? 'md:grid md:grid-cols-[0.8fr_1.2fr]' : 'md:grid md:grid-cols-[1.2fr_0.8fr]'
      } md:gap-16`}
    >
      <div className={align === 'right' ? 'md:col-start-2' : ''}>
        <p className="readable-kicker text-xs font-medium uppercase tracking-[0.32em] text-white/75">
          {eyebrow}
        </p>
        <h2 className="readable-heading mt-4 max-w-4xl text-[clamp(3rem,6vw,5.75rem)] font-light tracking-[-0.04em] text-white">
          {title}
        </h2>
      </div>
      <div
        className={`copy-scrim mt-7 max-w-2xl space-y-4 text-base leading-7 text-white/90 md:mt-0 md:text-[17px] md:leading-8 ${
          align === 'right' ? 'md:col-start-2' : ''
        }`}
      >
        {children}
      </div>
    </section>
  )
}

function App() {
  const heroSectionRef = useRef<HTMLElement | null>(null)
  const quietlyWordRef = useRef<HTMLHeadingElement | null>(null)
  const neverWordRef = useRef<HTMLParagraphElement | null>(null)

  useEffect(() => {
    const heroSection = heroSectionRef.current
    const quietlyWord = quietlyWordRef.current
    const neverWord = neverWordRef.current
    if (!heroSection || !quietlyWord || !neverWord) return

    const heroWords = [quietlyWord, neverWord]
    gsap.set(heroWords, {
      opacity: 1,
      x: 0,
      y: 0,
      filter: 'blur(0px)'
    })

    const fadeAnimation = gsap.timeline({
      paused: true
    })
    fadeAnimation
      .to(quietlyWord, { opacity: 0, x: -180, y: -44, filter: 'blur(10px)', ease: 'none' }, 0)
      .to(neverWord, { opacity: 0, x: 180, y: -44, filter: 'blur(10px)', ease: 'none' }, 0)

    const trigger = ScrollTrigger.create({
      trigger: heroSection,
      start: 'top top',
      end: 'bottom top',
      scrub: 0.8,
      animation: fadeAnimation
    })

    return () => {
      trigger.kill()
      fadeAnimation.kill()
    }
  }, [])

  return (
    <main id="top" className="relative min-h-screen w-full bg-black text-white">
      <CinematicVideo src={videoSrc} smallSrc={videoSmallSrc} />
      <div
        aria-hidden="true"
        data-testid="video-readability-scrim"
        className="video-readability-scrim pointer-events-none fixed inset-0 z-[1]"
      />
      <Navigation />

      <section
        ref={heroSectionRef}
        data-testid="hero-section"
        data-video-section
        data-section-panel="hero"
        className="sticky top-0 z-10 h-screen w-full overflow-hidden"
      >
        <div className="absolute inset-0 z-20">
          <h1
            ref={quietlyWordRef}
            data-testid="hero-word-quietly"
            data-parallax-object="hero-word"
            data-scroll-exit="left"
            className="hero-title readable-heading absolute left-4 top-[40%] text-[clamp(3.5rem,13vw,13rem)] font-light text-white will-change-[opacity,transform,filter] md:left-10"
          >
            <span data-testid="hero-word-quietly-thin" className="hero-word-ultra-thin">
              Quitely
            </span>{' '}
            <span data-testid="hero-word-roasted-bold" className="font-medium">
              Roasted
            </span>
          </h1>

          <p
            ref={neverWordRef}
            data-testid="hero-word-never"
            data-parallax-object="hero-word"
            data-scroll-exit="right"
            className="hero-title hero-word-never-offset readable-heading absolute right-2 top-[90%] whitespace-nowrap text-[clamp(3.6rem,11vw,12rem)] font-light text-white will-change-[opacity,transform,filter] md:right-10"
          >
            <span data-testid="hero-word-never-thin" className="hero-word-ultra-thin">
              Never
            </span>{' '}
            <span data-testid="hero-word-rushed-bold" className="font-medium">
              Rushed
            </span>
          </p>
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-48 bg-gradient-to-b from-transparent to-black" />
      </section>

      <div
        data-testid="story-sections-layer"
        className="relative z-20 bg-transparent px-6 md:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <StorySection
            id="story"
            ariaLabel="our story"
            eyebrow="our story"
            title="Born When the Cafes Went Quiet"
          >
            <p>
              Before 2020, coffee in Bandung wasn't something you drank alone - it was something
              you did with people. A cup outside, a bit of time, a few friends.
            </p>
            <p>
              Then the streets emptied and bean prices collapsed. We had time, cheap beans, and no
              excuse left, so we learned the process one failed cup at a time.
            </p>
            <p>
              Sawargi started with that refusal to serve anything we wouldn't drink ourselves. That
              habit is why every batch still has to earn the name.
            </p>
          </StorySection>

          <StorySection
            id="why-one"
            ariaLabel="why just one"
            eyebrow="why just one"
            title="Master One Coffee Completely"
            align="right"
          >
            <p>
              Most coffee brands spread thin across a dozen blends, hoping one sticks. We never had
              that luxury, so mastering one coffee became the standard we kept on purpose.
            </p>
            <p className="text-xl leading-8 text-white">
              Every harvest. Every roast. Every bag. Held to the same standard - refined, never
              replaced.
            </p>
          </StorySection>

          <StorySection
            id="process"
            ariaLabel="tasted before it's trusted"
            eyebrow="tasted before it's trusted"
            title="Cupped, Scored, Then Released"
          >
            <p>
              Before any batch leaves our roastery, it's cupped and scored against our own
              benchmark: body, acidity, sweetness, finish. If it misses the profile, it doesn't
              ship.
            </p>
            <p className="border-l border-white/40 pl-5 text-xl leading-8 text-white">
              Every batch cupped. Every batch scored. Every batch dated.
            </p>
          </StorySection>

          <StorySection
            ariaLabel="clean hands, careful process"
            eyebrow="clean hands, careful process"
            title="Care Starts Before the Cup"
            align="right"
          >
            <p>
              From drying to packing, our process runs on one rule: nothing touches your coffee
              that wouldn't touch our own cup. Sanitized equipment, sealed packaging, and a
              facility standard we don't negotiate on.
            </p>
          </StorySection>

          <section
            aria-label="proof, not promises"
            data-video-section
            data-section-panel="content"
            className="content-readability flex min-h-[100svh] items-center border-t border-white/20 py-14 md:py-16"
          >
            <div className="grid gap-10 md:grid-cols-[0.85fr_1.15fr] md:items-start">
              <div>
                <p className="readable-kicker text-xs font-medium uppercase tracking-[0.32em] text-white/75">
                  proof, not promises
                </p>
                <h2 className="readable-heading mt-4 max-w-3xl text-4xl font-light tracking-[-0.04em] text-white md:text-6xl">
                  Freshness You Can Audit
                </h2>
              </div>
              <ul className="grid gap-px overflow-hidden rounded-sm border border-white/25 bg-white/20 shadow-[0_24px_90px_rgb(0_0_0_/_0.45)]">
                {proofItems.map((item) => (
                  <li key={item} className="bg-black/[0.46] px-5 py-5 text-base text-white/90 backdrop-blur-sm md:px-7">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <StorySection
            ariaLabel="the scarcity angle"
            eyebrow="the scarcity angle"
            title="No New Flavor to Hide Behind"
          >
            <p>
              We don't launch a new flavor every season. When this batch sells out, the next one
              waits for proof, not a deadline.
            </p>
          </StorySection>

          <section
            id="order"
            aria-label="bring the table back"
            data-video-section
            data-section-panel="content"
            className="content-readability flex min-h-[100svh] items-center border-t border-white/20 py-14 md:py-16"
          >
            <div className="mx-auto max-w-5xl text-center">
              <p className="readable-kicker text-xs font-medium uppercase tracking-[0.32em] text-white/75">
                call to action
              </p>
              <h2 className="hero-title readable-heading mt-5 text-[clamp(4rem,12vw,12rem)] font-light text-white">
                Bring the Table Back
              </h2>
              <p className="copy-scrim mx-auto mt-8 max-w-3xl text-base leading-7 text-white/90 md:text-lg">
                The pandemic took the cup we used to share with friends. This is the one we built
                to bring it back - cupped, dated, and roasted the same unhurried way since the year
                cheap beans were all we had.
              </p>
              <Link
                to="/checkout"
                className="mt-10 inline-flex rounded-full bg-white px-10 py-4 text-sm font-normal text-black transition-colors hover:bg-neutral-200"
              >
                Order This Batch
              </Link>
              {currentBatch && (
                <p className="readable-kicker mt-5 text-sm text-white/75">
                  Batch {currentBatch.code} roasted {formatRoastDate(currentBatch.roastDate)}. Limited
                  to {currentBatch.bagsTotal} bags — {currentBatch.bagsLeft} left.
                </p>
              )}
            </div>
          </section>

          <footer className="readable-kicker border-t border-white/20 py-8 text-center text-sm text-white/75">
            Small batch. Fully traceable. Cupped before it's sold. Best enjoyed with someone else
            in the room.
          </footer>
        </div>
      </div>
    </main>
  )
}

export default App
