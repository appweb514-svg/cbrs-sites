import type { CollectionConfig } from 'payload'

import { hasRole, hiddenUnless, isAdmin, isAdminField, ROLES } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Bénévole', plural: 'Bénévoles' },
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'email', 'roles'],
    group: 'Administration',
    hidden: hiddenUnless('admin'),
  },
  auth: true,
  access: {
    admin: ({ req: { user } }) => Boolean(user),
    create: isAdmin,
    delete: isAdmin,
    read: ({ req: { user } }) => {
      if (!user) return false
      if (hasRole(user, 'admin')) return true
      return { id: { equals: user.id } }
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (hasRole(user, 'admin')) return true
      return { id: { equals: user.id } }
    },
  },
  fields: [
    { name: 'nom', label: 'Nom', type: 'text', required: true },
    {
      name: 'roles',
      label: 'Rôles',
      type: 'select',
      hasMany: true,
      required: true,
      options: [...ROLES],
      saveToJWT: true,
      access: { create: isAdminField, update: isAdminField },
      admin: { description: 'Détermine les sections que le bénévole peut modifier.' },
    },
  ],
}
