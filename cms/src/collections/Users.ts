import { APIError } from 'payload'
import type { CollectionConfig, PayloadRequest } from 'payload'

import { cacheSaufAdmin, estAdmin, isAdmin, isAdminField } from '../access'

const autresAdmins = async (req: PayloadRequest, id: number | string) =>
  (
    await req.payload.count({
      collection: 'users',
      where: { and: [{ estAdministrateur: { equals: true } }, { id: { not_equals: id } }] },
      req,
    })
  ).totalDocs

const DERNIER_ADMIN = 'Impossible : c’est le dernier administrateur. Nommez d’abord un autre administrateur.'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Bénévole', plural: 'Bénévoles' },
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'email', 'estAdministrateur', 'roles'],
    group: 'Administration',
    hidden: cacheSaufAdmin,
  },
  // Rôles peuplés sur l'utilisateur connecté : les droits sont calculés sans requête supplémentaire.
  auth: { depth: 1 },
  access: {
    admin: ({ req: { user } }) => Boolean(user),
    create: isAdmin,
    delete: isAdmin,
    read: ({ req: { user } }) => {
      if (!user) return false
      if (estAdmin(user)) return true
      return { id: { equals: user.id } }
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (estAdmin(user)) return true
      return { id: { equals: user.id } }
    },
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, originalDoc, req }) => {
        // Premier compte créé (écran « Créer le premier utilisateur ») : administrateur.
        if (operation === 'create' && (await req.payload.count({ collection: 'users', req })).totalDocs === 0) {
          return { ...data, estAdministrateur: true }
        }
        if (operation === 'update' && originalDoc?.estAdministrateur && data.estAdministrateur === false) {
          if ((await autresAdmins(req, originalDoc.id)) === 0) throw new APIError(DERNIER_ADMIN, 400, undefined, true)
        }
        return data
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        const doc = await req.payload.findByID({ collection: 'users', id, depth: 0, req })
        if (doc.estAdministrateur && (await autresAdmins(req, id)) === 0) {
          throw new APIError(DERNIER_ADMIN, 400, undefined, true)
        }
      },
    ],
  },
  fields: [
    { name: 'nom', label: 'Nom', type: 'text', required: true },
    {
      name: 'estAdministrateur',
      label: 'Administrateur (tous les droits)',
      type: 'checkbox',
      defaultValue: false,
      saveToJWT: true,
      access: { create: isAdminField, update: isAdminField },
      admin: {
        position: 'sidebar',
        description: 'Gère les bénévoles, les rôles, les paramètres et l’apparence du site.',
      },
    },
    {
      name: 'roles',
      label: 'Rôles',
      type: 'relationship',
      relationTo: 'roles',
      hasMany: true,
      saveToJWT: true,
      access: { create: isAdminField, update: isAdminField },
      admin: {
        description: 'Détermine les sections que le bénévole peut voir, modifier ou publier (menu Administration › Rôles).',
      },
    },
  ],
}
