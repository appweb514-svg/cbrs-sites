import type { CollectionConfig } from 'payload'

import { canEdit, hasRole, hiddenUnless, isAdminField, ownActivityOrEditor, publishedOrEditor } from '../access'

export const Activites: CollectionConfig = {
  slug: 'activites',
  labels: { singular: 'Activité', plural: 'Activités' },
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'referents', '_status'],
    group: 'Activités',
    hidden: hiddenUnless('bureau', 'activites'),
    description: 'Chaque responsable ne voit et ne modifie que les activités dont il est référent.',
  },
  defaultSort: 'nom',
  versions: { drafts: true },
  access: {
    read: (args) => {
      const { user } = args.req
      if (user && !hasRole(user, 'bureau')) {
        return ownActivityOrEditor(args)
      }
      return publishedOrEditor('bureau')(args)
    },
    create: canEdit('bureau'),
    update: ownActivityOrEditor,
    delete: canEdit('bureau'),
  },
  fields: [
    { name: 'nom', label: 'Nom de l’activité', type: 'text', required: true },
    { name: 'icone', label: 'Icône', type: 'upload', relationTo: 'media' },
    { name: 'description', label: 'Description courte', type: 'textarea', required: true, maxLength: 240 },
    { name: 'presentation', label: 'Présentation', type: 'textarea' },
    {
      name: 'creneaux',
      label: 'Créneaux',
      labels: { singular: 'Créneau', plural: 'Créneaux' },
      type: 'array',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'jour',
              label: 'Jour',
              type: 'select',
              required: true,
              options: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche', 'Voir planning'],
            },
            { name: 'horaire', label: 'Horaire', type: 'text', required: true, admin: { placeholder: '9h-12h' } },
            { name: 'lieu', label: 'Lieu', type: 'text', required: true },
          ],
        },
      ],
    },
    { name: 'pointRencontre', label: 'Point de rendez-vous', type: 'text' },
    {
      name: 'infos',
      label: 'Infos pratiques',
      labels: { singular: 'Info', plural: 'Infos pratiques' },
      type: 'array',
      fields: [{ name: 'texte', label: 'Texte', type: 'text', required: true }],
    },
    {
      name: 'referents',
      label: 'Référents (bénévoles autorisés à modifier)',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      access: { create: isAdminField, update: isAdminField },
      admin: { position: 'sidebar', description: 'Seul un administrateur peut changer les référents.' },
    },
  ],
}
