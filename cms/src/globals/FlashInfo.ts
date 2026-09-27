import type { GlobalConfig } from 'payload'

import { cacheSansDroit, peut } from '../access'

export const FlashInfo: GlobalConfig = {
  slug: 'flash-info',
  label: 'Flash info',
  admin: {
    group: 'Vie du club',
    hidden: cacheSansDroit('flash-info'),
    description: 'Bandeau défilant de la page d’accueil.',
  },
  access: {
    read: () => true,
    update: peut('flash-info', 'modifier'),
  },
  fields: [
    { name: 'actif', label: 'Afficher le bandeau', type: 'checkbox', defaultValue: true },
    { name: 'message', label: 'Message', type: 'text', required: true, maxLength: 200 },
  ],
}
