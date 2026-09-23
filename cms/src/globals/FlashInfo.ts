import type { GlobalConfig } from 'payload'

import { canEdit, hiddenUnless } from '../access'

export const FlashInfo: GlobalConfig = {
  slug: 'flash-info',
  label: 'Flash info',
  admin: {
    group: 'Accueil',
    hidden: hiddenUnless('bureau'),
    description: 'Bandeau défilant de la page d’accueil.',
  },
  access: {
    read: () => true,
    update: canEdit('bureau'),
  },
  fields: [
    { name: 'actif', label: 'Afficher le bandeau', type: 'checkbox', defaultValue: true },
    { name: 'message', label: 'Message', type: 'text', required: true, maxLength: 200 },
  ],
}
