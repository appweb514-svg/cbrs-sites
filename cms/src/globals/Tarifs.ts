import type { GlobalConfig } from 'payload'

import { cacheSansDroit, peut } from '../access'

export const Tarifs: GlobalConfig = {
  slug: 'tarifs',
  label: 'Tarifs',
  admin: {
    group: 'Vie du club',
    hidden: cacheSansDroit('tarifs'),
    description: 'Grille tarifaire de la page Adhésion, affichée dans l’ordre saisi.',
  },
  access: {
    read: () => true,
    update: peut('tarifs', 'modifier'),
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
