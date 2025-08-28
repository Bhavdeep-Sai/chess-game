/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'slide-in-left': 'slideInLeft 0.4s ease-out',
        'pulse-check': 'pulse-check 1s ease-in-out 2',
        'subtle-pulse': 'subtle-pulse 2.5s ease-in-out infinite',
        'capture-glow': 'capture-glow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          'from': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        slideInRight: {
          'from': {
            transform: 'translateX(100%)',
            opacity: '0',
          },
          'to': {
            transform: 'translateX(0)',
            opacity: '1',
          },
        },
        slideInLeft: {
          'from': {
            transform: 'translateX(-100%)',
            opacity: '0',
          },
          'to': {
            transform: 'translateX(0)',
            opacity: '1',
          },
        },
        'pulse-check': {
          '0%, 100%': {
            opacity: '1',
            transform: 'scale(1)',
            filter: 'none',
          },
          '50%': {
            opacity: '1',
            transform: 'scale(1.05)',
            filter: 'saturate(150%) brightness(110%)',
          },
        },
        'subtle-pulse': {
          '0%, 100%': { 
            opacity: '0.8',
            transform: 'scale(1)',
          },
          '50%': { 
            opacity: '1',
            transform: 'scale(1.1)',
          },
        },
        'capture-glow': {
          '0%, 100%': { 
            boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.4)',
          },
          '50%': { 
            boxShadow: '0 0 0 8px rgba(239, 68, 68, 0.1)',
          },
        },
      },
      colors: {
        'chess-light': '#f0d9b5',
        'chess-dark': '#b58863',
        'chess-border': '#8b4513',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
