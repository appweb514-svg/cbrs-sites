import type { GlobalConfig } from 'payload'

import { cacheSansDroit, peut } from '../access'

export const Tarifs: GlobalConfig = {
  slug: 'tarifs',
  label: 'Adhérer',
  admin: {
    components: { elements: { beforeDocumentControls: ['/admin/VoirPage#VoirPage'] } },
    group: 'Vie du club',
    hidden: cacheSansDroit('tarifs'),
    description:
      'Fiche d’adhésion (bouton de la page « Adhérer ») et grille tarifaire (encadré « Envie de nous rejoindre ? » de la page Planning), affichée dans l’ordre saisi.',
  },
  access: {
    read: () => true,
    readVersions: peut('tarifs', 'voir'),
    update: peut('tarifs', 'modifier'),
  },
  fields: [
    {
      name: 'ficheAdhesion',
      label: 'Fiche d’adhésion (PDF)',
      type: 'upload',
      relationTo: 'documents',
      admin: {
        description:
          'Choisissez la fiche déjà déposée ou cliquez sur « Créer nouveau » pour envoyer le PDF de la saison. Le bouton « Fiche d’adhésion » de la page Adhérer pointera vers ce fichier (laisser « Afficher dans la liste des documents » coché).',
      },
    },
    {
      name: 'lignes',
      label: 'Tarifs',
      labels: { singular: 'Tarif', plural: 'Tarifs' },
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
