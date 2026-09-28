import type { CollectionConfig, GlobalConfig } from 'payload'

// Bouton « Revenir en arrière » affiché à côté des boutons d'enregistrement (toutes les fiches).
export const BOUTON_RETOUR_ARRIERE = '/admin/RetourArriere#RetourArriere'

type Entite = CollectionConfig | GlobalConfig
type AdminAvecBouton = {
  components?: { edit?: { beforeDocumentControls?: string[] } }
}

// Chaque fiche garde l'historique de ses 20 dernières versions : c'est lui qui permet le retour
// en arrière. Les collections qui gèrent déjà brouillons ou versions gardent leur réglage.
const avecBouton = <T extends Entite>(entite: T): T => {
  const admin = entite.admin as AdminAvecBouton | undefined
  const avant = admin?.components?.edit?.beforeDocumentControls ?? []

  return {
    ...entite,
    versions: entite.versions ?? { max: 20 },
    admin: {
      ...entite.admin,
      components: {
        ...admin?.components,
        edit: { ...admin?.components?.edit, beforeDocumentControls: [...avant, BOUTON_RETOUR_ARRIERE] },
      },
    },
  } as T
}

export const avecRetourArriere = <T extends Entite>(entites: T[]): T[] => entites.map(avecBouton)
