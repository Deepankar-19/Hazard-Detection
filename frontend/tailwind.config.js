/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'hazard-low': '#22c55e',    // green-500
        'hazard-medium': '#f97316', // orange-500
        'hazard-high': '#ef4444',   // red-500
        primary: {
          50: '#eef2ff',  // indigo-50
          100: '#e0e7ff', // indigo-100
          500: '#6366f1', // indigo-500
          600: '#4f46e5', // indigo-600
          700: '#4338ca', // indigo-700
          800: '#3730a3', // indigo-800
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
