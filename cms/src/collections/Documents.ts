import type { CollectionConfig } from 'payload'

import { canEdit, hiddenUnless } from '../access'

export const Documents: CollectionConfig = {
  slug: 'documents',
  labels: { singular: 'Document', plural: 'Documents (PDF)' },
  admin: {
    useAsTitle: 'titre',
    defaultColumns: ['titre', 'rubrique', 'updatedAt'],
    group: 'Vie associative',
    hidden: hiddenUnless('bureau'),
    description: 'Statuts, règlement intérieur, fiche d’adhésion, assurance, imprimé fédéral.',
  },
  access: {
    read: () => true,
    create: canEdit('bureau'),
    update: canEdit('bureau'),
    delete: canEdit('bureau'),
  },
  fields: [
    { name: 'titre', label: 'Titre', type: 'text', required: true },
    {
      name: 'rubrique',
      label: 'Rubrique',
      type: 'select',
      required: true,
      options: [
        { label: 'Statuts', value: 'statuts' },
        { label: 'Règlement intérieur', value: 'reglement' },
        { label: 'Fiche d’adhésion', value: 'adhesion' },
        { label: 'Déclaration d’assurance', value: 'assurance' },
        { label: 'Imprimé fédéral', value: 'federal' },
        { label: 'Autre', value: 'autre' },
      ],
    },
    { name: 'description', label: 'Description', type: 'textarea' },
  ],
  upload: { mimeTypes: ['application/pdf'] },
}
