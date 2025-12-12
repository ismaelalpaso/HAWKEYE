/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        'azul-falcon': '#083f59',
        'azul-falcon-dark': '#052d40',
        'naranja-falcon': '#f7931d',
        'naranja-falcon-dark': '#c76e00',
        'color-text': '#1a1a1a',
        'color-bg': '#f9f9f9',
      },
      animation: {
        'hover-fade': 'hoverFade 2s forwards',
      },
      keyframes: {
        hoverFade: {
          '0%': { backgroundColor: '#F97316' },  // naranja-falcon
          '100%': { backgroundColor: '#C2410C' }, // naranja-falcon-dark
        }
      }
    },
  },
  plugins: [],
}
