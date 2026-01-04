/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#1e40af', // rgb(30 64 175)
          700: '#1e3a8a', // rgb(30 58 138)
          800: '#1e3a8a',
          900: '#1e3a8a',
          DEFAULT: '#1e40af',
        },
        accent: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#6d28d9', // rgb(109 40 217)
          700: '#5b21b6',
          DEFAULT: '#6d28d9',
        },
        // Dark mode background
        dark: {
          bg: '#030620', // rgb(3 6 32)
          card: '#0a0f2e',
          border: '#1e2a4a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
