import { InkButton } from '../ui/InkButton'

/** End-of-chapter nudge to the batch section (BRIEF §6: every chapter ends in a mini-CTA). */
export function MiniCta({ variant = 'paper' }: { variant?: 'paper' | 'cherry' }) {
  return (
    <div className="mt-14 md:mt-20">
      <InkButton href="#batch" variant={variant}>
        Choose a batch
      </InkButton>
    </div>
  )
}
