/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Permet de basculer entre les thèmes en utilisant la classe 'dark'
  content: [
    "./src/**/*.{html,ts}",
    "./node_modules/flowbite/**/*.js"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'Arial', 'sans-serif'],
      },
      textColor: {
        DEFAULT: '#52535A',
        alert: '#CE0600',
        success: '#19753C',
        required: '#CE0500'
      },
      colors: {
        green: {
          DEFAULT: '#19753C',
        },
        blue: {
          DEFAULT: '#0051C4',
          hover: '#1E3A8A'
        },
        red: {
          DEFAULT: "#CE0600"
        },
        gray: {
          hover: '#F3F4F6'
        },
        // Thème Clair
        light: {
          primary: '#0051C4',    // Bleu clair
          secondary: '#FFFFFF',  // blanc clair
        },
        // Thème Sombre
        dark: {
          primary: '#1E3A8A',    // Bleu foncé
          secondary: '#1F2937',  // noir foncé
        },
      },
    },
  },
  plugins: [
    require('flowbite/plugin')
  ],
}
