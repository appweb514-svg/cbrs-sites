import type { CollectionConfig } from 'payload'

import { canEdit } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Photo', plural: 'Photos' },
  admin: { group: 'Médiathèque' },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: canEdit('bureau', 'galerie'),
    delete: canEdit('bureau', 'galerie'),
  },
  fields: [
    {
      name: 'alt',
      label: 'Description de la photo',
      type: 'text',
      required: true,
      admin: { description: 'Lue par les lecteurs d’écran : décrivez ce que montre la photo.' },
    },
    {
      name: 'credit',
      label: 'Crédit photo',
      type: 'text',
      admin: { description: 'Auteur et licence si la photo ne vient pas du club.' },
    },
  ],
  upload: {
    mimeTypes: ['image/*'],
    imageSizes: [
      { name: 'vignette', width: 480 },
      { name: 'large', width: 1600 },
    ],
  },
}
