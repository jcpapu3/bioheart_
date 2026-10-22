/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#050c1d',
        card: '#0d1a33',
        card2: '#13264a',
        line: '#1f355f',
        ink: '#e9f1ff',
        muted: '#8fa6cc',
        brand: '#1d6fe0',
        heart: '#ff4d6d',
      },
      boxShadow: {
        glow: '0 0 24px rgba(56,189,248,0.18)',
        card: '0 8px 24px rgba(0,0,0,0.35)',
      },
    },
  },
  plugins: [],
};
