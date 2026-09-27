import type { CollectionConfig } from 'payload'

import { cacheSansDroit, peut } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Photo', plural: 'Photos' },
  admin: {
    group: 'Médiathèque',
    hidden: cacheSansDroit('media'),
    description: 'Ouvrez une photo puis « Modifier l’image » pour la recadrer ou choisir son point d’intérêt.',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: peut('media', 'modifier'),
    delete: peut('media', 'supprimer'),
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
    // Éditeur intégré : recadrage et point d'intérêt (centre conservé dans les vignettes).
    crop: true,
    focalPoint: true,
    adminThumbnail: 'vignette',
    imageSizes: [
      { name: 'vignette', width: 480 },
      { name: 'large', width: 1600 },
    ],
  },
}
