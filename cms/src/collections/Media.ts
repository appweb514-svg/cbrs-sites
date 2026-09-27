import type { CollectionConfig } from 'payload'

import { peut } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Photo', plural: 'Photothèque' },
  admin: {
    // Hors du menu : on ouvre une photo depuis la galerie du site (ou par son adresse).
    group: false,
    defaultColumns: ['filename', 'alt', 'credit'],
    description:
      'Toutes les photos du site. Ouvrez-en une pour la renommer ou voir ses propriétés ; « Modifier l’image » recadre et choisit le point d’intérêt. La mise en avant sur le site se gère dans « Galerie photo ».',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: peut('media', 'modifier'),
    delete: peut('media', 'supprimer'),
  },
  fields: [
    {
      name: 'renommer',
      type: 'ui',
      admin: { components: { Field: '/admin/RenommerFichier#RenommerFichier' } },
    },
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
    {
      // Redéclaré pour rendre le nom visible dans la liste (Payload fusionne avec le champ d'upload).
      name: 'filename',
      type: 'text',
      admin: { hidden: false, readOnly: true, components: { Cell: '/admin/NomFichierCellule#NomFichierCellule' } },
    },
    {
      name: 'retouche',
      type: 'ui',
      admin: { components: { Field: '/admin/EditeurPhoto#EditeurPhoto' } },
    },
    {
      name: 'proprietes',
      type: 'ui',
      admin: { position: 'sidebar', components: { Field: '/admin/ProprietesPhoto#ProprietesPhoto' } },
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
