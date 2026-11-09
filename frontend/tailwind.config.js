/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
      },
      colors: {
        carbon: {
          950: '#09090B',
          900: '#18181B',
          800: '#27272A',
        },
        ash: {
          100: '#F4F4F5',
          200: '#E4E4E7',
          300: '#D4D4D8',
          600: '#52525B',
          700: '#3F3F46',
        }
      }
    },
  },
  plugins: [],
};
