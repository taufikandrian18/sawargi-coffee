import { CinematicVideo } from './components/CinematicVideo'
import {
  BatchChapter,
  ClimaxCta,
  HomeFooter,
  JournalTeaser,
  OneChapter,
  ProcessChapter,
  ProofBand,
  StoryChapter
} from './components/home/Chapters'
import { Hero } from './components/home/Hero'
import { HomeNav } from './components/home/HomeNav'
import { useCurrentBatch } from './lib/useCatalog'

// All-keyframe MP4s re-encoded for scroll scrubbing (see docs/video-scrub.md).
const videoSrc = '/media/scrub/coffee-scrub-1080.mp4'
const videoSmallSrc = '/media/scrub/coffee-scrub-720.mp4'

/**
 * Home page, structured per docs/redesign/BRIEF.md §6: hook, proof band,
 * three chapters with mini-CTAs, the batch, the journal, then the climax.
 */
function App() {
  const currentBatch = useCurrentBatch()
  return (
    <main id="top" className="relative min-h-screen w-full bg-ink text-paper">
      <CinematicVideo src={videoSrc} smallSrc={videoSmallSrc} />
      <div
        aria-hidden="true"
        data-testid="video-readability-scrim"
        className="video-readability-scrim pointer-events-none fixed inset-0 z-[1]"
      />
      <HomeNav />
      <Hero batch={currentBatch} />

      <div data-testid="story-sections-layer" className="relative z-20">
        <ProofBand />
        <StoryChapter />
        <OneChapter />
        <ProcessChapter />
        <BatchChapter current={currentBatch} />
        <JournalTeaser />
        <ClimaxCta batch={currentBatch} />
        <HomeFooter />
      </div>
    </main>
  )
}

export default App
