/** Configuration unique, reprise à l'identique du `tailwind.config` inline des pages. */
module.exports = {
  content: ['../../site3/*.html', '../../site3/*.js'],
  theme: {
    extend: {
      colors: {
        'cbrs-blue': '#0a3273', 'cbrs-blue-light': '#1e4b99', 'cbrs-green': '#437c14',
        'cbrs-green-hover': '#3b6e11', 'cbrs-teal': '#145c75', 'cbrs-gray-100': '#f8f9fa',
        'cbrs-gray-200': '#e9ecef', 'cbrs-text': '#333333', 'cbrs-text-light': '#666666',
      },
      boxShadow: {
        card: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
        'card-hover': '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/container-queries')],
}
