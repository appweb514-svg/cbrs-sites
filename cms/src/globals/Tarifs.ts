import type { GlobalConfig } from 'payload'

import { canEdit, hiddenUnless } from '../access'

export const Tarifs: GlobalConfig = {
  slug: 'tarifs',
  label: 'Tarifs',
  admin: {
    group: 'Vie associative',
    hidden: hiddenUnless('bureau'),
    description: 'Grille tarifaire de la page Adhésion, affichée dans l’ordre saisi.',
  },
  access: {
    read: () => true,
    update: canEdit('bureau'),
  },
  fields: [
    {
      name: 'lignes',
      label: 'Lignes',
      labels: { singular: 'Ligne', plural: 'Lignes' },
      type: 'array',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'montant',
              label: 'Montant',
              type: 'text',
              required: true,
              admin: { placeholder: '49 €' },
            },
            { name: 'libelle', label: 'Libellé', type: 'text', required: true },
          ],
        },
      ],
    },
  ],
}
