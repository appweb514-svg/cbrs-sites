import { APIError } from 'payload'
import type { Access, ClientUser, CollectionBeforeChangeHook, FieldAccess, Where } from 'payload'

// Sections de l'administration auxquelles un rôle peut donner des droits.
// Bénévoles, Rôles et Paramètres restent réservés aux administrateurs.
export const SECTIONS = [
  { label: 'Vie du club (actualités)', value: 'vie-du-club' },
  { label: 'Présentation du bureau', value: 'membres-bureau' },
  { label: 'Activités', value: 'activites' },
  { label: 'Sorties & Voyages', value: 'sorties' },
  { label: 'Galerie', value: 'galerie' },
  { label: 'Documents (PDF)', value: 'documents' },
  { label: 'Photos (médiathèque)', value: 'media' },
  { label: 'Flash info', value: 'flash-info' },
  { label: 'Page Formation', value: 'formation' },
  { label: 'Tarifs', value: 'tarifs' },
  { label: 'Apparence du site', value: 'apparence' },
] as const

export const ACTIONS = [
  { label: 'Voir', value: 'voir' },
  { label: 'Créer', value: 'creer' },
  { label: 'Modifier', value: 'modifier' },
  { label: 'Publier', value: 'publier' },
  { label: 'Supprimer', value: 'supprimer' },
] as const

export type Section = (typeof SECTIONS)[number]['value']
export type Action = (typeof ACTIONS)[number]['value']

type RoleLike = {
  id?: number | string
  permissions?: { section?: string | null; actions?: string[] | null }[] | null
  activitesAutorisees?: (number | string | { id: number | string })[] | null
}

type UserLike =
  | { id?: number | string; estAdministrateur?: boolean | null; roles?: (number | string | RoleLike)[] | null }
  | ClientUser
  | null
  | undefined

const idOf = (value: number | string | { id: number | string }) => (typeof value === 'object' ? value.id : value)

// Les rôles sont peuplés sur req.user (auth.depth = 1). Un rôle non peuplé ne donne aucun droit.
const rolesOf = (user: UserLike): RoleLike[] =>
  (((user as { roles?: unknown[] } | null)?.roles ?? []) as unknown[]).filter(
    (role): role is RoleLike => typeof role === 'object' && role !== null,
  )

export const estAdmin = (user: UserLike): boolean =>
  Boolean((user as { estAdministrateur?: boolean | null } | null)?.estAdministrateur)

// Droits d'un utilisateur sur une section.
// `activites` : null = toutes les activités, sinon la liste des activités autorisées.
export const droits = (
  user: UserLike,
  section: Section,
  action: Action,
): { autorise: boolean; activites: (number | string)[] | null } => {
  if (!user) return { autorise: false, activites: [] }
  if (estAdmin(user)) return { autorise: true, activites: null }
  let autorise = false
  let limitees: (number | string)[] | null = []
  for (const role of rolesOf(user)) {
    const accorde = (role.permissions ?? []).some((p) => p.section === section && (p.actions ?? []).includes(action))
    if (!accorde) continue
    autorise = true
    const ids = (role.activitesAutorisees ?? []).map(idOf)
    if (ids.length === 0) limitees = null
    else if (limitees) limitees.push(...ids)
  }
  return { autorise, activites: autorise ? limitees : [] }
}

export const peutFaire = (user: UserLike, section: Section, action: Action): boolean =>
  droits(user, section, action).autorise

// Accès Payload : restreint aux activités autorisées pour la section « activites ».
export const peut =
  (section: Section, action: Action): Access =>
  ({ req: { user } }) => {
    const { autorise, activites } = droits(user, section, action)
    if (!autorise) return false
    if (section === 'activites' && activites) return { id: { in: activites } } satisfies Where
    return true
  }

// Lecture : les éditeurs de la section voient aussi les brouillons, les visiteurs le publié seulement.
export const publieOuEditeur =
  (section: Section): Access =>
  (args) => {
    const acces = peut(section, 'voir')(args)
    if (acces) return acces
    return { _status: { equals: 'published' } } satisfies Where
  }

export const isAdmin: Access = ({ req: { user } }) => estAdmin(user)

export const isAdminField: FieldAccess = ({ req: { user } }) => estAdmin(user)

// admin.hidden : la section n'apparaît que pour ceux qui ont le droit « voir ».
export const cacheSansDroit =
  (section: Section) =>
  ({ user }: { user: UserLike }): boolean =>
    !peutFaire(user, section, 'voir')

export const cacheSaufAdmin = ({ user }: { user: UserLike }): boolean => !estAdmin(user)

// Publier (passer en « publié ») exige le droit « publier » ; sinon l'enregistrement reste possible en brouillon.
export const verifierPublication =
  (section: Section): CollectionBeforeChangeHook =>
  ({ data, req: { user } }) => {
    if (user && data?._status === 'published' && !peutFaire(user, section, 'publier')) {
      throw new APIError(
        'Vous pouvez enregistrer un brouillon, mais pas publier : demandez à une personne autorisée de publier.',
        403,
        undefined,
        true,
      )
    }
    return data
  }

// Droits CRUD standard d'une section.
// `readVersions` ouvre l'historique (et le bouton « Revenir en arrière ») à ceux qui voient la section ;
// sans lui, Payload réserve les versions à son propre administrateur, qui n'existe pas ici.
export const accesSection = (section: Section, read: Access) => ({
  read,
  create: peut(section, 'creer'),
  update: peut(section, 'modifier'),
  delete: peut(section, 'supprimer'),
  readVersions: peut(section, 'voir'),
})

// Lecture : les éditeurs voient tout, les visiteurs seulement ce qui est marqué « afficher sur le site ».
export const afficheOuEditeur =
  (section: Section): Access =>
  (args) =>
    peut(section, 'voir')(args) || ({ afficherSurSite: { equals: true } } satisfies Where)
