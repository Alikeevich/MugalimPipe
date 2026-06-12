/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'San Francisco', 'SF Pro Display', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        'carmine': {
          /* burgundy palette */
          50: '#F5E6E8',
          100: '#EACCCD',
          500: '#800020',
          600: '#70001C',
          700: '#600018',
          800: '#500014',
        },
        'apple-gray': {
          50: '#F9F9F9',
          100: '#F5F5F7',
          200: '#EFEFEF',
          300: '#E5E5EA',
          400: '#D1D1D6',
          500: '#A1A1A6',
        }
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '16px' }],
        'sm': ['13px', { lineHeight: '19px' }],
        'base': ['15px', { lineHeight: '22px' }],
        'lg': ['17px', { lineHeight: '25px' }],
        'xl': ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['28px', { lineHeight: '36px' }],
        '4xl': ['32px', { lineHeight: '40px' }],
        '5xl': ['40px', { lineHeight: '48px' }],
      }
    },
  },
  plugins: [],
};
