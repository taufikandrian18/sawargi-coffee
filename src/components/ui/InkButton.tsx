import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from '../../lib/router'

type CommonProps = {
  children: ReactNode
  variant?: 'paper' | 'cherry'
  className?: string
}

type AnchorProps = CommonProps & { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps | 'href'>
type NativeButtonProps = CommonProps & { href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps>

// Full class names written out: Tailwind drops @layer components rules it can't find literally.
const VARIANT_CLASS = { paper: 'ink-btn--paper', cherry: 'ink-btn--cherry' } as const

/**
 * Pill CTA. On hover a fill sweeps in from the left (clip-path), our own
 * treatment rather than the reference's sprite (BRIEF §3).
 * `href` starting with "/" uses the SPA router; "#…" and external URLs are plain links.
 */
export function InkButton({ children, variant = 'paper', className = '', ...rest }: AnchorProps | NativeButtonProps) {
  const classes = `ink-btn ${VARIANT_CLASS[variant]} ${className}`.trim()
  const inner = (
    <>
      <span className="ink-btn__fill" aria-hidden="true" />
      <span className="ink-btn__label">{children}</span>
    </>
  )

  if (rest.href !== undefined) {
    const { href, ...anchorProps } = rest
    return href.startsWith('/') ? (
      <Link to={href} className={classes} {...anchorProps}>
        {inner}
      </Link>
    ) : (
      <a href={href} className={classes} {...anchorProps}>
        {inner}
      </a>
    )
  }

  const { type = 'button', ...buttonProps } = rest
  return (
    <button type={type} className={classes} {...buttonProps}>
      {inner}
    </button>
  )
}
