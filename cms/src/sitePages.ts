// Pages publiques du site (adresses propres servies par vercel.json).
// Source unique des listes déroulantes « Page du site » de l'administration.
export const SITE_PAGES = [
  { label: 'Accueil', value: '/' },
  { label: 'Activités', value: '/activites' },
  { label: 'Planning', value: '/planning' },
  { label: 'Sorties & voyages', value: '/sorties-voyages' },
  { label: 'Galerie photo', value: '/galerie' },
  { label: 'Adhésion', value: '/adhesion' },
  { label: 'Formation', value: '/formation' },
  { label: 'Événement', value: '/evenement' },
  { label: 'Statuts et règlement', value: '/statuts' },
  { label: 'Liens utiles et documents', value: '/liens-utiles' },
  { label: 'Contact', value: '/contact' },
  { label: 'Mentions légales', value: '/mentions-legales' },
  { label: 'Conditions d’utilisation', value: '/conditions-utilisation' },
] as const

export type SitePage = (typeof SITE_PAGES)[number]['value']
