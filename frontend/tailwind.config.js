/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
        },
        surface: {
          50: '#1e1e2a',
          100: '#22222d',
          200: '#2d2d3d',
        }
      }
    },
  },
  plugins: [require('@tailwindcss/typography')],
}