import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Readex Pro', 'system-ui', '-apple-system', 'sans-serif']
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
