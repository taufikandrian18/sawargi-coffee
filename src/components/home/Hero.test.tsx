import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BATCHES } from '../../data/shop'

const tweened = vi.hoisted(() => [] as Element[])
const tweenVars = vi.hoisted(() => new Map<Element, Record<string, unknown>>())

vi.mock('gsap', () => {
  const timeline = () => {
    const tl = {
      to: (target: Element, vars: Record<string, unknown>) => {
        tweened.push(target)
        tweenVars.set(target, vars)
        return tl
      },
      kill: () => undefined
    }
    return tl
  }
  return { default: { registerPlugin: () => undefined, timeline, to: () => undefined, from: () => undefined, set: () => undefined, context: (fn: () => void) => (fn(), { revert: () => undefined }) } }
})
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: { create: () => ({ kill: () => undefined }) } }))

import { Hero } from './Hero'

describe('Hero batch strip', () => {
  it('fades out on scroll even when the live batch arrives after the scroll exit was built', () => {
    // First paint: the store hasn't answered yet, so there is no batch.
    const { rerender } = render(<Hero />)
    const strip = screen.getByTestId('hero-strip')
    expect(tweened).toContain(strip)
    // autoAlpha ends at visibility:hidden, which iPhone WebKit honours for the ticket's filtered layers.
    expect(tweenVars.get(strip)).toMatchObject({ autoAlpha: 0 })

    // The batch arrives: it renders inside the same wrapper the exit animates.
    rerender(<Hero batch={BATCHES[0]} />)
    expect(screen.getByTestId('hero-strip')).toBe(strip)
    expect(strip).toHaveTextContent(BATCHES[0].code)
  })

  it('holds the strip space while stock loads, invisibly, so the headline does not jump', () => {
    const { rerender } = render(<Hero pending />)
    const placeholder = screen.getByTestId('hero-strip-placeholder')
    expect(placeholder).toHaveClass('invisible')
    expect(placeholder).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByRole('link')).not.toBeInTheDocument()

    rerender(<Hero pending={false} batch={BATCHES[0]} />)
    expect(screen.queryByTestId('hero-strip-placeholder')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /order this batch/i })).toBeInTheDocument()
  })
})
