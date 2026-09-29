import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Readex Pro', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['var(--font-display)'],
        // Named 'plex', not 'mono': overriding Tailwind's font-mono would restyle checkout.
        plex: ['var(--font-mono)']
      },
      // Redesign tokens (BRIEF §4); values live in src/styles/tokens.css.
      colors: {
        ink: 'rgb(var(--ink-rgb) / <alpha-value>)',
        char: 'rgb(var(--char-rgb) / <alpha-value>)',
        panel: 'rgb(var(--panel-rgb) / <alpha-value>)',
        paper: 'rgb(var(--paper-rgb) / <alpha-value>)',
        'paper-mut': 'rgb(var(--paper-mut-rgb) / <alpha-value>)',
        'ink-mut': 'rgb(var(--ink-mut-rgb) / <alpha-value>)',
        cherry: 'rgb(var(--cherry-rgb) / <alpha-value>)'
      },
      borderRadius: {
        card: 'var(--radius-card)'
      },
      transitionTimingFunction: {
        text: 'var(--ease-text)',
        card: 'var(--ease-card)'
      },
      keyframes: {
        'fade-rise': {
          '0%': { opacity: '0', transform: 'translateY(28px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        'fade-rise': 'fade-rise 900ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-rise-delay': 'fade-rise 900ms cubic-bezier(0.16, 1, 0.3, 1) 160ms both',
        'fade-rise-delay-2': 'fade-rise 900ms cubic-bezier(0.16, 1, 0.3, 1) 320ms both'
      }
    }
  },
  plugins: []
}

export default config
