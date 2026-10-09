import type { GlobalConfig } from 'payload'

import { cacheSansDroit, peut } from '../access'

export const Tarifs: GlobalConfig = {
  slug: 'tarifs',
  label: 'Adhérer (tarifs)',
  admin: {
    components: { elements: { beforeDocumentControls: ['/admin/VoirPage#VoirPage'] } },
    group: 'Vie du club',
    hidden: cacheSansDroit('tarifs'),
    description:
      'Page « Adhérer » : grille tarifaire, affichée dans l’ordre saisi. Pour mettre en ligne la fiche d’adhésion (PDF) : Photos & documents → Documents → Créer, puis « Remplace le lien officiel » = « Fiche d’adhésion (page Adhésion) ».',
  },
  access: {
    read: () => true,
    readVersions: peut('tarifs', 'voir'),
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
