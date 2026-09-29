import { render, screen } from '@testing-library/react'
import App from './App'

describe('cinematic hero foreground', () => {
  it('renders the black and white sawargi hero and navigation anchors', () => {
    render(<App />)

    const homeLink = screen.getByRole('link', { name: 'sawargi home' })
    expect(homeLink).toHaveAttribute('href', '#top')
    expect(homeLink).not.toHaveClass('rounded-full')
    expect(homeLink).not.toHaveClass('bg-neutral-900/90')
    expect(screen.getByTestId('sawargi-logo')).toHaveClass('sawargi-composite-logo')
    expect(screen.getByTestId('sawargi-logo-mark')).toHaveAttribute(
      'src',
      '/brand/sawargi-mark-white-cropped.png'
    )
    expect(screen.getByTestId('sawargi-logo-wordmark')).toHaveAttribute(
      'src',
      '/brand/sawargi-wordmark-white-cropped.png'
    )
    expect(screen.getByRole('link', { name: 'story' })).toHaveAttribute('href', '#story')
    expect(screen.getByRole('link', { name: 'one roast' })).toHaveAttribute('href', '#why-one')
    expect(screen.getByRole('link', { name: 'process' })).toHaveAttribute('href', '#process')
    expect(screen.getByRole('link', { name: 'order' })).toHaveAttribute('href', '#order')
    expect(screen.getByRole('link', { name: 'journal' })).toHaveAttribute('href', '/journal')
    expect(screen.getByRole('link', { name: 'Buy Now' })).toHaveAttribute(
      'href',
      '/checkout'
    )
    expect(screen.getByRole('link', { name: 'Order This Batch' })).toHaveAttribute(
      'href',
      '/checkout'
    )

    const quietlyWord = screen.getByTestId('hero-word-quietly')
    const neverWord = screen.getByTestId('hero-word-never')

    expect(quietlyWord).toHaveTextContent('Quitely Roasted')
    expect(quietlyWord).toHaveAttribute('data-parallax-object', 'hero-word')
    expect(quietlyWord).toHaveAttribute('data-scroll-exit', 'left')
    expect(quietlyWord).toHaveClass('top-[40%]')
    expect(screen.getByTestId('hero-word-quietly-thin')).toHaveClass('hero-word-ultra-thin')
    expect(screen.getByTestId('hero-word-roasted-bold')).toHaveClass('font-medium')
    expect(neverWord).toHaveTextContent('Never Rushed')
    expect(neverWord).toHaveAttribute('data-parallax-object', 'hero-word')
    expect(neverWord).toHaveAttribute('data-scroll-exit', 'right')
    expect(neverWord).toHaveClass('whitespace-nowrap')
    expect(neverWord).toHaveClass('top-[90%]')
    expect(neverWord).toHaveClass('hero-word-never-offset')
    expect(screen.getByTestId('hero-word-never-thin')).toHaveClass('hero-word-ultra-thin')
    expect(screen.getByTestId('hero-word-rushed-bold')).toHaveClass('font-medium')
    expect(screen.queryByTestId('hero-word-rushed')).not.toBeInTheDocument()
    expect(document.querySelectorAll('[data-parallax-object="hero-word"]')).toHaveLength(2)
    expect(screen.queryByTestId('hero-word-layer')).not.toBeInTheDocument()
    expect(document.querySelector('video')).toHaveAttribute(
      'src',
      '/media/scrub/coffee-scrub-1080.mp4'
    )

    expect(
      screen.queryByText("we haven't changed how we roast since 2019. we're not starting now")
    ).not.toBeInTheDocument()
    expect(screen.queryByText('+65k')).not.toBeInTheDocument()
    expect(screen.queryByText('rooted in tradition')).not.toBeInTheDocument()
    expect(screen.queryByText('+1.5b')).not.toBeInTheDocument()
    expect(screen.queryByText('gb data was protected')).not.toBeInTheDocument()
    expect(screen.queryByText('+300k')).not.toBeInTheDocument()

    expect(screen.queryByText(/securify/i)).not.toBeInTheDocument()
  })

  it('keeps the persistent navigation above scrolled content so links stay clickable', () => {
    render(<App />)

    const navigation = screen.getByRole('navigation')

    expect(navigation).toHaveClass('fixed')
    expect(navigation).toHaveClass('z-50')
    expect(screen.getByTestId('hero-section')).not.toContainElement(navigation)
    expect(screen.getByTestId('story-sections-layer')).toHaveClass('z-20')
  })

  it('renders the story, quality, proof, scarcity, and call-to-action sections', () => {
    render(<App />)

    expect(screen.getByRole('region', { name: 'our story' })).toHaveAttribute('id', 'story')
    expect(screen.getByRole('region', { name: 'why just one' })).toHaveAttribute('id', 'why-one')
    expect(screen.getByRole('region', { name: "tasted before it's trusted" })).toHaveAttribute(
      'id',
      'process'
    )
    expect(screen.getByRole('region', { name: 'clean hands, careful process' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'proof, not promises' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'the scarcity angle' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'bring the table back' })).toHaveAttribute(
      'id',
      'order'
    )

    expect(screen.getByText('Born When the Cafes Went Quiet')).toBeInTheDocument()
    expect(
      screen.getByText(/coffee in Bandung wasn't something you drank alone/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/Every harvest. Every roast. Every bag./i)).toBeInTheDocument()
    expect(screen.getByText(/Every batch cupped. Every batch scored./i)).toBeInTheDocument()
    expect(screen.getByText(/Roast date printed on every bag/i)).toBeInTheDocument()
    expect(screen.getByText(/When this batch sells out/i)).toBeInTheDocument()
    expect(screen.getByText(/Small batch. Fully traceable./i)).toBeInTheDocument()
  })

  it('keeps the new content sections transparent so the fixed video remains visible behind them', () => {
    render(<App />)

    expect(screen.getByTestId('story-sections-layer')).toHaveClass('bg-transparent')
    expect(screen.getByTestId('story-sections-layer')).not.toHaveClass('bg-black')
    expect(screen.getByText('Roast date printed on every bag').closest('li')).toHaveClass(
      'bg-black/[0.46]'
    )
  })

  it('adds stable readability layers for text over the HLS video', () => {
    render(<App />)

    expect(screen.getByTestId('video-readability-scrim')).toHaveClass('video-readability-scrim')
    expect(screen.getByTestId('hero-word-quietly')).toHaveClass('readable-heading')
    expect(screen.getByRole('region', { name: 'our story' })).toHaveClass('content-readability')
    expect(screen.getByText(/coffee in Bandung wasn't something you drank alone/i).closest('div')).toHaveClass(
      'copy-scrim'
    )
    expect(screen.getByText(/The pandemic took the cup we used to share with friends/i)).toHaveClass(
      'copy-scrim'
    )
  })

  it('marks each major viewport as a video scroll section', () => {
    render(<App />)

    const panels = document.querySelectorAll('[data-video-section]')

    expect(panels).toHaveLength(8)
    expect(screen.getByTestId('hero-section')).toHaveAttribute('data-section-panel', 'hero')
    expect(screen.getByRole('region', { name: 'our story' })).toHaveAttribute(
      'data-section-panel',
      'content'
    )
    expect(screen.getByRole('region', { name: 'proof, not promises' })).toHaveClass(
      'min-h-[100svh]'
    )
    expect(screen.getByRole('region', { name: 'bring the table back' })).toHaveClass(
      'min-h-[100svh]'
    )
  })
})
