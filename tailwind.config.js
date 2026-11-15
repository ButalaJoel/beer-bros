/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: { colors: { ink: '#111410', lime: '#C8F169' }, fontFamily: { sans: ['DM Sans', 'sans-serif'], display: ['Manrope', 'sans-serif'] } } },
  plugins: [],
}
