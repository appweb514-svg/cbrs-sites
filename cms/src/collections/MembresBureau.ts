import type { CollectionConfig } from 'payload'

import { canEdit, hiddenUnless } from '../access'

export const MembresBureau: CollectionConfig = {
  slug: 'membres-bureau',
  labels: { singular: 'Membre du bureau', plural: 'Présentation du bureau' },
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'fonction', 'ordre'],
    group: 'Accueil',
    hidden: hiddenUnless('bureau'),
    description: 'Section « Présentation du bureau » de la page d’accueil. Accord écrit des personnes requis pour la photo.',
  },
  defaultSort: 'ordre',
  access: {
    read: () => true,
    create: canEdit('bureau'),
    update: canEdit('bureau'),
    delete: canEdit('bureau'),
  },
  fields: [
    { name: 'nom', label: 'Prénom et nom', type: 'text', required: true },
    { name: 'fonction', label: 'Fonction', type: 'text', required: true, admin: { description: 'Ex. : Présidente, Trésorier…' } },
    { name: 'photo', label: 'Photo', type: 'upload', relationTo: 'media' },
    { name: 'ordre', label: 'Ordre d’affichage', type: 'number', defaultValue: 10 },
  ],
}
