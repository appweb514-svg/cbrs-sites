import type { CollectionConfig } from 'payload'

import { canEdit, hiddenUnless } from '../access'

export const Galerie: CollectionConfig = {
  slug: 'galerie',
  labels: { singular: 'Photo de galerie', plural: 'Galerie' },
  admin: {
    useAsTitle: 'legende',
    defaultColumns: ['album', 'annee', 'photo'],
    group: 'Médiathèque',
    hidden: hiddenUnless('galerie', 'bureau'),
    description: 'Photos mises en avant sur le site, regroupées par album et par année.',
  },
  defaultSort: '-annee',
  access: {
    read: () => true,
    create: canEdit('galerie', 'bureau'),
    update: canEdit('galerie', 'bureau'),
    delete: canEdit('galerie', 'bureau'),
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'album', label: 'Album', type: 'text' },
        { name: 'annee', label: 'Année', type: 'number' },
      ],
    },
    { name: 'photo', label: 'Photo', type: 'upload', relationTo: 'media', required: true },
    { name: 'legende', label: 'Légende', type: 'text' },
  ],
}
