/** Configuration unique, reprise à l'identique du `tailwind.config` inline des pages. */
module.exports = {
  content: ['../../site3/*.html', '../../site3/*.js'],
  theme: {
    extend: {
      colors: {
        // Couleurs pilotées par l'Apparence du CMS (variables posées par cms-client.js), valeurs d'origine par défaut.
        'cbrs-blue': 'rgb(var(--cbrs-blue-rgb, 10 50 115) / <alpha-value>)',
        'cbrs-blue-light': 'rgb(var(--cbrs-blue-light-rgb, 30 75 153) / <alpha-value>)',
        'cbrs-green': 'rgb(var(--cbrs-green-rgb, 67 124 20) / <alpha-value>)',
        'cbrs-green-hover': 'rgb(var(--cbrs-green-hover-rgb, 59 110 17) / <alpha-value>)',
        'cbrs-teal': 'rgb(var(--cbrs-teal-rgb, 20 92 117) / <alpha-value>)',
        'cbrs-gray-100': '#f8f9fa',
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
