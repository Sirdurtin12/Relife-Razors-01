/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#5f9bd9',
          DEFAULT: '#0056b3', // Bleu plus foncé pour un meilleur contraste
          dark: '#003d7a',
        },
        secondary: {
          light: '#8ecfb9',
          DEFAULT: '#2c8875', // Vert plus foncé pour un meilleur contraste
          dark: '#1d5c4d',
        },
        gentleness: {
          veryMild: '#fff176',    // Jaune pâle (1)
          mild: '#f9bd59',        // Jaune-orange (5)
          neutral: '#e8863b',     // Orange (10)
          moderate: '#d03c1f',    // Rouge-orange (15)
          aggressive: '#7e0404',  // Rouge bordeaux (20)
        },
      },
      fontSize: {
        'base': '1.125rem', // Augmente la taille de base du texte
      },
      borderRadius: {
        'lg': '0.625rem', // Coins plus arrondis
      },
      spacing: {
        '18': '4.5rem', // Ajout d'un espacement supplémentaire
      },
    },
  },
  plugins: [],
}
