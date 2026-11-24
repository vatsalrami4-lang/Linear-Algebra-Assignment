/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060a12',
          900: '#0a0f1d',
          850: '#0e162a',
          800: '#131e38',
          700: '#1b2a4e',
          600: '#263b6d',
        },
        brand: {
          blue: '#0284c7',
          sky: '#38bdf8',
          indigo: '#6366f1',
          accent: '#0ea5e9'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
      }
    },
  },
  plugins: [],
}
