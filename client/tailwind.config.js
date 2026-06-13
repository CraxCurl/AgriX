/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F0F0F0',
        foreground: '#121212',
        'primary-red': '#D02020',
        'primary-blue': '#1040C0',
        'primary-yellow': '#F0C020',
        border: '#121212',
        muted: '#E0E0E0',
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'bauhaus-sm': '4px 4px 0px 0px #121212',
        'bauhaus-md': '6px 6px 0px 0px #121212',
        'bauhaus-lg': '8px 8px 0px 0px #121212',
      },
      backgroundImage: {
        'dot-pattern': 'radial-gradient(#121212 2px, transparent 2px)',
      },
      backgroundSize: {
        'dot-size': '20px 20px',
      }
    },
  },
  plugins: [],
}
