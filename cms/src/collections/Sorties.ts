import type { CollectionConfig } from 'payload'

import { canEdit, hiddenUnless, publishedOrEditor } from '../access'

export const Sorties: CollectionConfig = {
  slug: 'sorties',
  labels: { singular: 'Sortie', plural: 'Sorties & Voyages' },
  admin: {
    useAsTitle: 'titre',
    defaultColumns: ['titre', 'type', 'date', '_status'],
    group: 'Sorties & Voyages',
    hidden: hiddenUnless('sorties', 'bureau'),
    description:
      'Manifestations, sorties à la journée et voyages. Seuls les documents publiés apparaissent sur le site.',
  },
  defaultSort: 'date',
  versions: { drafts: true },
  access: {
    read: publishedOrEditor('sorties', 'bureau'),
    create: canEdit('sorties', 'bureau'),
    update: canEdit('sorties', 'bureau'),
    delete: canEdit('sorties', 'bureau'),
  },
  fields: [
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      required: true,
      defaultValue: 'sortie',
      options: [
        { label: 'Manifestation', value: 'manifestation' },
        { label: 'Sortie', value: 'sortie' },
        { label: 'Voyage', value: 'voyage' },
      ],
    },
    { name: 'titre', label: 'Titre', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        {
          name: 'date',
          label: 'Date',
          type: 'date',
          required: true,
          admin: { date: { displayFormat: 'dd/MM/yyyy' } },
        },
        { name: 'lieu', label: 'Lieu', type: 'text', required: true },
      ],
    },
    { name: 'image', label: 'Photo', type: 'upload', relationTo: 'media' },
    { name: 'resume', label: 'Résumé', type: 'textarea', required: true, maxLength: 240 },
    { name: 'description', label: 'Description', type: 'textarea' },
  ],
}
