import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CinematicVideo } from './components/CinematicVideo'
import { copy, navItems } from './content/copy'
import { BATCHES, formatRoastDate } from './data/shop'
import { Link } from './lib/router'

gsap.registerPlugin(ScrollTrigger)

// All-keyframe MP4s re-encoded for scroll scrubbing (see docs/video-scrub.md).
const videoSrc = '/media/scrub/coffee-scrub-1080.mp4'
const videoSmallSrc = '/media/scrub/coffee-scrub-720.mp4'
const currentBatch = BATCHES.find((batch) => batch.bagsLeft > 0)

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
        {copy.nav.buyNow}
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
              {copy.hero.line1.thin}
            </span>{' '}
            <span data-testid="hero-word-roasted-bold" className="font-medium">
              {copy.hero.line1.bold}
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
              {copy.hero.line2.thin}
            </span>{' '}
            <span data-testid="hero-word-rushed-bold" className="font-medium">
              {copy.hero.line2.bold}
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
            ariaLabel={copy.story.eyebrow}
            eyebrow={copy.story.eyebrow}
            title={copy.story.title}
          >
            {copy.story.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </StorySection>

          <StorySection
            id="why-one"
            ariaLabel={copy.one.eyebrow}
            eyebrow={copy.one.eyebrow}
            title={copy.one.title}
            align="right"
          >
            <p>{copy.one.p1}</p>
            <p className="text-xl leading-8 text-white">{copy.one.pull}</p>
          </StorySection>

          <StorySection
            id="process"
            ariaLabel={copy.process.eyebrow}
            eyebrow={copy.process.eyebrow}
            title={copy.process.title}
          >
            <p>{copy.process.p1}</p>
            <p className="border-l border-white/40 pl-5 text-xl leading-8 text-white">
              {copy.process.pull}
            </p>
          </StorySection>

          <StorySection
            ariaLabel={copy.clean.eyebrow}
            eyebrow={copy.clean.eyebrow}
            title={copy.clean.title}
            align="right"
          >
            <p>{copy.clean.p1}</p>
          </StorySection>

          <section
            aria-label={copy.proof.eyebrow}
            data-video-section
            data-section-panel="content"
            className="content-readability flex min-h-[100svh] items-center border-t border-white/20 py-14 md:py-16"
          >
            <div className="grid gap-10 md:grid-cols-[0.85fr_1.15fr] md:items-start">
              <div>
                <p className="readable-kicker text-xs font-medium uppercase tracking-[0.32em] text-white/75">
                  {copy.proof.eyebrow}
                </p>
                <h2 className="readable-heading mt-4 max-w-3xl text-4xl font-light tracking-[-0.04em] text-white md:text-6xl">
                  {copy.proof.title}
                </h2>
              </div>
              <ul className="grid gap-px overflow-hidden rounded-sm border border-white/25 bg-white/20 shadow-[0_24px_90px_rgb(0_0_0_/_0.45)]">
                {copy.proof.items.map((item) => (
                  <li key={item} className="bg-black/[0.46] px-5 py-5 text-base text-white/90 backdrop-blur-sm md:px-7">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <StorySection
            ariaLabel={copy.scarcity.eyebrow}
            eyebrow={copy.scarcity.eyebrow}
            title={copy.scarcity.title}
          >
            <p>{copy.scarcity.p1}</p>
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
                {copy.cta.eyebrow}
              </p>
              <h2 className="hero-title readable-heading mt-5 text-[clamp(4rem,12vw,12rem)] font-light text-white">
                {copy.cta.title}
              </h2>
              <p className="copy-scrim mx-auto mt-8 max-w-3xl text-base leading-7 text-white/90 md:text-lg">
                {copy.cta.p1}
              </p>
              <Link
                to="/checkout"
                className="mt-10 inline-flex rounded-full bg-white px-10 py-4 text-sm font-normal text-black transition-colors hover:bg-neutral-200"
              >
                {copy.cta.button}
              </Link>
              {currentBatch && (
                <p className="readable-kicker mt-5 text-sm text-white/75">
                  {copy.cta.meta({
                    code: currentBatch.code,
                    date: formatRoastDate(currentBatch.roastDate),
                    total: currentBatch.bagsTotal,
                    left: currentBatch.bagsLeft
                  })}
                </p>
              )}
            </div>
          </section>

          <footer className="readable-kicker border-t border-white/20 py-8 text-center text-sm text-white/75">
            {copy.footer}
          </footer>
        </div>
      </div>
    </main>
  )
}

export default App
