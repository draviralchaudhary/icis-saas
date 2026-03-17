/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Syne Mono"', 'monospace'],
      },
      colors: {
        bg: {
          DEFAULT: '#020408',
          2: '#040c14',
          3: '#061220',
        },
        blue: {
          accent: '#0ea5e9',
          bright: '#38bdf8',
          glow: '#7dd3fc',
          mid: '#0d2a4a',
          deep: '#0a1628',
        },
        cyan: {
          DEFAULT: '#06b6d4',
          dim: '#0e7490',
        },
        border: {
          DEFAULT: 'rgba(14,165,233,0.18)',
          bright: 'rgba(14,165,233,0.45)',
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease both',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 20s linear infinite',
        'marquee': 'marquee 22s linear infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
      },
      backgroundImage: {
        'grid-pattern': `linear-gradient(rgba(14,165,233,0.06) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(14,165,233,0.06) 1px, transparent 1px)`,
      },
      backgroundSize: {
        'grid': '60px 60px',
      },
    },
  },
  plugins: [],
}
