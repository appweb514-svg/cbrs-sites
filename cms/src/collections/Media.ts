import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { peut } from '../access'

// Un formulaire ouvert avant un renommage renvoie l'ancien nom de fichier (celui qu'il connaît) :
// comme le fichier correspondant a été supprimé, l'enregistrer casserait la photo. Sans nouveau
// fichier, on garde donc le nom déjà enregistré.
const garderNomFichier: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  if (req.file || !data?.filename || !originalDoc?.filename) return data
  if (data.filename === originalDoc.filename) return data
  return { ...data, filename: originalDoc.filename }
}

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Photo', plural: 'Photothèque' },
  admin: {
    // Hors du menu : on ouvre une photo depuis la galerie du site (ou par son adresse).
    group: false,
    // Titre = description : le nom du fichier n'apparaît nulle part avec son extension.
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'credit'],
    description:
      'Toutes les photos du site. Ouvrez-en une pour la renommer ou voir ses propriétés ; « Modifier l’image » recadre, choisit le point d’intérêt et ajoute filtres, texte ou contours. La mise en avant sur le site se gère dans « Galerie photo ».',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: peut('media', 'modifier'),
    delete: peut('media', 'supprimer'),
    readVersions: peut('media', 'voir'),
  },
  hooks: {
    beforeChange: [garderNomFichier],
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
