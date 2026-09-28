import type { CollectionConfig, GlobalConfig } from 'payload'

// Bouton « Revenir en arrière » affiché à côté des boutons d'enregistrement (toutes les fiches).
export const BOUTON_RETOUR_ARRIERE = '/admin/RetourArriere#RetourArriere'

type Entite = CollectionConfig | GlobalConfig
type AdminAvecBouton = {
  components?: {
    edit?: { beforeDocumentControls?: string[] }
    elements?: { beforeDocumentControls?: string[] }
  }
}

// Payload lit `admin.components.edit` pour les collections et `admin.components.elements` pour
// les globals (voir `renderDocumentSlots` du paquet @payloadcms/next).
export type Emplacement = 'collections' | 'globals'

// Chaque fiche garde l'historique de ses 20 dernières versions : c'est lui qui permet le retour
// en arrière. Les collections qui gèrent déjà brouillons ou versions gardent leur réglage.
const avecBouton = <T extends Entite>(entite: T, emplacement: Emplacement): T => {
  const admin = entite.admin as AdminAvecBouton | undefined
  const chemin = emplacement === 'globals' ? 'elements' : 'edit'
  const avant = admin?.components?.[chemin]?.beforeDocumentControls ?? []

  return {
    ...entite,
    versions: entite.versions ?? { max: 20 },
    admin: {
      ...entite.admin,
      components: {
        ...admin?.components,
        [chemin]: {
          ...admin?.components?.[chemin],
          beforeDocumentControls: [...avant, BOUTON_RETOUR_ARRIERE],
        },
      },
    },
  } as T
}

export const avecRetourArriere = <T extends Entite>(entites: T[], emplacement: Emplacement): T[] =>
  entites.map((entite) => avecBouton(entite, emplacement))
