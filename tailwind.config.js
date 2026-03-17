/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#59B1C9', // Correct teal from the reference site
          dark: '#4AA1B7',
          light: '#F2F9FB',
        },
        dark: '#1B2336', // Dark blue for headings/footer
        gray: {
          text: '#6B7280',
          border: '#E5E7EB',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'grid-pattern': "url('data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='1' fill='%2359B1C9' fill-opacity='0.1' /%3E%3C/svg%3E')",
      }
    },
  },
  plugins: [],
}
