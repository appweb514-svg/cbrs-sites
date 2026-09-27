import type { CollectionConfig } from 'payload'

import { accesSection, cacheSansDroit, publieOuEditeur, verifierPublication } from '../access'
import { lienField } from '../fields/lien'

export const VieDuClub: CollectionConfig = {
  slug: 'vie-du-club',
  labels: { singular: 'Actualité', plural: 'Vie du club' },
  admin: {
    useAsTitle: 'titre',
    defaultColumns: ['titre', 'date', 'categorie', '_status'],
    group: 'Vie du club',
    hidden: cacheSansDroit('vie-du-club'),
    description: 'Actualités affichées sur la page d’accueil, section « Vie du club ».',
  },
  defaultSort: '-date',
  versions: { drafts: true },
  access: accesSection('vie-du-club', publieOuEditeur('vie-du-club')),
  hooks: { beforeChange: [verifierPublication('vie-du-club')] },
  fields: [
    { name: 'titre', label: 'Titre', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        { name: 'date', label: 'Date', type: 'date', required: true, admin: { date: { displayFormat: 'dd/MM/yyyy' } } },
        {
          name: 'categorie',
          label: 'Catégorie',
          type: 'select',
          required: true,
          defaultValue: 'club',
          options: [
            { label: 'Club', value: 'club' },
            { label: 'Sortie', value: 'sortie' },
            { label: 'Événement', value: 'evenement' },
          ],
        },
      ],
    },
    { name: 'image', label: 'Photo', type: 'upload', relationTo: 'media' },
    { name: 'resume', label: 'Résumé', type: 'textarea', required: true, maxLength: 240 },
    lienField({ label: 'Lien « En savoir plus »', description: 'Choisissez une page, une activité ou une sortie du site.' }),
  ],
}
