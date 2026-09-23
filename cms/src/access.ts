import type { Access, ClientUser, FieldAccess, Where } from 'payload'

export const ROLES = [
  { label: 'Administrateur', value: 'admin' },
  { label: 'Bureau', value: 'bureau' },
  { label: "Responsable d'activité", value: 'activites' },
  { label: 'Équipe Sorties & Voyages', value: 'sorties' },
  { label: 'Équipe Galerie', value: 'galerie' },
] as const

export type Role = (typeof ROLES)[number]['value']

type UserLike = { id?: number | string; roles?: Role[] | null } | ClientUser | null | undefined

export const hasRole = (user: UserLike, ...roles: Role[]): boolean => {
  const userRoles = ((user as { roles?: Role[] | null } | null)?.roles ?? []) as Role[]
  return userRoles.includes('admin') || roles.some((role) => userRoles.includes(role))
}

export const isAdmin: Access = ({ req: { user } }) => hasRole(user, 'admin')

export const isAdminField: FieldAccess = ({ req: { user } }) => hasRole(user, 'admin')

export const canEdit =
  (...roles: Role[]): Access =>
  ({ req: { user } }) =>
    hasRole(user, ...roles)

export const hiddenUnless =
  (...roles: Role[]) =>
  ({ user }: { user: UserLike }): boolean =>
    !hasRole(user, ...roles)

export const publishedOrEditor =
  (...roles: Role[]): Access =>
  ({ req: { user } }) => {
    if (hasRole(user, ...roles)) return true
    return { _status: { equals: 'published' } } satisfies Where
  }

export const ownActivityOrEditor: Access = ({ req: { user } }) => {
  if (!user) return false
  if (hasRole(user, 'bureau')) return true
  if (hasRole(user, 'activites')) return { referents: { in: [user.id] } } satisfies Where
  return false
}
