import type { CollectionConfig } from 'payload'

import { canEdit, hiddenUnless, publishedOrEditor } from '../access'

export const VieDuClub: CollectionConfig = {
  slug: 'vie-du-club',
  labels: { singular: 'Actualité', plural: 'Vie du club' },
  admin: {
    useAsTitle: 'titre',
    defaultColumns: ['titre', 'date', 'categorie', '_status'],
    group: 'Accueil',
    hidden: hiddenUnless('bureau'),
    description: 'Actualités affichées sur la page d’accueil, section « Vie du club ».',
  },
  defaultSort: '-date',
  versions: { drafts: true },
  access: {
    read: publishedOrEditor('bureau'),
    create: canEdit('bureau'),
    update: canEdit('bureau'),
    delete: canEdit('bureau'),
  },
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
    { name: 'lien', label: 'Lien « En savoir plus »', type: 'text' },
  ],
}
