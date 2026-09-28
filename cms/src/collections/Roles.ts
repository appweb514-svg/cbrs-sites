import type { CollectionConfig } from 'payload'

import { ACTIONS, cacheSaufAdmin, estAdmin, isAdmin, SECTIONS } from '../access'

export const Roles: CollectionConfig = {
  slug: 'roles',
  labels: { singular: 'Rôle', plural: 'Rôles' },
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'description'],
    group: 'Administration',
    hidden: cacheSaufAdmin,
    description:
      'Chaque rôle regroupe des droits par section. Un bénévole peut avoir plusieurs rôles ; ses droits s’additionnent.',
  },
  defaultSort: 'nom',
  access: {
    // Un bénévole connecté lit ses propres rôles (affichage de l'administration) ; seul l'administrateur les gère.
    read: ({ req: { user } }) => {
      if (!user) return false
      if (estAdmin(user)) return true
      const ids = ((user.roles as unknown[] | undefined) ?? []).map((role) =>
        typeof role === 'object' && role !== null ? (role as { id: number }).id : role,
      )
      return { id: { in: ids } }
    },
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
    readVersions: isAdmin,
  },
  fields: [
    { name: 'nom', label: 'Nom du rôle', type: 'text', required: true, unique: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    {
      name: 'permissions',
      label: 'Droits',
      labels: { singular: 'Droit', plural: 'Droits' },
      type: 'array',
      admin: {
        description:
          '« Voir » affiche la section dans l’administration. « Publier » permet de mettre en ligne ; sans ce droit, seuls les brouillons sont possibles.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'section',
              label: 'Section',
              type: 'select',
              required: true,
              options: SECTIONS.map(({ label, value }) => ({ label, value })),
            },
            {
              name: 'actions',
              label: 'Actions autorisées',
              type: 'select',
              hasMany: true,
              required: true,
              options: ACTIONS.map(({ label, value }) => ({ label, value })),
            },
          ],
        },
      ],
    },
    {
      name: 'activitesAutorisees',
      label: 'Limiter aux activités',
      type: 'relationship',
      relationTo: 'activites',
      hasMany: true,
      admin: {
        description:
          'Laisser vide pour toutes les activités. Sinon, les droits sur la section « Activités » ne concernent que celles-ci (ex. : responsable Jeux de cartes).',
      },
    },
  ],
}
