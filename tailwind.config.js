/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'navy': '#060d1b',
        'surface': '#0d1b2e',
        'card': '#0f2240',
        'border': '#1e3a5f',
        'cyan-glow': '#00d4ff',
      },
    },
  },
  plugins: [],
}
